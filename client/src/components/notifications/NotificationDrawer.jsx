import React, { useEffect } from 'react';
import { Bell, CheckCheck, X } from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore.js';
import { Avatar } from '../ui/Avatar.jsx';
import { Button } from '../ui/Button.jsx';
import { formatDistanceToNowStrict } from 'date-fns';

export function NotificationDrawer({ onClose }) {
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="flex-1 bg-chat-panel flex flex-col h-full overflow-y-auto p-4 md:p-8">
      <div className="max-w-2xl mx-auto w-full space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between bg-chat-sidebar border border-chat-border p-4 rounded-2xl">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-brand-400" />
            <h2 className="text-base font-bold text-white">Notifications ({unreadCount} unread)</h2>
          </div>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={markAllRead}
              leftIcon={<CheckCheck className="w-4 h-4" />}
            >
              Mark all as read
            </Button>
          )}
        </div>

        {/* Notifications list */}
        <div className="space-y-2.5">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-chat-muted">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => {
              const nId = n._id || n.id;
              const formattedTime = n.createdAt
                ? formatDistanceToNowStrict(new Date(n.createdAt), { addSuffix: true })
                : 'just now';

              return (
                <div
                  key={nId}
                  onClick={() => !n.isRead && markRead(nId)}
                  className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${
                    n.isRead
                      ? 'bg-chat-sidebar/50 border-chat-border/50 text-chat-muted'
                      : 'bg-chat-sidebar border-brand-500/40 text-white shadow-sm'
                  }`}
                >
                  <Avatar
                    src={n.sender?.avatar}
                    name={n.sender?.displayName || n.sender?.username || 'Nexus'}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-semibold truncate">{n.title}</h4>
                      <span className="text-[11px] text-chat-muted shrink-0 ml-2">
                        {formattedTime}
                      </span>
                    </div>
                    <p className="text-xs text-chat-bubbleText/90">{n.message}</p>
                  </div>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1.5" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationDrawer;
