import { describe, expect, it } from 'vitest';
import {
  calculatePowerConsumption,
  calculateRecommendedPSU,
  checkCompatibility,
  extractSocket,
  extractMemoryType,
  extractTDP,
  extractPSUWattage,
  hasIntegratedGraphics,
  extractFormFactor,
  extractSupportedSockets,
  extractGPULength,
  extractMaxGPULength,
  extractRAMCapacity,
  extractMaxMemory,
  type ComponentMap,
} from './compatibilityUtils';
import type { Product } from '../api/types';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'test-id',
    name: 'Test Product',
    sku: 'SKU-001',
    category: 'cpu',
    price: 10000,
    stock: 10,
    isActive: true,
    specifications: {},
    ...overrides,
  };
}

describe('compatibilityUtils - performanceCalculator', () => {
  describe('calculatePowerConsumption', () => {
    it('returns 50 for empty components', () => {
      expect(calculatePowerConsumption({})).toBe(50);
    });

    it('sums TDP for CPU and GPU', () => {
      const components: ComponentMap = {
        cpu: makeProduct({ specifications: { tdp: 125 } }),
        gpu: makeProduct({ specifications: { tdp: 200 } }),
      };
      expect(calculatePowerConsumption(components)).toBe(375);
    });

    it('uses default TDP when not specified', () => {
      const components: ComponentMap = {
        cpu: makeProduct({ specifications: {} }),
        gpu: makeProduct({ specifications: {} }),
      };
      expect(calculatePowerConsumption(components)).toBe(265);
    });

    it('adds fixed wattage for RAM, storage, cooling, motherboard', () => {
      const components: ComponentMap = {
        cpu: makeProduct({ specifications: { tdp: 100 } }),
        ram: makeProduct({ specifications: {} }),
        storage: makeProduct({ specifications: {} }),
        cooling: makeProduct({ specifications: {} }),
        motherboard: makeProduct({ specifications: {} }),
      };
      expect(calculatePowerConsumption(components)).toBe(165);
    });
  });

  describe('calculateRecommendedPSU', () => {
    it('returns 100 for empty', () => {
      expect(calculateRecommendedPSU({})).toBe(100);
    });

    it('returns 130% rounded up', () => {
      const components: ComponentMap = {
        cpu: makeProduct({ specifications: { tdp: 125 } }),
        gpu: makeProduct({ specifications: { tdp: 200 } }),
      };
      expect(calculateRecommendedPSU(components)).toBe(550);
    });
  });

  describe('checkCompatibility', () => {
    it('returns compatible for empty', () => {
      const result = checkCompatibility({});
      expect(result.isCompatible).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('detects CPU socket mismatch', () => {
      const components: ComponentMap = {
        cpu: makeProduct({ name: 'Intel CPU', specifications: { socket: 'LGA1700' } }),
        motherboard: makeProduct({
          name: 'AM5 Board',
          category: 'motherboard',
          specifications: { socket: 'AM5' },
        }),
      };
      const result = checkCompatibility(components);
      expect(result.isCompatible).toBe(false);
      expect(result.issues[0].message).toContain('LGA1700');
    });

    it('detects PSU warning for insufficient wattage', () => {
      const components: ComponentMap = {
        cpu: makeProduct({ specifications: { tdp: 125 } }),
        gpu: makeProduct({ specifications: { tdp: 300 } }),
        psu: makeProduct({ name: '400W PSU', category: 'psu', specifications: { wattage: 400 } }),
      };
      const result = checkCompatibility(components);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('includes powerConsumption and recommendedPSU', () => {
      const components: ComponentMap = {
        cpu: makeProduct({ specifications: { tdp: 100 } }),
        gpu: makeProduct({ specifications: { tdp: 200 } }),
      };
      const result = checkCompatibility(components);
      expect(result.powerConsumption).toBe(350);
      expect(result.recommendedPSU).toBe(Math.ceil((350 * 1.4) / 50) * 50);
    });
  });

  describe('extractSocket', () => {
    it('extracts valid socket', () => {
      expect(extractSocket({ socket: 'LGA1700' })).toBe('LGA1700');
    });

    it('normalizes to uppercase', () => {
      expect(extractSocket({ socket: 'lga1700' })).toBe('LGA1700');
    });

    it('returns null for invalid', () => {
      expect(extractSocket({ socket: 'UNKNOWN' })).toBeNull();
    });

    it('returns null for undefined', () => {
      expect(extractSocket(undefined)).toBeNull();
    });
  });

  describe('extractMemoryType', () => {
    it('extracts DDR5', () => {
      expect(extractMemoryType({ memoryType: 'DDR5' })).toBe('DDR5');
    });

    it('handles DDR5 with suffix', () => {
      expect(extractMemoryType({ memoryType: 'DDR5-4800' })).toBe('DDR5');
    });

    it('returns null for DDR3', () => {
      expect(extractMemoryType({ memoryType: 'DDR3' })).toBeNull();
    });
  });

  describe('extractTDP', () => {
    it('extracts numeric TDP', () => {
      expect(extractTDP({ tdp: 125 })).toBe(125);
    });

    it('extracts string TDP', () => {
      expect(extractTDP({ tdp: '125W' })).toBe(125);
    });

    it('returns 0 for missing', () => {
      expect(extractTDP(undefined)).toBe(0);
    });
  });

  describe('extractFormFactor', () => {
    it('extracts ATX', () => {
      expect(extractFormFactor({ formFactor: 'ATX' })).toBe('ATX');
    });

    it('handles Micro-ATX', () => {
      expect(extractFormFactor({ formFactor: 'Micro-ATX' })).toBe('MicroATX');
    });

    it('handles Mini-ITX', () => {
      expect(extractFormFactor({ formFactor: 'Mini-ITX' })).toBe('MiniITX');
    });
  });

  describe('extractPSUWattage', () => {
    it('extracts wattage', () => {
      expect(extractPSUWattage({ wattage: 750 })).toBe(750);
    });

    it('returns 0 for missing', () => {
      expect(extractPSUWattage(undefined)).toBe(0);
    });
  });

  describe('extractSupportedSockets', () => {
    it('extracts array', () => {
      expect(extractSupportedSockets({ supportedSockets: ['LGA1700', 'AM5'] })).toEqual([
        'LGA1700',
        'AM5',
      ]);
    });

    it('returns empty for undefined', () => {
      expect(extractSupportedSockets(undefined)).toEqual([]);
    });
  });

  describe('hasIntegratedGraphics', () => {
    it('returns true for boolean true', () => {
      expect(hasIntegratedGraphics({ integratedGraphics: true })).toBe(true);
    });

    it('returns false for boolean false', () => {
      expect(hasIntegratedGraphics({ integratedGraphics: false })).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(hasIntegratedGraphics(undefined)).toBe(false);
    });
  });

  describe('extractMaxGPULength and extractGPULength', () => {
    it('extracts max GPU length', () => {
      expect(extractMaxGPULength({ maxGPULength: 350 })).toBe(350);
    });

    it('extracts GPU length', () => {
      expect(extractGPULength({ length: 305 })).toBe(305);
    });

    it('returns null for missing', () => {
      expect(extractMaxGPULength(undefined)).toBeNull();
      expect(extractGPULength({})).toBeNull();
    });
  });

  describe('extractRAMCapacity and extractMaxMemory', () => {
    it('extracts RAM capacity', () => {
      expect(extractRAMCapacity({ capacity: 32 })).toBe(32);
    });

    it('extracts max memory', () => {
      expect(extractMaxMemory({ maxMemory: 128 })).toBe(128);
    });

    it('defaults max memory to 128', () => {
      expect(extractMaxMemory({})).toBe(128);
    });
  });
});
