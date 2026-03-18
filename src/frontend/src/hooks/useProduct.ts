/**
 * Хук для получения одного товара по ID
 * Абстрагирует прямой вызов API от компонентов
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { catalogApi } from '../api/catalog';
import type { Product, Uuid } from '../api/types';

/**
 * Ключи для кэширования запросов отдельного продукта
 */
export const productKeys = {
  all: ['product'] as const,
  detail: (id: Uuid) => [...productKeys.all, id] as const,
};

/**
 * Хук для получения товара по ID
 * @param productId - ID товара
 * @param options - дополнительные опции (например, enabled для условного запроса)
 * @returns UseQueryResult с данными о продукте, статусом загрузки и ошибками
 */
export function useProduct(
  productId: Uuid | undefined,
  options?: {
    enabled?: boolean;
  }
): UseQueryResult<Product, Error> {
  return useQuery({
    queryKey: productKeys.detail(productId ?? ''),
    queryFn: () => catalogApi.getProduct(productId!),
    enabled: !!productId && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000, // 5 минут
  });
}

export type { Product, Uuid };