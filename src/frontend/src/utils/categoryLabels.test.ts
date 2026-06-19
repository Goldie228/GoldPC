import { describe, it, expect } from 'vitest';
import { CATEGORY_LABELS_RU } from './categoryLabels';
import { CATEGORY_LABELS } from './category-mappings';

describe('categoryLabels', () => {
  it('re-exports CATEGORY_LABELS from category-mappings as CATEGORY_LABELS_RU', () => {
    expect(CATEGORY_LABELS_RU).toBe(CATEGORY_LABELS);
  });

  it('contains expected category keys', () => {
    expect(CATEGORY_LABELS_RU).toHaveProperty('cpu');
    expect(CATEGORY_LABELS_RU).toHaveProperty('gpu');
    expect(CATEGORY_LABELS_RU).toHaveProperty('motherboard');
    expect(CATEGORY_LABELS_RU).toHaveProperty('monitor');
    expect(CATEGORY_LABELS_RU).toHaveProperty('headphones');
  });

  it('has Russian labels as values', () => {
    expect(CATEGORY_LABELS_RU.cpu).toBe('Процессоры');
    expect(CATEGORY_LABELS_RU.gpu).toBe('Видеокарты');
    expect(CATEGORY_LABELS_RU.monitor).toBe('Мониторы');
  });
});
