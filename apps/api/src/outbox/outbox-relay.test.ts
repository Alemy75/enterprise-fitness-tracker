import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestDb, TEST_ENV } from '../../test/test-db.js';
import { parseEnv } from '../config/env.js';
import { type Db } from '../db/db.js';
import { auditLog } from '../db/schema/audit.js';
import { outboxEvent } from '../db/schema/outbox.js';
import { OutboxHandlerRegistry } from './outbox-handlers.js';
import { backoffMs, OUTBOX_MAX_ATTEMPTS, OutboxRelay } from './outbox-relay.js';
import { OutboxService } from './outbox.service.js';

describe('OutboxRelay', () => {
  let db: Db;
  let close: () => Promise<void>;
  let registry: OutboxHandlerRegistry;
  let relay: OutboxRelay;
  const outbox = new OutboxService();

  beforeAll(async () => {
    ({ db, close } = await createTestDb());
  });
  afterAll(() => close());

  beforeEach(async () => {
    await db.delete(outboxEvent);
    await db.delete(auditLog);
    registry = new OutboxHandlerRegistry();
    relay = new OutboxRelay(db, parseEnv(TEST_ENV), registry);
  });

  it('delivers an event to every handler and marks it processed', async () => {
    const a = vi.fn().mockResolvedValue(undefined);
    const b = vi.fn().mockResolvedValue(undefined);
    registry.register('WorkoutCompleted', a);
    registry.register('WorkoutCompleted', b);
    await db.transaction((tx) =>
      outbox.enqueue(tx, { type: 'WorkoutCompleted', payload: { sessionId: 's1' } }),
    );

    expect(await relay.processBatch()).toBe(1);

    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
    expect(a.mock.calls[0]?.[0]).toMatchObject({ type: 'WorkoutCompleted', payload: { sessionId: 's1' } });
    const [row] = await db.select().from(outboxEvent);
    expect(row?.processedAt).toBeInstanceOf(Date);
    expect(await relay.processBatch()).toBe(0);
  });

  it('does not publish events from a rolled-back transaction', async () => {
    await expect(
      db.transaction(async (tx) => {
        await outbox.enqueue(tx, { type: 'X', payload: {} });
        throw new Error('rollback');
      }),
    ).rejects.toThrow('rollback');

    expect(await db.select().from(outboxEvent)).toHaveLength(0);
  });

  it('marks events without handlers as processed', async () => {
    await outbox.enqueue(db, { type: 'Nobody listens', payload: {} });

    expect(await relay.processBatch()).toBe(1);
    const [row] = await db.select().from(outboxEvent);
    expect(row?.processedAt).not.toBeNull();
  });

  it('rolls back handler writes on failure and schedules a retry with backoff', async () => {
    registry.register('X', async (_event, tx) => {
      await tx.insert(auditLog).values({ action: 'side-effect', entityType: 'test' });
      throw new Error('boom');
    });
    await outbox.enqueue(db, { type: 'X', payload: {} });

    expect(await relay.processBatch()).toBe(1);

    expect(await db.select().from(auditLog)).toHaveLength(0);
    const [row] = await db.select().from(outboxEvent);
    expect(row).toMatchObject({ attempts: 1, lastError: 'boom', processedAt: null, failedAt: null });
    expect(row!.availableAt.getTime()).toBeGreaterThan(row!.createdAt.getTime());
    // Not yet due: the retry waits for its backoff.
    expect(await relay.processBatch()).toBe(0);
  });

  it('moves an event to dead letter after the last attempt', async () => {
    registry.register('X', () => Promise.reject(new Error('still broken')));
    await outbox.enqueue(db, { type: 'X', payload: {} });
    await db.update(outboxEvent).set({ attempts: OUTBOX_MAX_ATTEMPTS - 1 });

    expect(await relay.processBatch()).toBe(1);

    const [row] = await db.select().from(outboxEvent);
    expect(row?.attempts).toBe(OUTBOX_MAX_ATTEMPTS);
    expect(row?.failedAt).toBeInstanceOf(Date);
    await db
      .update(outboxEvent)
      .set({ availableAt: sql`now() - interval '1 day'` })
      .where(eq(outboxEvent.id, row!.id));
    expect(await relay.processBatch()).toBe(0);
  });

  it('grows backoff exponentially and caps it at 10 minutes', () => {
    expect([1, 2, 3, 4].map(backoffMs)).toEqual([1000, 2000, 4000, 8000]);
    expect(backoffMs(20)).toBe(10 * 60 * 1000);
  });
});
