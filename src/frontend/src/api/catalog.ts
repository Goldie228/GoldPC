import api from './index';
import type { ProductListResponse, GetProductsParams, Product, Category } from './types';

/**
 * API сервиса каталога
 */
export const catalogApi = {
  /**
   * Получить список товаров с пагинацией и фильтрацией
   */
  async getProducts(params?: GetProductsParams): Promise<ProductListResponse> {
    const response = await api.get<ProductListResponse>('/catalog/products', {
      params,
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
};