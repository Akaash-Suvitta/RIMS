'use client';

import { Bell } from 'lucide-react';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../../../hooks/useNotifications';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import type { Notification } from '@rim/types';

function typeBadgeColor(type: string): string {
  switch (type) {
    case 'renewal_due': return '#F59E0B';
    case 'submission_milestone': return '#38BDF8';
    case 'task_assigned': return '#7C3AED';
    case 'approval_received': return '#10B981';
    case 'rejection_received': return '#F43F5E';
    default: return '#7A9BBD';
  }
}

function TypeBadge({ type }: { type: string }) {
  const color = typeBadgeColor(type);
  return (
    <span
      className="rounded px-2 py-0.5 text-xs font-medium"
      style={{
        color,
        backgroundColor: `${color}1A`,
        border: `1px solid ${color}33`,
      }}
    >
      {type.replace(/_/g, ' ')}
    </span>
  );
}

export default function NotificationsPage() {
  const { data, isLoading } = useNotifications();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead } = useMarkAllNotificationsRead();

  const notifications = data as Notification[] | { data: Notification[] } | undefined;
  const notificationList: Notification[] = Array.isArray(notifications)
    ? notifications
    : (notifications as { data?: Notification[] } | undefined)?.data ?? [];

  const hasUnread = notificationList.some((n) => !n.isRead);

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'DM Serif Display, serif', color: '#E8F0F8' }}>
            Notifications
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#7A9BBD' }}>
            {notificationList.length} notification{notificationList.length !== 1 ? 's' : ''}
          </p>
        </div>
        {hasUnread && (
          <Button variant="ghost" size="sm" onClick={() => markAllRead()}>
            Mark all read
          </Button>
        )}
      </div>

      {notificationList.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <Bell className="h-10 w-10" style={{ color: '#4A6A8A' }} />
          <p className="text-sm" style={{ color: '#7A9BBD' }}>No notifications.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notificationList.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (!n.isRead) markRead(n.id);
              }}
              className={!n.isRead ? 'cursor-pointer' : ''}
              style={{
                borderLeft: n.isRead ? '3px solid transparent' : '3px solid #38BDF8',
                backgroundColor: n.isRead ? '#0B1929' : 'rgba(17, 34, 56, 0.8)',
                border: `1px solid rgba(56, 189, 248, 0.12)`,
                borderLeftColor: n.isRead ? 'transparent' : '#38BDF8',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold" style={{ color: '#E8F0F8' }}>
                      {n.title}
                    </p>
                    {!n.isRead && (
                      <span
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: '#38BDF8' }}
                      />
                    )}
                  </div>
                  {n.body && (
                    <p className="text-sm" style={{ color: '#7A9BBD' }}>{n.body}</p>
                  )}
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <TypeBadge type={n.type} />
                    <span className="text-xs" style={{ color: '#4A6A8A' }}>
                      {n.sentAt
                        ? new Date(n.sentAt).toLocaleDateString()
                        : new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
