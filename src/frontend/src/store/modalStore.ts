/**
 * Modal Store - Zustand store для управления модальными окнами
 */
import { create } from 'zustand';
import type { ReactNode } from 'react';

export interface ModalContent {
  /** Заголовок модального окна */
  title?: string;
  /** Содержимое модального окна */
  content: ReactNode;
  /** Размер модального окна */
  size?: 'small' | 'default' | 'large' | 'fullWidth';
  /** Опциональный футер */
  footer?: ReactNode;
  /** Дополнительные данные */
  data?: Record<string, unknown>;
}

interface ModalState {
  /** Открыто ли модальное окно */
  isOpen: boolean;
  /** Содержимое модального окна */
  modalContent: ModalContent | null;

  // Actions
  /** Открыть модальное окно с контентом */
  openModal: (content: ModalContent) => void;
  /** Закрыть модальное окно */
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  modalContent: null,

  openModal: (content) =>
    set({
      isOpen: true,
      modalContent: content,
    }),

  closeModal: () =>
    set({
      isOpen: false,
      modalContent: null,
    }),
}));
