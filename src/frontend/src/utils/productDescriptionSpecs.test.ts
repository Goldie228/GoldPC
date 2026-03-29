import { describe, expect, it } from 'vitest';
import {
  collectKeyValuePairsFromDescription,
  mergeDescriptionIntoSpecifications,
  normalizeMergedSpecKey,
  specificationsWithDescriptionFallback,
} from './productDescriptionSpecs';

describe('productDescriptionSpecs', () => {
  it('normalizeMergedSpecKey: латиница camelCase и кириллица', () => {
    expect(normalizeMergedSpecKey('connectionType')).toBe('connection_type');
    expect(normalizeMergedSpecKey('Тип подключения')).toBe('тип_подключения');
  });

  it('mergeDescriptionIntoSpecifications: API-поля не перезаписываются из описания', () => {
    const merged = mergeDescriptionIntoSpecifications(
      { dpi: 16000, connection_type: 'USB' } as Record<string, string | number>,
      'Основные\nDPI — 9999\nТип подключения — Bluetooth'
    );
    expect(merged.dpi).toBe(16000);
    expect(merged.connection_type).toBe('USB');
  });

  it('mergeDescriptionIntoSpecifications: пустые поля дополняются из описания', () => {
    const merged = mergeDescriptionIntoSpecifications(
      { dpi: 800 } as Record<string, number>,
      'Технические характеристики\nЧастота опроса — 1000 Гц'
    );
    expect(merged.dpi).toBe(800);
    expect(merged['частота_опроса']).toBe('1000 Гц');
  });

  it('specificationsWithDescriptionFallback: при непустом API дополняет ключи из описания', () => {
    const merged = specificationsWithDescriptionFallback(
      { vram: '8GB' } as Record<string, string>,
      'Основные\nОбъём памяти — 16 ГБ'
    );
    expect(merged.vram).toBe('8GB');
    expect(merged['объём_памяти']).toBe('16 ГБ');
  });

  it('specificationsWithDescriptionFallback: без API использует описание', () => {
    const merged = specificationsWithDescriptionFallback(
      {},
      'Основные\nВес — 300 г'
    );
    expect(merged['вес']).toBe('300 г');
  });

  it('specificationsWithDescriptionFallback: разреженный API + блок Основные из описания (как наушники)', () => {
    const merged = specificationsWithDescriptionFallback(
      { color: 'черный', type: 'накладные' } as Record<string, string>,
      'Основные\nТип: наушники с микрофоном\nКонструкция: мониторные'
    );
    expect(merged.color).toBe('черный');
    expect(merged.type).toBe('накладные');
    expect(merged['тип']).toBe('наушники с микрофоном');
    expect(merged['конструкция']).toBe('мониторные');
  });

  it('collectKeyValuePairsFromDescription извлекает пары из секций', () => {
    const desc = `Основные
Вес — 300 г
Технические характеристики
Чувствительность — 100 дБ`;
    const pairs = collectKeyValuePairsFromDescription(desc);
    const keys = pairs.map((p) => p.key);
    expect(keys.some((k) => k.includes('Вес'))).toBe(true);
    expect(keys.some((k) => k.includes('Чувствительность'))).toBe(true);
  });
});
