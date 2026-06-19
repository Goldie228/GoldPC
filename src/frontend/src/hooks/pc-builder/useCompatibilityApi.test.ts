import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCompatibilityApi } from './useCompatibilityApi';
import type { PCBuilderSelectedState } from '@/features/pc-builder/logic/types';

const mockCheckCompatibilityAPI = vi.fn();

vi.mock('@/api/pcBuilderService', () => ({
  checkCompatibilityAPI: (...args: any[]) => mockCheckCompatibilityAPI(...args),
}));

vi.mock('@/features/pc-builder/logic/constants', () => ({
  COMPATIBILITY_DEBOUNCE_MS: 120,
}));

vi.mock('@/features/pc-builder/logic/types', () => ({}));

const emptyComponents: PCBuilderSelectedState = { ram: [], storage: [], fan: [] };

describe('hooks/pc-builder/useCompatibilityApi', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useCompatibilityApi(emptyComponents));
    expect(result.current.apiResult).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('does not call API when components is empty', () => {
    renderHook(() => useCompatibilityApi(emptyComponents));

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(mockCheckCompatibilityAPI).not.toHaveBeenCalled();
  });

  it('debounces API call and sets result', async () => {
    mockCheckCompatibilityAPI.mockResolvedValue({ isCompatible: true, issues: [] });

    const components: PCBuilderSelectedState = {
      cpu: { product: { id: 'cpu-1', name: 'CPU', sku: 'SKU', category: 'cpu', price: 100, stock: 1, isActive: true } as never, type: 'cpu' },
      gpu: { product: { id: 'gpu-1', name: 'GPU', sku: 'SKU', category: 'gpu', price: 200, stock: 1, isActive: true } as never, type: 'gpu' },
      ram: [],
      storage: [],
      fan: [],
    };
    renderHook(() => useCompatibilityApi(components));

    // Before debounce (120ms) - not called yet
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(mockCheckCompatibilityAPI).not.toHaveBeenCalled();

    // After debounce - should be called
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(mockCheckCompatibilityAPI).toHaveBeenCalled();
  });

  it('sets error on API failure', async () => {
    mockCheckCompatibilityAPI.mockRejectedValue(new Error('Service unavailable'));

    const components: PCBuilderSelectedState = {
      cpu: { product: { id: 'cpu-1', name: 'CPU', sku: 'SKU', category: 'cpu', price: 100, stock: 1, isActive: true } as never, type: 'cpu' },
      ram: [],
      storage: [],
      fan: [],
    };
    const { result } = renderHook(() => useCompatibilityApi(components));

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.error?.message).toBe('Service unavailable');
  });
});
