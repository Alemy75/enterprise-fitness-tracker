import { sql } from 'drizzle-orm';
import { index, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { id } from './columns.js';

export const outboxEvent = pgTable(
  'outbox_event',
  {
    id: id(),
    type: text().notNull(),
    payload: jsonb().$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    availableAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    attempts: integer().notNull().default(0),
    lastError: text(),
    processedAt: timestamp({ withTimezone: true }),
    failedAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    index('outbox_event_pending_idx')
      .on(t.availableAt)
      .where(sql`${t.processedAt} is null and ${t.failedAt} is null`),
  ],
);

export type OutboxEventRow = typeof outboxEvent.$inferSelect;
