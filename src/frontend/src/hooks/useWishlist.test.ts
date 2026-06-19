import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockAddItem = vi.fn();
const mockRemoveItem = vi.fn();
const mockClearWishlist = vi.fn();
const mockToggleWishlist = vi.fn();
const mockIsInWishlist = vi.fn(() => false);
const mockGetCount = vi.fn(() => 0);
const mockSyncWithServer = vi.fn().mockResolvedValue(undefined);

vi.mock('../store/wishlistStore', () => ({
  useWishlistStore: vi.fn((selector: any) => {
    const state = {
      items: [],
      addItem: mockAddItem,
      removeItem: mockRemoveItem,
      clearWishlist: mockClearWishlist,
      toggleWishlist: mockToggleWishlist,
      isInWishlist: mockIsInWishlist,
      getCount: mockGetCount,
      syncWithServer: mockSyncWithServer,
    };
    return selector(state);
  }),
}));

vi.mock('../api/client', () => ({
  default: { defaults: { headers: { common: {} } } },
}));

import { useWishlist } from './useWishlist';

describe('hooks/useWishlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state from store', () => {
    const { result } = renderHook(() => useWishlist());
    expect(result.current.items).toEqual([]);
  });

  it('addItem calls store', () => {
    const { result } = renderHook(() => useWishlist());
    act(() => {
      result.current.addItem('p1');
    });
    expect(mockAddItem).toHaveBeenCalledWith('p1');
  });

  it('removeItem calls store', () => {
    const { result } = renderHook(() => useWishlist());
    act(() => {
      result.current.removeItem('p1');
    });
    expect(mockRemoveItem).toHaveBeenCalledWith('p1');
  });

  it('clearWishlist calls store', () => {
    const { result } = renderHook(() => useWishlist());
    act(() => {
      result.current.clearWishlist();
    });
    expect(mockClearWishlist).toHaveBeenCalled();
  });

  it('toggleWishlist calls store', () => {
    const { result } = renderHook(() => useWishlist());
    act(() => {
      result.current.toggleWishlist('p1');
    });
    expect(mockToggleWishlist).toHaveBeenCalledWith('p1');
  });

  it('isInWishlist delegates to store', () => {
    mockIsInWishlist.mockReturnValue(true);
    const { result } = renderHook(() => useWishlist());
    expect(result.current.isInWishlist('p1')).toBe(true);
    expect(mockIsInWishlist).toHaveBeenCalledWith('p1');
  });

  it('getCount delegates to store', () => {
    mockGetCount.mockReturnValue(3);
    const { result } = renderHook(() => useWishlist());
    expect(result.current.getCount()).toBe(3);
  });

  it('syncWithServer calls store', async () => {
    const { result } = renderHook(() => useWishlist());
    await act(async () => {
      await result.current.syncWithServer();
    });
    expect(mockSyncWithServer).toHaveBeenCalled();
  });
});
