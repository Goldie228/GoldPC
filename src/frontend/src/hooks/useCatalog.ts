import { useState, useCallback } from 'react';
import { catalogApi, type ProductSummary, type ProductReview, type FilterFacetAttribute, type GetProductsParams, type ProductListResponse } from '../api/catalog';

export interface UseCatalogReturn {
  loading: boolean;
  error: Error | null;
  getProduct: (id: string) => Promise<ProductSummary | null>;
  getProducts: (params?: GetProductsParams) => Promise<ProductListResponse | null>;
  getProductsByIds: (ids: string[]) => Promise<ProductSummary[]>;
  getProductReviews: (productId: string, page?: number, pageSize?: number) => Promise<{ data: ProductReview[] } | null>;
  addProductReview: (productId: string, data: { rating: number; comment: string; pros?: string; cons?: string }) => Promise<ProductReview | null>;
  getFilterFacets: (categorySlug: string, filterParams?: { manufacturerIds?: string[]; specifications?: Record<string, string>; specificationRanges?: Record<string, string>; inStock?: boolean }) => Promise<FilterFacetAttribute[] | null>;
}

export function useCatalog(): UseCatalogReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getProduct = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      return await catalogApi.getProduct(id);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to fetch product');
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getProducts = useCallback(async (params?: GetProductsParams) => {
    setLoading(true);
    setError(null);
    try {
      return await catalogApi.getProducts(params);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to fetch products');
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getProductsByIds = useCallback(async (ids: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled(ids.map((id) => catalogApi.getProduct(id)));
      const loaded = results
        .filter((r): r is PromiseFulfilledResult<ProductSummary> => r.status === 'fulfilled')
        .map((r) => r.value);
      return loaded;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to fetch products');
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getProductReviews = useCallback(async (productId: string, page = 1, pageSize = 20) => {
    setLoading(true);
    setError(null);
    try {
      return await catalogApi.getProductReviews(productId, page, pageSize);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to fetch reviews');
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const addProductReview = useCallback(async (productId: string, data: { rating: number; comment: string; pros?: string; cons?: string }) => {
    setLoading(true);
    setError(null);
    try {
      return await catalogApi.addProductReview(productId, data);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to add review');
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getFilterFacets = useCallback(async (categorySlug: string, filterParams?: { manufacturerIds?: string[]; specifications?: Record<string, string>; specificationRanges?: Record<string, string>; inStock?: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      return await catalogApi.getFilterFacets(categorySlug, filterParams);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to fetch filter facets');
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getProduct,
    getProducts,
    getProductsByIds,
    getProductReviews,
    addProductReview,
    getFilterFacets,
  };
}

export default useCatalog;