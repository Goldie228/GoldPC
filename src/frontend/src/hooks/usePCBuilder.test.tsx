import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePCBuilder, PC_BUILDER_SLOTS } from './usePCBuilder';
import type { Product } from '../api/types';

const STORAGE_KEY = 'goldpc-pc-builder';

// === Вспомогательные функции для моков ===

function createMockProduct(overrides: Partial<Product> = {}): Product {
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

function createCPU(overrides: Partial<Product> = {}): Product {
  return createMockProduct({
    id: 'cpu-1',
    name: 'Intel Core i7-13700K',
    category: 'cpu',
    price: 35000,
    specifications: {
      socket: 'LGA1700',
      tdp: 125,
      integratedGraphics: false,
    },
    ...overrides,
  });
}

function createMotherboard(overrides: Partial<Product> = {}): Product {
  return createMockProduct({
    id: 'mb-1',
    name: 'ASUS ROG STRIX B660-A',
    category: 'motherboard',
    price: 18000,
    specifications: {
      socket: 'LGA1700',
      memoryType: 'DDR5',
    },
    ...overrides,
  });
}

function createRAM(overrides: Partial<Product> = {}): Product {
  return createMockProduct({
    id: 'ram-1',
    name: 'Corsair Vengeance DDR5 32GB',
    category: 'ram',
    price: 12000,
    specifications: {
      memoryType: 'DDR5',
    },
    ...overrides,
  });
}

function createGPU(overrides: Partial<Product> = {}): Product {
  return createMockProduct({
    id: 'gpu-1',
    name: 'NVIDIA RTX 4070',
    category: 'gpu',
    price: 60000,
    specifications: {
      tdp: 200,
    },
    ...overrides,
  });
}

function createPSU(overrides: Partial<Product> = {}): Product {
  return createMockProduct({
    id: 'psu-1',
    name: 'Corsair RM750',
    category: 'psu',
    price: 10000,
    specifications: {
      wattage: 750,
    },
    ...overrides,
  });
}

function createCooling(overrides: Partial<Product> = {}): Product {
  return createMockProduct({
    id: 'cooling-1',
    name: 'Noctua NH-D15',
    category: 'cooling',
    price: 8000,
    specifications: {
      supportedSockets: ['LGA1700', 'AM5'],
    } as Product['specifications'],
    ...overrides,
  });
}

// === Тесты ===

describe('usePCBuilder', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ===== 1. Socket Incompatibility Detection =====
  describe('should detect socket incompatibility', () => {
    it('возвращает ошибку при несовпадении сокетов CPU и материнской платы', () => {
      const { result } = renderHook(() => usePCBuilder());

      const cpuLGA1700 = createCPU({ specifications: { socket: 'LGA1700', tdp: 125 } });
      const mbAM5 = createMotherboard({
        id: 'mb-am5',
        name: 'ASUS AM5 Board',
        specifications: { socket: 'AM5', memoryType: 'DDR5' },
      });

      act(() => {
        result.current.selectComponent('cpu', cpuLGA1700);
      });

      act(() => {
        result.current.selectComponent('motherboard', mbAM5);
      });

      expect(result.current.compatibility.isCompatible).toBe(false);
      expect(result.current.compatibility.errors.length).toBeGreaterThan(0);
      expect(result.current.compatibility.errors[0]).toContain('LGA1700');
      expect(result.current.compatibility.errors[0]).toContain('AM5');
    });

    it('не возвращает ошибку при совпадении сокетов', () => {
      const { result } = renderHook(() => usePCBuilder());

      const cpu = createCPU();
      const mb = createMotherboard();

      act(() => {
        result.current.selectComponent('cpu', cpu);
        result.current.selectComponent('motherboard', mb);
      });

      expect(result.current.compatibility.isCompatible).toBe(true);
      expect(result.current.compatibility.errors).toHaveLength(0);
    });

    it('возвращает ошибку при несовпадении типа RAM', () => {
      const { result } = renderHook(() => usePCBuilder());

      const mbDDR4 = createMotherboard({
        specifications: { socket: 'LGA1700', memoryType: 'DDR4' },
      });
      const ramDDR5 = createRAM({
        specifications: { memoryType: 'DDR5' },
      });

      act(() => {
        result.current.selectComponent('motherboard', mbDDR4);
        result.current.selectComponent('ram', ramDDR5);
      });

      expect(result.current.compatibility.isCompatible).toBe(false);
      expect(result.current.compatibility.errors.some(e => e.includes('памят'))).toBe(true);
    });
  });

  // ===== 2. Total Price Calculation =====
  describe('should calculate total price correctly', () => {
    it('возвращает 0 для пустой сборки', () => {
      const { result } = renderHook(() => usePCBuilder());
      expect(result.current.totalPrice).toBe(0);
    });

    it('корректно суммирует цены всех компонентов', () => {
      const { result } = renderHook(() => usePCBuilder());

      act(() => {
        result.current.selectComponent('cpu', createCPU({ price: 35000 }));
        result.current.selectComponent('gpu', createGPU({ price: 60000 }));
        result.current.selectComponent('motherboard', createMotherboard({ price: 18000 }));
        result.current.selectComponent('ram', createRAM({ price: 12000 }));
        result.current.selectComponent('psu', createPSU({ price: 10000 }));
      });

      expect(result.current.totalPrice).toBe(35000 + 60000 + 18000 + 12000 + 10000);
    });

    it('пересчитывает цену при удалении компонента', () => {
      const { result } = renderHook(() => usePCBuilder());

      act(() => {
        result.current.selectComponent('cpu', createCPU({ price: 35000 }));
        result.current.selectComponent('gpu', createGPU({ price: 60000 }));
      });

      expect(result.current.totalPrice).toBe(95000);

      act(() => {
        result.current.removeComponent('gpu');
      });

      expect(result.current.totalPrice).toBe(35000);
    });
  });

  // ===== 3. Power Consumption Calculation =====
  describe('should calculate power consumption', () => {
    it('возвращает базовую нагрузку для пустой сборки', () => {
      const { result } = renderHook(() => usePCBuilder());
      expect(result.current.powerConsumption).toBe(50);
    });

    it('корректно рассчитывает энергопотребление по TDP компонентов', () => {
      const { result } = renderHook(() => usePCBuilder());

      act(() => {
        result.current.selectComponent('cpu', createCPU({ specifications: { socket: 'LGA1700', tdp: 125 } }));
        result.current.selectComponent('gpu', createGPU({ specifications: { tdp: 200 } }));
        result.current.selectComponent('motherboard', createMotherboard({ specifications: { socket: 'LGA1700', memoryType: 'DDR5' } }));
        result.current.selectComponent('ram', createRAM({ specifications: { memoryType: 'DDR5' } }));
        result.current.selectComponent('storage', createMockProduct({ id: 's-1', name: 'SSD', category: 'storage', price: 5000, stock: 10, isActive: true, specifications: {} }));
        result.current.selectComponent('cooling', createCooling());
      });

      // 50 база + CPU 125 + GPU 200 + накопитель 5 + охлаждение 10 = 390 Вт
      expect(result.current.powerConsumption).toBe(390);
    });

    it('без TDP в спецификациях учитывается только база и выбранные компоненты без TDP', () => {
      const { result } = renderHook(() => usePCBuilder());

      act(() => {
        result.current.selectComponent('cpu', createCPU({ specifications: { socket: 'LGA1700' } }));
        result.current.selectComponent('gpu', createGPU({ specifications: {} }));
      });

      expect(result.current.powerConsumption).toBe(50);
    });
  });

  // ===== 4. Save to localStorage on component change =====
  describe('should save to localStorage on component change', () => {
    it('saves component to localStorage on add', () => {
      const { result } = renderHook(() => usePCBuilder());

      act(() => {
        result.current.selectComponent('cpu', createCPU());
      });

      const saved = localStorage.getItem(STORAGE_KEY);
      expect(saved).not.toBeNull();
      const parsed = JSON.parse(saved!);
      expect(parsed.v).toBe(2);
      expect(parsed.components.cpu).toBeDefined();
      expect(parsed.components.cpu.product.name).toBe('Intel Core i7-13700K');
    });

    it('updates localStorage on component removal', () => {
      const { result } = renderHook(() => usePCBuilder());

      act(() => {
        result.current.selectComponent('cpu', createCPU());
        result.current.selectComponent('gpu', createGPU());
      });

      act(() => {
        result.current.removeComponent('gpu');
      });

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(saved.v).toBe(2);
      expect(saved.components.cpu).toBeDefined();
      expect(saved.components.gpu).toBeUndefined();
    });

    it('removes localStorage data on build clear', () => {
      const { result } = renderHook(() => usePCBuilder());

      act(() => {
        result.current.selectComponent('cpu', createCPU());
      });

      act(() => {
        result.current.clearBuild();
      });

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  // ===== 5. Restore from localStorage on mount =====
  describe('should restore from localStorage on mount', () => {
    it('restores components from localStorage on init', () => {
      const cpu = createCPU();
      const mockData = {
        v: 2 as const,
        savedAt: new Date().toISOString(),
        components: {
          cpu: {
            productId: cpu.id,
            type: 'cpu' as const,
            product: {
              id: cpu.id,
              name: cpu.name,
              sku: cpu.sku,
              category: cpu.category,
              price: cpu.price,
              stock: cpu.stock,
              isActive: cpu.isActive,
              specifications: cpu.specifications,
            },
          },
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockData));

      const { result } = renderHook(() => usePCBuilder());

      expect(result.current.selectedComponents.cpu).toBeDefined();
      expect(result.current.selectedComponents.cpu?.product.name).toBe('Intel Core i7-13700K');
      expect(result.current.totalPrice).toBe(35000);
    });

    it('starts with empty build if localStorage is empty', () => {
      const { result } = renderHook(() => usePCBuilder());

      expect(result.current.selectedCount).toBe(0);
      expect(result.current.selectedComponents.ram).toEqual([]);
      expect(result.current.selectedComponents.storage).toEqual([]);
      expect(result.current.totalPrice).toBe(0);
    });

    it('ignores invalid localStorage data', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid-json{{{');

      const { result } = renderHook(() => usePCBuilder());

      expect(result.current.selectedCount).toBe(0);
      expect(result.current.selectedComponents.ram).toEqual([]);
    });
  });

  // ===== 6. Reset Build Correctly =====
  describe('should reset build correctly', () => {
    it('clears all selected components', () => {
      const { result } = renderHook(() => usePCBuilder());

      act(() => {
        result.current.selectComponent('cpu', createCPU());
        result.current.selectComponent('gpu', createGPU());
        result.current.selectComponent('motherboard', createMotherboard());
      });

      expect(result.current.selectedCount).toBe(3);

      act(() => {
        result.current.clearBuild();
      });

      expect(result.current.selectedCount).toBe(0);
      expect(result.current.selectedComponents.ram).toEqual([]);
      expect(result.current.selectedComponents.storage).toEqual([]);
      expect(result.current.totalPrice).toBe(0);
      expect(result.current.powerConsumption).toBe(50);
    });

    it('resets compatibility after clear', () => {
      const { result } = renderHook(() => usePCBuilder());

      act(() => {
        result.current.selectComponent('cpu', createCPU({ specifications: { socket: 'LGA1700', tdp: 125 } }));
        result.current.selectComponent('motherboard', createMotherboard({
          specifications: { socket: 'AM5', memoryType: 'DDR5' },
        }));
      });

      expect(result.current.compatibility.isCompatible).toBe(false);

      act(() => {
        result.current.clearBuild();
      });

      expect(result.current.compatibility.isCompatible).toBe(true);
      expect(result.current.compatibility.errors).toHaveLength(0);
    });

    it('removes localStorage after clear', () => {
      const { result } = renderHook(() => usePCBuilder());

      act(() => {
        result.current.selectComponent('cpu', createCPU());
      });

      expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();

      act(() => {
        result.current.clearBuild();
      });

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  describe('PC_BUILDER_SLOTS', () => {
    it('contains all 8 component types', () => {
      expect(PC_BUILDER_SLOTS).toHaveLength(8);
      const keys = PC_BUILDER_SLOTS.map(s => s.key);
      expect(keys).toContain('cpu');
      expect(keys).toContain('gpu');
      expect(keys).toContain('motherboard');
      expect(keys).toContain('ram');
      expect(keys).toContain('storage');
      expect(keys).toContain('psu');
      expect(keys).toContain('case');
      expect(keys).toContain('cooling');
    });
  });

  describe('getSlotState', () => {
    it('returns empty for unselected slot', () => {
      const { result } = renderHook(() => usePCBuilder());
      expect(result.current.getSlotState('cpu').state).toBe('empty');
    });

    it('returns selected for chosen component', () => {
      const { result } = renderHook(() => usePCBuilder());

      act(() => {
        result.current.selectComponent('cpu', createCPU());
      });

      expect(result.current.getSlotState('cpu').state).toBe('selected');
    });

    it('returns incompatible on compatibility error', () => {
      const { result } = renderHook(() => usePCBuilder());

      act(() => {
        result.current.selectComponent('cpu', createCPU({ specifications: { socket: 'LGA1700', tdp: 125 } }));
        result.current.selectComponent('motherboard', createMotherboard({
          specifications: { socket: 'AM5', memoryType: 'DDR5' },
        }));
      });

      expect(result.current.getSlotState('cpu').state).toBe('incompatible');
      expect(result.current.getSlotState('motherboard').state).toBe('incompatible');
    });
  });
});
