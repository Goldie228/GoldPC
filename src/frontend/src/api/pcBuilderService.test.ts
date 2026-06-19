import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPost } = vi.hoisted(() => ({
  mockPost: vi.fn(),
}));

vi.mock('./client', () => ({
  default: {
    get: vi.fn(),
    post: mockPost,
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { buildComponentsDTO, checkCompatibilityAPI, calculateFpsApi } from './pcBuilderService';
import type { SelectedComponentsState } from './pcBuilderService';

describe('api/pcBuilderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('buildComponentsDTO', () => {
    it('builds DTO from full components state', () => {
      const components: SelectedComponentsState = {
        cpu: { product: { id: 'c1', name: 'Ryzen', sku: 'S1', category: 'cpu', price: 300, stock: 5, isActive: true, specifications: { cores: 8 } } },
        gpu: { product: { id: 'g1', name: 'RTX', sku: 'S2', category: 'gpu', price: 700, stock: 3, isActive: true, mainImage: { id: 'i1', url: '/img.jpg' } } },
        motherboard: { product: { id: 'm1', name: 'B650', sku: 'S3', category: 'motherboard', price: 200, stock: 10, isActive: true } },
        psu: { product: { id: 'p1', name: '750W', sku: 'S4', category: 'psu', price: 100, stock: 8, isActive: true } },
        case: { product: { id: 'ca1', name: 'Case', sku: 'S5', category: 'case', price: 80, stock: 15, isActive: true } },
        cooling: { product: { id: 'co1', name: 'Cooler', sku: 'S6', category: 'cooling', price: 50, stock: 20, isActive: true } },
        ram: [{ product: { id: 'r1', name: 'DDR5', sku: 'S7', category: 'ram', price: 120, stock: 12, isActive: true } }],
        storage: [{ product: { id: 'st1', name: 'SSD', sku: 'S8', category: 'storage', price: 90, stock: 25, isActive: true } }],
      };

      const dto = buildComponentsDTO(components);

      expect(dto.cpu?.productId).toBe('c1');
      expect(dto.cpu?.name).toBe('Ryzen');
      expect(dto.cpu?.price).toBe(300);
      expect(dto.cpu?.isAvailable).toBe(true);
      expect(dto.gpu?.productId).toBe('g1');
      expect(dto.gpu?.image).toBe('/img.jpg');
      expect(dto.motherboard?.productId).toBe('m1');
      expect(dto.psu?.productId).toBe('p1');
      expect(dto.case?.productId).toBe('ca1');
      expect(dto.cooling?.productId).toBe('co1');
      expect(dto.ram?.productId).toBe('r1');
      expect(dto.storage).toHaveLength(1);
      expect(dto.storage?.[0].productId).toBe('st1');
    });

    it('omits missing components', () => {
      const components: SelectedComponentsState = {
        ram: [],
        storage: [],
      };
      const dto = buildComponentsDTO(components);
      expect(dto.cpu).toBeUndefined();
      expect(dto.gpu).toBeUndefined();
      expect(dto.motherboard).toBeUndefined();
      expect(dto.ram).toBeUndefined();
      expect(dto.storage).toBeUndefined();
    });

    it('sends only first RAM module', () => {
      const components: SelectedComponentsState = {
        ram: [
          { product: { id: 'r1', name: 'DDR5-1', sku: 'S1', category: 'ram', price: 100, stock: 5, isActive: true } },
          { product: { id: 'r2', name: 'DDR5-2', sku: 'S2', category: 'ram', price: 100, stock: 5, isActive: true } },
        ],
        storage: [],
      };
      const dto = buildComponentsDTO(components);
      expect(dto.ram?.productId).toBe('r1');
    });

    it('sets isAvailable based on stock > 0', () => {
      const components: SelectedComponentsState = {
        cpu: { product: { id: 'c1', name: 'CPU', sku: 'S1', category: 'cpu', price: 100, stock: 0, isActive: true } },
        ram: [],
        storage: [],
      };
      const dto = buildComponentsDTO(components);
      expect(dto.cpu?.isAvailable).toBe(false);
    });
  });

  describe('checkCompatibilityAPI', () => {
    it('sends POST /pcbuilder/check-compatibility with components', async () => {
      const mockResult = {
        result: { isCompatible: true, issues: [], warnings: [] },
        powerConsumption: 300,
        recommendedPSU: 550,
      };
      mockPost.mockResolvedValueOnce({ data: mockResult });

      const components: SelectedComponentsState = {
        cpu: { product: { id: 'c1', name: 'CPU', sku: 'S1', category: 'cpu', price: 300, stock: 5, isActive: true } },
        ram: [{ product: { id: 'r1', name: 'RAM', sku: 'S2', category: 'ram', price: 100, stock: 5, isActive: true } }],
        storage: [],
      };

      const result = await checkCompatibilityAPI(components);
      expect(mockPost).toHaveBeenCalledWith(
        '/pcbuilder/check-compatibility',
        { components: expect.objectContaining({ cpu: expect.objectContaining({ productId: 'c1' }) }) },
        { signal: undefined },
      );
      expect(result).toEqual(mockResult);
    });

    it('passes abort signal', async () => {
      mockPost.mockResolvedValueOnce({ data: { result: { isCompatible: true, issues: [], warnings: [] }, powerConsumption: 200, recommendedPSU: 400 } });
      const controller = new AbortController();
      const components: SelectedComponentsState = { ram: [], storage: [] };
      await checkCompatibilityAPI(components, { signal: controller.signal });
      expect(mockPost).toHaveBeenCalledWith(
        '/pcbuilder/check-compatibility',
        expect.anything(),
        { signal: controller.signal },
      );
    });
  });

  describe('calculateFpsApi', () => {
    it('sends POST /pcbuilder/calculate-fps with params', async () => {
      const mockFps = { cpuScore: 80, gpuScore: 90, overallScore: 85, bottleneck: null, games: [], ramFactor: 1.0 };
      mockPost.mockResolvedValueOnce({ data: mockFps });

      const result = await calculateFpsApi({ cpuId: 'c1', gpuId: 'g1', ramCapacity: 32, ramFrequency: 6000 });
      expect(mockPost).toHaveBeenCalledWith('/pcbuilder/calculate-fps', {
        components: { cpuId: 'c1', gpuId: 'g1' },
        ramCapacity: 32,
        ramFrequency: 6000,
      });
      expect(result).toEqual(mockFps);
    });

    it('handles undefined params', async () => {
      mockPost.mockResolvedValueOnce({ data: { cpuScore: 0, gpuScore: 0, overallScore: 0, bottleneck: null, games: [], ramFactor: 0 } });
      const result = await calculateFpsApi({});
      expect(mockPost).toHaveBeenCalledWith('/pcbuilder/calculate-fps', {
        components: { cpuId: undefined, gpuId: undefined },
        ramCapacity: undefined,
        ramFrequency: undefined,
      });
      expect(result.cpuScore).toBe(0);
    });
  });
});
