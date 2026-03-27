/**
 * Хук для получения списка услуг сервисного центра
 * Абстрагирует прямой вызов API от компонентов
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { ServiceListResponse, GetServicesParams, Service, Uuid } from '../api/types';
import { SERVICES } from '../mocks/data/services';

function buildMockServicesResponse(params?: GetServicesParams): ServiceListResponse {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const category = params?.category;
  const search = params?.search?.trim().toLowerCase();
  const isPopular = params?.isPopular;

  let services = [...SERVICES];

  if (category) {
    services = services.filter((s) => s.category === category);
  }

  if (typeof isPopular === 'boolean') {
    services = services.filter((s) => Boolean(s.isPopular) === isPopular);
  }

  if (search) {
    services = services.filter(
      (s) =>
        s.name.toLowerCase().includes(search) ||
        s.description.toLowerCase().includes(search) ||
        s.shortDescription.toLowerCase().includes(search)
    );
  }

  const totalItems = services.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const data = services.slice(startIndex, startIndex + pageSize);

  return {
    data,
    meta: {
      page: safePage,
      pageSize,
      totalPages,
      totalItems,
      hasNext: safePage < totalPages,
      hasPrevious: safePage > 1,
    },
  };
}

// Временный API клиент для услуг (пока MSW не настроен)
const servicesApi = {
  getServices: async (params?: GetServicesParams): Promise<ServiceListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
    if (params?.category) searchParams.set('category', params.category);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.isPopular !== undefined) searchParams.set('isPopular', String(params.isPopular));

    try {
      const response = await fetch(`/api/services?${searchParams.toString()}`);
      if (response.ok) {
        return response.json();
      }
    } catch {
      // fallback below
    }

    // Fallback: keep services page functional even when backend route is unavailable.
    return buildMockServicesResponse(params);
  },

  getService: async (id: Uuid): Promise<Service> => {
    try {
      const response = await fetch(`/api/services/${id}`);
      if (response.ok) {
        return response.json();
      }
    } catch {
      // fallback below
    }

    const service = SERVICES.find((s) => s.id === id);
    if (!service) {
      throw new Error('Failed to fetch service');
    }
    return service;
  },

  getServiceBySlug: async (slug: string): Promise<Service> => {
    try {
      const response = await fetch(`/api/services/slug/${slug}`);
      if (response.ok) {
        return response.json();
      }
    } catch {
      // fallback below
    }

    const service = SERVICES.find((s) => s.slug === slug);
    if (!service) {
      throw new Error('Failed to fetch service');
    }
    return service;
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
 * @param id - ID услуги
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