import { describe, it, expect } from 'vitest';
import {
  validateCardNumberLuhn,
  getCardType,
  formatCardNumber,
  validateCardExpiry,
  validateCVV,
  formatCardExpiry,
  validateCardHolder,
  maskCardNumber,
} from './cardValidation';

// ── validateCardNumberLuhn ──────────────────────────────────────────

describe('validateCardNumberLuhn', () => {
  it('passes valid Visa number', () => {
    expect(validateCardNumberLuhn('4111111111111111')).toBe(true);
  });

  it('passes valid Mastercard number', () => {
    expect(validateCardNumberLuhn('5500000000000004')).toBe(true);
  });

  it('passes number with spaces', () => {
    expect(validateCardNumberLuhn('4111 1111 1111 1111')).toBe(true);
  });

  it('fails invalid checksum', () => {
    expect(validateCardNumberLuhn('4111111111111112')).toBe(false);
  });

  it('fails too short number (< 13 digits)', () => {
    expect(validateCardNumberLuhn('123456789012')).toBe(false);
  });

  it('fails non-numeric input', () => {
    expect(validateCardNumberLuhn('abcdefg')).toBe(false);
  });

  it('fails empty string', () => {
    expect(validateCardNumberLuhn('')).toBe(false);
  });

  it('passes 13-digit valid card', () => {
    expect(validateCardNumberLuhn('4222222222222')).toBe(true);
  });
});

// ── getCardType ─────────────────────────────────────────────────────

describe('getCardType', () => {
  it('returns visa for 4xxx', () => {
    expect(getCardType('4111111111111111')).toBe('visa');
  });

  it('returns mastercard for 51xx-55xx', () => {
    expect(getCardType('5100000000000000')).toBe('mastercard');
    expect(getCardType('5500000000000004')).toBe('mastercard');
  });

  it('returns mir for 2200-2204', () => {
    expect(getCardType('2200000000000000')).toBe('mir');
    expect(getCardType('2201000000000000')).toBe('mir');
    expect(getCardType('2204000000000000')).toBe('mir');
  });

  it('returns mastercard for 2205-27xx (outside MIR range)', () => {
    expect(getCardType('2205000000000000')).toBe('mastercard');
    expect(getCardType('2700000000000000')).toBe('mastercard');
  });

  it('returns maestro for 50xx, 56xx-58xx, 6xxx', () => {
    expect(getCardType('5000000000000000')).toBe('maestro');
    expect(getCardType('5600000000000000')).toBe('maestro');
    expect(getCardType('6000000000000000')).toBe('maestro');
  });

  it('returns unknown for unmatched prefix', () => {
    expect(getCardType('1111111111111111')).toBe('unknown');
    expect(getCardType('9999999999999999')).toBe('unknown');
  });

  it('handles spaces in input', () => {
    expect(getCardType('4111 1111 1111 1111')).toBe('visa');
  });

  it('handles empty string', () => {
    expect(getCardType('')).toBe('unknown');
  });
});

// ── formatCardNumber ────────────────────────────────────────────────

describe('formatCardNumber', () => {
  it('groups digits into blocks of 4', () => {
    expect(formatCardNumber('4111111111111111')).toBe('4111 1111 1111 1111');
  });

  it('strips non-digit characters', () => {
    expect(formatCardNumber('4111-1111-1111-1111')).toBe('4111 1111 1111 1111');
  });

  it('handles short numbers', () => {
    expect(formatCardNumber('123')).toBe('123');
  });

  it('handles empty string', () => {
    expect(formatCardNumber('')).toBe('');
  });

  it('handles already formatted input', () => {
    expect(formatCardNumber('4111 1111 1111 1111')).toBe('4111 1111 1111 1111');
  });
});

// ── validateCardExpiry ──────────────────────────────────────────────

describe('validateCardExpiry', () => {
  it('returns true for valid future date', () => {
    expect(validateCardExpiry('12/30')).toBe(true);
  });

  it('returns false for expired date', () => {
    expect(validateCardExpiry('01/20')).toBe(false);
  });

  it('returns false for invalid format', () => {
    expect(validateCardExpiry('1230')).toBe(false);
    expect(validateCardExpiry('12-30')).toBe(false);
  });

  it('returns false for month 00', () => {
    expect(validateCardExpiry('00/30')).toBe(false);
  });

  it('returns false for month 13', () => {
    expect(validateCardExpiry('13/30')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(validateCardExpiry('')).toBe(false);
  });
});

// ── formatCardExpiry ────────────────────────────────────────────────

describe('formatCardExpiry', () => {
  it('adds slash after 2 digits', () => {
    expect(formatCardExpiry('1230')).toBe('12/30');
  });

  it('handles digits only', () => {
    expect(formatCardExpiry('123055')).toBe('12/30');
  });

  it('returns short string as-is', () => {
    expect(formatCardExpiry('1')).toBe('1');
  });

  it('handles empty string', () => {
    expect(formatCardExpiry('')).toBe('');
  });

  it('strips non-digits then formats', () => {
    expect(formatCardExpiry('12-30')).toBe('12/30');
  });
});

// ── validateCVV ─────────────────────────────────────────────────────

describe('validateCVV', () => {
  it('returns true for 3-digit CVV (default)', () => {
    expect(validateCVV('123')).toBe(true);
  });

  it('returns true for 4-digit CVV with amex', () => {
    expect(validateCVV('1234', 'amex')).toBe(true);
  });

  it('returns false for 4-digit CVV without amex', () => {
    expect(validateCVV('1234')).toBe(false);
  });

  it('returns false for 2-digit CVV', () => {
    expect(validateCVV('12')).toBe(false);
  });

  it('returns false for 5-digit CVV', () => {
    expect(validateCVV('12345')).toBe(false);
  });

  it('returns false for non-numeric', () => {
    expect(validateCVV('abc')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(validateCVV('')).toBe(false);
  });
});

// ── validateCardHolder ──────────────────────────────────────────────

describe('validateCardHolder', () => {
  it('returns true for valid name', () => {
    expect(validateCardHolder('John Doe')).toBe(true);
  });

  it('returns true for Cyrillic name', () => {
    expect(validateCardHolder('Иван Иванов')).toBe(true);
  });

  it('returns false for single character', () => {
    expect(validateCardHolder('A')).toBe(false);
  });

  it('returns false for name with numbers', () => {
    expect(validateCardHolder('John123')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(validateCardHolder('')).toBe(false);
  });
});

// ── maskCardNumber ──────────────────────────────────────────────────

describe('maskCardNumber', () => {
  it('masks all but last 4 digits', () => {
    expect(maskCardNumber('4111111111111111')).toBe('**** **** **** 1111');
  });

  it('returns original if less than 4 digits', () => {
    expect(maskCardNumber('123')).toBe('123');
  });

  it('handles spaced input', () => {
    expect(maskCardNumber('4111 1111 1111 1111')).toBe('**** **** **** 1111');
  });
});
