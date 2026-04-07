/**
 * Хук для получения списка услуг сервисного центра
 * Абстрагирует прямой вызов API от компонентов
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { ServiceListResponse, GetServicesParams, Service, Uuid } from '../api/types';

const servicesApi = {
  getServices: async (params?: GetServicesParams): Promise<ServiceListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
    if (params?.category) searchParams.set('category', params.category);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.isPopular !== undefined) searchParams.set('isPopular', String(params.isPopular));

    const response = await fetch(`/api/services?${searchParams.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch services');
    }
    return response.json();
  },

  getService: async (id: Uuid): Promise<Service> => {
    const response = await fetch(`/api/services/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch service');
    }
    return response.json();
  },

  getServiceBySlug: async (slug: string): Promise<Service> => {
    const response = await fetch(`/api/services/slug/${slug}`);
    if (!response.ok) {
      throw new Error('Failed to fetch service');
    }
    return response.json();
  },
};

/**
 * Ключи для кэширования запросов услуг
 */
export const servicesKeys = {
  all: ['services'] as const,
  lists: () => [...servicesKeys.all, 'list'] as const,
  list: (params?: GetServicesParams) => [...servicesKeys.lists(), params] as const,
  details: () => [...servicesKeys.all, 'detail'] as const,
  detail: (id: Uuid) => [...servicesKeys.details(), id] as const,
  bySlug: (slug: string) => [...servicesKeys.all, 'slug', slug] as const,
};

/**
 * Хук для получения списка услуг
 * @param params - параметры запроса (пагинация, фильтрация)
 * @returns UseQueryResult с данными об услугах, статусом загрузки и ошибками
 */
export function useServices(params?: GetServicesParams): UseQueryResult<ServiceListResponse, Error> {
  return useQuery({
    queryKey: servicesKeys.list(params),
    queryFn: () => servicesApi.getServices(params),
    staleTime: 5 * 60 * 1000, // 5 минут
  });
}

/**
 * Хук для получения одной услуги по ID
 * @param id - ID услуга
 * @returns UseQueryResult с данными об услуге
 */
export function useService(id: Uuid): UseQueryResult<Service, Error> {
  return useQuery({
    queryKey: servicesKeys.detail(id),
    queryFn: () => servicesApi.getService(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Хук для получения услуги по slug
 * @param slug - Slug услуги
 * @returns UseQueryResult с данными об услуге
 */
export function useServiceBySlug(slug: string): UseQueryResult<Service, Error> {
  return useQuery({
    queryKey: servicesKeys.bySlug(slug),
    queryFn: () => servicesApi.getServiceBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

export { servicesApi };
export type { ServiceListResponse, GetServicesParams, Service, Uuid };
