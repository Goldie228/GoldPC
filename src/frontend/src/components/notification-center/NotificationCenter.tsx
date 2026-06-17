import { useState } from 'react';
import { Package, Wrench, AlertTriangle, MessageSquare, Bell, Check, Trash2 } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import type { Notification, NotificationPriorityValue, NotificationTypeValue } from '@/hooks/useNotifications';

export const NotificationCenter = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const getPriorityStyle = (priority: NotificationPriorityValue) => {
    switch (priority) {
      case 'Critical': return 'border-l-price-rise bg-price-rise/5';
      case 'High': return 'border-l-price-rise/60 bg-price-rise/5';
      case 'Medium': return 'border-l-warning bg-warning/5';
      case 'Low': return 'border-l-info-blue bg-info-blue/5';
    }
  };

  const getTypeIcon = (type: NotificationTypeValue) => {
    switch (type) {
      case 'OrderStatusChanged': return <Package size={20} />;
      case 'RepairTicketUpdated': return <Wrench size={20} />;
      case 'LowStockAlert': return <AlertTriangle size={20} />;
      case 'NewSupportMessage': return <MessageSquare size={20} />;
      default: return <Bell size={20} />;
    }
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins}м назад`;
    if (diffHours < 24) return `${diffHours}ч назад`;
    if (diffDays < 7) return `${diffDays}д назад`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-elevated focus:outline-none transition-colors"
        aria-label="Уведомления"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold leading-none text-gold-ink bg-gold rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-card rounded-lg shadow-lg border border-border z-50">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-sm text-foreground">Уведомления</h3>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={() => void markAllAsRead()}
                  className="text-[11px] text-info-blue hover:text-info-blue/80 font-medium flex items-center gap-1 transition-colors"
                >
                  <Check className="h-3.5 w-3.5" />
                  Прочитать все
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Нет уведомлений</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-border hover:bg-elevated/50 cursor-pointer transition-colors ${
                    !notification.isRead
                      ? `${getPriorityStyle(notification.priority)} border-l-2`
                      : 'border-l-2 border-l-transparent'
                  }`}
                  onClick={() => !notification.isRead && void markAsRead(notification.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !notification.isRead) void markAsRead(notification.id); }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-muted-foreground mt-0.5 flex-shrink-0">{getTypeIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${notification.isRead ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                        {notification.title}
                      </p>
                      <p className={`text-xs mt-0.5 line-clamp-2 ${notification.isRead ? 'text-muted-foreground/60' : 'text-muted-foreground'}`}>
                        {notification.message}
                      </p>
                      <p className="text-[11px] text-muted-foreground/50 mt-1.5">
                        {getDateLabel(notification.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {!notification.isRead && (
                        <button
                          onClick={(e) => { e.stopPropagation(); void markAsRead(notification.id); }}
                          className="p-1.5 text-muted-foreground/50 hover:text-info-blue rounded transition-colors"
                          aria-label="Отметить прочитанным"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); void deleteNotification(notification.id); }}
                        className="p-1.5 text-muted-foreground/50 hover:text-price-rise rounded transition-colors"
                        aria-label="Удалить уведомление"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
