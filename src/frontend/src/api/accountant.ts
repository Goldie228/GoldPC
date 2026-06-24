/**
 * API модуль для бухгалтерской панели
 * Эндпоинты отчётов и экспорта данных
 */

import apiClient from './client';

/* ─── Типы ответов ─── */

/** Обёртка ответа API: { success, data, message } */
interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
}

/** Сводный финансовый отчёт за период */
export interface FinancialSummary {
  /** Выручка за период */
  revenue: number;
  /** Количество заказов */
  ordersCount: number;
  /** Средний чек */
  averageCheck: number;
  /** Количество оказанных услуг СЦ */
  servicesCount: number;
  /** Прибыль */
  profit: number;
  /** Процент маржи */
  marginPercent: number;
}

/** Заказы, сгруппированные по периоду */
export interface OrdersByPeriod {
  /** Начало периода */
  periodStart: string;
  /** Количество заказов */
  ordersCount: number;
  /** Сумма заказов */
  totalAmount: number;
}

/** Статистика по услугам СЦ за период */
export interface ServicesByPeriod {
  /** Общее количество заявок */
  totalRequests: number;
  /** Количество завершённых */
  completedRequests: number;
  /** Количество отменённых */
  cancelledRequests: number;
  /** Суммарная выручка */
  totalRevenue: number;
  /** Средняя стоимость услуги */
  averageServiceCost: number;
  /** Выручка по типам услуг */
  byServiceType: ServiceTypeRevenue[];
}

/** Выручка по типу услуги */
export interface ServiceTypeRevenue {
  serviceTypeName: string;
  requestsCount: number;
  revenue: number;
}

/* ─── API функции ─── */

/** Получить сводный финансовый отчёт за период */
async function getFinancialSummary(from: string, to: string): Promise<FinancialSummary> {
  const response = await apiClient.get<ApiResponse<FinancialSummary>>(
    '/reports/financial-summary',
    { params: { from, to } }
  );
  const result = response.data;
  if (!result.success || !result.data) {
    throw new Error(result.message ?? 'Ошибка загрузки финансового отчёта');
  }
  return result.data;
}

/** Получить заказы по периоду (сгруппированные) */
async function getOrdersByPeriod(
  from: string,
  to: string,
  groupBy: 'day' | 'week' | 'month' = 'day'
): Promise<OrdersByPeriod[]> {
  const response = await apiClient.get<ApiResponse<OrdersByPeriod[]>>(
    '/reports/orders-by-period',
    { params: { from, to, groupBy } }
  );
  const result = response.data;
  if (!result.success || !result.data) {
    throw new Error(result.message ?? 'Ошибка загрузки статистики заказов');
  }
  return result.data;
}

/** Получить статистику по услугам СЦ за период */
async function getServicesByPeriod(from: string, to: string): Promise<ServicesByPeriod> {
  const response = await apiClient.get<ApiResponse<ServicesByPeriod>>(
    '/reports/services-by-period',
    { params: { from, to } }
  );
  const result = response.data;
  if (!result.success || !result.data) {
    throw new Error(result.message ?? 'Ошибка загрузки статистики услуг');
  }
  return result.data;
}

/** Скачать CSV-экспорт (заказы или товары) */
async function exportCsv(
  entity: 'orders' | 'products',
  from: string,
  to: string
): Promise<{ blob: Blob; fileName: string }> {
  const response = await apiClient.get('/reports/export', {
    params: { format: 'csv', entity, from: from + 'T00:00:00', to: to + 'T23:59:59' },
    responseType: 'blob',
  });

  // Извлекаем имя файла из Content-Disposition
  const disposition = response.headers['content-disposition'] as string | undefined;
  let fileName = `export_${entity}_${new Date().toISOString().slice(0, 10)}.csv`;
  if (disposition) {
    const match = /filename\*?=(?:UTF-8''|"?)([^";]+)/i.exec(disposition);
    if (match?.[1]) {
      fileName = decodeURIComponent(match[1].replace(/"/g, ''));
    }
  }

  return { blob: response.data as Blob, fileName };
}

/* ─── Экспорт API объекта ─── */

export const accountantApi = {
  getFinancialSummary,
  getOrdersByPeriod,
  getServicesByPeriod,
  exportCsv,
};
