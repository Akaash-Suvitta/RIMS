import { get, patch, post } from '../lib/api';
import type { CursorPage } from '@rim/types';
import type { Notification } from '@rim/types';

const BASE = '/api/v1/notifications';

export function listNotifications(params?: { read?: boolean; cursor?: string; limit?: number }): Promise<CursorPage<Notification>> {
  const qs = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString() : '';
  return get<CursorPage<Notification>>(`${BASE}${qs}`);
}

export function markNotificationRead(id: string): Promise<{ id: string; readAt: string }> {
  return patch<{ id: string; readAt: string }>(`${BASE}/${id}/read`);
}

export function markAllNotificationsRead(): Promise<{ markedRead: number }> {
  return post<{ markedRead: number }>(`${BASE}/read-all`);
}
