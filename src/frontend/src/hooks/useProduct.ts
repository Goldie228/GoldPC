/**
 * Хук для получения одного товара по slug
 * Абстрагирует прямой вызов API от компонентов
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { catalogApi } from '../api/catalog';
import type { Product } from '../api/types';

/**
 * Ключи для кэширования запросов отдельного продукта
 */
export const productKeys = {
  all: ['product'] as const,
  detail: (slug: string) => [...productKeys.all, slug] as const,
};

/**
 * Хук для получения товара по slug
 * @param productSlug - slug товара
 * @param options - дополнительные опции (например, enabled для условного запроса)
 * @returns UseQueryResult с данными о продукте, статусом загрузки и ошибками
 */
export function useProduct(
  productSlug: string | undefined,
  options?: {
    enabled?: boolean;
  }
): UseQueryResult<Product, Error> {
  return useQuery({
    queryKey: productKeys.detail(productSlug ?? ''),
    queryFn: () => catalogApi.getProductBySlug(productSlug!),
    enabled: !!productSlug && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000, // 5 минут
  });
}

export type { Product };