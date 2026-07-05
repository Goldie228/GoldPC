import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockSetUser = vi.fn();

vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn((selector: any) => {
    const state = {
      isAuthenticated: false,
      refreshToken: null,
      setUser: mockSetUser,
    };
    return typeof selector === 'function' ? selector(state) : state;
  }),
}));

const mockAxiosPost = vi.fn();

vi.mock('axios', () => ({
  default: {
    post: (...args: any[]) => mockAxiosPost(...args),
  },
}));

vi.mock('../api/client', () => ({
  BASE_URL: 'http://localhost:5000/api/v1',
}));

import { useTokenRefresh } from './useTokenRefresh';

describe('hooks/useTokenRefresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not refresh when no refresh token in localStorage', () => {
    renderHook(() => useTokenRefresh());
    // Should not throw - no refresh token means no API call
    expect(mockAxiosPost).not.toHaveBeenCalled();
  });

  it('does nothing when token is not expired', async () => {
    // Создаёт a valid JWT with future expiry (10 hours from now)
    const payload = { exp: Math.floor((Date.now() + 10 * 60 * 60 * 1000) / 1000) };
    const accessToken = 'header.' + btoa(JSON.stringify(payload)) + '.signature';

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', 'refresh-token-123');

    vi.useFakeTimers({ shouldAdvanceTime: true });

    renderHook(() => useTokenRefresh());

    vi.advanceTimersByTime(60 * 1000);

    expect(mockAxiosPost).not.toHaveBeenCalled();
  });

  it('does nothing when no accessToken and no refreshToken', () => {
    localStorage.clear();
    renderHook(() => useTokenRefresh());
    // Should not throw
    expect(mockAxiosPost).not.toHaveBeenCalled();
  });
});
