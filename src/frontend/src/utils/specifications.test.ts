import { describe, expect, it } from 'vitest';
import { specLabel, formatSpecValue, formatSpecValueForKey } from './specifications';

// ─── specLabel ──────────────────────────────────────────────────────────────────

describe('specLabel', () => {
  it('возвращает лейбл из SPEC_LABELS_GENERATED для известного ключа', () => {
    expect(specLabel('cores')).toBe('Количество ядер');
  });

  it('возвращает лейбл для ключа в camelCase (нормализуется через normalizeSpecKey)', () => {
    expect(specLabel('baseFreq')).toContain('частота');
  });

  it('возвращает лейбл из SPEC_LABELS для ключа directx', () => {
    expect(specLabel('directx')).toBe('DirectX');
  });

  it('возвращает лейбл для ключа memoryType', () => {
    expect(specLabel('memoryType')).toBe('Тип памяти');
  });

  it('возвращает лейбл для ключа formFactor', () => {
    expect(specLabel('formFactor')).toBe('Форм-фактор');
  });

  it('для неизвестного ключа форматирует snake_case в Title Case', () => {
    expect(specLabel('my_custom_key')).toBe('My Custom Key');
  });

  it('для ключа в нижнем регистре ищет в SPEC_LABELS', () => {
    expect(specLabel('chip')).toBe('Чип');
  });

  it('для ключа power возвращает Мощность', () => {
    expect(specLabel('power')).toBe('Мощность');
  });

  it('возвращает лейбл для refreshRate', () => {
    expect(specLabel('refreshRate')).toBe('Частота обновления');
  });

  it('для однословного ключа capitalizes первую букву', () => {
    expect(specLabel('cache')).toBe('Кэш');
  });
});

// ─── formatSpecValue ─�─────────────────────────────────────────────────────────

describe('formatSpecValue', () => {
  it('возвращает прочерк для undefined', () => {
    expect(formatSpecValue(undefined)).toBe('—');
  });

  it('возвращает прочерк для null', () => {
    expect(formatSpecValue(null)).toBe('—');
  });

  it('возвращает прочерк для пустой строки', () => {
    expect(formatSpecValue('')).toBe('—');
  });

  it('возвращает Да для true', () => {
    expect(formatSpecValue(true)).toBe('Да');
  });

  it('возвращает Нет для false', () => {
    expect(formatSpecValue(false)).toBe('Нет');
  });

  it('возвращает строковое значение как есть', () => {
    expect(formatSpecValue('DDR5')).toBe('DDR5');
  });

  it('преобразует число в строку', () => {
    expect(formatSpecValue(12345)).toBe('12345');
  });

  it('возвращает строку 0 как есть', () => {
    expect(formatSpecValue('0')).toBe('0');
  });

  it('возвращает пустую строку как прочерк', () => {
    expect(formatSpecValue('')).toBe('—');
  });
});

// ─── formatSpecValueForKey ──────────────────────────────────────────────────────

describe('formatSpecValueForKey', () => {
  it('для razyemy_pitaniya и true возвращает Требуется', () => {
    expect(formatSpecValueForKey('razyemy_pitaniya', true)).toBe('Требуется');
  });

  it('для razyemy_pitaniya и false возвращает Не требуется', () => {
    expect(formatSpecValueForKey('razyemy_pitaniya', false)).toBe('Не требуется');
  });

  it('для razyemy_pitaniya и строки true возвращает Требуется', () => {
    expect(formatSpecValueForKey('razyemy_pitaniya', 'true')).toBe('Требуется');
  });

  it('для razyemy_pitaniya и строки false возвращает Не требуется', () => {
    expect(formatSpecValueForKey('razyemy_pitaniya', 'false')).toBe('Не требуется');
  });

  it('для razyemy_pitaniya и строки 0 возвращает Не требуется', () => {
    expect(formatSpecValueForKey('razyemy_pitaniya', '0')).toBe('Не требуется');
  });

  it('для razyemy_pitaniya и строки 1 возвращает Требуется', () => {
    expect(formatSpecValueForKey('razyemy_pitaniya', '1')).toBe('Требуется');
  });

  it('для razyemy_pitaniya и строки да возвращает Требуется', () => {
    expect(formatSpecValueForKey('razyemy_pitaniya', 'да')).toBe('Требуется');
  });

  it('для razyemy_pitaniya и строки нет возвращает Не требуется', () => {
    expect(formatSpecValueForKey('razyemy_pitaniya', 'нет')).toBe('Не требуется');
  });

  it('для обычного ключа и true возвращает Да', () => {
    expect(formatSpecValueForKey('ecc', true)).toBe('Да');
  });

  it('для обычного ключа и false возвращает Нет', () => {
    expect(formatSpecValueForKey('ecc', false)).toBe('Нет');
  });

  it('для обычного ключа и строки true возвращает Да', () => {
    expect(formatSpecValueForKey('ecc', 'true')).toBe('Да');
  });

  it('для обычного ключа и строки yes возвращает Да', () => {
    expect(formatSpecValueForKey('ecc', 'yes')).toBe('Да');
  });

  it('для обычного ключа и строки no возвращает Нет', () => {
    expect(formatSpecValueForKey('ecc', 'no')).toBe('Нет');
  });

  it('для строкового значения возвращает его как есть', () => {
    expect(formatSpecValueForKey('type', 'DDR5')).toBe('DDR5');
  });

  it('для числового значения возвращает строку', () => {
    expect(formatSpecValueForKey('type', 42)).toBe('42');
  });

  it('для undefined возвращает прочерк', () => {
    expect(formatSpecValueForKey('cores', undefined)).toBe('—');
  });

  it('для null возвращает прочерк', () => {
    expect(formatSpecValueForKey('cores', null)).toBe('—');
  });

  it('для пустой строки возвращает прочерк', () => {
    expect(formatSpecValueForKey('cores', '')).toBe('—');
  });

  it('регистронезависимо определяет boolean строки', () => {
    expect(formatSpecValueForKey('ecc', 'True')).toBe('Да');
    expect(formatSpecValueForKey('ecc', 'FALSE')).toBe('Нет');
    expect(formatSpecValueForKey('ecc', 'Yes')).toBe('Да');
    expect(formatSpecValueForKey('ecc', 'NO')).toBe('Нет');
  });

  it('нормализует camelCase ключ через normalizeSpecKey', () => {
    // memoryType нормализуется в memory_type, это не razyemy_pitaniya -> дефолтный формат
    expect(formatSpecValueForKey('memoryType', true)).toBe('Да');
  });
});
