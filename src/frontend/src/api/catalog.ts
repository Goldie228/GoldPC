import { goldpcApi } from './generated/client';
import api from './index';
import { FRONTEND_TO_BACKEND, CATEGORY_NAME_TO_SLUG } from '@/utils/category-mappings';
import type {
  ProductListResponse,
  GetProductsParams,
  Product,
  Category,
  FilterAttribute,
  FilterFacetAttribute,
  ProductCategory,
  Manufacturer,
  ProductReview,
  ProductReviewsResponse,
  CreateReviewRequest,
  UpdateReviewRequest,
  ProductSummary,
  CategorySpecificationsDto,
} from './types';
import type { GetApiV1CatalogProductsParams } from './generated/model/getApiV1CatalogProductsParams';
export type { ProductSummary, ProductReview, FilterFacetAttribute, GetProductsParams, ProductListResponse } from './types';

// Standalone exports for backwards compatibility (SearchDropdown etc.)
export async function searchProducts(query: string, params?: Omit<GetProductsParams, 'search'>): Promise<ProductListResponse> {
  return catalogApi.searchProducts(query, params);
}

export async function getFeaturedProducts(limit?: number): Promise<ProductSummary[]> {
  return catalogApi.getFeaturedProducts(limit);
}

export async function getProductById(id: string): Promise<Product> {
  return catalogApi.getProduct(id);
}

export async function getProducts(params?: GetProductsParams): Promise<ProductListResponse> {
  return catalogApi.getProducts(params);
}

export async function getCategories(): Promise<Category[]> {
  return catalogApi.getCategories();
}

/**
 * API сервиса каталога
 */
export interface StockCheckRequest {
  productId: string;
  quantity: number;
}

export interface StockCheckResponse {
  productId: string;
  available: boolean;
  availableQuantity: number;
  message?: string;
}

