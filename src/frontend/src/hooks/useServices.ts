/**
 * Хук для получения списка услуг сервисного центра
 * Абстрагирует прямой вызов API от компонентов
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { Service, ServiceCategory, ServiceListResponse, GetServicesParams, Uuid } from '../api/types';
import type { ServiceType } from '../api/services';

interface ApiResponse<T> {
  data?: T;
  success?: boolean;
  message?: string;
}

/**
 * Определяет категорию услуги по названию
 */
function inferCategory(name: string): ServiceCategory {
  const n = name.toLowerCase();
  if (n.includes('ноутбук')) return 'laptop-repair';
  if (n.includes('проч')) return 'other'; // прочая техника
  if (n.includes('ремонт')) return 'repair';
  if (n.includes('модерниза') || n.includes('апгрейд')) return 'upgrade';
  if (n.includes('диагностик')) return 'diagnostics';
  if (n.includes('сборк')) return 'assembly';
  if (n.includes('восстановлен') || n.includes('данных')) return 'data-recovery';
  if (n.includes('чистк') || n.includes('обслуживан')) return 'maintenance';
  return 'other';
}

/**
 * Маппер ServiceTypeDto → Service
 */
function mapServiceTypeToService(dto: ServiceType): Service {
  return {
    id: dto.id,
    name: dto.name,
    slug: dto.name.toLowerCase().replace(/\s+/g, '-'),
    category: inferCategory(dto.name),
    description: dto.description,
    shortDescription: dto.description.slice(0, 100),
    basePrice: dto.basePrice,
    duration: `${dto.estimatedDurationMinutes} мин`,
    warrantyMonths: 12,
    isPopular: false,
    isActive: true,
  };
}

const servicesApi = {
  getServices: async (params?: GetServicesParams): Promise<ServiceListResponse> => {
    const response = await apiClient.get<ApiResponse<ServiceType[]>>('/services/types');
    const raw = response.data;
    // Бэкенд возвращает { data: T, success, message } — извлекаем данные
    const data: ServiceType[] = raw && typeof raw === 'object' && 'data' in raw ? (raw as { data: ServiceType[] }).data : (raw as ServiceType[]);
    const items = Array.isArray(data) ? data.map(mapServiceTypeToService) : [];

    return {
      data: items,
      meta: {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20,
        totalPages: 1,
        totalItems: items.length,
        hasNext: false,
        hasPrevious: false,
      },
    };
  },

  getService: async (id: Uuid): Promise<Service> => {
    const response = await apiClient.get<ApiResponse<ServiceType>>(`/services/${id}`);
    const raw = response.data;
    const dto: ServiceType = raw && typeof raw === 'object' && 'data' in raw ? (raw as { data: ServiceType }).data : (raw as ServiceType);
    return mapServiceTypeToService(dto);
  },

getServiceBySlug: async (slug: string): Promise<Service> => {
    const response = await apiClient.get<ApiResponse<ServiceType>>(`/services/types/${slug}`);
    const raw = response.data;
    const dto: ServiceType = raw && typeof raw === 'object' && 'data' in raw ? (raw as { data: ServiceType }).data : (raw as ServiceType);
    return mapServiceTypeToService(dto);
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