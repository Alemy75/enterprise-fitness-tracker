import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { id } from './columns.js';

export const auditLog = pgTable(
  'audit_log',
  {
    id: id(),
    organizationId: uuid(),
    actorUserId: uuid(),
    action: text().notNull(),
    entityType: text().notNull(),
    entityId: uuid(),
    before: jsonb().$type<Record<string, unknown>>(),
    after: jsonb().$type<Record<string, unknown>>(),
    reason: text(),
    requestId: text(),
    ip: text(),
    deviceId: text(),
    at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index().on(t.entityType, t.entityId, t.at),
    index().on(t.actorUserId, t.at),
    index().on(t.organizationId, t.at),
  ],
);

export type AuditLogRow = typeof auditLog.$inferSelect;
