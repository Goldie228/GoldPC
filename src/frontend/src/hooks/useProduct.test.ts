import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockGetProductBySlug = vi.fn();

vi.mock('../api/catalog', () => ({
  catalogApi: {
    getProductBySlug: (...args: any[]) => mockGetProductBySlug(...args),
  },
}));

import { useProduct } from './useProduct';

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('hooks/useProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns loading state initially with slug', () => {
    mockGetProductBySlug.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useProduct('test-slug'), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns idle state when slug is undefined', () => {
    const { result } = renderHook(() => useProduct(undefined), { wrapper: createWrapper() });
    expect(result.current.isPending).toBe(true);
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches product by slug', async () => {
    const product = { id: 'p1', name: 'CPU', slug: 'cpu' };
    mockGetProductBySlug.mockResolvedValue(product);

    const { result } = renderHook(() => useProduct('cpu'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(product);
    expect(mockGetProductBySlug).toHaveBeenCalledWith('cpu');
  });

  it('handles error', async () => {
    mockGetProductBySlug.mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useProduct('bad-slug'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Not found');
  });

  it('can disable query with enabled option', () => {
    const { result } = renderHook(() => useProduct('slug', { enabled: false }), { wrapper: createWrapper() });
    expect(result.current.isPending).toBe(true);
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetProductBySlug).not.toHaveBeenCalled();
  });
});