export const catalogApi = {
  /**
   * Проверка наличия товаров на складе
   * (нет сгенерированного эндпоинта — используем apiClient напрямую)
   */
  async checkStock(items: StockCheckRequest[]): Promise<StockCheckResponse[]> {
    const response = await api.post<StockCheckResponse[]>('/catalog/products/check-stock', items);
    return response.data;
  },

  /**
   * Получить товар по ID
   */
  async getProduct(productId: string): Promise<Product> {
    const response = await goldpcApi.getCatalogProductsProductId(productId);
    const data = response.data as unknown as Product;
    if (data && typeof data.category === 'string' && data.category in CATEGORY_NAME_TO_SLUG) {
      data.category = CATEGORY_NAME_TO_SLUG[data.category] as ProductCategory;
    }
    return data;
  },

  /**
   * Получить товар по slug
   */
  async getProductBySlug(slug: string): Promise<Product> {
    const response = await goldpcApi.getCatalogProductsBySlugSlug(slug);
    const data = response.data as unknown as Product;
    if (data && typeof data.category === 'string' && data.category in CATEGORY_NAME_TO_SLUG) {
      data.category = CATEGORY_NAME_TO_SLUG[data.category] as ProductCategory;
    }
    return data;
  },

  /**
   * Получить список товаров с пагинацией и фильтрацией
   * specifications и specificationRanges сериализуются в формат specifications[key]=value для ASP.NET binding
   */
  async getProducts(params?: GetProductsParams): Promise<ProductListResponse> {
    const apiParams: Record<string, string | number | boolean | undefined> = {};
    if (params == null) {
      const response = await goldpcApi.getCatalogProducts();
      const data = response.data as unknown as ProductListResponse;
      if (data?.data && Array.isArray(data.data)) {
        for (const p of data.data) {
          const prod = p as unknown as { category: string };
          if (typeof prod.category === 'string' && prod.category in CATEGORY_NAME_TO_SLUG) {
            (p as unknown as { category: ProductCategory }).category = CATEGORY_NAME_TO_SLUG[prod.category];
          }
        }
      }
      return data;
    }
    if (params.page != null) apiParams.page = params.page;
    if (params.pageSize != null) {
      apiParams.pageSize = params.pageSize;
    } else if (params.category === 'storage') {
      // В категории Накопители 585 товаров, SSD/NVMe на страницах 11+.
      // Увеличиваем pageSize, чтобы все диски попали в первый запрос.
      apiParams.pageSize = 200;
    }
    if (params.category && FRONTEND_TO_BACKEND[params.category]) {
      apiParams.category = FRONTEND_TO_BACKEND[params.category];
    }
    if (params.search) apiParams.search = params.search;
    if (params.priceMin != null && params.priceMin > 0) apiParams.priceMin = params.priceMin;
    if (params.priceMax != null && params.priceMax > 0) apiParams.priceMax = params.priceMax;
    if (params.rating != null && params.rating > 0) apiParams.rating = params.rating;
    if (params.inStock != null) apiParams.inStock = params.inStock;
    if (params.isFeatured != null) apiParams.isFeatured = params.isFeatured;
    if (params.manufacturerId) apiParams.manufacturerId = params.manufacturerId;
    if (params.manufacturerIds?.length) {
      (apiParams as Record<string, unknown>).manufacturerIds = params.manufacturerIds;
    }
    if (params.specifications && Object.keys(params.specifications).length > 0) {
      for (const [key, value] of Object.entries(params.specifications)) {
        if (value === undefined || value === null) continue;
        const str = Array.isArray(value) ? value.join(',') : String(value);
        if (str !== '') apiParams[`specifications[${key}]`] = str;
      }
    }
    if (params.specificationRanges && Object.keys(params.specificationRanges).length > 0) {
      for (const [key, value] of Object.entries(params.specificationRanges)) {
        if (value) apiParams[`specificationRanges[${key}]`] = value;
      }
    }
    if (params.sortBy) apiParams.sortBy = params.sortBy;
    if (params.sortOrder) apiParams.sortOrder = params.sortOrder;

    const paramsSerializer = (params: Record<string, unknown>) => {
      const pairs: [string, string][] = [];
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        if (Array.isArray(value)) {
          value.forEach((v) => pairs.push([key, String(v)]));
        } else {
          pairs.push([key, String(value)]);
        }
      }
      return new URLSearchParams(pairs).toString();
    };

    const response = await goldpcApi.getCatalogProducts(
      apiParams as unknown as GetApiV1CatalogProductsParams,
      { paramsSerializer },
    );
    const data = response.data as unknown as ProductListResponse;
    if (data?.data && Array.isArray(data.data)) {
      for (const p of data.data) {
        const prod = p as unknown as { category: string };
        if (typeof prod.category === 'string' && prod.category in CATEGORY_NAME_TO_SLUG) {
          (p as unknown as { category: ProductCategory }).category = CATEGORY_NAME_TO_SLUG[prod.category];
        }
      }
    }
    return data;
  },

  /**
   * Получить категории (дерево)
   */
  async getCategories(): Promise<Category[]> {
    const response = await goldpcApi.getCatalogCategories();
    const data = response.data as unknown as { data?: Category[]; categories?: Category[] } | Category[];
    if (Array.isArray(data)) {
      return data;
    }
    return (data as { data?: Category[]; categories?: Category[] })?.data || (data as { categories?: Category[] })?.categories || [];
  },

  /**
   * Получить атрибуты фильтра для категории
   */
  async getFilterAttributes(
    categorySlug: string,
    filterParams?: { manufacturerIds?: string[]; specifications?: Record<string, string>; specificationRanges?: Record<string, string>; inStock?: boolean },
  ): Promise<FilterAttribute[]> {
    const apiParams: Record<string, string | number | boolean> = {};
    if (filterParams?.manufacturerIds?.length) {
      (apiParams as Record<string, unknown>).manufacturerIds = filterParams.manufacturerIds;
    }
    if (filterParams?.specifications && Object.keys(filterParams.specifications).length > 0) {
      for (const [key, value] of Object.entries(filterParams.specifications)) {
        if (value != null && value !== '') apiParams[`specifications[${key}]`] = value;
      }
    }
    if (filterParams?.specificationRanges && Object.keys(filterParams.specificationRanges).length > 0) {
      for (const [key, value] of Object.entries(filterParams.specificationRanges)) {
        if (value) apiParams[`specificationRanges[${key}]`] = value;
      }
    }
    if (filterParams?.inStock != null) apiParams.inStock = filterParams.inStock;
    const paramsSerializer = (params: Record<string, unknown>) => {
      const pairs: [string, string][] = [];
      for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null) continue;
        if (Array.isArray(v)) v.forEach((x) => pairs.push([k, String(x)]));
        else pairs.push([k, String(v)]);
      }
      return new URLSearchParams(pairs).toString();
    };
    const response = await goldpcApi.getCatalogCategoriesSlugFilterAttributes(
      categorySlug,
      Object.keys(apiParams).length > 0 ? apiParams as never : undefined,
      { paramsSerializer },
    );
    const data = response.data as unknown as { data?: FilterAttribute[] } | FilterAttribute[];
    return Array.isArray(data) ? data : (data?.data ?? []);
  },

  /**
   * Получить facets фильтра для категории
   */
  async getFilterFacets(
    categorySlug: string,
    filterParams?: { manufacturerIds?: string[]; specifications?: Record<string, string>; specificationRanges?: Record<string, string>; inStock?: boolean },
  ): Promise<FilterFacetAttribute[]> {
    const apiParams: Record<string, string | number | boolean> = {};
    if (filterParams?.manufacturerIds?.length) {
      (apiParams as Record<string, unknown>).manufacturerIds = filterParams.manufacturerIds;
    }
    if (filterParams?.specifications && Object.keys(filterParams.specifications).length > 0) {
      for (const [key, value] of Object.entries(filterParams.specifications)) {
        if (value != null && value !== '') apiParams[`specifications[${key}]`] = value;
      }
    }
    if (filterParams?.specificationRanges && Object.keys(filterParams.specificationRanges).length > 0) {
      for (const [key, value] of Object.entries(filterParams.specificationRanges)) {
        if (value) apiParams[`specificationRanges[${key}]`] = value;
      }
    }
    if (filterParams?.inStock != null) apiParams.inStock = filterParams.inStock;
    const paramsSerializer = (params: Record<string, unknown>) => {
      const pairs: [string, string][] = [];
      for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null) continue;
        if (Array.isArray(v)) v.forEach((x) => pairs.push([k, String(x)]));
        else pairs.push([k, String(v)]);
      }
      return new URLSearchParams(pairs).toString();
    };
    const response = await goldpcApi.getCatalogCategoriesSlugFilterFacets(
      categorySlug,
      Object.keys(apiParams).length > 0 ? apiParams as never : undefined,
      { paramsSerializer },
    );
    return (response.data as unknown as { data?: FilterFacetAttribute[] })?.data ?? [];
  },

  /**
   * Получить производителей (бренды). При указании category — только те, у кого есть товары в категории.
   */
  async getManufacturers(category?: string): Promise<Manufacturer[]> {
    const params = category ? { category } : {};
    const response = await goldpcApi.getCatalogManufacturers(
      Object.keys(params).length > 0 ? params as never : undefined,
    );
    const data = response.data as unknown as { data?: Manufacturer[] } | Manufacturer[];
    if (Array.isArray(data)) {
      return data;
    }
    return data?.data ?? [];
  },

  /**
   * Поиск товаров по названию (обёртка над getProducts)
   */
  async searchProducts(query: string, params?: Omit<GetProductsParams, 'search'>): Promise<ProductListResponse> {
    return catalogApi.getProducts({ ...params, search: query } as GetProductsParams);
  },

  /**
   * Получить популярные товары
   */
  async getFeaturedProducts(limit?: number): Promise<ProductSummary[]> {
    const response = await catalogApi.getProducts({ isFeatured: true, pageSize: limit ?? 10 } as GetProductsParams);
    return response.data ?? [];
  },

  /**
   * Получить отзывы о товаре
   */
  async getProductReviews(productId: string, page: number = 1, pageSize: number = 5): Promise<ProductReviewsResponse> {
    const response = await goldpcApi.getCatalogProductsProductIdReviews(productId, { page, pageSize });
    return response.data as unknown as ProductReviewsResponse;
  },

  /**
   * Добавить отзыв о товаре
   */
  async addProductReview(productId: string, payload: CreateReviewRequest): Promise<ProductReview> {
    const response = await goldpcApi.postCatalogProductsProductIdReviews(productId, payload);
    return response.data as unknown as ProductReview;
  },

  /**
   * Обновить отзыв о товаре
   */
  async updateProductReview(productId: string, reviewId: string, payload: UpdateReviewRequest): Promise<ProductReview> {
    const response = await goldpcApi.putCatalogProductsProductIdReviewsReviewId(productId, reviewId, payload);
    return response.data as unknown as ProductReview;
  },

  /**
   * Удалить отзыв о товаре
   */
  async deleteProductReview(productId: string, reviewId: string): Promise<void> {
    await goldpcApi.deleteCatalogProductsProductIdReviewsReviewId(productId, reviewId);
  },

  /**
   * Переключить helpful для отзыва
   */
  async toggleHelpful(productId: string, reviewId: string): Promise<void> {
    await goldpcApi.patchCatalogProductsProductIdReviewsReviewIdHelpful(productId, reviewId);
  },

  /**
   * Получить мета-данные характеристик для категории (локализованные названия из БД)
   * (нет сгенерированного эндпоинта — используем apiClient напрямую)
   */
  async getCategorySpecifications(categoryId: string): Promise<CategorySpecificationsDto> {
    const response = await api.get<CategorySpecificationsDto>(`/catalog/specifications/by-category/${categoryId}`);
    return response.data;
  },
};
