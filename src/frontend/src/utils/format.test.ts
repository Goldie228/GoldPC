import { describe, it, expect } from 'vitest';
import { formatPrice, formatDateTime, formatDate } from './format';

describe('formatPrice', () => {
  it('formats integer price with BYN suffix', () => {
    const result = formatPrice(100);
    expect(result).toMatch(/BYN$/);
    expect(result).toContain('100');
  });

  it('formats zero', () => {
    const result = formatPrice(0);
    expect(result).toMatch(/BYN$/);
    expect(result).toContain('0');
  });

  it('formats large price', () => {
    const result = formatPrice(999999);
    expect(result).toMatch(/BYN$/);
    expect(result).toContain('999');
  });

  it('formats decimal price', () => {
    const result = formatPrice(19.99);
    expect(result).toMatch(/BYN$/);
    expect(result).toContain('19');
  });
});

describe('formatDateTime', () => {
  it('returns "--" for undefined', () => {
    expect(formatDateTime(undefined)).toBe('--');
  });

  it('returns "--" for empty string', () => {
    expect(formatDateTime('')).toBe('--');
  });

  it('formats a valid ISO date string', () => {
    const result = formatDateTime('2024-06-15T14:30:00Z');
    // Should contain date and time separated by space
    expect(result).toContain(' ');
    // Should not be '--'
    expect(result).not.toBe('--');
  });

  it('contains date and time parts', () => {
    const result = formatDateTime('2024-01-01T10:00:00Z');
    const parts = result.split(' ');
    expect(parts.length).toBe(2);
  });
});

describe('formatDate', () => {
  it('returns "--" for undefined', () => {
    expect(formatDate(undefined)).toBe('--');
  });

  it('returns "--" for empty string', () => {
    expect(formatDate('')).toBe('--');
  });

  it('formats a valid ISO date string', () => {
    const result = formatDate('2024-06-15T14:30:00Z');
    // Should not be '--'
    expect(result).not.toBe('--');
    // Should be a date-only string (no time component visible)
    expect(result.split(' ')).toHaveLength(1);
  });
});
