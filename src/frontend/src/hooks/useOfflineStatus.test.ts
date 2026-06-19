import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOfflineStatus } from './useOfflineStatus';

describe('hooks/useOfflineStatus', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns online status by default', () => {
    const { result } = renderHook(() => useOfflineStatus());
    expect(result.current.isOnline).toBe(true);
    expect(result.current.isOffline).toBe(false);
  });

  it('returns offline when navigator.onLine is false', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });

    const { result } = renderHook(() => useOfflineStatus());
    expect(result.current.isOffline).toBe(true);
    expect(result.current.isOnline).toBe(false);
  });

  it('responds to offline event', () => {
    const { result } = renderHook(() => useOfflineStatus());

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOffline).toBe(true);
    expect(result.current.isOnline).toBe(false);
  });

  it('responds to online event', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });

    const { result } = renderHook(() => useOfflineStatus());
    expect(result.current.isOffline).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOffline).toBe(false);
    expect(result.current.isOnline).toBe(true);
  });

  it('cleans up event listeners on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useOfflineStatus());
    unmount();

    expect(removeSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('offline', expect.any(Function));
  });
});
