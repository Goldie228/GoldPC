import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useToastStore } from './toastStore';

describe('toastStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useToastStore.setState({ toasts: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Начальное состояние', () => {
    it('toasts — пустой массив', () => {
      expect(useToastStore.getState().toasts).toEqual([]);
    });
  });

  describe('showToast', () => {
    it('добавляет тост с типом success по умолчанию', () => {
      useToastStore.getState().showToast('Operation completed');
      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toBe('Operation completed');
      expect(toasts[0].type).toBe('success');
    });

    it('добавляет тост с указанным типом', () => {
      useToastStore.getState().showToast('Error occurred', 'error');
      expect(useToastStore.getState().toasts[0].type).toBe('error');
    });

    it('добавляет тост с указанным duration', () => {
      useToastStore.getState().showToast('Warning', 'warning', 2000);
      const toasts = useToastStore.getState().toasts;
      expect(toasts[0].duration).toBe(2000);
    });

    it('автоматически удаляет тост после duration', () => {
      useToastStore.getState().showToast('Auto remove', 'success', 1000);
      expect(useToastStore.getState().toasts).toHaveLength(1);

      vi.advanceTimersByTime(1000);

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('не удаляет тост если duration = 0', () => {
      useToastStore.getState().showToast('Persistent', 'info', 0);
      vi.advanceTimersByTime(10000);
      expect(useToastStore.getState().toasts).toHaveLength(1);
    });

    it('генерирует уникальные id для каждого тоста', () => {
      useToastStore.getState().showToast('Toast 1');
      useToastStore.getState().showToast('Toast 2');
      const toasts = useToastStore.getState().toasts;
      expect(toasts[0].id).not.toBe(toasts[1].id);
    });
  });

  describe('removeToast', () => {
    it('удаляет тост по id', () => {
      useToastStore.getState().showToast('Toast 1');
      useToastStore.getState().showToast('Toast 2');
      const id = useToastStore.getState().toasts[0].id;
      useToastStore.getState().removeToast(id);
      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toBe('Toast 2');
    });

    it('не меняет корзину если id не найден', () => {
      useToastStore.getState().showToast('Toast 1');
      useToastStore.getState().removeToast('nonexistent-id');
      expect(useToastStore.getState().toasts).toHaveLength(1);
    });
  });

  describe('clearToasts', () => {
    it('очищает все тосты', () => {
      useToastStore.getState().showToast('Toast 1');
      useToastStore.getState().showToast('Toast 2');
      useToastStore.getState().showToast('Toast 3');
      useToastStore.getState().clearToasts();
      expect(useToastStore.getState().toasts).toEqual([]);
    });

    it('ничего не меняет если тостов нет', () => {
      useToastStore.getState().clearToasts();
      expect(useToastStore.getState().toasts).toEqual([]);
    });
  });

  describe('Все типы тостов', () => {
    it('поддерживает все 4 типа', () => {
      const types = ['success', 'error', 'info', 'warning'] as const;
      types.forEach((type) => {
        useToastStore.getState().showToast(`Message ${type}`, type);
      });
      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(4);
      expect(toasts.map(t => t.type)).toEqual(['success', 'error', 'info', 'warning']);
    });
  });
});
