import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockGetProducts = vi.fn();

vi.mock('../api/catalog', () => ({
  catalogApi: {
    getProducts: (...args: any[]) => mockGetProducts(...args),
  },
}));

import { useProducts, productsKeys } from './useProducts';

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('hooks/useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports correct query keys', () => {
    expect(productsKeys.all).toEqual(['products']);
    expect(productsKeys.lists()).toEqual(['products', 'list']);
  });

  it('returns loading state initially', () => {
    mockGetProducts.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useProducts({ page: 1, pageSize: 10 }), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('fetches products successfully', async () => {
    const response = { items: [{ id: 'p1', name: 'Test' }], totalCount: 1 };
    mockGetProducts.mockResolvedValue(response);

    const { result } = renderHook(() => useProducts({ page: 1, pageSize: 10 }), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(response);
    expect(mockGetProducts).toHaveBeenCalledWith({ page: 1, pageSize: 10 });
  });

  it('handles error', async () => {
    mockGetProducts.mockRejectedValue(new Error('API error'));

    const { result } = renderHook(() => useProducts({ page: 1 }), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('API error');
  });
});
