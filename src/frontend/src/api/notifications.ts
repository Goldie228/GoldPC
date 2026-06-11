/**
 * API для управления уведомлениями пользователя
 *
 * GET    /api/v1/notifications — получить уведомления
 * PUT    /api/v1/notifications/{id}/read — отметить прочитанным
 * PUT    /api/v1/notifications/read-all — отметить всё прочитанным
 * DELETE /api/v1/notifications/{id} — удалить уведомление
 * GET    /api/v1/notifications/preferences — получить настройки
 * PUT    /api/v1/notifications/preferences — сохранить настройки
 */

import api from './index';
import type { UserNotificationPreferences } from './types';

export type { UserNotificationPreferences } from './types';

// ── Тип уведомления (согласован с backend Notification entity) ──

export interface UserNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  relatedUrl?: string;
  metadata?: string;
}

// ── API для уведомлений ──

/**
 * Получить уведомления текущего пользователя
 */
export async function getUserNotifications(
  unreadOnly = false,
  limit = 50
): Promise<UserNotification[]> {
  const response = await api.get<UserNotification[]>('/notifications', {
    params: { unreadOnly, limit },
  });
  return response.data;
}

/**
 * Отметить уведомление как прочитанное
 */
export async function markAsRead(id: string): Promise<void> {
  await api.put(`/notifications/${id}/read`);
}

/**
 * Отметить все уведомления как прочитанные
 */
export async function markAllAsRead(): Promise<void> {
  await api.put('/notifications/read-all');
}

/**
 * Удалить уведомление
 */
export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/notifications/${id}`);
}

// ── API для настроек уведомлений ──

export const notificationPreferencesApi = {
  /**
   * Получить настройки уведомлений текущего пользователя
   */
  async getPreferences(): Promise<UserNotificationPreferences> {
    const response = await api.get<UserNotificationPreferences>(
      '/notifications/preferences'
    );
    return response.data;
  },

  /**
   * Сохранить настройки уведомлений текущего пользователя
   */
  async updatePreferences(
    data: Partial<UserNotificationPreferences>
  ): Promise<UserNotificationPreferences> {
    const response = await api.put<UserNotificationPreferences>(
      '/notifications/preferences',
      data
    );
    return response.data;
  },
};
