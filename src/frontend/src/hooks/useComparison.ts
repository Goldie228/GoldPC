/**
 * useComparison Hook - Управление списком товаров для сравнения
 */
import { useMemo } from 'react';
import { useComparisonStore, type ComparisonItem } from '../store/comparisonStore';

export interface UseComparisonReturn {
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

export function useComparison(): UseComparisonReturn {
  const items = useComparisonStore((state) => state.items);
  const isInComparison = useComparisonStore((state) => state.isInComparison);
  const toggleComparison = useComparisonStore((state) => state.toggleComparison);
  const addItem = useComparisonStore((state) => state.addItem);
  const removeItem = useComparisonStore((state) => state.removeItem);
  const clearComparison = useComparisonStore((state) => state.clearComparison);
  const getCount = useComparisonStore((state) => state.getCount);
  const canAdd = useComparisonStore((state) => state.canAdd);
  const getItems = useComparisonStore((state) => state.getItems);

  return useMemo(() => ({
    items,
    isInComparison,
    toggleComparison,
    addItem,
    removeItem,
    clearComparison,
    getCount,
    canAdd,
    getItems,
  }), [
    items, isInComparison, toggleComparison, addItem, removeItem,
    clearComparison, getCount, canAdd, getItems,
  ]);
}

export default useComparison;