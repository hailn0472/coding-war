import { useState, useEffect } from 'react';
import { useWebSocket } from '@/providers/WebSocketProvider';
import { useToast } from '@/hooks/useToast';
import type { Notification } from '@/types';

export const useNotifications = () => {
  const { subscribe, unsubscribe } = useWebSocket();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
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

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
};
