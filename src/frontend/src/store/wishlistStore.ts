/**
 * Wishlist Store - Управление списком желаний
 * 
 * Хранит ID товаров в списке желаний в localStorage для персистентности.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { wishlistApi } from '../api/wishlist';

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

  /** Синхронизировать с сервером для авторизованного пользователя */
  syncWithServer: () => Promise<void>;
}

function isAuthorizedSession(): boolean {
  return Boolean(localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken'));
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
          if (isAuthorizedSession()) {
            void wishlistApi.removeItem(productId).catch((error) => {
              console.error('Failed to remove wishlist item:', error);
            });
          }
        } else {
          set({ items: [...items, productId] });
          if (isAuthorizedSession()) {
            void wishlistApi.addItem(productId).catch((error) => {
              console.error('Failed to add wishlist item:', error);
            });
          }
        }
      },

      addItem: (productId: string): void => {
        const { items } = get();
        if (!items.includes(productId)) {
          set({ items: [...items, productId] });
          if (isAuthorizedSession()) {
            void wishlistApi.addItem(productId).catch((error) => {
              console.error('Failed to add wishlist item:', error);
            });
          }
        }
      },

      removeItem: (productId: string): void => {
        set({ items: get().items.filter((id) => id !== productId) });
        if (isAuthorizedSession()) {
          void wishlistApi.removeItem(productId).catch((error) => {
            console.error('Failed to remove wishlist item:', error);
          });
        }
      },

      clearWishlist: (): void => {
        set({ items: [] });
      },

      getCount: (): number => {
        return get().items.length;
      },

      syncWithServer: async (): Promise<void> => {
        if (!isAuthorizedSession()) return;
        const localItems = get().items;
        try {
          const synced = await wishlistApi.sync(localItems);
          set({ items: synced });
        } catch (error: unknown) {
          // Если 401 — токен недействителен, очищаем локальное избранное
          const axiosError = error as { response?: { status: number } };
          if (axiosError?.response?.status === 401) {
            console.warn('Wishlist sync: unauthorized, clearing local items');
            set({ items: [] });
          } else {
            console.error('Wishlist sync failed:', error);
          }
        }
      },
    }),
    {
      name: 'goldpc-wishlist',
      migrate: (persistedState: unknown, _version: number) => {
        return persistedState as WishlistState;
      },
    }
  )
);

/** Селектор для количества товаров в избранном (реактивный) */
export const useWishlistCount = () =>
  useWishlistStore((state) => state.items.length);