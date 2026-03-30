/**
 * useModal Hook - Удобное управление модальными окнами
 */
import { useCallback } from 'react';
import { useModalStore, type ModalContent } from '../store/modalStore';

export interface UseModalReturn {
  /** Открыто ли модальное окно */
  isOpen: boolean;
  /** Содержимое модального окна */
  modalContent: ModalContent | null;
  /** Открыть модальное окно */
  openModal: (content: ModalContent) => void;
  /** Закрыть модальное окно */
  closeModal: () => void;
  /** Полностью закрыть все модальные окна */
  closeAll: () => void;
  /** Переключить состояние модального окна */
  toggleModal: (content?: ModalContent) => void;
}

/**
 * Хук для управления модальными окнами
 *
 * @example
 * const { openModal, closeModal } = useModal();
 *
 * // Открыть модальное окно
 * openModal({
 *   title: 'Подтверждение',
 *   content: <p>Вы уверены?</p>,
 * });
 *
 * // Закрыть модальное окно
 * closeModal();
 */
export function useModal(): UseModalReturn {
  const isOpen = useModalStore((state) => state.isOpen);
  const modalContent = useModalStore((state) => state.modalContent);
  const openModal = useModalStore((state) => state.openModal);
  const closeModal = useModalStore((state) => state.closeModal);
   const closeAll = useModalStore((state) => state.closeAll);

  const toggleModal = useCallback(
    (content?: ModalContent) => {
      if (isOpen) {
        closeModal();
      } else if (content) {
        openModal(content);
      }
    },
    [isOpen, openModal, closeModal]
  );

  return {
    isOpen,
    modalContent,
    openModal,
    closeModal,
    closeAll,
    toggleModal,
  };
}

export default useModal;