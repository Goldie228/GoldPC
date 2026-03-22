import api from './index';
import type { ProductListResponse, GetProductsParams, Product, Category, FilterAttribute, ProductCategory, Manufacturer } from './types';

/** Маппинг frontend category -> backend slug для API */
const FRONTEND_TO_BACKEND_SLUG: Record<ProductCategory, string> = {
  cpu: 'processors',
  gpu: 'gpu',
  motherboard: 'motherboards',
  ram: 'ram',
  storage: 'storage',
  psu: 'psu',
  case: 'cases',
  cooling: 'coolers',
  monitor: 'monitors',
  peripherals: 'periphery',
};

/**
 * API сервиса каталога
 */
export const catalogApi = {
  /**
   * Получить список товаров с пагинацией и фильтрацией
   * specifications и specificationRanges сериализуются в формат specifications[key]=value для ASP.NET binding
   */
  async getProducts(params?: GetProductsParams): Promise<ProductListResponse> {
    const apiParams: Record<string, string | number | boolean | undefined> = {};
    if (!params) {
      const response = await api.get<ProductListResponse>('/catalog/products');
      return response.data;
    }
    if (params.page != null) apiParams.page = params.page;
    if (params.pageSize != null) apiParams.pageSize = params.pageSize;
    if (params.category && FRONTEND_TO_BACKEND_SLUG[params.category]) {
      apiParams.category = FRONTEND_TO_BACKEND_SLUG[params.category];
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
    return response.data;
  },

  /**
   * Получить товар по ID
   */
  async getProduct(productId: string): Promise<Product> {
    const response = await api.get<Product>(`/catalog/products/${productId}`);
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
    filterParams?: { manufacturerIds?: string[]; specifications?: Record<string, string>; specificationRanges?: Record<string, string> }
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

  /**
   * Получить производителей (бренды). При указании category — только те, у кого есть товары в категории.
   */
  async getManufacturers(category?: string): Promise<Manufacturer[]> {
    const params = category ? { category } : {};
    const response = await api.get<{ data?: Manufacturer[] }>('/catalog/manufacturers', { params });
    return response.data?.data ?? [];
  },
};