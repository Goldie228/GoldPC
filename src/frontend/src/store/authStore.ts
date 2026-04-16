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

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  startImpersonation: (targetUser: User) => void;
  stopImpersonation: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      // isAuthenticated is derived automatically from user presence - NOT PERSISTED
      get isAuthenticated() {
        return !!this.user;
      },
      isLoading: false,
      isImpersonating: false,
      originalUser: null,

      setUser: (user) =>
        set({
          user,
          isLoading: false,
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