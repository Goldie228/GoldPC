import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockShowToast = vi.fn();
const mockRemoveToast = vi.fn();
const mockClearToasts = vi.fn();

vi.mock('../store/toastStore', () => ({
  useToastStore: vi.fn((selector: any) => {
    const state = {
      toasts: [],
      showToast: mockShowToast,
      removeToast: mockRemoveToast,
      clearToasts: mockClearToasts,
    };
    return selector(state);
  }),
}));

import { useToast } from './useToast';

describe('hooks/useToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns default state', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it('showToast calls store.showToast', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.showToast('Hello', 'success');
    });
    expect(mockShowToast).toHaveBeenCalledWith('Hello', 'success');
  });

  it('showToast with duration passes duration to store', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.showToast('Warning', 'warning', 3000);
    });
    expect(mockShowToast).toHaveBeenCalledWith('Warning', 'warning', 3000);
  });

  it('removeToast delegates to store', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.removeToast('toast-1');
    });
    expect(mockRemoveToast).toHaveBeenCalledWith('toast-1');
  });

  it('clearToasts delegates to store', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.clearToasts();
    });
    expect(mockClearToasts).toHaveBeenCalled();
  });
});
