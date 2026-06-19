import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFpsApi } from './useFpsApi';
import type { PCBuilderSelectedState } from '@/features/pc-builder/logic/types';

const mockCalculateFpsApi = vi.fn();

vi.mock('@/api/pcBuilderService', () => ({
  calculateFpsApi: (...args: any[]) => mockCalculateFpsApi(...args),
}));

vi.mock('@/features/pc-builder/logic/constants', () => ({
  FPS_DEBOUNCE_MS: 300,
}));

const emptyComponents: PCBuilderSelectedState = { ram: [], storage: [], fan: [] };

describe('hooks/pc-builder/useFpsApi', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useFpsApi(emptyComponents));
    expect(result.current.fpsData).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('does not call API when no cpu or gpu', () => {
    renderHook(() => useFpsApi(emptyComponents));

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(mockCalculateFpsApi).not.toHaveBeenCalled();
  });

  it('debounces API call with valid components', async () => {
    mockCalculateFpsApi.mockResolvedValue({ fps: 120 });

    const components: PCBuilderSelectedState = {
      cpu: { product: { id: 'cpu-1', name: 'CPU', sku: 'SKU', category: 'cpu', price: 100, stock: 1, isActive: true } as never, type: 'cpu' },
      gpu: { product: { id: 'gpu-1', name: 'GPU', sku: 'SKU', category: 'gpu', price: 200, stock: 1, isActive: true } as never, type: 'gpu' },
      ram: [],
      storage: [],
      fan: [],
    };

    renderHook(() => useFpsApi(components));

    // Before debounce (300ms)
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(mockCalculateFpsApi).not.toHaveBeenCalled();

    // After debounce
    await act(async () => {
      vi.advanceTimersByTime(250);
    });

    expect(mockCalculateFpsApi).toHaveBeenCalledWith({
      cpuId: 'cpu-1',
      gpuId: 'gpu-1',
      ramCapacity: undefined,
      ramFrequency: undefined,
    });
  });

  it('sets error on API failure', async () => {
    mockCalculateFpsApi.mockRejectedValue(new Error('Unavailable'));

    const components: PCBuilderSelectedState = {
      cpu: { product: { id: 'cpu-1', name: 'CPU', sku: 'SKU', category: 'cpu', price: 100, stock: 1, isActive: true } as never, type: 'cpu' },
      gpu: { product: { id: 'gpu-1', name: 'GPU', sku: 'SKU', category: 'gpu', price: 200, stock: 1, isActive: true } as never, type: 'gpu' },
      ram: [],
      storage: [],
      fan: [],
    };

    const { result } = renderHook(() => useFpsApi(components));

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.error?.message).toBe('Unavailable');
  });
});
