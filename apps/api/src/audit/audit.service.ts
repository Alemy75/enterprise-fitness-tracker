import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, gte, lt, lte, type SQL } from 'drizzle-orm';
import { RequestContext } from '../common/request-context.js';
import { DB, type Db, type DbOrTx } from '../db/db.js';
import { auditLog, type AuditLogRow } from '../db/schema/audit.js';

export interface AuditEntry {
  action: string;
  entityType: string;
  entityId?: string;
  organizationId?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  reason?: string;
}

export interface AuditQuery {
  entityType?: string;
  entityId?: string;
  actorUserId?: string;
  organizationId?: string;
  from?: Date;
  to?: Date;
  /** `at` of the last row from the previous page. */
  before?: Date;
  limit?: number;
}

/**
 * Append-only audit log (ADR-09, EFT-012).
 * Callers pass their transaction so the audit row commits atomically with the change.
 */
@Injectable()
export class AuditService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async record(tx: DbOrTx, entry: AuditEntry): Promise<void> {
    const ctx = RequestContext.get();
    await tx.insert(auditLog).values({
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      organizationId: entry.organizationId ?? ctx?.organizationId ?? null,
      actorUserId: ctx?.actorUserId ?? null,
      before: entry.before ?? null,
      after: entry.after ?? null,
      reason: entry.reason ?? null,
      requestId: ctx?.requestId ?? null,
      ip: ctx?.ip ?? null,
      deviceId: ctx?.deviceId ?? null,
    });
  }

  async find(query: AuditQuery): Promise<AuditLogRow[]> {
    const conditions: SQL[] = [];
    if (query.entityType) conditions.push(eq(auditLog.entityType, query.entityType));
    if (query.entityId) conditions.push(eq(auditLog.entityId, query.entityId));
    if (query.actorUserId) conditions.push(eq(auditLog.actorUserId, query.actorUserId));
    if (query.organizationId) conditions.push(eq(auditLog.organizationId, query.organizationId));
    if (query.from) conditions.push(gte(auditLog.at, query.from));
    if (query.to) conditions.push(lte(auditLog.at, query.to));
    if (query.before) conditions.push(lt(auditLog.at, query.before));

    return this.db
      .select()
      .from(auditLog)
      .where(and(...conditions))
      .orderBy(desc(auditLog.at))
      .limit(Math.min(query.limit ?? 50, 200));
  }
}
