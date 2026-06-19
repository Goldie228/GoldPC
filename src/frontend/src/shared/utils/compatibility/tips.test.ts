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

  it('returns tip when cpu has integrated graphics', () => {
    const cpu = makeProduct({ integratedGraphics: 'true' });
    const gpu = makeProduct();
    const result = tipMonitorToGPU(cpu, gpu);
    expect(result).not.toBeNull();
    expect(result!.message).toContain('монитор');
  });

  it('returns null when cpu has no integrated graphics', () => {
    const cpu = makeProduct({ integratedGraphics: 'false' });
    const gpu = makeProduct();
    expect(tipMonitorToGPU(cpu, gpu)).toBeNull();
  });
});

describe('tipDDR5Training', () => {
  it('returns null when ram is undefined', () => {
    expect(tipDDR5Training(undefined)).toBeNull();
  });

  it('returns tip for DDR5 memory', () => {
    const ram = makeProduct({ memoryType: 'DDR5' });
    const result = tipDDR5Training(ram);
    expect(result).not.toBeNull();
    expect(result!.message).toContain('DDR5');
  });

  it('returns null for DDR4 memory', () => {
    const ram = makeProduct({ memoryType: 'DDR4' });
    expect(tipDDR5Training(ram)).toBeNull();
  });
});

describe('tipXMPNeeded', () => {
  it('returns null when ram is undefined', () => {
    expect(tipXMPNeeded(undefined, undefined)).toBeNull();
  });
});

describe('tipDualChannel', () => {
  it('returns null when ramCount is less than 2', () => {
    expect(tipDualChannel(0, undefined)).toBeNull();
    expect(tipDualChannel(1, undefined)).toBeNull();
  });
});

describe('tipThermalPaste', () => {
  it('returns null when cooler is undefined', () => {
    expect(tipThermalPaste(undefined)).toBeNull();
  });
});

describe('tipSingleChannel', () => {
  it('returns null when ramCount is not 1', () => {
    expect(tipSingleChannel(0)).toBeNull();
    expect(tipSingleChannel(2)).toBeNull();
  });

  it('returns tip when ramCount is 1', () => {
    const result = tipSingleChannel(1);
    expect(result).not.toBeNull();
    expect(result!.message).toContain('одноканальном');
  });
});

describe('tipRemoveCoolerFilm', () => {
  it('returns a tip unconditionally', () => {
    const result = tipRemoveCoolerFilm();
    expect(result).not.toBeNull();
    expect(result.message).toContain('плёнку');
  });
});

describe('tipCheckPSUSwitch', () => {
  it('returns a tip about PSU switch', () => {
    const result = tipCheckPSUSwitch();
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('Info');
  });
});
