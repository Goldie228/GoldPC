import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockApiGet = vi.fn();

vi.mock('../api/client', () => ({
  default: {
    get: (...args: any[]) => mockApiGet(...args),
  },
}));

import { useServices, servicesKeys } from './useServices';

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('hooks/useServices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exports correct query keys', () => {
    expect(servicesKeys.all).toEqual(['services']);
    expect(servicesKeys.lists()).toEqual(['services', 'list']);
  });

  it('returns loading state initially', () => {
    mockApiGet.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useServices(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('fetches services successfully', async () => {
    mockApiGet.mockResolvedValue({ data: [{ id: 's1', name: 'Repair', slug: 'repair', description: 'Desc', basePrice: 50, estimatedDurationMinutes: 60 }] });

    const { result } = renderHook(() => useServices(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
    expect(result.current.data!.data).toHaveLength(1);
  });

  it('handles error', async () => {
    mockApiGet.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useServices(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Network error');
  });
});
