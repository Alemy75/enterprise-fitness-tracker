import { Injectable } from '@nestjs/common';
import { type Tx } from '../db/db.js';
import { type OutboxEventRow } from '../db/schema/outbox.js';

/**
 * Delivery is at-least-once: a handler may see the same event again after a crash
 * or a failure in a sibling handler, so it must be idempotent.
 */
export type OutboxHandler = (event: OutboxEventRow, tx: Tx) => Promise<void>;

@Injectable()
export class OutboxHandlerRegistry {
  private readonly handlers = new Map<string, OutboxHandler[]>();

  register(type: string, handler: OutboxHandler): void {
    const list = this.handlers.get(type) ?? [];
    list.push(handler);
    this.handlers.set(type, list);
  }

  get(type: string): readonly OutboxHandler[] {
    return this.handlers.get(type) ?? [];
  }
}
