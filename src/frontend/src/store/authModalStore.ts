/**
 * Auth Modal Store - Zustand store для управления модальными окнами авторизации
 */
import { create } from 'zustand';

export type AuthModalType = 'login' | 'register' | null;

interface AuthModalState {
  /** Активное модальное окно */
  activeModal: AuthModalType;

  // Actions
  /** Открыть модальное окно входа */
  openLoginModal: () => void;
  /** Открыть модальное окно регистрации */
  openRegisterModal: () => void;
  /** Закрыть модальное окно */
  closeAuthModal: () => void;
  /** Переключиться между модальными окнами */
  switchAuthModal: (modal: AuthModalType) => void;
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  activeModal: null,

  openLoginModal: () =>
    set({
      activeModal: 'login',
    }),

  openRegisterModal: () =>
    set({
      activeModal: 'register',
    }),

  closeAuthModal: () =>
    set({
      activeModal: null,
    }),

  switchAuthModal: (modal) =>
    set({
      activeModal: modal,
    }),
}));