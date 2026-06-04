import { describe, it, expect } from 'vitest';
import {
  extractMemoryType,
  extractMemoryTypeWithFallback,
  extractMemoryFormFactorWithFallback,
  extractSocketWithFallback,
} from '../extractors';

// ─── extractMemoryType ───

describe('extractMemoryType', () => {
  it('возвращает DDR5 для DDR5-4800', () => {
    expect(extractMemoryType({ memoryType: 'DDR5-4800' })).toBe('DDR5');
  });

  it('возвращает DDR4 для DDR4-3200', () => {
    expect(extractMemoryType({ memoryType: 'DDR4-3200' })).toBe('DDR4');
  });

  it('возвращает DDR4 для LPDDR4', () => {
    expect(extractMemoryType({ tip_pamyati: 'LPDDR4' })).toBe('DDR4');
  });

  it('возвращает DDR4 для LPDDR4X', () => {
    expect(extractMemoryType({ memoryType: 'LPDDR4X' })).toBe('DDR4');
  });

  it('возвращает DDR3 для DDR3-1600', () => {
    expect(extractMemoryType({ memoryType: 'DDR3-1600' })).toBe('DDR3');
  });

  it('возвращает DDR3 для LPDDR3', () => {
    expect(extractMemoryType({ tip_pamyati: 'LPDDR3' })).toBe('DDR3');
  });

  it('возвращает DDR3 для DDR3L', () => {
    expect(extractMemoryType({ memory_type: 'DDR3L' })).toBe('DDR3');
  });

  it('возвращает LPDDR5 для LPDDR5', () => {
    expect(extractMemoryType({ memoryType: 'LPDDR5' })).toBe('LPDDR5');
  });

  it('возвращает null для undefined specs', () => {
    expect(extractMemoryType(undefined)).toBeNull();
  });

  it('возвращает null для пустых specs', () => {
    expect(extractMemoryType({})).toBeNull();
  });

  it('возвращает null для неизвестного типа памяти', () => {
    expect(extractMemoryType({ memoryType: 'SDRAM' })).toBeNull();
  });
});

// ─── extractMemoryTypeWithFallback ───

describe('extractMemoryTypeWithFallback', () => {
  const makeProduct = (overrides: Record<string, unknown> = {}) => ({
    id: 'test-id',
    name: 'Test Product',
    sku: 'TST-001',
    category: 'ram' as const,
    price: 100,
    stock: 10,
    isActive: true,
    ...overrides,
  });

  it('берёт memoryType из ProductSummary, когда поле есть', () => {
    const product = makeProduct({ memoryType: 'DDR5' });
    expect(extractMemoryTypeWithFallback(product, {})).toBe('DDR5');
  });

  it('распознаёт DDR4 в ProductSummary.memoryType', () => {
    const product = makeProduct({ memoryType: 'DDR4' });
    expect(extractMemoryTypeWithFallback(product, {})).toBe('DDR4');
  });

  it('распознаёт DDR3 в ProductSummary.memoryType', () => {
    const product = makeProduct({ memoryType: 'DDR3' });
    expect(extractMemoryTypeWithFallback(product, {})).toBe('DDR3');
  });

  it('падает на specs, когда в ProductSummary нет memoryType', () => {
    const product = makeProduct();
    expect(extractMemoryTypeWithFallback(product, { memoryType: 'DDR5' })).toBe('DDR5');
  });

  it('возвращает null, когда оба источника пусты', () => {
    const product = makeProduct();
    expect(extractMemoryTypeWithFallback(product, {})).toBeNull();
  });
});

// ─── extractMemoryFormFactorWithFallback ───

describe('extractMemoryFormFactorWithFallback', () => {
  const makeProduct = (overrides: Record<string, unknown> = {}) => ({
    id: 'test-id',
    name: 'Test RAM',
    sku: 'RAM-001',
    category: 'ram' as const,
    price: 50,
    stock: 5,
    isActive: true,
    ...overrides,
  });

  it('возвращает DIMM из ProductSummary.memoryFormFactor', () => {
    const product = makeProduct({ memoryFormFactor: 'DIMM' });
    expect(extractMemoryFormFactorWithFallback(product, {})).toBe('DIMM');
  });

  it('возвращает SO-DIMM из ProductSummary.memoryFormFactor', () => {
    const product = makeProduct({ memoryFormFactor: 'SO-DIMM' });
    expect(extractMemoryFormFactorWithFallback(product, {})).toBe('SO-DIMM');
  });

  it('распознаёт SODIMM без дефиса в ProductSummary', () => {
    const product = makeProduct({ memoryFormFactor: 'SODIMM' });
    expect(extractMemoryFormFactorWithFallback(product, {})).toBe('SO-DIMM');
  });

  it('падает на specs, когда в ProductSummary нет memoryFormFactor', () => {
    const product = makeProduct();
    expect(extractMemoryFormFactorWithFallback(product, { memoryFormFactor: 'DIMM' })).toBe('DIMM');
  });

  it('возвращает null, когда оба источника пусты', () => {
    const product = makeProduct();
    expect(extractMemoryFormFactorWithFallback(product, {})).toBeNull();
  });
});

// ─── extractSocketWithFallback ───

describe('extractSocketWithFallback', () => {
  const makeProduct = (overrides: Record<string, unknown> = {}) => ({
    id: 'test-id',
    name: 'Test CPU',
    sku: 'CPU-001',
    category: 'cpu' as const,
    price: 200,
    stock: 3,
    isActive: true,
    ...overrides,
  });

  it('возвращает сокет из ProductSummary.socket', () => {
    const product = makeProduct({ socket: 'AM5' });
    expect(extractSocketWithFallback(product, {})).toBe('AM5');
  });

  it('возвращает null, когда сокет в ProductSummary неизвестен', () => {
    const product = makeProduct({ socket: 'UNKNOWN-SOCKET' });
    expect(extractSocketWithFallback(product, {})).toBeNull();
  });

  it('падает на specs, когда в ProductSummary нет socket', () => {
    const product = makeProduct();
    expect(extractSocketWithFallback(product, { socket: 'AM5' })).toBe('AM5');
  });

  it('нормализует сокет к верхнему регистру через specs', () => {
    const product = makeProduct();
    expect(extractSocketWithFallback(product, { socket: 'am5' })).toBe('AM5');
  });

  it('возвращает null, когда оба источника пусты', () => {
    const product = makeProduct();
    expect(extractSocketWithFallback(product, {})).toBeNull();
  });

  it('приоритет ProductSummary перед specs', () => {
    const product = makeProduct({ socket: 'AM5' });
    expect(extractSocketWithFallback(product, { socket: 'LGA1700' })).toBe('AM5');
  });
});
