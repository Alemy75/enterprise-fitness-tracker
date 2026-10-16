import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { and, asc, eq, isNull, lte, sql } from 'drizzle-orm';
import { ENV } from '../config/config.module.js';
import { type Env } from '../config/env.js';
import { DB, type Db } from '../db/db.js';
import { outboxEvent } from '../db/schema/outbox.js';
import { OutboxHandlerRegistry } from './outbox-handlers.js';

export const OUTBOX_MAX_ATTEMPTS = 10;
const MAX_BACKOFF_MS = 10 * 60 * 1000;

export function backoffMs(attempts: number): number {
  return Math.min(1000 * 2 ** (attempts - 1), MAX_BACKOFF_MS);
}

/**
 * Polls the outbox and runs handlers. Runs only in the worker process.
 * `FOR UPDATE SKIP LOCKED` lets several worker replicas share the queue safely.
 */
@Injectable()
export class OutboxRelay implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(OutboxRelay.name);
  private timer: NodeJS.Timeout | undefined;
  private running: Promise<void> | undefined;
  private stopped = false;

  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(ENV) private readonly env: Env,
    private readonly registry: OutboxHandlerRegistry,
  ) {}

  onApplicationBootstrap(): void {
    this.schedule(0);
  }

  async onApplicationShutdown(): Promise<void> {
    this.stopped = true;
    clearTimeout(this.timer);
    await this.running;
  }

  /** Processes up to `OUTBOX_BATCH_SIZE` events. Returns how many were taken. */
  async processBatch(): Promise<number> {
    let taken = 0;
    while (taken < this.env.OUTBOX_BATCH_SIZE && (await this.processOne())) taken++;
    return taken;
  }

  private schedule(delayMs: number): void {
    if (this.stopped) return;
    this.timer = setTimeout(() => {
      this.running = this.processBatch()
        .catch((err: unknown) => this.logger.error('Outbox batch failed', err as Error))
        .then((taken) => this.schedule(taken ? 0 : this.env.OUTBOX_POLL_INTERVAL_MS));
    }, delayMs);
  }

  private async processOne(): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const [event] = await tx
        .select()
        .from(outboxEvent)
        .where(
          and(
            isNull(outboxEvent.processedAt),
            isNull(outboxEvent.failedAt),
            lte(outboxEvent.availableAt, sql`now()`),
          ),
        )
        .orderBy(asc(outboxEvent.availableAt), asc(outboxEvent.id))
        .limit(1)
        .for('update', { skipLocked: true });
      if (!event) return false;

      try {
        // Savepoint: a failing handler rolls back only its own writes.
        await tx.transaction(async (htx) => {
          for (const handler of this.registry.get(event.type)) await handler(event, htx);
        });
        await tx
          .update(outboxEvent)
          .set({ processedAt: sql`now()` })
          .where(eq(outboxEvent.id, event.id));
      } catch (err) {
        const attempts = event.attempts + 1;
        const exhausted = attempts >= OUTBOX_MAX_ATTEMPTS;
        const message = err instanceof Error ? err.message : String(err);
        await tx
          .update(outboxEvent)
          .set({
            attempts,
            lastError: message.slice(0, 2000),
            availableAt: sql`now() + make_interval(secs => ${backoffMs(attempts) / 1000})`,
            ...(exhausted ? { failedAt: sql`now()` } : {}),
          })
          .where(eq(outboxEvent.id, event.id));
        const log = `Outbox event ${event.id} (${event.type}) failed, attempt ${attempts}: ${message}`;
        if (exhausted) this.logger.error(`${log}. Moved to dead letter.`);
        else this.logger.warn(log);
      }
      return true;
    });
  }
}
