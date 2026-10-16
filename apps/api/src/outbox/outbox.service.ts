import { Injectable } from '@nestjs/common';
import { type DbOrTx } from '../db/db.js';
import { outboxEvent } from '../db/schema/outbox.js';

export interface DomainEvent<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  type: string;
  payload: TPayload;
}

/**
 * Transactional outbox (ADR-05, EFT-013): the event is written in the same
 * transaction as the state change, so it is never lost or published for a rolled-back change.
 */
@Injectable()
export class OutboxService {
  async enqueue(tx: DbOrTx, event: DomainEvent): Promise<void> {
    await tx.insert(outboxEvent).values({ type: event.type, payload: event.payload });
  }
}
