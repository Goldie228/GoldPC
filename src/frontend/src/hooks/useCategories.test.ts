import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockGetCategories = vi.fn();

vi.mock('../api/catalog', () => ({
  catalogApi: {
    getCategories: (...args: any[]) => mockGetCategories(...args),
  },
}));

import { useCategories, categoriesKeys } from './useCategories';

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('hooks/useCategories', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exports correct query keys', () => {
    expect(categoriesKeys.all).toEqual(['categories']);
    expect(categoriesKeys.list()).toEqual(['categories', 'list']);
  });

  it('returns loading state initially', () => {
    mockGetCategories.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('fetches categories successfully', async () => {
    const categories = [{ id: '1', name: 'Laptops', slug: 'laptops' }];
    mockGetCategories.mockResolvedValue(categories);

    const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(categories);
  });

  it('handles error', async () => {
    mockGetCategories.mockRejectedValue(new Error('Fetch failed'));

    const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Fetch failed');
  });
});
