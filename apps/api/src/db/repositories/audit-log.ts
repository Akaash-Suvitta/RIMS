import { query } from '../client.js';
import type { PaginatedResult } from './tenants.js';

export interface AuditLogRow {
  id: string;
  tenant_id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  occurred_at: Date;
}

export interface CreateAuditLogData {
  tenantId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string;
  userAgent?: string;
}

export interface FindAllAuditLogOptions {
  page?: number;
  limit?: number;
  filters?: {
    entityType?: string;
    entityId?: string;
    userId?: string;
    action?: string;
    fromDate?: Date;
    toDate?: Date;
  };
}

export const auditLogRepository = {
  /** Insert-only. rims_app role has INSERT only on audit_log (TR-C-003). */
  async create(data: CreateAuditLogData): Promise<AuditLogRow> {
    const result = await query<AuditLogRow>(
      `INSERT INTO audit_log
         (tenant_id, user_id, action, entity_type, entity_id,
          old_values, new_values, ip_address, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        data.tenantId,
        data.userId ?? null,
        data.action,
        data.entityType,
        data.entityId,
        data.oldValues ? JSON.stringify(data.oldValues) : null,
        data.newValues ? JSON.stringify(data.newValues) : null,
        data.ipAddress ?? null,
        data.userAgent ?? null,
      ],
    );
    return result.rows[0];
  },

  async findById(id: string): Promise<AuditLogRow | null> {
    const result = await query<AuditLogRow>(
      'SELECT * FROM audit_log WHERE id = $1',
      [id],
    );
    return result.rows[0] ?? null;
  },

  async findAll(
    tenantId: string,
    opts: FindAllAuditLogOptions = {},
  ): Promise<PaginatedResult<AuditLogRow>> {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(200, Math.max(1, opts.limit ?? 50));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['tenant_id = $1'];
    const values: unknown[] = [tenantId];
    let idx = 2;

    if (opts.filters?.entityType) {
      conditions.push(`entity_type = $${idx++}`);
      values.push(opts.filters.entityType);
    }
    if (opts.filters?.entityId) {
      conditions.push(`entity_id = $${idx++}`);
      values.push(opts.filters.entityId);
    }
    if (opts.filters?.userId) {
      conditions.push(`user_id = $${idx++}`);
      values.push(opts.filters.userId);
    }
    if (opts.filters?.action) {
      conditions.push(`action = $${idx++}`);
      values.push(opts.filters.action);
    }
    if (opts.filters?.fromDate) {
      conditions.push(`occurred_at >= $${idx++}`);
      values.push(opts.filters.fromDate);
    }
    if (opts.filters?.toDate) {
      conditions.push(`occurred_at <= $${idx++}`);
      values.push(opts.filters.toDate);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM audit_log ${where}`,
      values,
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const itemsResult = await query<AuditLogRow>(
      `SELECT * FROM audit_log ${where}
       ORDER BY occurred_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset],
    );

    return { items: itemsResult.rows, total, page, limit };
  },

  // update and delete intentionally omitted — audit_log is append-only
};
