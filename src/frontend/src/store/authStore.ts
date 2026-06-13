/**
 * Auth Store - Zustand store для управления состоянием аутентификации
 */
import { create } from 'zustand';
import type { User } from '../api/types';
import { decodeHtmlEntities } from '../utils/decodeHtml';
import { mapBackendRole, normalizeUserRoles } from '../utils/roleMapper';

export type UserRole = 'Client' | 'Manager' | 'Master' | 'Admin' | 'Accountant';

export const getUserRoles = (user: User | null): string[] => {
  return user?.roles ?? (user?.role ? [user.role] : ['Client']);
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isImpersonating: boolean;
  originalUser: User | null;
  currentRole: string | null;

  // Действия
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  startImpersonation: (targetUser: User) => void;
  stopImpersonation: () => void;
  switchRole: (role: string) => void;
}

// ✅ ВРУЧНУЮ ВОССТАНАВЛИВАЕМ СОСТОЯНИЕ БЕЗ БАГАНУТОГО PERSIST MIDDLEWARE
const getInitialState = (): Pick<AuthState, 'user' | 'isAuthenticated' | 'currentRole'> => {
  try {
    const saved = localStorage.getItem('auth-storage');

    // Проверяем, что токен реально существует
    const hasToken = !!(
      localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken')
    );

    if (saved != null && saved !== '' && hasToken) {
      const data = JSON.parse(saved) as { user?: User | null };
      // Декодируем HTML-сущности в данных пользователя
      if (data.user != null) {
        const decodedUser = {
          ...data.user,
          firstName: decodeHtmlEntities(data.user.firstName),
          lastName: decodeHtmlEntities(data.user.lastName),
          email: decodeHtmlEntities(data.user.email),
        };
        // Нормализуем роли: бэкенд мог сохранить числа (0=Client)
        const normalizedUser = normalizeUserRoles(decodedUser);
         return {
           user: normalizedUser,
           isAuthenticated: normalizedUser != null,
           currentRole: normalizedUser != null ? mapBackendRole(normalizedUser.roles?.[0] ?? normalizedUser.role) : null,
         };
      }
    }

    // Если дошли сюда — нет user'а или нет токена ⇒ неавторизован
    if (saved != null && saved !== '') {
      console.warn('[authStore] auth-storage найден, но accessToken отсутствует — очищаем');
      localStorage.removeItem('auth-storage');
    }
  } catch {
    // Игнорируем ошибки парсинга
  }

  return {
    user: null,
    isAuthenticated: false,
    currentRole: null,
  };
};

const initialState = getInitialState();

export const useAuthStore = create<AuthState>()(
  (set, get) => ({
    ...initialState,
    isLoading: false,
    isImpersonating: false,
    originalUser: null,

    setUser: (user) => {
      // Декодируем HTML-сущности в данных пользователя
      if (user != null) {
        user = {
          ...user,
          firstName: decodeHtmlEntities(user.firstName),
          lastName: decodeHtmlEntities(user.lastName),
          email: decodeHtmlEntities(user.email),
        };
        // Нормализуем роли на случай если пришли числа
        user = normalizeUserRoles(user);
      }
      const newState = {
        user,
        isAuthenticated: !!user,
        isLoading: false,
        currentRole: user != null ? mapBackendRole(user.roles?.[0] ?? user.role) : null,
      };

      // ✅ ВРУЧНУЮ СОХРАНЯЕМ В LOCALSTORAGE
      localStorage.setItem('auth-storage', JSON.stringify({
        user: newState.user,
        currentRole: newState.currentRole,
      }));

      set(newState);
    },

    setLoading: (isLoading) =>
      set({ isLoading }),

    startImpersonation: (targetUser: User) => {
      const currentState = get();

      // Только пользователи с ролью Admin могут выполнять подмену
      if (currentState.user?.role !== 'Admin') {
        console.error('Security violation: Insufficient permissions for user impersonation');
        return;
      }

      set({
        originalUser: currentState.user,
        user: targetUser,
        isImpersonating: true,
      });
    },

    stopImpersonation: () => {
      const currentState = get();

      // Разрешаем остановку подмены только если она активна
      if (!currentState.isImpersonating) {
        console.error('Cannot stop impersonation: not currently impersonating');
        return;
      }

      set({
        user: currentState.originalUser,
        originalUser: null,
        isImpersonating: false,
        // Сбрасываем текущую роль при остановке подмены
        currentRole: currentState.originalUser?.roles?.[0] ?? currentState.originalUser?.role ?? null,
      });
    },

    switchRole: (role: string) => {
      const currentState = get();

      if (currentState.user == null) return;

      // Проверяем, что пользователь действительно имеет эту роль
      const userRoles: string[] = (currentState.user.roles ?? [currentState.user.role]).filter(Boolean) as string[];
      if (!userRoles.includes(role)) {
        console.error(`User does not have role: ${role}`);
        return;
      }

      set({
        currentRole: role,
      });
    },

    logout: async () => {
      try {
        // В Production делаем logout через Keycloak first
        if (import.meta.env.PROD) {
          const keycloakModule = await import('../api/keycloak');
          await keycloakModule.doLogout();
        }
      } finally {
        // Всегда очищаем локальное хранилище и состояние независимо от результата сервера
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        localStorage.removeItem('auth-storage');

        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    },
  })
);