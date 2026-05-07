import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notifications.service';

export function useNotifications(params?: { read?: boolean; limit?: number }) {
  return useQuery({
    queryKey: ['notifications', params ?? {}],
    queryFn: () => listNotifications(params),
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
