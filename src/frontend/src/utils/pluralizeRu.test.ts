import { describe, it, expect } from 'vitest';
import { pluralizeRu, formatCountRu, RU_FORMS } from './pluralizeRu';

describe('pluralizeRu', () => {
  const forms: readonly [string, string, string] = ['товар', 'товара', 'товаров'];

  // ── Form 1: один (1, 21, 31, ...) ────────────────────────────────

  describe('form 1 (singular: 1, 21, 31, ...)', () => {
    it('returns form[0] for 1', () => {
      expect(pluralizeRu(1, forms)).toBe('товар');
    });

    it('returns form[0] for 21', () => {
      expect(pluralizeRu(21, forms)).toBe('товар');
    });

    it('returns form[0] for 31', () => {
      expect(pluralizeRu(31, forms)).toBe('товар');
    });

    it('returns form[0] for 101', () => {
      expect(pluralizeRu(101, forms)).toBe('товар');
    });
  });

  // ── Form 2: два-четыре (2-4, 22-24, 32-34, ...) ──────────────────

  describe('form 2 (few: 2-4, 22-24, 32-34, ...)', () => {
    it('returns form[1] for 2', () => {
      expect(pluralizeRu(2, forms)).toBe('товара');
    });

    it('returns form[1] for 3', () => {
      expect(pluralizeRu(3, forms)).toBe('товара');
    });

    it('returns form[1] for 4', () => {
      expect(pluralizeRu(4, forms)).toBe('товара');
    });

    it('returns form[1] for 22', () => {
      expect(pluralizeRu(22, forms)).toBe('товара');
    });

    it('returns form[1] for 34', () => {
      expect(pluralizeRu(34, forms)).toBe('товара');
    });
  });

  // ── Form 3: пять и более (5-20, 25-30, 35-40, ...) ───────────────

  describe('form 3 (many: 5-20, 25-30, 35-40, ...)', () => {
    it('returns form[2] for 5', () => {
      expect(pluralizeRu(5, forms)).toBe('товаров');
    });

    it('returns form[2] for 10', () => {
      expect(pluralizeRu(10, forms)).toBe('товаров');
    });

    it('returns form[2] for 11', () => {
      expect(pluralizeRu(11, forms)).toBe('товаров');
    });

    it('returns form[2] for 12', () => {
      expect(pluralizeRu(12, forms)).toBe('товаров');
    });

    it('returns form[2] for 14', () => {
      expect(pluralizeRu(14, forms)).toBe('товаров');
    });

    it('returns form[2] for 20', () => {
      expect(pluralizeRu(20, forms)).toBe('товаров');
    });

    it('returns form[2] for 25', () => {
      expect(pluralizeRu(25, forms)).toBe('товаров');
    });

    it('returns form[2] for 100', () => {
      expect(pluralizeRu(100, forms)).toBe('товаров');
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles 0', () => {
      expect(pluralizeRu(0, forms)).toBe('товаров');
    });

    it('handles negative numbers by absolute value', () => {
      expect(pluralizeRu(-1, forms)).toBe('товар');
      expect(pluralizeRu(-2, forms)).toBe('товара');
      expect(pluralizeRu(-5, forms)).toBe('товаров');
    });

    it('handles floats by truncating', () => {
      expect(pluralizeRu(1.9, forms)).toBe('товар');
      expect(pluralizeRu(2.9, forms)).toBe('товара');
    });

    // Edge: 111, 112, 113, 114 are form 3 (mod100 in 11..14)
    it('returns form[2] for 111 (mod100 = 11)', () => {
      expect(pluralizeRu(111, forms)).toBe('товаров');
    });

    it('returns form[2] for 112 (mod100 = 12)', () => {
      expect(pluralizeRu(112, forms)).toBe('товаров');
    });

    it('returns form[1] for 122 (mod100 = 22)', () => {
      expect(pluralizeRu(122, forms)).toBe('товара');
    });
  });
});

describe('formatCountRu', () => {
  it('formats count with correct plural form', () => {
    expect(formatCountRu(1, ['товар', 'товара', 'товаров'])).toBe('1 товар');
    expect(formatCountRu(5, ['товар', 'товара', 'товаров'])).toBe('5 товаров');
    expect(formatCountRu(2, ['товар', 'товара', 'товаров'])).toBe('2 товара');
  });

  it('formats zero', () => {
    expect(formatCountRu(0, ['товар', 'товара', 'товаров'])).toBe('0 товаров');
  });
});

describe('RU_FORMS', () => {
  it('has tovar forms', () => {
    expect(RU_FORMS.tovar).toEqual(['товар', 'товара', 'товаров']);
  });
});
