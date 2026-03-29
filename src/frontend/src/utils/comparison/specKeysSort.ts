import { normalizeSpecKey } from './comparisonRules';

/** Порядок важных ключей в таблице сравнения и в машинном аудите (совпадает с UI). */
export const SPEC_COMPARISON_PRIORITY_KEYS = [
  'socket',
  'chipset',
  'cores',
  'threads',
  'vram',
  'capacity',
  'frequency',
] as const;

/**
 * Стабильная сортировка ключей спецификаций: сначала приоритетные, затем по алфавиту.
 */
export function sortSpecKeysForComparison(keys: string[]): string[] {
  const priority = SPEC_COMPARISON_PRIORITY_KEYS;
  return [...keys].sort((a, b) => {
    const na = normalizeSpecKey(a);
    const nb = normalizeSpecKey(b);
    const ia = priority.findIndex((k) => k === na);
    const ib = priority.findIndex((k) => k === nb);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });
}
