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
  /** Стек модальных окон (последний элемент — верхнее модальное окно) */
  modalStack: ModalContent[];
  /** Открыто ли хотя бы одно модальное окно */
  isOpen: boolean;
  /** Текущее (верхнее) модальное окно, для удобства доступа в хуках/контейнере */
  modalContent: ModalContent | null;

  // Actions
  /** Открыть модальное окно с контентом (добавляет в стек) */
  openModal: (content: ModalContent) => void;
  /** Закрыть текущее модальное окно (снять верх стека) */
  closeModal: () => void;
  /** Полностью очистить все модальные окна */
  closeAll: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  modalStack: [],
  isOpen: false,
  modalContent: null,

  openModal: (content) =>
    set((state) => {
      const newStack = [...state.modalStack, content];
      const top = newStack[newStack.length - 1] ?? null;
      return {
        modalStack: newStack,
        isOpen: newStack.length > 0,
        modalContent: top,
      };
    }),

  closeModal: () =>
    set((state) => {
      if (state.modalStack.length <= 1) {
        return {
          modalStack: [],
          isOpen: false,
          modalContent: null,
        };
      }

      const newStack = state.modalStack.slice(0, -1);
      const top = newStack[newStack.length - 1] ?? null;

      return {
        modalStack: newStack,
        isOpen: newStack.length > 0,
        modalContent: top,
      };
    }),

  closeAll: () =>
    set({
      modalStack: [],
      isOpen: false,
      modalContent: null,
    }),
}));
