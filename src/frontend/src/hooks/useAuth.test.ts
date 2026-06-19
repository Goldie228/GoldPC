import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockSetUser = vi.fn();
const mockSetLoading = vi.fn();
const mockStoreLogout = vi.fn();
const mockStartImpersonation = vi.fn();
const mockStopImpersonation = vi.fn();
const mockSyncWithServer = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isImpersonating: false,
    originalUser: null,
    setUser: mockSetUser,
    setLoading: mockSetLoading,
    logout: mockStoreLogout,
    startImpersonation: mockStartImpersonation,
    stopImpersonation: mockStopImpersonation,
  })),
}));

vi.mock('../store/wishlistStore', () => ({
  useWishlistStore: vi.fn((selector: any) => {
    if (typeof selector === 'function') {
      return selector({ syncWithServer: mockSyncWithServer });
    }
    return mockSyncWithServer;
  }),
}));

vi.mock('../api/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('../api/client', () => ({
  default: { defaults: { headers: { common: {} } } },
}));

import { useAuth } from './useAuth';
import { authService } from '../api/authService';

describe('hooks/useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSyncWithServer.mockResolvedValue(undefined);
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns default state from store', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isImpersonating).toBe(false);
  });

  it('login calls authService.login and sets user', async () => {
    const fakeUser = { id: '1', email: 'test@test.com', firstName: 'A', lastName: 'B', role: 'Client' } as any;
    vi.mocked(authService.login).mockResolvedValue({ user: fakeUser, accessToken: 'at', refreshToken: 'rt' } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login({ email: 'test@test.com', password: 'pass' });
    });

    expect(authService.login).toHaveBeenCalled();
    expect(mockSetUser).toHaveBeenCalledWith(fakeUser);
  });

  it('login throws on error', async () => {
    vi.mocked(authService.login).mockRejectedValue(new Error('Bad credentials'));

    const { result } = renderHook(() => useAuth());

    await expect(
      result.current.login({ email: 'x', password: 'y' })
    ).rejects.toThrow('Bad credentials');
  });

  it('register calls authService.register and sets user', async () => {
    const fakeUser = { id: '2', email: 'new@test.com' } as any;
    vi.mocked(authService.register).mockResolvedValue({ user: fakeUser, accessToken: 'at', refreshToken: 'rt' } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.register({ email: 'new@test.com', password: 'pass', firstName: 'N', lastName: 'U', phone: '+375291234567' });
    });

    expect(authService.register).toHaveBeenCalled();
    expect(mockSetUser).toHaveBeenCalledWith(fakeUser);
  });

  it('logout clears state', async () => {
    vi.mocked(authService.logout).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.logout();
    });

    expect(mockStoreLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('startImpersonation delegates to store', () => {
    const { result } = renderHook(() => useAuth());
    const targetUser = { id: 'target' } as any;

    act(() => {
      result.current.startImpersonation(targetUser);
    });

    expect(mockStartImpersonation).toHaveBeenCalledWith(targetUser);
  });

  it('stopImpersonation delegates to store', () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.stopImpersonation();
    });

    expect(mockStopImpersonation).toHaveBeenCalled();
  });
});
