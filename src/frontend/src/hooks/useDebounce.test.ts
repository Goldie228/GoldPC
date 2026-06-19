import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('hooks/useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('does not update value before delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 500 } }
    );

    rerender({ value: 'b', delay: 500 });
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toBe('a');
  });

  it('updates value after delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 300 } }
    );

    rerender({ value: 'b', delay: 300 });
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe('b');
  });

  it('resets timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 300 } }
    );

    rerender({ value: 'b', delay: 300 });
    act(() => { vi.advanceTimersByTime(200); });
    rerender({ value: 'c', delay: 300 });
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toBe('a');

    act(() => { vi.advanceTimersByTime(100); });
    expect(result.current).toBe('c');
  });

  it('works with default delay of 300ms', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'x' } }
    );

    rerender({ value: 'y' });
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe('y');
  });
});
