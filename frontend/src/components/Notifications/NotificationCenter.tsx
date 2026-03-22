import React, { useState, useEffect } from 'react';
import { useWebSocket } from '@/providers/WebSocketProvider';
import { useToast } from '@/hooks/useToast';
import type { Notification } from '@/types';
import {
  Bell,
  X,
  Check,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/utils';

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  className,
}) => {
  const { subscribe, unsubscribe } = useWebSocket();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleNotification = (data: Notification) => {
      setNotifications(prev => [data, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Show toast notification
      showToast({
        variant:
          data.type === 'info'
            ? 'info'
            : data.type === 'success'
              ? 'success'
              : data.type === 'warning'
                ? 'warning'
                : 'error',
        title: data.title,
        message: data.message,
        duration: data.type === 'error' ? 0 : 5000,
      });
    };

    subscribe('user_notification', handleNotification);
    return () => unsubscribe('user_notification', handleNotification);
  }, [subscribe, unsubscribe, showToast]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-muted-foreground hover:text-foreground relative p-2 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="bg-card absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border shadow-lg">
          <div className="border-border border-b p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-foreground font-medium">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-muted-foreground p-8 text-center">
                <Bell className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-border divide-y">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={cn(
                      'hover:bg-muted/50 p-4 transition-colors',
                      !notification.read && 'bg-primary/5'
                    )}
                  >
                    <div className="flex items-start space-x-3">
                      {getNotificationIcon(notification.type)}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-foreground text-sm font-medium">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-primary-600 hover:text-primary-700"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {notification.message}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-muted-foreground text-xs">
                            {notification.timestamp.toLocaleTimeString()}
                          </span>
                          {notification.actionUrl &&
                            notification.actionText && (
                              <a
                                href={notification.actionUrl}
                                className="text-xs text-primary-600 hover:text-primary-700"
                              >
                                {notification.actionText}
                              </a>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-border border-t p-4">
              <button
                onClick={clearAll}
                className="text-muted-foreground hover:text-foreground w-full text-sm"
              >
                Clear all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
