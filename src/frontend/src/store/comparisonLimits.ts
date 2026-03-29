import { normalizeCategory } from '../utils/comparison/comparisonRules';

export const MAX_COMPARISON_ITEMS_PER_CATEGORY = 4;

export interface CategoryItem {
  category: string;
}

export function countInNormalizedCategory(items: CategoryItem[], category: string): number {
  const target = normalizeCategory(category);
  return items.filter((i) => normalizeCategory(i.category) === target).length;
}

export function canAddToNormalizedCategory(items: CategoryItem[], category: string): boolean {
  return countInNormalizedCategory(items, category) < MAX_COMPARISON_ITEMS_PER_CATEGORY;
}
