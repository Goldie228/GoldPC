/**
 * Auth Store - Zustand store для управления состоянием аутентификации
 */
import { create } from 'zustand';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { persist } from 'zustand/middleware';
import type { User } from '../api/types';
import { decodeHtmlEntities } from '../utils/decodeHtml';

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

  // Actions
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
    if (saved) {
      const data = JSON.parse(saved);
      // Decode HTML entities in user data
      if (data.user) {
        data.user = {
          ...data.user,
          firstName: decodeHtmlEntities(data.user.firstName),
          lastName: decodeHtmlEntities(data.user.lastName),
          email: decodeHtmlEntities(data.user.email),
        };
      }
      return {
        user: data.user ?? null,
        isAuthenticated: !!data.user,
        currentRole: data.user ? (data.user.roles?.[0] ?? data.user.role ?? null) : null,
      };
    }
  } catch {}

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
      // Decode HTML entities in user data
      if (user) {
        user = {
          ...user,
          firstName: decodeHtmlEntities(user.firstName),
          lastName: decodeHtmlEntities(user.lastName),
          email: decodeHtmlEntities(user.email),
        };
      }
      const newState = {
        user,
        isAuthenticated: !!user,
        isLoading: false,
        currentRole: user ? (user.roles?.[0] ?? user.role ?? null) : null,
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

      // Only Admin users are allowed to perform impersonation
      if (!currentState.user || currentState.user.role !== 'Admin') {
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

      // Only allow stopping impersonation if actually impersonating
      if (!currentState.isImpersonating) {
        console.error('Cannot stop impersonation: not currently impersonating');
        return;
      }

      set({
        user: currentState.originalUser,
        originalUser: null,
        isImpersonating: false,
        // Reset current role when stopping impersonation
        currentRole: currentState.originalUser?.roles?.[0] ?? currentState.originalUser?.role ?? null,
      });
    },

    switchRole: (role: string) => {
      const currentState = get();

      if (!currentState.user) return;

      // Validate that user actually has this role
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
          const keycloakModule = await import('../services/keycloak');
          await keycloakModule.doLogout();
        }
      } finally {
        // Always clear local storage and state regardless of server outcome
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