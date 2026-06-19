import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock SignalR completely
const mockOn = vi.fn();
const mockInvoke = vi.fn().mockResolvedValue(undefined);
const mockStart = vi.fn().mockResolvedValue(undefined);
const mockStop = vi.fn().mockResolvedValue(undefined);

vi.mock('@microsoft/signalr', () => ({
  HubConnectionBuilder: vi.fn(() => ({
    withUrl: vi.fn().mockReturnThis(),
    withAutomaticReconnect: vi.fn().mockReturnThis(),
    configureLogging: vi.fn().mockReturnThis(),
    build: vi.fn(() => ({
      start: mockStart,
      stop: mockStop,
      on: mockOn,
      invoke: mockInvoke,
      state: 1,
    })),
  })),
  LogLevel: { Warning: 0, Information: 1 },
}));

vi.mock('../api/services', () => ({
  servicesApi: {
    getMessages: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    sendMessage: vi.fn().mockResolvedValue(undefined),
    markMessagesAsRead: vi.fn().mockResolvedValue(undefined),
    uploadFile: vi.fn().mockResolvedValue({ fileUrl: '', fileName: '', fileSize: 0, contentType: '' }),
  },
}));

import { useTicketChat } from './useTicketChat';

describe('hooks/useTicketChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state with correct types', () => {
    const { result } = renderHook(() => useTicketChat({ ticketId: 'ticket-1' }));
    expect(result.current.messages).toEqual([]);
    expect(typeof result.current.sendMessage).toBe('function');
    expect(typeof result.current.markRead).toBe('function');
    expect(typeof result.current.loadMore).toBe('function');
    expect(typeof result.current.uploadFile).toBe('function');
  });

  it('returns disconnected status when ticketId is undefined', () => {
    const { result } = renderHook(() => useTicketChat({ ticketId: undefined }));
    expect(result.current.connectionStatus).toBe('disconnected');
  });

  it('has correct initial flags', () => {
    const { result } = renderHook(() => useTicketChat({ ticketId: 'ticket-1' }));
    expect(typeof result.current.sending).toBe('boolean');
    expect(typeof result.current.uploading).toBe('boolean');
    expect(typeof result.current.hasMore).toBe('boolean');
    expect(result.current.typingUserId).toBeNull();
  });
});
