import { sql } from 'drizzle-orm';
import { bigint, integer, pgSequence, timestamp, uuid } from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';

/**
 * Monotonic counter for incremental sync (`GET /sync/pull?cursor=`).
 * Bumped on insert by default and on update by the `set_change_seq` trigger.
 */
export const changeSeq = pgSequence('change_seq', { startWith: 1, increment: 1 });

/** Primary key. Clients send their own UUIDv7 (ADR-11); the server fills it in otherwise. */
export const id = () =>
  uuid()
    .primaryKey()
    .$defaultFn(() => uuidv7());

export const timestamps = () => ({
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/**
 * Columns shared by every syncable domain entity:
 * tenant scope, soft delete (ADR-09), optimistic version and sync cursor.
 */
export const entityColumns = () => ({
  id: id(),
  organizationId: uuid().notNull(),
  ...timestamps(),
  deletedAt: timestamp({ withTimezone: true }),
  version: integer().notNull().default(1),
  changeSeq: bigint({ mode: 'bigint' })
    .notNull()
    .default(sql`nextval('change_seq')`),
});
