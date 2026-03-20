/**
 * Wishlist Store - Управление списком желаний
 * 
 * Хранит ID товаров в списке желаний в localStorage для персистентности.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistState {
  /** Массив ID товаров в списке желаний */
  items: string[];

  /** Проверить, есть ли товар в списке желаний */
  isInWishlist: (productId: string) => boolean;

  /** Добавить/удалить товар из списка желаний (toggle) */
  toggleWishlist: (productId: string) => void;

  /** Добавить товар в список желаний */
  addItem: (productId: string) => void;

  /** Удалить товар из списка желаний */
  removeItem: (productId: string) => void;

  /** Очистить список желаний */
  clearWishlist: () => void;

  /** Получить количество товаров в списке желаний */
  getCount: () => number;
}

/**
 * Store для управления списком желаний
 * 
 * @example
 * const { isInWishlist, toggleWishlist } = useWishlistStore();
 * 
 * // Проверить наличие
 * const liked = isInWishlist('product-123');
 * 
 * // Переключить
 * toggleWishlist('product-123');
 */
export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      isInWishlist: (productId: string): boolean => {
        return get().items.includes(productId);
      },

      toggleWishlist: (productId: string): void => {
        const { items } = get();
        if (items.includes(productId)) {
          set({ items: items.filter((id) => id !== productId) });
        } else {
          set({ items: [...items, productId] });
        }
      },

      addItem: (productId: string): void => {
        const { items } = get();
        if (!items.includes(productId)) {
          set({ items: [...items, productId] });
        }
      },

      removeItem: (productId: string): void => {
        set({ items: get().items.filter((id) => id !== productId) });
      },

      clearWishlist: (): void => {
        set({ items: [] });
      },

      getCount: (): number => {
        return get().items.length;
      },
    }),
    {
      name: 'goldpc-wishlist',
    }
  )
);

/** Селектор для количества товаров в избранном (реактивный) */
export const useWishlistCount = () =>
  useWishlistStore((state) => state.items.length);