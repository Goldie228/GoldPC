import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useComparisonStore } from './comparisonStore';

// Mock localStorage для persist middleware
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((_index: number) => null),
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('comparisonStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    // Сбросить store к начальному состоянию
    useComparisonStore.setState({ items: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Начальное состояние', () => {
    it('items — пустой массив', () => {
      expect(useComparisonStore.getState().items).toEqual([]);
    });

    it('getCount() возвращает 0', () => {
      expect(useComparisonStore.getState().getCount()).toBe(0);
    });

    it('isInComparison() возвращает false для любого ID', () => {
      expect(useComparisonStore.getState().isInComparison('any-id')).toBe(false);
    });

    it('getItems() возвращает пустой массив', () => {
      expect(useComparisonStore.getState().getItems()).toEqual([]);
    });
  });

  describe('addItem', () => {
    it('добавляет товар в список', () => {
      const result = useComparisonStore.getState().addItem('product-1', 'cpu');
      expect(result.success).toBe(true);
      expect(useComparisonStore.getState().items).toEqual([
        { id: 'product-1', category: 'cpu' },
      ]);
    });

    it('не добавляет дубликат', () => {
      useComparisonStore.getState().addItem('product-1', 'cpu');
      const result = useComparisonStore.getState().addItem('product-1', 'cpu');
      expect(result.success).toBe(true); // считается успехом (уже есть)
      expect(useComparisonStore.getState().items).toHaveLength(1);
    });

    it('возвращает limit если категория заполнена (4 товара)', () => {
      useComparisonStore.setState({
        items: [
          { id: 'p1', category: 'cpu' },
          { id: 'p2', category: 'cpu' },
          { id: 'p3', category: 'cpu' },
          { id: 'p4', category: 'cpu' },
        ],
      });
      const result = useComparisonStore.getState().addItem('p5', 'cpu');
      expect(result.success).toBe(false);
      expect(result.reason).toBe('limit');
    });

    it('разрешает добавить в другую категорию при заполненной первой', () => {
      useComparisonStore.setState({
        items: [
          { id: 'p1', category: 'cpu' },
          { id: 'p2', category: 'cpu' },
          { id: 'p3', category: 'cpu' },
          { id: 'p4', category: 'cpu' },
        ],
      });
      const result = useComparisonStore.getState().addItem('p5', 'gpu');
      expect(result.success).toBe(true);
    });
  });

  describe('removeItem', () => {
    it('удаляет товар из списка', () => {
      useComparisonStore.setState({
        items: [{ id: 'product-1', category: 'cpu' }],
      });
      useComparisonStore.getState().removeItem('product-1');
      expect(useComparisonStore.getState().items).toEqual([]);
    });

    it('не падает при удалении несуществующего товара', () => {
      useComparisonStore.setState({
        items: [{ id: 'product-1', category: 'cpu' }],
      });
      useComparisonStore.getState().removeItem('nonexistent');
      expect(useComparisonStore.getState().items).toHaveLength(1);
    });

    it('удаляет только целевой товар', () => {
      useComparisonStore.setState({
        items: [
          { id: 'p1', category: 'cpu' },
          { id: 'p2', category: 'gpu' },
        ],
      });
      useComparisonStore.getState().removeItem('p1');
      expect(useComparisonStore.getState().items).toEqual([
        { id: 'p2', category: 'gpu' },
      ]);
    });
  });

  describe('toggleComparison', () => {
    it('добавляет товар если его нет', () => {
      const result = useComparisonStore.getState().toggleComparison('p1', 'cpu');
      expect(result.success).toBe(true);
      expect(useComparisonStore.getState().items).toEqual([
        { id: 'p1', category: 'cpu' },
      ]);
    });

    it('удаляет товар если он есть', () => {
      useComparisonStore.setState({
        items: [{ id: 'p1', category: 'cpu' }],
      });
      const result = useComparisonStore.getState().toggleComparison('p1', 'cpu');
      expect(result.success).toBe(true);
      expect(useComparisonStore.getState().items).toEqual([]);
    });

    it('двойной toggle возвращает в исходное состояние', () => {
      useComparisonStore.getState().toggleComparison('p1', 'cpu');
      useComparisonStore.getState().toggleComparison('p1', 'cpu');
      expect(useComparisonStore.getState().items).toEqual([]);
    });

    it('возвращает limit при попытке toggle добавления сверх лимита', () => {
      useComparisonStore.setState({
        items: [
          { id: 'p1', category: 'cpu' },
          { id: 'p2', category: 'cpu' },
          { id: 'p3', category: 'cpu' },
          { id: 'p4', category: 'cpu' },
        ],
      });
      const result = useComparisonStore.getState().toggleComparison('p5', 'cpu');
      expect(result.success).toBe(false);
      expect(result.reason).toBe('limit');
    });
  });

  describe('clearComparison', () => {
    it('очищает весь список', () => {
      useComparisonStore.setState({
        items: [
          { id: 'p1', category: 'cpu' },
          { id: 'p2', category: 'gpu' },
        ],
      });
      useComparisonStore.getState().clearComparison();
      expect(useComparisonStore.getState().items).toEqual([]);
    });

    it('не падает на пустом списке', () => {
      useComparisonStore.getState().clearComparison();
      expect(useComparisonStore.getState().items).toEqual([]);
    });
  });

  describe('Лимит товаров на категорию', () => {
    it('canAdd возвращает false для пустой категории', () => {
      expect(useComparisonStore.getState().canAdd('')).toBe(false);
    });

    it('canAdd возвращает false если category не передана', () => {
      expect(useComparisonStore.getState().canAdd()).toBe(false);
    });

    it('canAdd возвращает true если в категории меньше 4 товаров', () => {
      useComparisonStore.setState({
        items: [
          { id: 'p1', category: 'cpu' },
          { id: 'p2', category: 'cpu' },
        ],
      });
      expect(useComparisonStore.getState().canAdd('cpu')).toBe(true);
    });

    it('canAdd возвращает false если в категории ровно 4 товара', () => {
      useComparisonStore.setState({
        items: [
          { id: 'p1', category: 'cpu' },
          { id: 'p2', category: 'cpu' },
          { id: 'p3', category: 'cpu' },
          { id: 'p4', category: 'cpu' },
        ],
      });
      expect(useComparisonStore.getState().canAdd('cpu')).toBe(false);
    });

    it('canAdd учитывает нормализацию категории (алиасы)', () => {
      useComparisonStore.setState({
        items: [
          { id: 'p1', category: 'processors' },
          { id: 'p2', category: 'cpu' },
          { id: 'p3', category: 'процессор' },
          { id: 'p4', category: 'процессоры' },
        ],
      });
      // Все 4 — это «cpu» после нормализации, лимит достигнут
      expect(useComparisonStore.getState().canAdd('cpu')).toBe(false);
    });

    it('разные категории независимы по лимиту', () => {
      useComparisonStore.setState({
        items: [
          { id: 'p1', category: 'cpu' },
          { id: 'p2', category: 'cpu' },
          { id: 'p3', category: 'cpu' },
          { id: 'p4', category: 'cpu' },
        ],
      });
      expect(useComparisonStore.getState().canAdd('gpu')).toBe(true);
    });
  });

  describe('getItems', () => {
    it('возвращает массив ID', () => {
      useComparisonStore.setState({
        items: [
          { id: 'p1', category: 'cpu' },
          { id: 'p2', category: 'gpu' },
        ],
      });
      expect(useComparisonStore.getState().getItems()).toEqual(['p1', 'p2']);
    });

    it('возвращает пустой массив если нет товаров', () => {
      expect(useComparisonStore.getState().getItems()).toEqual([]);
    });
  });

  describe('isInComparison', () => {
    it('возвращает true если товар есть', () => {
      useComparisonStore.setState({
        items: [{ id: 'p1', category: 'cpu' }],
      });
      expect(useComparisonStore.getState().isInComparison('p1')).toBe(true);
    });

    it('возвращает false если товара нет', () => {
      expect(useComparisonStore.getState().isInComparison('p1')).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('addItem с пустой строкой категории — добавляет (canAddToNormalizedCategory разрешает)', () => {
      // canAdd проверяет пустую строку и возвращает false,
      // но addItem вызывает canAddToNormalizedCategory напрямую — пустая категория проходит
      const result = useComparisonStore.getState().addItem('p1', '');
      expect(result.success).toBe(true);
      expect(useComparisonStore.getState().items).toEqual([{ id: 'p1', category: '' }]);
    });

    it('toggleComparison не добавляет при лимите но удаляет существующий', () => {
      useComparisonStore.setState({
        items: [
          { id: 'p1', category: 'cpu' },
          { id: 'p2', category: 'cpu' },
          { id: 'p3', category: 'cpu' },
          { id: 'p4', category: 'cpu' },
        ],
      });
      // Удаление существующего работает даже при лимите
      const result = useComparisonStore.getState().toggleComparison('p1', 'cpu');
      expect(result.success).toBe(true);
      expect(useComparisonStore.getState().items).toHaveLength(3);
    });
  });
});
