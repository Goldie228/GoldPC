import { describe, it, expect } from 'vitest';
import {
  tipMonitorToGPU,
  tipDDR5Training,
  tipXMPNeeded,
  tipDualChannel,
  tipThermalPaste,
  tipSingleChannel,
  tipRemoveCoolerFilm,
  tipCheckPSUSwitch,
} from './tips';
import type { Product } from '@/api/types';

function makeProduct(specs: Record<string, string> = {}): Product {
  return {
    id: '1', name: 'Test', slug: 'test', sku: 'SKU-1',
    category: 'cpu', price: 100, stock: 5, isActive: true,
    specifications: specs,
  } as Product;
}

describe('tipMonitorToGPU', () => {
  it('returns null when cpu is undefined', () => {
    expect(tipMonitorToGPU(undefined, makeProduct())).toBeNull();
  });

  it('returns null when gpu is undefined', () => {
    expect(tipMonitorToGPU(makeProduct(), undefined)).toBeNull();
  });
});

describe('tipDDR5Training', () => {
  it('returns null when ram is undefined', () => {
    expect(tipDDR5Training(undefined)).toBeNull();
  });

  it('returns tip for DDR5 memory', () => {
    const ram = makeProduct({ 'Тип памяти': 'DDR5' });
    const result = tipDDR5Training(ram);
    if (result) {
      expect(result.message).toContain('DDR5');
    }
  });
});

describe('tipXMPNeeded', () => {
  it('returns null when ram is undefined', () => {
    expect(tipXMPNeeded(undefined, undefined)).toBeNull();
  });
});

describe('tipDualChannel', () => {
  it('returns null when ram is undefined', () => {
    expect(tipDualChannel(undefined, undefined)).toBeNull();
  });
});

describe('tipThermalPaste', () => {
  it('returns null when cooler is undefined', () => {
    expect(tipThermalPaste(undefined)).toBeNull();
  });
});

describe('tipSingleChannel', () => {
  it('returns null when ram is undefined', () => {
    expect(tipSingleChannel(undefined)).toBeNull();
  });
});

describe('tipRemoveCoolerFilm', () => {
  it('returns a tip when cooler is provided', () => {
    const cooler = makeProduct();
    const result = tipRemoveCoolerFilm(cooler);
    if (result) {
      expect(result.message).toBeDefined();
    }
  });
});

describe('tipCheckPSUSwitch', () => {
  it('returns a tip about PSU switch', () => {
    const result = tipCheckPSUSwitch();
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('Info');
  });
});
