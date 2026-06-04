import React, { useEffect, useCallback, useState, useRef, createContext, useContext } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationTypeValue;
  priority: NotificationPriorityValue;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  relatedUrl?: string;
  metadata?: string;
}

export type NotificationTypeValue = 'OrderStatusChanged' | 'RepairTicketUpdated' | 'LowStockAlert' | 'NewSupportMessage' | 'SystemAnnouncement' | 'TaskAssigned' | 'InventoryAlert';

export const NotificationType = {
  OrderStatusChanged: 'OrderStatusChanged' as const,
  RepairTicketUpdated: 'RepairTicketUpdated' as const,
  LowStockAlert: 'LowStockAlert' as const,
  NewSupportMessage: 'NewSupportMessage' as const,
  SystemAnnouncement: 'SystemAnnouncement' as const,
  TaskAssigned: 'TaskAssigned' as const,
  InventoryAlert: 'InventoryAlert' as const,
} as const;

export type NotificationPriorityValue = 'Low' | 'Medium' | 'High' | 'Critical';

export const NotificationPriority = {
  Low: 'Low' as const,
  Medium: 'Medium' as const,
  High: 'High' as const,
  Critical: 'Critical' as const,
} as const;

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
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isMountedRef = useRef(false);

  useEffect(() => {
    // Пропускаем первый mount при StrictMode (development двойной рендер)
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }

    const getToken = () => localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken');
    if (!getToken()) return;

    let hubConnection: signalR.HubConnection | null = null;
    let isMounted = true;

    const startConnection = async () => {
      hubConnection = new signalR.HubConnectionBuilder()
        .configureLogging(signalR.LogLevel.Warning)
        .withUrl('/hubs/notifications', {
          accessTokenFactory: () => getToken() ?? ''
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .build();

      hubConnection.on('ReceiveNotification', (notification: Notification) => {
        if (!isMounted) return;

        setNotifications(prev => [notification, ...prev]);

        // Play notification sound if enabled
        const soundEnabled = localStorage.getItem('notification_sound') !== 'false';
        const priority = notification.priority as unknown as string;
        if (soundEnabled && (priority === 'High' || priority === 'Critical')) {
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

      // Первая попытка может失败了 (e.g. negotiate 401), 
      // но withAutomaticReconnect переподключится автоматически.
      // Ошибку не логируем — reconnect сам всё исправит.
      try {
        if (isMounted) setConnectionStatus('connecting');
        await hubConnection.start();
        if (isMounted) {
          setConnectionStatus('connected');
          setConnection(hubConnection);
        }
      } catch {
        // automatic reconnect will retry — keep status as 'connecting'
        if (isMounted) {
          setConnectionStatus('connecting');
        }
      }
    };

    void startConnection();

    return () => {
      isMounted = false;
      hubConnection?.off('ReceiveNotification');
      void hubConnection?.stop();
      setConnection(null);
    };
  }, [isAuthenticated]);

  const showToast = (notification: Notification) => {
    const toastType = (() => {
      switch (notification.priority) {
        case 'Critical': case 'High': return 'error';
        case 'Medium': return 'warning';
        default: return 'info';
      }
    })();
    useToastStore.getState().showToast(
      `${notification.title}: ${notification.message}`,
      toastType as 'info' | 'warning' | 'error' | 'success',
      5000,
    );
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
