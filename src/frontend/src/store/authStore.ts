/**
 * Auth Store - Zustand store для управления состоянием аутентификации
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../api/types';

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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      currentRole: null,
      isAuthenticated: false,
      isLoading: false,
      isImpersonating: false,
      originalUser: null,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
          // Автоматически выбираем первую роль при входе
          currentRole: user ? (user.roles?.[0] ?? user.role ?? null) : null,
        }),

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
        const userRoles = currentState.user.roles ?? [currentState.user.role];
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

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
      }),
      migrate: (persistedState: unknown, _version: number) => {
        return persistedState as AuthState;
      },
    }
  )
);