import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';

// Mock the notification store/context
const mockNotifications: any[] = [];
const mockUnreadCount = 0;
const mockMarkAsRead = vi.fn().mockResolvedValue(undefined);
const mockMarkAllAsRead = vi.fn().mockResolvedValue(undefined);
const mockDeleteNotification = vi.fn().mockResolvedValue(undefined);

vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 'user-1' },
    isAuthenticated: true,
  })),
}));

vi.mock('../store/toastStore', () => ({
  useToastStore: vi.fn((selector: any) => {
    return selector({ showToast: vi.fn(), toasts: [], removeToast: vi.fn(), clearToasts: vi.fn() });
  }),
}));

vi.mock('../api/notifications', () => ({
  getUserNotifications: vi.fn().mockResolvedValue([]),
  markAsRead: vi.fn().mockResolvedValue(undefined),
  markAllAsRead: vi.fn().mockResolvedValue(undefined),
  deleteNotification: vi.fn().mockResolvedValue(undefined),
}));

// Use a simpler approach - just test the exports and types
import {
  NotificationProvider,
  useNotifications,
  NotificationType,
  NotificationPriority,
} from './useNotifications';

describe('hooks/useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exports NotificationType enum', () => {
    expect(NotificationType.OrderStatusChanged).toBe('OrderStatusChanged');
    expect(NotificationType.RepairTicketUpdated).toBe('RepairTicketUpdated');
    expect(NotificationType.LowStockAlert).toBe('LowStockAlert');
    expect(NotificationType.NewSupportMessage).toBe('NewSupportMessage');
    expect(NotificationType.SystemAnnouncement).toBe('SystemAnnouncement');
  });

  it('exports NotificationPriority enum', () => {
    expect(NotificationPriority.Low).toBe('Low');
    expect(NotificationPriority.Medium).toBe('Medium');
    expect(NotificationPriority.High).toBe('High');
    expect(NotificationPriority.Critical).toBe('Critical');
  });

  it('useNotifications throws when used outside provider', () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useNotifications());
    }).toThrow();

    spy.mockRestore();
  });

  it('useNotifications works inside provider', () => {
    function Wrapper({ children }: { children: ReactNode }) {
      return <NotificationProvider>{children}</NotificationProvider>;
    }

    const { result } = renderHook(() => useNotifications(), { wrapper: Wrapper });

    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
    expect(typeof result.current.markAsRead).toBe('function');
    expect(typeof result.current.markAllAsRead).toBe('function');
    expect(typeof result.current.deleteNotification).toBe('function');
  });
});
