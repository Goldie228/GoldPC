import api from './index';
import type { ProductListResponse, GetProductsParams, Product, Category, FilterAttribute, ProductCategory } from './types';

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
   */
  async getProducts(params?: GetProductsParams): Promise<ProductListResponse> {
    const apiParams: Record<string, unknown> = params ? { ...params } : {};
    if (params?.category && FRONTEND_TO_BACKEND_SLUG[params.category]) {
      apiParams.category = FRONTEND_TO_BACKEND_SLUG[params.category];
    }
    const response = await api.get<ProductListResponse>('/catalog/products', {
      params: apiParams,
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
   */
  async getFilterAttributes(categorySlug: string): Promise<FilterAttribute[]> {
    const response = await api.get<{ data?: FilterAttribute[] }>(`/catalog/categories/${categorySlug}/filter-attributes`);
    return response.data?.data ?? [];
  },
};