import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useWishlistStore } from './wishlistStore';

// Mock wishlistApi
vi.mock('../api/wishlist', () => ({
  wishlistApi: {
    addItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
    sync: vi.fn().mockResolvedValue([]),
    getItems: vi.fn().mockResolvedValue([]),
  },
}));

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

const sessionStorageMock = (() => {
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
Object.defineProperty(globalThis, 'sessionStorage', { value: sessionStorageMock });

describe('wishlistStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    sessionStorageMock.clear();
    vi.clearAllMocks();
    // Сбросить store к начальному состоянию
    useWishlistStore.setState({ items: [] });
  });

  describe('Начальное состояние', () => {
    it('items — пустой массив', () => {
      expect(useWishlistStore.getState().items).toEqual([]);
    });

    it('getCount() возвращает 0', () => {
      expect(useWishlistStore.getState().getCount()).toBe(0);
    });

    it('isInWishlist() возвращает false для любого ID', () => {
      expect(useWishlistStore.getState().isInWishlist('any-id')).toBe(false);
    });
  });

  describe('addItem', () => {
    it('добавляет товар в список', () => {
      useWishlistStore.getState().addItem('product-1');
      expect(useWishlistStore.getState().items).toEqual(['product-1']);
    });

    it('не добавляет дубликат', () => {
      useWishlistStore.getState().addItem('product-1');
      useWishlistStore.getState().addItem('product-1');
      expect(useWishlistStore.getState().items).toEqual(['product-1']);
    });

    it('добавляет несколько разных товаров', () => {
      useWishlistStore.getState().addItem('product-1');
      useWishlistStore.getState().addItem('product-2');
      useWishlistStore.getState().addItem('product-3');
      expect(useWishlistStore.getState().items).toEqual([
        'product-1',
        'product-2',
        'product-3',
      ]);
    });

    it('getCount() обновляется после добавления', () => {
      useWishlistStore.getState().addItem('product-1');
      expect(useWishlistStore.getState().getCount()).toBe(1);
    });
  });

  describe('removeItem', () => {
    it('удаляет товар из списка', () => {
      useWishlistStore.setState({ items: ['product-1', 'product-2'] });
      useWishlistStore.getState().removeItem('product-1');
      expect(useWishlistStore.getState().items).toEqual(['product-2']);
    });

    it('не падает при удалении несуществующего товара', () => {
      useWishlistStore.setState({ items: ['product-1'] });
      useWishlistStore.getState().removeItem('nonexistent');
      expect(useWishlistStore.getState().items).toEqual(['product-1']);
    });

    it('очищает весь список при удалении всех товаров', () => {
      useWishlistStore.setState({ items: ['product-1'] });
      useWishlistStore.getState().removeItem('product-1');
      expect(useWishlistStore.getState().items).toEqual([]);
    });
  });

  describe('toggleWishlist', () => {
    it('добавляет товар если его нет в списке', () => {
      useWishlistStore.getState().toggleWishlist('product-1');
      expect(useWishlistStore.getState().items).toEqual(['product-1']);
    });

    it('удаляет товар если он есть в списке', () => {
      useWishlistStore.setState({ items: ['product-1'] });
      useWishlistStore.getState().toggleWishlist('product-1');
      expect(useWishlistStore.getState().items).toEqual([]);
    });

    it('двойной toggle возвращает в исходное состояние', () => {
      useWishlistStore.getState().toggleWishlist('product-1');
      useWishlistStore.getState().toggleWishlist('product-1');
      expect(useWishlistStore.getState().items).toEqual([]);
    });

    it('isInWishlist возвращает корректное значение после toggle', () => {
      useWishlistStore.getState().toggleWishlist('product-1');
      expect(useWishlistStore.getState().isInWishlist('product-1')).toBe(true);
      useWishlistStore.getState().toggleWishlist('product-1');
      expect(useWishlistStore.getState().isInWishlist('product-1')).toBe(false);
    });
  });

  describe('clearWishlist', () => {
    it('очищает весь список', () => {
      useWishlistStore.setState({ items: ['p1', 'p2', 'p3'] });
      useWishlistStore.getState().clearWishlist();
      expect(useWishlistStore.getState().items).toEqual([]);
    });

    it('не падает на пустом списке', () => {
      useWishlistStore.getState().clearWishlist();
      expect(useWishlistStore.getState().items).toEqual([]);
    });
  });

  describe('syncWithServer', () => {
    it('синхронизирует с сервером для авторизованного пользователя', async () => {
      const { wishlistApi } = await import('../api/wishlist');
      (wishlistApi.sync as ReturnType<typeof vi.fn>).mockResolvedValue([
        'server-item-1',
        'server-item-2',
      ]);
      localStorageMock.setItem('accessToken', 'token');

      useWishlistStore.setState({ items: ['local-item'] });
      await useWishlistStore.getState().syncWithServer();

      expect(wishlistApi.sync).toHaveBeenCalledWith(['local-item']);
      expect(useWishlistStore.getState().items).toEqual([
        'server-item-1',
        'server-item-2',
      ]);
    });

    it('не синхронизирует для неавторизованного пользователя', async () => {
      const { wishlistApi } = await import('../api/wishlist');
      await useWishlistStore.getState().syncWithServer();

      expect(wishlistApi.sync).not.toHaveBeenCalled();
    });

    it('обрабатывает ошибку 401 — очищает локальные данные', async () => {
      const { wishlistApi } = await import('../api/wishlist');
      (wishlistApi.sync as ReturnType<typeof vi.fn>).mockRejectedValue({
        response: { status: 401 },
      });
      localStorageMock.setItem('accessToken', 'token');

      useWishlistStore.setState({ items: ['local-item'] });
      await useWishlistStore.getState().syncWithServer();

      expect(useWishlistStore.getState().items).toEqual([]);
    });

    it('обрабатывает ошибку сети — сохраняет локальные данные', async () => {
      const { wishlistApi } = await import('../api/wishlist');
      (wishlistApi.sync as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network error'),
      );
      localStorageMock.setItem('accessToken', 'token');

      useWishlistStore.setState({ items: ['local-item'] });
      await useWishlistStore.getState().syncWithServer();

      expect(useWishlistStore.getState().items).toEqual(['local-item']);
    });
  });

  describe('Edge cases', () => {
    it('addItem с пустой строкой', () => {
      useWishlistStore.getState().addItem('');
      expect(useWishlistStore.getState().items).toEqual(['']);
    });

    it('toggleWishlist с дубликатом в списке (мутировавший стейт)', () => {
      // Имитируем невалидное состояние с дублем
      useWishlistStore.setState({ items: ['p1', 'p1'] });
      useWishlistStore.getState().toggleWishlist('p1');
      // После toggle должен остаться один p1 (filter удалит оба)
      expect(useWishlistStore.getState().items.filter((id) => id === 'p1').length).toBeLessThanOrEqual(1);
    });
  });
});
