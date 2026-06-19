import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { NotificationCenter } from './NotificationCenter';

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: vi.fn(() => ({
    notifications: [],
    unreadCount: 0,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    deleteNotification: vi.fn(),
  })),
}));

afterEach(() => cleanup());

describe('NotificationCenter', () => {
  it('renders bell button', () => {
    render(<NotificationCenter />);
    expect(screen.getByRole('button', { name: /уведомления/i })).toBeInTheDocument();
  });

  it('shows badge with unread count', async () => {
    const { useNotifications } = await import('@/hooks/useNotifications');
    vi.mocked(useNotifications).mockReturnValue({
      notifications: [{ id: '1', title: 'Test', message: 'msg', createdAt: new Date().toISOString(), read: false, type: 'OrderStatusChanged' as const, priority: 'Medium' as const, entityType: 'Order', entityId: '1' }],
      unreadCount: 1,
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      deleteNotification: vi.fn(),
    } as any);
    render(<NotificationCenter />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('opens dropdown when clicked and shows notifications header', () => {
    render(<NotificationCenter />);
    fireEvent.click(screen.getByRole('button', { name: /уведомления/i }));
    expect(screen.getByRole('heading', { name: /уведомления/i })).toBeInTheDocument();
  });
});
