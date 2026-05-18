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
  ProductCategory,
} from './types';

const CATEGORY_NAME_TO_SLUG: Record<string, ProductCategory> = {
  'Процессоры': 'cpu',
  'Видеокарты': 'gpu',
  'Материнские платы': 'motherboard',
  'Оперативная память': 'ram',
  'Накопители': 'storage',
  'Блоки питания': 'psu',
  'Корпуса': 'case',
  'Охлаждение': 'cooling',
  'Вентиляторы': 'fan',
  'Мониторы': 'monitor',
  'Клавиатуры': 'keyboard',
  'Мыши': 'mouse',
  'Наушники': 'headphones',
};

function normalizeCategory<T extends { category?: unknown }>(item: T): T {
  if (item != null && typeof item.category === 'string') {
    const slug = CATEGORY_NAME_TO_SLUG[item.category];
    if (slug != null) {
      (item as { category?: string }).category = slug;
    }
  }
  return item;
}

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
  const data = response.data;
  if (data?.data != null && Array.isArray(data.data)) {
    for (const p of data.data) {
      normalizeCategory(p);
    }
  }
  return data;
}

/**
 * Получить товар по ID
 * @param id - UUID товара
 * @returns полная информация о товаре
 */
export async function getProductById(id: string): Promise<Product> {
  const response = await apiClient.get<Product>(`/catalog/products/${id}`);
  return normalizeCategory(response.data);
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
      pageSize: limit ?? 10,
    },
  });
  const items = response.data.data ?? [];
  for (const p of items) {
    normalizeCategory(p);
  }
  return items;
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
  const data = response.data;
  if (data?.data != null && Array.isArray(data.data)) {
    for (const p of data.data) {
      normalizeCategory(p);
    }
  }
  return data;
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