import { useEffect, useCallback, useState, createContext, useContext } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { isAccessTokenValid } from '../utils/token';
import { getUserNotifications, markAsRead as apiMarkAsRead, markAllAsRead as apiMarkAllAsRead, deleteNotification as apiDeleteNotification } from '../api/notifications';

// ── Типы ────────────────────────────────────────────────────────

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

export type NotificationTypeValue =
  | 'OrderStatusChanged'
  | 'RepairTicketUpdated'
  | 'LowStockAlert'
  | 'NewSupportMessage'
  | 'SystemAnnouncement'
  | 'TaskAssigned'
  | 'InventoryAlert';

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

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

// ── Контекст ──────────────────────────────────────────────────────

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  connectionStatus: ConnectionStatus;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

// ── Чистые вспомогательные функции (без побочных эффектов) ──────────────────────

/** Чтение токена доступа из хранилища (сначала localStorage, затем sessionStorage) */
const getAccessToken = (): string | null =>
  localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken');

/** Маппинг приоритета уведомления на вариант toast */
const priorityToToastVariant = (priority: NotificationPriorityValue): 'info' | 'warning' | 'error' | 'success' => {
  switch (priority) {
    case 'Critical':
    case 'High':
      return 'error';
    case 'Medium':
      return 'warning';
    default:
      return 'info';
  }
};

// ── Вспомогательные функции с побочными эффектами ──────────────────────────────────

/** Воспроизведение звука уведомления для высокоприоритетных оповещений (браузер может заблокировать автовоспроизведение) */
const playNotificationSound = (priority: NotificationPriorityValue): void => {
  const soundEnabled = localStorage.getItem('notification_sound') !== 'false';
  if (soundEnabled && (priority === 'High' || priority === 'Critical')) {
    const audio = new Audio('/notification-sound.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => { /* Браузер может заблокировать автовоспроизведение */ });
  }
};

/** Показать toast-уведомление через глобальный стор уведомлений */
const showNotificationToast = (notification: Notification): void => {
  useToastStore.getState().showToast(
    `${notification.title}: ${notification.message}`,
    priorityToToastVariant(notification.priority),
    5000,
  );
};

// ── Провайдер ─────────────────────────────────────────────────────

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // ── Жизненный цикл подключения SignalR ──
  // Выполняется только при изменении состояния авторизации (вход/выход)
  useEffect(() => {
    // Не авторизован — нечего подключать
    if (!isAuthenticated) {
      setConnectionStatus('disconnected');
      return;
    }

    const token = getAccessToken();
    // Токен отсутствует или истёк — не дёргаем API/SignalR (иначе 401)
    if (token == null || token === '' || !isAccessTokenValid()) {
      setConnectionStatus('disconnected');
      return;
    }

    let isMounted = true;
    let hubConnection: signalR.HubConnection | null = null;

    const initialize = async () => {
      // 1. Загрузка существующих уведомлений из REST API (перед SignalR)
      try {
        const existingNotifications = await getUserNotifications();
        if (isMounted) setNotifications(existingNotifications as Notification[]);
      } catch {
        // API может быть ещё недоступен — SignalR подхватит при переподключении
      }

      // 2. Создание HubConnection SignalR
      hubConnection = new signalR.HubConnectionBuilder()
        .configureLogging(signalR.LogLevel.Warning)
        .withUrl('/hubs/notifications', {
          accessTokenFactory: () => getAccessToken() ?? '',
        })
        // Экспоненциальная задержка: 0с → 2с → 10с → 30с (максимум, повторы)
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .build();

      // ── Обработчик входящих уведомлений ──
      hubConnection.on('ReceiveNotification', (notification: Notification) => {
        if (!isMounted) return;

        // Дедупликация: заменяем, если существует тот же ID (например, обновлено сервером),
        // иначе добавляем новое уведомление в начало
        setNotifications(prev => {
          const index = prev.findIndex(n => n.id === notification.id);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = notification;
            return updated;
          }
          return [notification, ...prev];
        });

        playNotificationSound(notification.priority);
        showNotificationToast(notification);
      });

      // ── Отслеживание состояния подключения ──
      hubConnection.onreconnecting(() => {
        if (isMounted) setConnectionStatus('reconnecting');
      });

      hubConnection.onreconnected(() => {
        if (isMounted) setConnectionStatus('connected');
      });

      hubConnection.onclose(() => {
        if (isMounted) setConnectionStatus('disconnected');
      });

      // 3. Запуск подключения
      try {
        if (isMounted) setConnectionStatus('reconnecting');
        await hubConnection.start();
        if (isMounted) setConnectionStatus('connected');
      } catch {
        // Автоматическое переподключение повторит попытку с настроенной задержкой
        if (isMounted) setConnectionStatus('reconnecting');
      }
    };

    initialize();

    // Очистка при размонтировании или изменении состояния авторизации
    return () => {
      isMounted = false;
      hubConnection?.off('ReceiveNotification');
      hubConnection?.stop().catch(() => {});
    };
    // isAuthenticated — единственный триггер; изменение авторизации требует нового подключения
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // ── CRUD-действия (все используют оптимистичные обновления с откатом) ──

  const markAsRead = useCallback(async (id: string) => {
    // Оптимистичное обновление
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)),
    );

    try {
      await apiMarkAsRead(id);
    } catch {
      // Откат при ошибке
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: false, readAt: undefined } : n)),
      );
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    let snapshot: Notification[] = [];
    setNotifications(prev => {
      snapshot = prev;
      return prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }));
    });

    try {
      await apiMarkAllAsRead();
    } catch {
      setNotifications(snapshot);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    let snapshot: Notification[] = [];
    setNotifications(prev => {
      snapshot = prev;
      return prev.filter(n => n.id !== id);
    });

    try {
      await apiDeleteNotification(id);
    } catch {
      // Откат при ошибке — восстанавливаем удаленное уведомление из снимка
      setNotifications(snapshot);
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        connectionStatus,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// ── Хук-потребитель ────────────────────────────────────────────────

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications должен использоваться внутри NotificationProvider');
  }
  return context;
};
