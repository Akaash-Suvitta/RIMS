import { query } from '../client.js';
import type { PaginatedResult } from './tenants.js';

export interface NotificationRow {
  id: string;
  tenant_id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  read_at: Date | null;
  entity_type: string | null;
  entity_id: string | null;
  created_at: Date;
}

export interface CreateNotificationData {
  tenantId: string;
  userId: string;
  type: string;
  title: string;
  body?: string;
  entityType?: string;
  entityId?: string;
}

export interface FindAllNotificationsOptions {
  page?: number;
  limit?: number;
  filters?: {
    unreadOnly?: boolean;
    type?: string;
  };
}

export const notificationsRepository = {
  async create(data: CreateNotificationData): Promise<NotificationRow> {
    const result = await query<NotificationRow>(
      `INSERT INTO notifications
         (tenant_id, user_id, type, title, body, entity_type, entity_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        data.tenantId,
        data.userId,
        data.type,
        data.title,
        data.body ?? null,
        data.entityType ?? null,
        data.entityId ?? null,
      ],
    );
    return result.rows[0];
  },

  async findById(id: string, tenantId: string): Promise<NotificationRow | null> {
    const result = await query<NotificationRow>(
      'SELECT * FROM notifications WHERE id = $1 AND tenant_id = $2',
      [id, tenantId],
    );
    return result.rows[0] ?? null;
  },

  async findAll(
    tenantId: string,
    userId: string,
    opts: FindAllNotificationsOptions = {},
  ): Promise<PaginatedResult<NotificationRow>> {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(100, Math.max(1, opts.limit ?? 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['tenant_id = $1', 'user_id = $2'];
    const values: unknown[] = [tenantId, userId];
    let idx = 3;

    if (opts.filters?.unreadOnly) {
      conditions.push('read_at IS NULL');
    }
    if (opts.filters?.type) {
      conditions.push(`type = $${idx++}`);
      values.push(opts.filters.type);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM notifications ${where}`,
      values,
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const itemsResult = await query<NotificationRow>(
      `SELECT * FROM notifications ${where}
       ORDER BY created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset],
    );

    return { items: itemsResult.rows, total, page, limit };
  },

  async update(id: string, tenantId: string, data: { readAt?: Date | null }): Promise<NotificationRow> {
    const result = await query<NotificationRow>(
      `UPDATE notifications SET read_at = $3
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [id, tenantId, data.readAt ?? null],
    );
    if (!result.rows[0]) throw new Error(`Notification not found: ${id}`);
    return result.rows[0];
  },

  async markAsRead(id: string, tenantId: string, userId: string): Promise<void> {
    await query(
      `UPDATE notifications SET read_at = NOW()
       WHERE id = $1 AND tenant_id = $2 AND user_id = $3 AND read_at IS NULL`,
      [id, tenantId, userId],
    );
  },

  async markAllAsRead(tenantId: string, userId: string): Promise<void> {
    await query(
      `UPDATE notifications SET read_at = NOW()
       WHERE tenant_id = $1 AND user_id = $2 AND read_at IS NULL`,
      [tenantId, userId],
    );
  },

  async hardDelete(id: string, tenantId: string): Promise<void> {
    await query(
      'DELETE FROM notifications WHERE id = $1 AND tenant_id = $2',
      [id, tenantId],
    );
  },
};
