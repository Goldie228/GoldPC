import React, { useEffect, useCallback, useState, createContext, useContext } from 'react';
import * as signalR from '@microsoft/signalr';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  relatedUrl?: string;
  metadata?: string;
}

export enum NotificationType {
  OrderStatusChanged = 'OrderStatusChanged',
  RepairTicketUpdated = 'RepairTicketUpdated',
  LowStockAlert = 'LowStockAlert',
  NewSupportMessage = 'NewSupportMessage',
  SystemAnnouncement = 'SystemAnnouncement',
  TaskAssigned = 'TaskAssigned',
  InventoryAlert = 'InventoryAlert'
}

export enum NotificationPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical'
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    let hubConnection: signalR.HubConnection | null = null;
    let isMounted = true;

    const startConnection = async () => {
      hubConnection = new signalR.HubConnectionBuilder()
        .withUrl('/hubs/notifications', {
          accessTokenFactory: () => token
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .build();

      hubConnection.on('ReceiveNotification', (notification: Notification) => {
        if (!isMounted) return;

        setNotifications(prev => [notification, ...prev]);

        // Play notification sound if enabled
        const soundEnabled = localStorage.getItem('notification_sound') !== 'false';
        if (soundEnabled && (notification.priority === NotificationPriority.High || notification.priority === NotificationPriority.Critical)) {
          const audio = new Audio('/notification-sound.mp3');
          audio.volume = 0.3;
          audio.play().catch(() => {});
        }

        // Show toast notification
        showToast(notification);
      });

      hubConnection.onreconnecting(() => {
        if (isMounted) setConnectionStatus('connecting');
      });

      hubConnection.onreconnected(() => {
        if (isMounted) setConnectionStatus('connected');
      });

      hubConnection.onclose(() => {
        if (isMounted) setConnectionStatus('disconnected');
      });

      try {
        if (isMounted) setConnectionStatus('connecting');
        await hubConnection.start();
        if (isMounted) {
          setConnectionStatus('connected');
          setConnection(hubConnection);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to connect to notification hub:', error);
          setConnectionStatus('error');
        }
      }
    };

    startConnection();

    return () => {
      isMounted = false;
      hubConnection?.off('ReceiveNotification');
      hubConnection?.stop();
      setConnection(null);
    };
  }, []);

  const showToast = (notification: Notification) => {
    // This will integrate with existing toast system
    console.log('Notification received:', notification);
  };

  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
    ));
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      connectionStatus,
      markAsRead,
      markAllAsRead,
      deleteNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
