/**
 * Comparison Store - Управление списком товаров для сравнения
 *
 * Хранит ID и категорию товаров в localStorage. Лимит 4 товара.
 * Разрешено сравнивать только товары одной категории.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_COMPARISON_ITEMS = 4;

export interface ComparisonItem {
  id: string;
  category: string;
}

interface ComparisonState {
  items: ComparisonItem[];

  isInComparison: (productId: string) => boolean;

  toggleComparison: (productId: string, category: string) => { success: boolean; reason?: 'limit' | 'category' };

  addItem: (productId: string, category: string) => { success: boolean; reason?: 'limit' | 'category' };

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

      toggleComparison: (productId: string, category: string): { success: boolean; reason?: 'limit' | 'category' } => {
        const { items } = get();
        const existing = items.find((i) => i.id === productId);
        if (existing) {
          set({ items: items.filter((i) => i.id !== productId) });
          return { success: true };
        }
        if (items.length >= MAX_COMPARISON_ITEMS) {
          return { success: false, reason: 'limit' };
        }
        const existingCategory = items[0]?.category;
        if (existingCategory && existingCategory !== '' && existingCategory !== category) {
          return { success: false, reason: 'category' };
        }
        set({ items: [...items, { id: productId, category }] });
        return { success: true };
      },

      addItem: (productId: string, category: string): { success: boolean; reason?: 'limit' | 'category' } => {
        const { items } = get();
        if (items.some((i) => i.id === productId)) return { success: true };
        if (items.length >= MAX_COMPARISON_ITEMS) return { success: false, reason: 'limit' };
        const existingCategory = items[0]?.category;
        if (existingCategory && existingCategory !== '' && existingCategory !== category) {
          return { success: false, reason: 'category' };
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
        const { items } = get();
        if (items.length >= MAX_COMPARISON_ITEMS) return false;
        if (items.length === 0 || !category) return true;
        const existingCategory = items[0]?.category;
        return !existingCategory || existingCategory === '' || existingCategory === category;
      },

      getItems: (): string[] => {
        return get().items.map((i) => i.id);
      },
    }),
    {
      name: 'goldpc-comparison-v2',
      version: 2,
      partialize: (state) => ({ items: state.items }),
      merge: (persisted, current) => {
        const p = persisted as { items?: unknown[] };
        const items = Array.isArray(p?.items) ? migrateItems(p.items) : current.items;
        return { ...current, items };
      },
    }
  )
);

export const useComparisonCount = () =>
  useComparisonStore((state) => state.items.length);
