/**
 * AuthModalContainer - Контейнер для модальных окон авторизации
 * 
 * Рендерит LoginModal или RegisterModal в зависимости от состояния authModalStore
 */

import { useAuthModal } from '../../hooks/useAuthModal';
import { LoginModal } from './LoginModal';
import { RegisterModal } from './RegisterModal';

export function AuthModalContainer() {
  const { activeModal, closeAuthModal } = useAuthModal();

  return (
    <>
      <LoginModal
        isOpen={activeModal === 'login'}
        onClose={closeAuthModal}
      />
      <RegisterModal
        isOpen={activeModal === 'register'}
        onClose={closeAuthModal}
      />
    </>
  );
}

export default AuthModalContainer;