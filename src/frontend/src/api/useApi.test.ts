import { describe, it, expect, vi } from 'vitest';

// Mock @tanstack/react-query
const { mockUseQuery, mockUseMutation, mockUseQueryClient } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockUseMutation: vi.fn(),
  mockUseQueryClient: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: mockUseQuery,
  useMutation: mockUseMutation,
  useQueryClient: mockUseQueryClient,
}));

// Mock api module
const { mockApiGet } = vi.hoisted(() => ({
  mockApiGet: vi.fn(),
}));

vi.mock('./index', () => ({
  default: {
    get: mockApiGet,
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  apiClient: {
    get: mockApiGet,
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { useApiQuery, useApiQueryWithParams, useApiMutation, useApiUtils } from './useApi';

describe('api/useApi', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useApiQuery', () => {
    it('calls useQuery with correct queryKey and queryFn', () => {
      mockUseQuery.mockReturnValue({ data: null, isLoading: true, error: null });

      useApiQuery('/products');

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ['/products'],
        queryFn: expect.any(Function),
      });
    });

    it('passes options to useQuery', () => {
      mockUseQuery.mockReturnValue({ data: null, isLoading: false, error: null });

      useApiQuery('/products', { enabled: false, staleTime: 60000 });

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ['/products'],
        queryFn: expect.any(Function),
        enabled: false,
        staleTime: 60000,
      });
    });

    it('queryFn calls api.get and returns response.data', async () => {
      mockApiGet.mockResolvedValue({ data: { products: [] } });
      mockUseQuery.mockClear();
      mockUseQuery.mockImplementation(({ queryFn }) => {
        return { data: null, isLoading: false, error: null };
      });

      useApiQuery('/products');
      const callArgs = mockUseQuery.mock.calls[0][0];
      const queryFn = callArgs.queryFn;

      const result = await queryFn();
      expect(mockApiGet).toHaveBeenCalledWith('/products');
      expect(result).toEqual({ products: [] });
    });
  });

  describe('useApiQueryWithParams', () => {
    it('calls useQuery with url and params in queryKey', () => {
      mockUseQuery.mockReturnValue({ data: null, isLoading: true, error: null });

      useApiQueryWithParams(['/products', { category: 'gpu' }]);

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ['/products', { category: 'gpu' }],
        queryFn: expect.any(Function),
      });
    });

    it('queryFn passes params to api.get', async () => {
      mockApiGet.mockResolvedValue({ data: [] });
      mockUseQuery.mockClear();
      mockUseQuery.mockImplementation(({ queryFn }) => {
        return { data: null, isLoading: false, error: null };
      });

      useApiQueryWithParams(['/products', { category: 'cpu' }]);
      const callArgs = mockUseQuery.mock.calls[0][0];
      const queryFn = callArgs.queryFn;

      await queryFn();
      expect(mockApiGet).toHaveBeenCalledWith('/products', { params: { category: 'cpu' } });
    });

    it('works without params', () => {
      mockUseQuery.mockReturnValue({ data: null, isLoading: true, error: null });

      useApiQueryWithParams(['/products']);

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ['/products', undefined],
        queryFn: expect.any(Function),
      });
    });
  });

  describe('useApiMutation', () => {
    it('calls useMutation with unwrapped response.data', async () => {
      mockUseMutation.mockReturnValue({ mutate: vi.fn(), isLoading: false });

      const mockMutationFn = vi.fn();
      useApiMutation(mockMutationFn);

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationFn: expect.any(Function),
      });

      // Extract and test the mutationFn wrapper
      const wrappedFn = mockUseMutation.mock.calls[0][0].mutationFn;
      mockMutationFn.mockResolvedValueOnce({ data: { id: '1' } });
      const result = await wrappedFn({ name: 'test' });

      expect(mockMutationFn).toHaveBeenCalledWith({ name: 'test' });
      expect(result).toEqual({ id: '1' });
    });

    it('passes options to useMutation', () => {
      mockUseMutation.mockReturnValue({ mutate: vi.fn() });
      const onSuccess = vi.fn();

      useApiMutation(vi.fn(), { onSuccess });

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationFn: expect.any(Function),
        onSuccess,
      });
    });
  });

  describe('useApiUtils', () => {
    it('returns invalidate, prefetch, setQueryData, getQueryData', () => {
      const mockQueryClient = {
        invalidateQueries: vi.fn(),
        prefetchQuery: vi.fn(),
        setQueryData: vi.fn(),
        getQueryData: vi.fn(),
      };
      mockUseQueryClient.mockReturnValue(mockQueryClient);

      const utils = useApiUtils();

      expect(typeof utils.invalidate).toBe('function');
      expect(typeof utils.prefetch).toBe('function');
      expect(typeof utils.setQueryData).toBe('function');
      expect(typeof utils.getQueryData).toBe('function');
    });

    it('invalidate with key calls invalidateQueries with key', async () => {
      const mockQueryClient = {
        invalidateQueries: vi.fn().mockResolvedValue(undefined),
        prefetchQuery: vi.fn(),
        setQueryData: vi.fn(),
        getQueryData: vi.fn(),
      };
      mockUseQueryClient.mockReturnValue(mockQueryClient);

      const utils = useApiUtils();
      await utils.invalidate(['/products']);

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['/products'] });
    });

    it('invalidate without key calls invalidateQueries without args', async () => {
      const mockQueryClient = {
        invalidateQueries: vi.fn().mockResolvedValue(undefined),
        prefetchQuery: vi.fn(),
        setQueryData: vi.fn(),
        getQueryData: vi.fn(),
      };
      mockUseQueryClient.mockReturnValue(mockQueryClient);

      const utils = useApiUtils();
      await utils.invalidate();

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith();
    });

    it('setQueryData calls client.setQueryData', () => {
      const mockQueryClient = {
        invalidateQueries: vi.fn(),
        prefetchQuery: vi.fn(),
        setQueryData: vi.fn(),
        getQueryData: vi.fn(),
      };
      mockUseQueryClient.mockReturnValue(mockQueryClient);

      const utils = useApiUtils();
      utils.setQueryData('/products', [{ id: '1' }]);

      expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(['/products'], [{ id: '1' }]);
    });

    it('getQueryData calls client.getQueryData', () => {
      const mockQueryClient = {
        invalidateQueries: vi.fn(),
        prefetchQuery: vi.fn(),
        setQueryData: vi.fn(),
        getQueryData: vi.fn().mockReturnValue([{ id: '1' }]),
      };
      mockUseQueryClient.mockReturnValue(mockQueryClient);

      const utils = useApiUtils();
      const result = utils.getQueryData('/products');

      expect(mockQueryClient.getQueryData).toHaveBeenCalledWith(['/products']);
      expect(result).toEqual([{ id: '1' }]);
    });
  });
});
