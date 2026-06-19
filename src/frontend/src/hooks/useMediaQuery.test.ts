import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMediaQuery } from './useMediaQuery';

describe('hooks/useMediaQuery', () => {
  let matchMediaSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const listeners: Record<string, Function[]> = {};

    matchMediaSpy = vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn((event: string, cb: Function) => {
        if (!listeners[query]) listeners[query] = [];
        listeners[query].push(cb);
      }),
      removeEventListener: vi.fn((event: string, cb: Function) => {
        if (listeners[query]) {
          listeners[query] = listeners[query].filter((fn) => fn !== cb);
        }
      }),
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(window, 'matchMedia', { value: matchMediaSpy, writable: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false when media query does not match', () => {
    matchMediaSpy.mockReturnValue({ matches: false, media: '(max-width: 767px)', addEventListener: vi.fn(), removeEventListener: vi.fn() });
    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    expect(result.current).toBe(false);
  });

  it('returns true when media query matches', () => {
    matchMediaSpy.mockReturnValue({ matches: true, media: '(min-width: 768px)', addEventListener: vi.fn(), removeEventListener: vi.fn() });
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(true);
  });

  it('updates when media query changes', () => {
    let changeHandler: ((event: MediaQueryListEvent) => void) | undefined;

    matchMediaSpy.mockReturnValue({
      matches: false,
      media: '(max-width: 767px)',
      addEventListener: vi.fn((event: string, cb: any) => { changeHandler = cb; }),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    expect(result.current).toBe(false);

    act(() => {
      changeHandler!({ matches: true } as MediaQueryListEvent);
    });

    expect(result.current).toBe(true);
  });

  it('cleans up event listener on unmount', () => {
    const removeSpy = vi.fn();
    matchMediaSpy.mockReturnValue({ matches: false, media: 'test', addEventListener: vi.fn(), removeEventListener: removeSpy });

    const { unmount } = renderHook(() => useMediaQuery('test'));
    unmount();

    expect(removeSpy).toHaveBeenCalled();
  });
});
