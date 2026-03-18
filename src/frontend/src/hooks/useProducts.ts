/**
 * Хук для получения списка товаров с пагинацией и фильтрацией
 * Абстрагирует прямой вызов API от компонентов
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { catalogApi } from '../api/catalog';
import type { ProductListResponse, GetProductsParams } from '../api/types';

/**
 * Ключи для кэширования запросов продуктов
 */
export const productsKeys = {
  all: ['products'] as const,
  lists: () => [...productsKeys.all, 'list'] as const,
  list: (params?: GetProductsParams) => [...productsKeys.lists(), params] as const,
};

/**
 * Хук для получения списка товаров
 * @param params - параметры запроса (пагинация, фильтрация, сортировка)
 * @returns UseQueryResult с данными о продуктах, статусом загрузки и ошибками
 */
export function useProducts(params?: GetProductsParams): UseQueryResult<ProductListResponse, Error> {
  return useQuery({
    queryKey: productsKeys.list(params),
    queryFn: () => catalogApi.getProducts(params),
    staleTime: 5 * 60 * 1000, // 5 минут
  });
}

export type { ProductListResponse, GetProductsParams };