/**
 * Хук для получения списка категорий
 * Абстрагирует прямой вызов API от компонентов
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { catalogApi } from '../api/catalog';
import type { Category } from '../api/types';

/**
 * Ключи для кэширования запросов категорий
 */
export const categoriesKeys = {
  all: ['categories'] as const,
  list: () => [...categoriesKeys.all, 'list'] as const,
};

/**
 * Хук для получения списка категорий
 * @returns UseQueryResult с данными о категориях, статусом загрузки и ошибками
 */
export function useCategories(): UseQueryResult<Category[], Error> {
  return useQuery({
    queryKey: categoriesKeys.list(),
    queryFn: () => catalogApi.getCategories(),
    staleTime: 10 * 60 * 1000, // 10 минут - категории меняются редко
  });
}

export type { Category };