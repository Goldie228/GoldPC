/**
 * useAuthModal Hook - Управление модальными окнами авторизации
 */
import { useAuthModalStore, type AuthModalType } from '../store/authModalStore';

export interface UseAuthModalReturn {
  activeModal: AuthModalType;
  openLoginModal: () => void;
  openRegisterModal: () => void;
  closeAuthModal: () => void;
  switchAuthModal: (modal: AuthModalType) => void;
}

export function useAuthModal(): UseAuthModalReturn {
  const activeModal = useAuthModalStore((state) => state.activeModal);
  const openLoginModal = useAuthModalStore((state) => state.openLoginModal);
  const openRegisterModal = useAuthModalStore((state) => state.openRegisterModal);
  const closeAuthModal = useAuthModalStore((state) => state.closeAuthModal);
  const switchAuthModal = useAuthModalStore((state) => state.switchAuthModal);

  return {
    activeModal,
    openLoginModal,
    openRegisterModal,
    closeAuthModal,
    switchAuthModal,
  };
}

export default useAuthModal;