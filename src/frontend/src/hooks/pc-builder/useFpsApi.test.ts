import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFpsApi } from './useFpsApi';

const mockCalculateFpsApi = vi.fn();

vi.mock('@/api/pcBuilderService', () => ({
  calculateFpsApi: (...args: any[]) => mockCalculateFpsApi(...args),
}));

vi.mock('@/features/pc-builder/logic/constants', () => ({
  FPS_DEBOUNCE_MS: 300,
}));

describe('hooks/pc-builder/useFpsApi', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useFpsApi({ ram: [], storage: [], fan: [] } as any));
    expect(result.current.fpsData).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('does not call API when no cpu or gpu', () => {
    renderHook(() => useFpsApi({ ram: [], storage: [], fan: [] } as any));

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(mockCalculateFpsApi).not.toHaveBeenCalled();
  });

  it('debounces API call with valid components', async () => {
    mockCalculateFpsApi.mockResolvedValue({ fps: 120 });

    const components = {
      cpu: { product: { id: 'cpu-1' } },
      gpu: { product: { id: 'gpu-1' } },
      ram: [],
      storage: [],
      fan: [],
    } as any;

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

    const components = {
      cpu: { product: { id: 'cpu-1' } },
      gpu: { product: { id: 'gpu-1' } },
      ram: [],
      storage: [],
      fan: [],
    } as any;

    const { result } = renderHook(() => useFpsApi(components));

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.error?.message).toBe('Unavailable');
  });
});
