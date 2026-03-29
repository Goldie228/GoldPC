import { describe, expect, it } from 'vitest';
import { canAddToNormalizedCategory, countInNormalizedCategory, MAX_COMPARISON_ITEMS_PER_CATEGORY } from './comparisonLimits';

describe('comparisonLimits', () => {
  it('считает позиции по нормализованной категории (алиасы slug)', () => {
    const items = [
      { category: 'keyboards' },
      { category: 'keyboard' },
      { category: 'mouse' },
    ];
    expect(countInNormalizedCategory(items, 'keyboards')).toBe(2);
    expect(countInNormalizedCategory(items, 'mice')).toBe(1);
  });

  it('разрешает до MAX товаров на категорию независимо от других категорий', () => {
    const fourKeyboards = Array.from({ length: MAX_COMPARISON_ITEMS_PER_CATEGORY }, () => ({
      category: 'keyboard',
    }));
    expect(canAddToNormalizedCategory(fourKeyboards, 'keyboard')).toBe(false);
    expect(canAddToNormalizedCategory(fourKeyboards, 'mouse')).toBe(true);
  });
});
