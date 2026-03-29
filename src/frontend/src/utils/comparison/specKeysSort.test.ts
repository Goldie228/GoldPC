import { describe, expect, it } from 'vitest';
import { sortSpecKeysForComparison, SPEC_COMPARISON_PRIORITY_KEYS } from './specKeysSort';

describe('sortSpecKeysForComparison', () => {
  it('ставит приоритетные ключи выше остальных', () => {
    const keys = ['zz_extra', 'frequency', 'aaa', 'capacity', 'socket'];
    expect(sortSpecKeysForComparison(keys)).toEqual([
      'socket',
      'capacity',
      'frequency',
      'aaa',
      'zz_extra',
    ]);
  });

  it('сортирует неприоритетные по алфавиту', () => {
    const keys = ['zebra', 'alpha', 'beta'];
    expect(sortSpecKeysForComparison(keys)).toEqual(['alpha', 'beta', 'zebra']);
  });

  it('экспортирует ожидаемый набор приоритетов', () => {
    expect(SPEC_COMPARISON_PRIORITY_KEYS.length).toBeGreaterThan(0);
  });
});
