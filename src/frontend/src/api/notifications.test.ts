import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGet, mockPut, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPut: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('./index', () => ({
  default: {
    get: mockGet,
    post: vi.fn(),
    put: mockPut,
    patch: vi.fn(),
    delete: mockDelete,
  },
}));

import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  notificationPreferencesApi,
} from './notifications';

describe('api/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserNotifications', () => {
    it('sends GET /notifications with default params', async () => {
      const mockNotifications = [{ id: 'n1', title: 'Test', message: 'Hello' }];
      mockGet.mockResolvedValueOnce({ data: mockNotifications });
      const result = await getUserNotifications();
      expect(mockGet).toHaveBeenCalledWith('/notifications', {
        params: { unreadOnly: false, limit: 50 },
      });
      expect(result).toEqual(mockNotifications);
    });

    it('passes custom unreadOnly and limit', async () => {
      mockGet.mockResolvedValueOnce({ data: [] });
      await getUserNotifications(true, 10);
      expect(mockGet).toHaveBeenCalledWith('/notifications', {
        params: { unreadOnly: true, limit: 10 },
      });
    });
  });

  describe('markAsRead', () => {
    it('sends PUT /notifications/:id/read', async () => {
      mockPut.mockResolvedValueOnce({});
      await markAsRead('notif-1');
      expect(mockPut).toHaveBeenCalledWith('/notifications/notif-1/read');
    });
  });

  describe('markAllAsRead', () => {
    it('sends PUT /notifications/read-all', async () => {
      mockPut.mockResolvedValueOnce({});
      await markAllAsRead();
      expect(mockPut).toHaveBeenCalledWith('/notifications/read-all');
    });
  });

  describe('deleteNotification', () => {
    it('sends DELETE /notifications/:id', async () => {
      mockDelete.mockResolvedValueOnce({});
      await deleteNotification('notif-2');
      expect(mockDelete).toHaveBeenCalledWith('/notifications/notif-2');
    });
  });

  describe('notificationPreferencesApi', () => {
    it('getPreferences — GET /notifications/preferences', async () => {
      const prefs = { orderStatusChanged: true, lowStockAlert: false };
      mockGet.mockResolvedValueOnce({ data: prefs });
      const result = await notificationPreferencesApi.getPreferences();
      expect(mockGet).toHaveBeenCalledWith('/notifications/preferences');
      expect(result).toEqual(prefs);
    });

    it('updatePreferences — PUT /notifications/preferences with data', async () => {
      const data = { loginNotification: true };
      const updated = { ...data, systemAnnouncement: false };
      mockPut.mockResolvedValueOnce({ data: updated });
      const result = await notificationPreferencesApi.updatePreferences(data);
      expect(mockPut).toHaveBeenCalledWith('/notifications/preferences', data);
      expect(result).toEqual(updated);
    });
  });
});
