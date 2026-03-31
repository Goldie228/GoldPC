/**
 * Comparison Store - Управление списком товаров для сравнения
 *
 * Хранит ID и категорию товаров в localStorage. Лимит 4 товара на каждую категорию (нормализованную).
 * Разрешено сравнивать товары разных категорий; счётчик в шапке — суммарное число позиций.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { canAddToNormalizedCategory } from './comparisonLimits';

export interface ComparisonItem {
  id: string;
  category: string;
}

interface ComparisonState {
  items: ComparisonItem[];

  isInComparison: (productId: string) => boolean;

  toggleComparison: (productId: string, category: string) => { success: boolean; reason?: 'limit' };

  addItem: (productId: string, category: string) => { success: boolean; reason?: 'limit' };

  removeItem: (productId: string) => void;

  clearComparison: () => void;

  getCount: () => number;

  canAdd: (category?: string) => boolean;

  getItems: () => string[];
}

function migrateItems(items: unknown[]): ComparisonItem[] {
  return items.map((item) =>
    typeof item === 'string' ? { id: item, category: '' } : { id: (item as ComparisonItem).id, category: (item as ComparisonItem).category ?? '' }
  );
}

export const useComparisonStore = create<ComparisonState>()(
  persist(
    (set, get) => ({
      items: [],

      isInComparison: (productId: string): boolean => {
        return get().items.some((i) => i.id === productId);
      },

      toggleComparison: (productId: string, category: string): { success: boolean; reason?: 'limit' } => {
        const { items } = get();
        const existing = items.find((i) => i.id === productId);
        if (existing) {
          set({ items: items.filter((i) => i.id !== productId) });
          return { success: true };
        }
        if (!canAddToNormalizedCategory(items, category)) {
          return { success: false, reason: 'limit' };
        }
        set({ items: [...items, { id: productId, category }] });
        return { success: true };
      },

      addItem: (productId: string, category: string): { success: boolean; reason?: 'limit' } => {
        const { items } = get();
        if (items.some((i) => i.id === productId)) return { success: true };
        if (!canAddToNormalizedCategory(items, category)) {
          return { success: false, reason: 'limit' };
        }
        set({ items: [...items, { id: productId, category }] });
        return { success: true };
      },

      removeItem: (productId: string): void => {
        set({ items: get().items.filter((i) => i.id !== productId) });
      },

      clearComparison: (): void => {
        set({ items: [] });
      },

      getCount: (): number => {
        return get().items.length;
      },

      canAdd: (category?: string): boolean => {
        if (category === undefined || category === '') return false;
        return canAddToNormalizedCategory(get().items, category);
      },

      getItems: (): string[] => {
        return get().items.map((i) => i.id);
      },
    }),
    {
      name: 'goldpc-comparison-v2',
      version: 4,
      partialize: (state) => ({ items: state.items }),
      merge: (persisted, current) => {
        const p = persisted as { items?: unknown[] };
        const items = Array.isArray(p?.items) ? migrateItems(p.items) : current.items;
        return { ...current, items };
      },
      migrate: (persistedState: unknown, _version: number) => {
        return persistedState as ComparisonState;
      },
    }
  )
);

export const useComparisonCount = () => useComparisonStore((state) => state.items.length);
