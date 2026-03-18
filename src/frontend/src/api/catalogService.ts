/**
 * Сервис каталога товаров для GoldPC
 * Предоставляет функции для работы с продуктами и категориями
 */

import apiClient from './client';
import type {
  Product,
  ProductSummary,
  ProductListResponse,
  GetProductsParams,
  Category,
} from './types';

/**
 * Получить список товаров с пагинацией и фильтрацией
 * @param params - параметры фильтрации и пагинации
 * @returns список товаров с метаданными пагинации
 */
export async function getProducts(
  params?: GetProductsParams
): Promise<ProductListResponse> {
  const response = await apiClient.get<ProductListResponse>('/catalog/products', {
    params,
  });
  return response.data;
}

/**
 * Получить товар по ID
 * @param id - UUID товара
 * @returns полная информация о товаре
 */
export async function getProductById(id: string): Promise<Product> {
  const response = await apiClient.get<Product>(`/catalog/products/${id}`);
  return response.data;
}

/**
 * Получить список всех категорий
 * @returns массив категорий
 */
export async function getCategories(): Promise<Category[]> {
  const response = await apiClient.get<{ data: Category[] }>('/catalog/categories');
  return response.data.data;
}

/**
 * Получить популярные товары
 * @param limit - максимальное количество товаров
 * @returns список популярных товаров
 */
export async function getFeaturedProducts(limit?: number): Promise<ProductSummary[]> {
  const response = await apiClient.get<ProductListResponse>('/catalog/products', {
    params: {
      isFeatured: true,
      pageSize: limit || 10,
    },
  });
  return response.data.data;
}

/**
 * Поиск товаров по названию
 * @param query - поисковый запрос
 * @param params - дополнительные параметры
 * @returns список найденных товаров
 */
export async function searchProducts(
  query: string,
  params?: Omit<GetProductsParams, 'search'>
): Promise<ProductListResponse> {
  const response = await apiClient.get<ProductListResponse>('/catalog/products', {
    params: {
      ...params,
      search: query,
    },
  });
  return response.data;
}

/**
 * Экспорт объекта сервиса для использования с namespace
 */
export const catalogService = {
  getProducts,
  getProductById,
  getCategories,
  getFeaturedProducts,
  searchProducts,
};

export default catalogService;