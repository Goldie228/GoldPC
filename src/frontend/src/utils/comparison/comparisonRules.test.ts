import { describe, it, expect } from 'vitest';
import {
  CATEGORY_ALIASES,
  normalizeCategory,
  normalizeSpecKey,
  getBackendCategorySlug,
  getCanonicalSpecKeyForComparison,
  hasExplicitCategoryRuleForCanonicalKey,
  getComparisonRule,
} from './comparisonRules';

describe('CATEGORY_ALIASES', () => {
  it('maps "processors" to "cpu"', () => {
    expect(CATEGORY_ALIASES['processors']).toBe('cpu');
  });

  it('maps "cpu" to "cpu"', () => {
    expect(CATEGORY_ALIASES['cpu']).toBe('cpu');
  });

  it('maps "gpu" to "gpu"', () => {
    expect(CATEGORY_ALIASES['gpu']).toBe('gpu');
  });

  it('maps "videocard" to "gpu"', () => {
    expect(CATEGORY_ALIASES['videocard']).toBe('gpu');
  });

  it('maps Russian "процессор" to "cpu"', () => {
    expect(CATEGORY_ALIASES['процессор']).toBe('cpu');
  });

  it('maps Russian "видеокарта" to "gpu"', () => {
    expect(CATEGORY_ALIASES['видеокарта']).toBe('gpu');
  });

  it('maps "headphone" (singular) to "headphones"', () => {
    expect(CATEGORY_ALIASES['headphone']).toBe('headphones');
  });

  it('maps "fan" to "fan"', () => {
    expect(CATEGORY_ALIASES['fan']).toBe('fan');
  });

  it('maps "fans" to "fan"', () => {
    expect(CATEGORY_ALIASES['fans']).toBe('fan');
  });

  it('maps "coolers" to "cooling"', () => {
    expect(CATEGORY_ALIASES['coolers']).toBe('cooling');
  });
});

describe('normalizeCategory', () => {
  it('returns canonical slug for known alias', () => {
    expect(normalizeCategory('processors')).toBe('cpu');
    expect(normalizeCategory('cpu')).toBe('cpu');
    expect(normalizeCategory('gpu')).toBe('gpu');
    expect(normalizeCategory('videocards')).toBe('gpu');
  });

  it('is case-insensitive', () => {
    expect(normalizeCategory('CPU')).toBe('cpu');
    expect(normalizeCategory('Processors')).toBe('cpu');
    expect(normalizeCategory('GPU')).toBe('gpu');
  });

  it('trims whitespace', () => {
    expect(normalizeCategory('  cpu  ')).toBe('cpu');
    expect(normalizeCategory(' processors ')).toBe('cpu');
  });

  it('returns empty string for falsy input', () => {
    expect(normalizeCategory('')).toBe('');
    expect(normalizeCategory(null)).toBe('');
    expect(normalizeCategory(undefined)).toBe('');
  });

  it('returns normalized string as-is for unknown input', () => {
    expect(normalizeCategory('mama')).toBe('mama');
  });

  it('handles Russian category names', () => {
    expect(normalizeCategory('процессоры')).toBe('cpu');
    expect(normalizeCategory('видеокарты')).toBe('gpu');
    expect(normalizeCategory('мониторы')).toBe('monitor');
  });
});

describe('normalizeSpecKey', () => {
  it('converts camelCase to snake_case', () => {
    expect(normalizeSpecKey('baseFreq')).toBe('base_freq');
    expect(normalizeSpecKey('maxFreq')).toBe('max_freq');
    expect(normalizeSpecKey('cudaCores')).toBe('cuda_cores');
  });

  it('returns lowercase unchanged key', () => {
    expect(normalizeSpecKey('cores')).toBe('cores');
    expect(normalizeSpecKey('frequency')).toBe('frequency');
  });

  it('handles already snake_case', () => {
    expect(normalizeSpecKey('base_freq')).toBe('base_freq');
  });
});

describe('getBackendCategorySlug', () => {
  it('returns backend slug for known category', () => {
    expect(getBackendCategorySlug('cpu')).toBe('processors');
    expect(getBackendCategorySlug('gpu')).toBe('gpu');
    expect(getBackendCategorySlug('motherboard')).toBe('motherboards');
    expect(getBackendCategorySlug('monitor')).toBe('monitors');
    expect(getBackendCategorySlug('mouse')).toBe('mice');
  });

  it('returns null for unknown category', () => {
    expect(getBackendCategorySlug('unknown')).toBeNull();
  });

  it('returns null for empty/null input', () => {
    expect(getBackendCategorySlug('')).toBeNull();
    expect(getBackendCategorySlug(null)).toBeNull();
  });

  it('works through aliases', () => {
    expect(getBackendCategorySlug('processors')).toBe('processors');
    expect(getBackendCategorySlug('видеокарты')).toBe('gpu');
  });
});

describe('getCanonicalSpecKeyForComparison', () => {
  it('resolves headphone alias "bluetooth" to "bluetooth_version"', () => {
    expect(getCanonicalSpecKeyForComparison('headphones', 'bluetooth')).toBe('bluetooth_version');
  });

  it('resolves ram alias "частота" to "frequency"', () => {
    expect(getCanonicalSpecKeyForComparison('ram', 'частота')).toBe('frequency');
  });

  it('returns the key as-is if no alias exists', () => {
    expect(getCanonicalSpecKeyForComparison('cpu', 'cores')).toBe('cores');
  });
});

describe('hasExplicitCategoryRuleForCanonicalKey', () => {
  it('returns true for cpu.cores', () => {
    expect(hasExplicitCategoryRuleForCanonicalKey('cpu', 'cores')).toBe(true);
  });

  it('returns false for cpu.unknown_key', () => {
    expect(hasExplicitCategoryRuleForCanonicalKey('cpu', 'unknown_key_xyz')).toBe(false);
  });

  it('returns false for unknown category', () => {
    expect(hasExplicitCategoryRuleForCanonicalKey('unknown', 'cores')).toBe(false);
  });
});

describe('getComparisonRule', () => {
  it('returns max/number for cpu.cores', () => {
    const rule = getComparisonRule('cpu', 'cores');
    expect(rule.mode).toBe('max');
    expect(rule.valueType).toBe('number');
  });

  it('returns min/number for cpu.process_nm', () => {
    const rule = getComparisonRule('cpu', 'process_nm');
    expect(rule.mode).toBe('min');
    expect(rule.valueType).toBe('number');
  });

  it('returns compatibility/text for socket', () => {
    const rule = getComparisonRule('cpu', 'socket');
    expect(rule.mode).toBe('compatibility');
    expect(rule.valueType).toBe('text');
  });

  it('returns none/text for unknown spec (fallback)', () => {
    const rule = getComparisonRule('cpu', 'totally_unknown_spec');
    expect(rule.mode).toBe('none');
    expect(rule.valueType).toBe('text');
  });

  it('returns a rule for gpu category', () => {
    const rule = getComparisonRule('gpu', 'vram');
    expect(rule.mode).toBe('max');
    expect(rule.valueType).toBe('number');
  });

  it('returns a rule for monitor category', () => {
    const rule = getComparisonRule('monitor', 'refresh_rate');
    expect(rule.mode).toBe('max');
    expect(rule.valueType).toBe('number');
  });
});
