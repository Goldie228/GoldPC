/**
 * Warranty API — работа с гарантийными картами
 * Бэкенд: WarrantyService (порт 5006)
 */

import apiClient from './client';

export type WarrantyStatus = 'active' | 'expired' | 'annulled';

/**
 * Модель гарантийной карты, приведённая к фронтовому формату.
 * Backend DTO: Id, WarrantyNumber, ProductName, SerialNumber?,
 *              StartDate, EndDate, WarrantyMonths, Status
 */
export interface WarrantyCard {
  id: string;
  warrantyNumber: string;
  productName: string;
  serialNumber: string | null;
  startDate: string;
  endDate: string;
  warrantyMonths: number;
  status: WarrantyStatus;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

interface ApiResponse<T> {
  data?: T;
  success?: boolean;
  message?: string;
}

/**
 * Маппинг статусов бэка (0=Active, 1=Expired, 2=Annulled)
 */
function mapStatus(backendStatus: number): WarrantyStatus {
  switch (backendStatus) {
    case 0: return 'active';
    case 1: return 'expired';
    case 2: return 'annulled';
    default: return 'expired';
  }
}

/**
 * Преобразование бэкендовой DTO в интерфейс WarrantyCard
 */
function mapCard(raw: {
  id: string;
  warrantyNumber?: string;
  productName?: string;
  serialNumber?: string | null;
  startDate?: string;
  endDate?: string;
  warrantyMonths?: number;
  status: number;
}): WarrantyCard {
  return {
    id: raw.id,
    warrantyNumber: raw.warrantyNumber ?? '',
    productName: raw.productName ?? '—',
    serialNumber: raw.serialNumber ?? null,
    startDate: raw.startDate ?? '',
    endDate: raw.endDate ?? '',
    warrantyMonths: raw.warrantyMonths ?? 0,
    status: mapStatus(raw.status),
  };
}

/**
 * Безопасное извлечение data из ApiResponse<T>
 */
function unwrap<T>(response: T | ApiResponse<T>): T {
  if (response != null && typeof response === 'object' && 'data' in (response as object)) {
    const wrapped = response as ApiResponse<T>;
    if (wrapped.data !== undefined) return wrapped.data;
  }
  throw new Error('Unable to unwrap API response: data is undefined');
}

export const warrantyApi = {
  /**
   * Получить список гарантийных карт пользователя (с пагинацией)
   */
  async getMyCards(page = 1, pageSize = 10): Promise<PagedResult<WarrantyCard>> {
    try {
      const response = await apiClient.get<ApiResponse<{
        items: unknown[];
        totalCount: number;
        pageNumber: number;
        pageSize: number;
      }>>('/warranty/card/my', { params: { page, pageSize } });

      const raw = unwrap(response.data);

      return {
        items: (raw.items ?? []).map((item) => mapCard(item as Parameters<typeof mapCard>[0])),
        totalCount: raw.totalCount ?? 0,
        pageNumber: raw.pageNumber ?? page,
        pageSize: raw.pageSize ?? pageSize,
      };
    } catch {
      // Endpoint may not be implemented on backend yet
      return { items: [], totalCount: 0, pageNumber: page, pageSize };
    }
  },

  /**
   * Получить гарантийную карту по ID
   */
  async getCard(id: string): Promise<WarrantyCard> {
    const response = await apiClient.get<ApiResponse<Parameters<typeof mapCard>[0]>>(
      `/warranty/card/${id}`
    );
    const raw = unwrap(response.data);
    return mapCard(raw);
  },
};

export default warrantyApi;
