import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockIsInComparison = vi.fn(() => false);
const mockToggleComparison = vi.fn(() => ({ success: true }));
const mockAddItem = vi.fn(() => ({ success: true }));
const mockRemoveItem = vi.fn();
const mockClearComparison = vi.fn();
const mockGetCount = vi.fn(() => 0);
const mockCanAdd = vi.fn(() => true);
const mockGetItems = vi.fn(() => []);

vi.mock('../store/comparisonStore', () => ({
  useComparisonStore: vi.fn((selector: any) => {
    const state = {
      items: [],
      isInComparison: mockIsInComparison,
      toggleComparison: mockToggleComparison,
      addItem: mockAddItem,
      removeItem: mockRemoveItem,
      clearComparison: mockClearComparison,
      getCount: mockGetCount,
      canAdd: mockCanAdd,
      getItems: mockGetItems,
    };
    return selector(state);
  }),
}));

import { useComparison } from './useComparison';

describe('hooks/useComparison', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useComparison());
    expect(result.current.items).toEqual([]);
  });

  it('isInComparison delegates to store', () => {
    mockIsInComparison.mockReturnValue(true);
    const { result } = renderHook(() => useComparison());
    expect(result.current.isInComparison('p1')).toBe(true);
    expect(mockIsInComparison).toHaveBeenCalledWith('p1');
  });

  it('toggleComparison delegates to store', () => {
    const { result } = renderHook(() => useComparison());
    const res = result.current.toggleComparison('p1', 'cpu');
    expect(mockToggleComparison).toHaveBeenCalledWith('p1', 'cpu');
    expect(res).toEqual({ success: true });
  });

  it('addItem delegates to store', () => {
    const { result } = renderHook(() => useComparison());
    result.current.addItem('p1', 'gpu');
    expect(mockAddItem).toHaveBeenCalledWith('p1', 'gpu');
  });

  it('removeItem delegates to store', () => {
    const { result } = renderHook(() => useComparison());
    result.current.removeItem('p1');
    expect(mockRemoveItem).toHaveBeenCalledWith('p1');
  });

  it('clearComparison delegates to store', () => {
    const { result } = renderHook(() => useComparison());
    result.current.clearComparison();
    expect(mockClearComparison).toHaveBeenCalled();
  });

  it('getCount delegates to store', () => {
    mockGetCount.mockReturnValue(3);
    const { result } = renderHook(() => useComparison());
    expect(result.current.getCount()).toBe(3);
  });

  it('canAdd delegates to store', () => {
    const { result } = renderHook(() => useComparison());
    expect(result.current.canAdd('cpu')).toBe(true);
    expect(mockCanAdd).toHaveBeenCalledWith('cpu');
  });

  it('getItems delegates to store', () => {
    mockGetItems.mockReturnValue(['p1', 'p2']);
    const { result } = renderHook(() => useComparison());
    expect(result.current.getItems()).toEqual(['p1', 'p2']);
  });
});
