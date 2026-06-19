import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore, getUserRoles } from './authStore';
import type { User } from '../api/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((_index: number) => null),
  };
})();

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((_index: number) => null),
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });
Object.defineProperty(globalThis, 'sessionStorage', { value: sessionStorageMock });

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'Иван',
  lastName: 'Петров',
  phone: '+375291234567',
  role: 'Client',
  roles: ['Client'],
  isActive: true,
  isEmailVerified: true,
  createdAt: '2024-01-01T00:00:00Z',
};

const mockAdminUser: User = {
  ...mockUser,
  id: 'admin-1',
  email: 'admin@example.com',
  role: 'Admin',
  roles: ['Admin'],
};

describe('authStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    sessionStorageMock.clear();
    vi.clearAllMocks();
    // Сбросить store к начальному состоянию
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isImpersonating: false,
      originalUser: null,
      currentRole: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getUserRoles (pure function)', () => {
    it('возвращает roles если есть', () => {
      const user: User = { ...mockUser, roles: ['Admin', 'Manager'] };
      expect(getUserRoles(user)).toEqual(['Admin', 'Manager']);
    });

    it('возвращает [role] если roles пустой', () => {
      const user: User = { ...mockUser, roles: undefined, role: 'Manager' };
      expect(getUserRoles(user)).toEqual(['Manager']);
    });

    it('возвращает [Client] если user null', () => {
      expect(getUserRoles(null)).toEqual(['Client']);
    });
  });

  describe('Начальное состояние', () => {
    it('user === null, isAuthenticated === false', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('isLoading === false по умолчанию', () => {
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('isImpersonating === false по умолчанию', () => {
      expect(useAuthStore.getState().isImpersonating).toBe(false);
    });
  });

  describe('setUser', () => {
    it('устанавливает пользователя и isAuthenticated = true', () => {
      useAuthStore.getState().setUser(mockUser);
      const state = useAuthStore.getState();
      expect(state.user).not.toBeNull();
      expect(state.user?.id).toBe('user-1');
      expect(state.isAuthenticated).toBe(true);
    });

    it('сбрасывает isLoading при установке пользователя', () => {
      useAuthStore.setState({ isLoading: true });
      useAuthStore.getState().setUser(mockUser);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('setUser(null) сбрасывает авторизацию', () => {
      useAuthStore.getState().setUser(mockUser);
      useAuthStore.getState().setUser(null);
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('сохраняет пользователя в localStorage', () => {
      useAuthStore.getState().setUser(mockUser);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'auth-storage',
        expect.any(String),
      );
      const saved = JSON.parse(
        localStorageMock.setItem.mock.calls.find(
          (c: [string, string]) => c[0] === 'auth-storage',
        )![1],
      );
      expect(saved.user.id).toBe('user-1');
    });

    it('декодирует HTML-сущности в данных пользователя', () => {
      const userWithHtml: User = {
        ...mockUser,
        firstName: '&#x412;&#x430;&#x441;&#x44F;',
        lastName: '&#x41F;&#x435;&#x442;&#x440;&#x43E;&#x432;',
        email: 'test@example.com',
      };
      useAuthStore.getState().setUser(userWithHtml);
      const state = useAuthStore.getState();
      expect(state.user?.firstName).toBe('Вася');
      expect(state.user?.lastName).toBe('Петров');
    });

    it('нормализует числовые роли', () => {
      const userWithNumericRoles = {
        ...mockUser,
        role: 3 as unknown as 'Admin',
        roles: [3, 0] as unknown as ('Admin' | 'Client')[],
      };
      useAuthStore.getState().setUser(userWithNumericRoles as User);
      const state = useAuthStore.getState();
      expect(state.user?.role).toBe('Admin');
      expect(state.user?.roles).toEqual(['Admin', 'Client']);
    });
  });

  describe('setLoading', () => {
    it('устанавливает isLoading = true', () => {
      useAuthStore.getState().setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);
    });

    it('устанавливает isLoading = false', () => {
      useAuthStore.setState({ isLoading: true });
      useAuthStore.getState().setLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('не меняет пользователя', () => {
      useAuthStore.getState().setUser(mockUser);
      useAuthStore.getState().setLoading(true);
      expect(useAuthStore.getState().user?.id).toBe('user-1');
    });
  });

  describe('logout', () => {
    it('сбрасывает пользователя и isAuthenticated', async () => {
      useAuthStore.getState().setUser(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('очищает токены из localStorage', async () => {
      localStorageMock.setItem('accessToken', 'token');
      localStorageMock.setItem('refreshToken', 'refresh');

      await useAuthStore.getState().logout();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
    });

    it('очищает токены из sessionStorage', async () => {
      sessionStorageMock.setItem('accessToken', 'session-token');
      sessionStorageMock.setItem('refreshToken', 'session-refresh');

      await useAuthStore.getState().logout();

      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
    });

    it('очищает auth-storage из localStorage', async () => {
      await useAuthStore.getState().logout();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth-storage');
    });
  });

  describe('startImpersonation', () => {
    it('Admin может начать подмену', () => {
      useAuthStore.getState().setUser(mockAdminUser);
      useAuthStore.getState().startImpersonation(mockUser);

      const state = useAuthStore.getState();
      expect(state.isImpersonating).toBe(true);
      expect(state.originalUser?.id).toBe('admin-1');
      expect(state.user?.id).toBe('user-1');
    });

    it('не-Admin не может начать подмену', () => {
      useAuthStore.getState().setUser(mockUser); // role: Client
      useAuthStore.getState().startImpersonation(mockAdminUser);

      const state = useAuthStore.getState();
      expect(state.isImpersonating).toBe(false);
      expect(state.user?.id).toBe('user-1');
    });

    it('сохраняет оригинального пользователя', () => {
      useAuthStore.getState().setUser(mockAdminUser);
      useAuthStore.getState().startImpersonation(mockUser);

      expect(useAuthStore.getState().originalUser?.email).toBe('admin@example.com');
    });
  });

  describe('stopImpersonation', () => {
    it('возвращает оригинального пользователя', () => {
      useAuthStore.getState().setUser(mockAdminUser);
      useAuthStore.getState().startImpersonation(mockUser);
      useAuthStore.getState().stopImpersonation();

      const state = useAuthStore.getState();
      expect(state.isImpersonating).toBe(false);
      expect(state.user?.id).toBe('admin-1');
      expect(state.originalUser).toBeNull();
    });

    it('не делает ничего если подмена не активна', () => {
      useAuthStore.getState().setUser(mockAdminUser);
      useAuthStore.getState().stopImpersonation();

      const state = useAuthStore.getState();
      expect(state.isImpersonating).toBe(false);
      expect(state.user?.id).toBe('admin-1');
    });

    it('сбрасывает currentRole к роли оригинального пользователя', () => {
      useAuthStore.getState().setUser(mockAdminUser);
      useAuthStore.getState().startImpersonation(mockUser);
      useAuthStore.getState().stopImpersonation();

      expect(useAuthStore.getState().currentRole).toBe('Admin');
    });
  });

  describe('switchRole', () => {
    it('переключает роль если она есть у пользователя', () => {
      const multiRoleUser: User = {
        ...mockUser,
        roles: ['Client', 'Manager'],
      };
      useAuthStore.getState().setUser(multiRoleUser);
      useAuthStore.getState().switchRole('Manager');

      expect(useAuthStore.getState().currentRole).toBe('Manager');
    });

    it('не переключает роль если её нет у пользователя', () => {
      useAuthStore.getState().setUser(mockUser); //只有 Client
      useAuthStore.getState().switchRole('Admin');

      expect(useAuthStore.getState().currentRole).not.toBe('Admin');
    });

    it('не делает ничего если пользователь не установлен', () => {
      useAuthStore.getState().switchRole('Admin');
      expect(useAuthStore.getState().currentRole).toBeNull();
    });
  });
});
