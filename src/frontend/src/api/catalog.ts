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
   */
  async checkStock(items: StockCheckRequest[]): Promise<StockCheckResponse[]> {
    const response = await api.post<StockCheckResponse[]>('/catalog/products/check-stock', items);
    return response.data;
  },

  /**
   * Получить список товаров с пагинацией и фильтрацией
   * specifications и specificationRanges сериализуются в формат specifications[key]=value для ASP.NET binding
   */
  async getProducts(params?: GetProductsParams): Promise<ProductListResponse> {
    const apiParams: Record<string, string | number | boolean | undefined> = {};
    if (params == null) {
      const response = await api.get<ProductListResponse>('/catalog/products');
      const data = response.data;
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
    if (params.sortBy) apiParams.sortBy = params.sortBy;
    if (params.sortOrder) apiParams.sortOrder = params.sortOrder;
    if (params.rating != null && params.rating > 0) apiParams.rating = params.rating;
    if (params.inStock != null) apiParams.inStock = params.inStock;
    if (params.isFeatured != null) apiParams.isFeatured = params.isFeatured;
    if (params.manufacturerId) apiParams.manufacturerId = params.manufacturerId;
    if (params.manufacturerIds?.length) {
      (apiParams as Record<string, unknown>).manufacturerIds = params.manufacturerIds;
    }

    // Flatten specifications and specificationRanges for ASP.NET model binding
    if (params.specifications && Object.keys(params.specifications).length > 0) {
      for (const [key, value] of Object.entries(params.specifications)) {
        if (value === undefined || value === null) continue;
        const str = Array.isArray(value) ? value.join(',') : String(value);
        if (str !== '') apiParams[`specifications[${key}]`] = str;
      }
    }
    if (params.specificationRanges && Object.keys(params.specificationRanges).length > 0) {
      for (const [key, value] of Object.entries(params.specificationRanges)) {
        if (value) {
          apiParams[`specificationRanges[${key}]`] = value;
        }
      }
    }

    // ASP.NET model binder ожидает manufacturerIds=id1&manufacturerIds=id2 (без [])
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

    const response = await api.get<ProductListResponse>('/catalog/products', {
      params: apiParams as Record<string, unknown>,
      paramsSerializer,
    });
    const data = response.data;
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
   * Получить товар по ID
   */
 async getProduct(productId: string): Promise<Product> {
    const response = await api.get<Product>(`/catalog/products/${productId}`);
    const p = response.data;
    if (p != null) {
      const prod = p as unknown as { category: string };
      if (typeof prod.category === 'string' && prod.category in CATEGORY_NAME_TO_SLUG) {
        (p as unknown as { category: ProductCategory }).category = CATEGORY_NAME_TO_SLUG[prod.category];
      }
    }
    return p;
  },

  async getProductBySlug(slug: string): Promise<Product> {
    const response = await api.get<Product>(`/catalog/products/by-slug/${slug}`);
    const p = response.data;
    if (p != null) {
      const prod = p as unknown as { category: string };
      if (typeof prod.category === 'string' && prod.category in CATEGORY_NAME_TO_SLUG) {
        (p as unknown as { category: ProductCategory }).category = CATEGORY_NAME_TO_SLUG[prod.category];
      }
    }
    return p;
  },

  /**
   * Получить отзывы товара
   */
  async getProductReviews(productId: string, page = 1, pageSize = 20): Promise<ProductReviewsResponse> {
    const response = await api.get<ProductReviewsResponse>(`/catalog/products/${productId}/reviews`, {
      params: { page, pageSize },
    });
    return response.data;
  },

  /**
   * Добавить отзыв к товару
   */
  async addProductReview(productId: string, payload: CreateReviewRequest): Promise<ProductReview> {
    const response = await api.post<ProductReview>(`/catalog/products/${productId}/reviews`, payload);
    return response.data;
  },

  /**
   * Обновить отзыв
   */
  async updateProductReview(productId: string, reviewId: string, payload: UpdateReviewRequest): Promise<ProductReview> {
    const response = await api.put<ProductReview>(`/catalog/products/${productId}/reviews/${reviewId}`, payload);
    return response.data;
  },

  /**
   * Удалить отзыв
   */
  async deleteProductReview(productId: string, reviewId: string): Promise<void> {
    await api.delete(`/catalog/products/${productId}/reviews/${reviewId}`);
  },

  /**
   * Отметить отзыв как полезный
   */
  async toggleHelpful(productId: string, reviewId: string): Promise<{ helpful: number }> {
    const response = await api.patch<{ helpful: number }>(`/catalog/products/${productId}/reviews/${reviewId}/helpful`);
    return response.data;
  },

  /**
   * Получить дерево категорий
   */
  async getCategories(): Promise<Category[]> {
    const response = await api.get<{ data?: Category[]; categories?: Category[] } | Category[]>('/catalog/categories');
    // Поддержка разных форматов ответа: { data: [...] }, { categories: [...] } или прямой массив
    const data = response.data;
    if (Array.isArray(data)) {
      return data;
    }
    return data?.data || data?.categories || [];
  },

  /**
   * Получить атрибуты фильтрации для категории (VRAM, socket, chipset и т.д.)
   * При передаче filterParams возвращаются только значения из отфильтрованных товаров (напр. при Intel — без AM4/AM5)
   */
  async getFilterAttributes(
    categorySlug: string,
    filterParams?: { manufacturerIds?: string[]; specifications?: Record<string, string>; specificationRanges?: Record<string, string>; inStock?: boolean }
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
    const response = await api.get<{ data?: FilterAttribute[] }>(
      `/catalog/categories/${categorySlug}/filter-attributes`,
      Object.keys(apiParams).length > 0 ? { params: apiParams as Record<string, unknown>, paramsSerializer } : {}
    );
    return response.data?.data ?? [];
  },

  async getFilterFacets(
    categorySlug: string,
    filterParams?: { manufacturerIds?: string[]; specifications?: Record<string, string>; specificationRanges?: Record<string, string>; inStock?: boolean }
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
    const response = await api.get<{ data?: FilterFacetAttribute[] }>(
      `/catalog/categories/${categorySlug}/filter-facets`,
      Object.keys(apiParams).length > 0 ? { params: apiParams as Record<string, unknown>, paramsSerializer } : {}
    );
    return response.data?.data ?? [];
  },

  /**
   * Получить производителей (бренды). При указании category — только те, у кого есть товары в категории.
   */
  async getManufacturers(category?: string): Promise<Manufacturer[]> {
    const params = category ? { category } : {};
    const response = await api.get<{ data?: Manufacturer[] } | Manufacturer[]>('/catalog/manufacturers', { params });
    const data = response.data;
    if (Array.isArray(data)) {
      return data;
    }
    return data?.data ?? [];
  },

  /**
   * Поиск товаров по названию (обёртка над getProducts)
   */
  async searchProducts(query: string, params?: Omit<GetProductsParams, 'search'>): Promise<ProductListResponse> {
    return this.getProducts({ ...params, search: query } as GetProductsParams);
  },

  /**
   * Получить популярные товары
   */
  async getFeaturedProducts(limit?: number): Promise<ProductSummary[]> {
    const response = await this.getProducts({ isFeatured: true, pageSize: limit ?? 10 } as GetProductsParams);
    return response.data ?? [];
  },

  /**
   * Получить мета-данные характеристик для категории (локализованные названия из БД)
   */
  async getCategorySpecifications(categoryId: string): Promise<CategorySpecificationsDto> {
    const response = await api.get<CategorySpecificationsDto>(`/catalog/specifications/by-category/${categoryId}`);
    return response.data;
  },
};