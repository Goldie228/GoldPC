import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockGetProduct = vi.fn();
const mockGetProducts = vi.fn();
const mockGetProductsByIds = vi.fn();
const mockGetProductReviews = vi.fn();
const mockAddProductReview = vi.fn();
const mockUpdateProductReview = vi.fn();
const mockDeleteProductReview = vi.fn();
const mockToggleHelpful = vi.fn();
const mockGetFilterFacets = vi.fn();

vi.mock('../api/catalog', () => ({
  catalogApi: {
    getProduct: (...args: any[]) => mockGetProduct(...args),
    getProducts: (...args: any[]) => mockGetProducts(...args),
    getProductsByIds: (...args: any[]) => mockGetProductsByIds(...args),
    getProductReviews: (...args: any[]) => mockGetProductReviews(...args),
    addProductReview: (...args: any[]) => mockAddProductReview(...args),
    updateProductReview: (...args: any[]) => mockUpdateProductReview(...args),
    deleteProductReview: (...args: any[]) => mockDeleteProductReview(...args),
    toggleHelpful: (...args: any[]) => mockToggleHelpful(...args),
    getFilterFacets: (...args: any[]) => mockGetFilterFacets(...args),
  },
}));

import { useCatalog } from './useCatalog';

describe('hooks/useCatalog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useCatalog());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('getProduct fetches product by id', async () => {
    const product = { id: 'p1', name: 'Test' } as any;
    mockGetProduct.mockResolvedValue(product);

    const { result } = renderHook(() => useCatalog());
    let res: any;
    await act(async () => {
      res = await result.current.getProduct('p1');
    });

    expect(res).toEqual(product);
    expect(mockGetProduct).toHaveBeenCalledWith('p1');
  });

  it('getProduct sets error on failure', async () => {
    mockGetProduct.mockRejectedValue(new Error('Not found'));
    const { result } = renderHook(() => useCatalog());

    await act(async () => {
      const res = await result.current.getProduct('bad');
      expect(res).toBeNull();
    });
    expect(result.current.error?.message).toBe('Not found');
  });

  it('getProducts calls API with params', async () => {
    const response = { items: [], totalCount: 0 } as any;
    mockGetProducts.mockResolvedValue(response);

    const { result } = renderHook(() => useCatalog());
    let res: any;
    await act(async () => {
      res = await result.current.getProducts({ page: 1 });
    });

    expect(res).toEqual(response);
  });

  it('addProductReview posts review', async () => {
    const review = { id: 'r1', rating: 5 } as any;
    mockAddProductReview.mockResolvedValue(review);

    const { result } = renderHook(() => useCatalog());
    let res: any;
    await act(async () => {
      res = await result.current.addProductReview('p1', { rating: 5, comment: 'Great' });
    });

    expect(res).toEqual(review);
  });

  it('deleteProductReview returns boolean', async () => {
    mockDeleteProductReview.mockResolvedValue(true);
    const { result } = renderHook(() => useCatalog());

    await act(async () => {
      const res = await result.current.deleteProductReview('p1', 'r1');
      expect(res).toBe(true);
    });
  });

  it('toggleHelpful calls API', async () => {
    mockToggleHelpful.mockResolvedValue({ helpful: 1 });
    const { result } = renderHook(() => useCatalog());

    await act(async () => {
      const res = await result.current.toggleHelpful('p1', 'r1');
      expect(res).toEqual({ helpful: 1 });
    });
  });

  it('getFilterFacets calls API', async () => {
    const facets = [{ name: 'Brand', values: [] }] as any[];
    mockGetFilterFacets.mockResolvedValue(facets);
    const { result } = renderHook(() => useCatalog());

    await act(async () => {
      const res = await result.current.getFilterFacets('laptops');
      expect(res).toEqual(facets);
    });
  });
});
