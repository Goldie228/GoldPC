import { useState } from 'react';
import { Package, Wrench, AlertTriangle, MessageSquare, Bell, Circle, Check, Trash2 } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import type { Notification, NotificationPriorityValue, NotificationTypeValue } from '../../hooks/useNotifications';

export const NotificationCenter = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, connectionStatus } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const getPriorityColor = (priority: NotificationPriorityValue) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 border-red-400 text-red-800';
      case 'High': return 'bg-orange-100 border-orange-400 text-orange-800';
      case 'Medium': return 'bg-yellow-100 border-yellow-400 text-yellow-800';
      case 'Low': return 'bg-blue-100 border-blue-400 text-blue-800';
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

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-elevated focus:outline-none"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-card rounded-lg shadow-xl border border-border z-50">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Уведомления</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Circle size={8} className={connectionStatus === 'connected' ? 'text-price-drop' : 'text-price-rise'} fill="currentColor" />
                {connectionStatus === 'connected' ? 'В сети' : 'Не в сети'}
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={() => void markAllAsRead()}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Check className="h-4 w-4" />
                  Прочитать все
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p>Нет уведомлений</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-border hover:bg-elevated cursor-pointer ${!notification.isRead ? getPriorityColor(notification.priority) : ''}`}
                  onClick={() => !notification.isRead && void markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">{getTypeIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{notification.title}</p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.isRead && (
                        <button
                          onClick={(e) => { e.stopPropagation(); void markAsRead(notification.id); }}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); void deleteNotification(notification.id); }}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
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
