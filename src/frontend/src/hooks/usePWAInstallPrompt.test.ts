import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePWAInstallPrompt } from './usePWAInstallPrompt';

describe('hooks/usePWAInstallPrompt', () => {
  let capturedHandlers: Record<string, Function> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    capturedHandlers = {};

    // Define matchMedia since jsdom doesn't have it
    if (!window.matchMedia) {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: false,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });
    }

    // Mock addEventListener to capture beforeinstallprompt
    vi.spyOn(window, 'addEventListener').mockImplementation((event: string, handler: any, options?: any) => {
      capturedHandlers[event] = handler;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns initial state with isInstallable false', () => {
    const { result } = renderHook(() => usePWAInstallPrompt());
    expect(result.current.isInstallable).toBe(false);
  });

  it('returns isInstalled as false by default', () => {
    const { result } = renderHook(() => usePWAInstallPrompt());
    expect(result.current.isInstalled).toBe(false);
  });

  it('promptInstall returns false when no prompt available', async () => {
    const { result } = renderHook(() => usePWAInstallPrompt());

    let res: boolean = false;
    await act(async () => {
      res = await result.current.promptInstall();
    });

    expect(res).toBe(false);
  });

  it('captures beforeinstallprompt event', () => {
    const { result } = renderHook(() => usePWAInstallPrompt());

    const fakeEvent = { preventDefault: vi.fn() };

    act(() => {
      if (capturedHandlers['beforeinstallprompt']) {
        capturedHandlers['beforeinstallprompt'](fakeEvent);
      }
    });

    expect(result.current.isInstallable).toBe(true);
  });

  it('promptInstall calls prompt on deferred event', async () => {
    const fakePrompt = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => usePWAInstallPrompt());

    act(() => {
      if (capturedHandlers['beforeinstallprompt']) {
        capturedHandlers['beforeinstallprompt']({
          preventDefault: vi.fn(),
          prompt: fakePrompt,
          userChoice: Promise.resolve({ outcome: 'accepted' }),
        });
      }
    });

    let res: boolean = false;
    await act(async () => {
      res = await result.current.promptInstall();
    });

    expect(fakePrompt).toHaveBeenCalled();
    expect(res).toBe(true);
    expect(result.current.isInstalled).toBe(true);
  });
});
