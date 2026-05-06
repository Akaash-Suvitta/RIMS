import { notificationsRepository } from '../db/repositories/index.js';
import { query } from '../db/client.js';
import { Errors } from '../middleware/error.js';
import type { NotificationRow } from '../db/repositories/notifications.js';

export async function listNotifications(
  tenantId: string,
  userId: string,
  q: { cursor?: string; limit?: number; read?: boolean },
): Promise<{ data: NotificationRow[]; total: number; nextCursor: string | null }> {
  const limit = q.limit ?? 25;
  const result = await notificationsRepository.findAll(tenantId, userId, {
    limit,
    filters: { unreadOnly: q.read === false },
  });
  const nextCursor =
    result.items.length === limit ? result.items[result.items.length - 1].id : null;
  return { data: result.items, total: result.total, nextCursor };
}

export async function markNotificationRead(
  id: string,
  tenantId: string,
  userId: string,
): Promise<{ id: string; readAt: Date }> {
  const notification = await notificationsRepository.findById(id, tenantId);
  if (!notification || notification.user_id !== userId) {
    throw Errors.notFound(`Notification ${id} not found.`);
  }

  await notificationsRepository.markAsRead(id, tenantId, userId);

  return { id, readAt: new Date() };
}

export async function markAllNotificationsRead(
  tenantId: string,
  userId: string,
): Promise<{ markedRead: number }> {
  // Count unread before marking
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM notifications
     WHERE tenant_id = $1 AND user_id = $2 AND read_at IS NULL`,
    [tenantId, userId],
  );
  const markedRead = parseInt(countResult.rows[0].count, 10);

  await notificationsRepository.markAllAsRead(tenantId, userId);

  return { markedRead };
}
