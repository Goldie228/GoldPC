import { describe, it, expect, beforeEach } from 'vitest';
import { useModalStore } from './modalStore';
import type { ReactNode } from 'react';

const content1 = 'Modal 1' as ReactNode;
const content2 = 'Modal 2' as ReactNode;
const content3 = 'Modal 3' as ReactNode;

describe('modalStore', () => {
  beforeEach(() => {
    useModalStore.setState({
      modalStack: [],
      isOpen: false,
      modalContent: null,
    });
  });

  describe('Начальное состояние', () => {
    it('стек пуст, isOpen = false, modalContent = null', () => {
      const state = useModalStore.getState();
      expect(state.modalStack).toEqual([]);
      expect(state.isOpen).toBe(false);
      expect(state.modalContent).toBeNull();
    });
  });

  describe('openModal', () => {
    it('открывает модальное окно', () => {
      useModalStore.getState().openModal({ content: content1 });
      const state = useModalStore.getState();
      expect(state.isOpen).toBe(true);
      expect(state.modalContent?.content).toBe(content1);
      expect(state.modalStack).toHaveLength(1);
    });

    it('добавляет в стек несколько модальных окон', () => {
      useModalStore.getState().openModal({ content: content1 });
      useModalStore.getState().openModal({ content: content2 });
      const state = useModalStore.getState();
      expect(state.modalStack).toHaveLength(2);
      expect(state.modalContent?.content).toBe(content2); // верх стека
    });

    it('сохраняет title и size', () => {
      useModalStore.getState().openModal({
        content: content1,
        title: 'Test Title',
        size: 'large',
      });
      const state = useModalStore.getState();
      expect(state.modalContent?.title).toBe('Test Title');
      expect(state.modalContent?.size).toBe('large');
    });

    it('сохраняет data', () => {
      useModalStore.getState().openModal({
        content: content1,
        data: { id: '123', action: 'edit' },
      });
      expect(useModalStore.getState().modalContent?.data).toEqual({ id: '123', action: 'edit' });
    });
  });

  describe('closeModal', () => {
    it('закрывает единственное модальное окно', () => {
      useModalStore.getState().openModal({ content: content1 });
      useModalStore.getState().closeModal();
      const state = useModalStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.modalContent).toBeNull();
      expect(state.modalStack).toEqual([]);
    });

    it('закрывает верхнее окно и оставляет нижнее', () => {
      useModalStore.getState().openModal({ content: content1 });
      useModalStore.getState().openModal({ content: content2 });
      useModalStore.getState().closeModal();
      const state = useModalStore.getState();
      expect(state.isOpen).toBe(true);
      expect(state.modalStack).toHaveLength(1);
      expect(state.modalContent?.content).toBe(content1);
    });

    it('закрывает все по одному', () => {
      useModalStore.getState().openModal({ content: content1 });
      useModalStore.getState().openModal({ content: content2 });
      useModalStore.getState().openModal({ content: content3 });
      useModalStore.getState().closeModal();
      useModalStore.getState().closeModal();
      useModalStore.getState().closeModal();
      const state = useModalStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.modalContent).toBeNull();
      expect(state.modalStack).toEqual([]);
    });

    it('ничего не меняет если стек пуст', () => {
      useModalStore.getState().closeModal();
      const state = useModalStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.modalContent).toBeNull();
    });
  });

  describe('closeAll', () => {
    it('полностью очищает стек', () => {
      useModalStore.getState().openModal({ content: content1 });
      useModalStore.getState().openModal({ content: content2 });
      useModalStore.getState().openModal({ content: content3 });
      useModalStore.getState().closeAll();
      const state = useModalStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.modalContent).toBeNull();
      expect(state.modalStack).toEqual([]);
    });

    it('ничего не меняет если стек пуст', () => {
      useModalStore.getState().closeAll();
      expect(useModalStore.getState().isOpen).toBe(false);
    });
  });
});
