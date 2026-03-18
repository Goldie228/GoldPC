import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
  type QueryKey,
} from '@tanstack/react-query'
import type { AxiosError, AxiosResponse } from 'axios'
import api from './index'

// Типы для типизации ответов API
type ApiResponse<T> = AxiosResponse<T>
type ApiError = AxiosError

/**
 * Параметры для useApi query hook
 */
interface UseApiQueryOptions<TData, TError = ApiError>
  extends Omit<UseQueryOptions<TData, TError, TData, QueryKey>, 'queryKey' | 'queryFn'> {
  enabled?: boolean
}

/**
 * Параметры для useApi mutation hook
 */
interface UseApiMutationOptions<TData, TError = ApiError, TVariables = unknown>
  extends Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'> {}

/**
 * Хук для выполнения GET запросов с использованием React Query
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = useApiQuery('/products', { 
 *   staleTime: 60000 
 * })
 * ```
 */
export function useApiQuery<TData = unknown>(
  url: string,
  options?: UseApiQueryOptions<TData>
) {
  return useQuery<TData, ApiError>({
    queryKey: [url],
    queryFn: async () => {
      const response = await api.get<TData>(url)
      return response.data
    },
    ...options,
  })
}

/**
 * Хук для выполнения GET запросов с параметрами
 * 
 * @example
 * ```tsx
 * const { data, isLoading } = useApiQueryWithParams(
 *   ['/products', { category: 'gpu' }],
 *   { staleTime: 30000 }
 * )
 * ```
 */
export function useApiQueryWithParams<TData = unknown, TParams = Record<string, unknown>>(
  queryKey: [string, TParams?],
  options?: UseApiQueryOptions<TData>
) {
  const [url, params] = queryKey
  
  return useQuery<TData, ApiError>({
    queryKey: [url, params],
    queryFn: async () => {
      const response = await api.get<TData>(url, { params })
      return response.data
    },
    ...options,
  })
}

/**
 * Хук для выполнения POST/PUT/DELETE запросов
 * 
 * @example
 * ```tsx
 * const { mutate, isLoading } = useApiMutation(
 *   (data: CreateProductDto) => api.post('/products', data)
 * )
 * 
 * // В компоненте
 * mutate({ name: 'RTX 4090', price: 1500 })
 * ```
 */
export function useApiMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options?: UseApiMutationOptions<TData, ApiError, TVariables>
) {
  return useMutation<TData, ApiError, TVariables>({
    mutationFn: async (variables) => {
      const response = await mutationFn(variables)
      return response.data
    },
    ...options,
  })
}

/**
 * Хук для инвалидации кэша
 * 
 * @example
 * ```tsx
 * const { invalidate } = useApiUtils()
 * 
 * // Инвалидировать конкретный query
 * invalidate('/products')
 * 
 * // Инвалидировать все queries
 * invalidate()
 * ```
 */
export function useApiUtils() {
  const queryClient = useQueryClient()

  return {
    invalidate: (queryKey?: QueryKey) => {
      if (queryKey) {
        return queryClient.invalidateQueries({ queryKey })
      }
      return queryClient.invalidateQueries()
    },
    prefetch: async <TData = unknown>(url: string) => {
      await queryClient.prefetchQuery({
        queryKey: [url],
        queryFn: async () => {
          const response = await api.get<TData>(url)
          return response.data
        },
      })
    },
    setQueryData: <TData = unknown>(url: string, data: TData) => {
      queryClient.setQueryData([url], data)
    },
    getQueryData: <TData = unknown>(url: string) => {
      return queryClient.getQueryData<TData>([url])
    },
  }
}

// Экспорт api экземпляра для прямого использования
export { api }
