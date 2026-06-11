/**
 * API для взаимодействия с ServicesService (порт 5003)
 *
 * Бэкенд-роуты: /api/v1/services
 * - GET  /services/types    — типы услуг (ServiceTypeDto) [AllowAnonymous]
 * - POST /services          — создать заявку [Authorize]
 * - GET  /services/my       — мои заявки
 * - GET  /services/{id}     — заявка по ID
 */

import apiClient from './client';

// ═══════════════════════════════════════════════
//  TICKET STATUSES (совместимы со статусами бэка)
// ═══════════════════════════════════════════════

export const TICKET_STATUSES = [
  { key: 'Submitted', label: 'Подана', color: 'blue' },
  { key: 'InProgress', label: 'В работе', color: 'yellow' },
  { key: 'PartsPending', label: 'Ожидание запчастей', color: 'purple' },
  { key: 'ReadyForPickup', label: 'Готова к выдаче', color: 'green' },
  { key: 'Completed', label: 'Завершён', color: 'gray' },
  { key: 'Cancelled', label: 'Отменён', color: 'red' },
] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number]['key'];

// ═══════════════════════════════════════════════
//  НОВЫЕ ТИПЫ ПОД РЕАЛЬНЫЙ БЭКЕНД
// ═══════════════════════════════════════════════

/** Тип услуги (ServiceTypeDto) */
export interface ServiceType {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  estimatedDurationMinutes: number;
}

/** Запрос на создание заявки (CreateServiceRequestRequest) */
export interface CreateServiceRequest {
  serviceTypeId: string;
  /** Описание проблемы (опционально для неавторизованных, обязательно для авторизованных) */
  description: string; // 10-2000 символов
  deviceModel?: string; // макс 100
  serialNumber?: string; // макс 50
}

/** DTO заявки на услугу (ServiceRequestDto) */
export interface ServiceRequestDto {
  id: string;
  requestNumber: string;
  clientId: string;
  masterId?: string;
  serviceTypeId: string;
  serviceTypeName: string;
  status: TicketStatus;
  description: string;
  deviceModel?: string;
  serialNumber?: string;
  estimatedCost: number;
  actualCost: number;
  masterComment?: string;
  createdAt: string;
  completedAt?: string;
  serviceParts?: ServicePartDto[];
  workReports?: WorkReportDto[];
}

/** Деталь/запчасть (ServicePartDto) */
export interface ServicePartDto {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

/** Запись истории (WorkReportDto) */
export interface WorkReportDto {
  id: string;
  serviceRequestId: string;
  previousStatus: TicketStatus;
  newStatus: TicketStatus;
  comment?: string;
  changedBy: string;
  changedAt: string;
}

// ═══════════════════════════════════════════════
//  ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ═══════════════════════════════════════════════

/**
 * Извлекает полезные данные из обёрнутого ApiResponse<T>
 * Бэкенд возвращает { data: T, success: true, message: "..." }
 */
function unwrapData<T>(responseData: unknown): T {
  if (responseData != null && typeof responseData === 'object' && 'data' in (responseData as Record<string, unknown>)) {
    const wrapped = responseData as { data: T; success?: boolean; message?: string };
    if (wrapped.data !== undefined) return wrapped.data;
  }
  return responseData as T;
}

// ═══════════════════════════════════════════════
//  НОВЫЕ API-ФУНКЦИИ (реальный бэкенд)
// ═══════════════════════════════════════════════

/**
 * GET /services/types — список типов услуг
 * AllowAnonymous
 */
async function getServiceTypes(): Promise<ServiceType[]> {
  const response = await apiClient.get('/services/types');
  return unwrapData<ServiceType[]>(response.data);
}

/**
 * POST /services — создать заявку на услугу
 * [Authorize] — требуется токен
 */
async function createService(data: CreateServiceRequest): Promise<ServiceRequestDto> {
  const response = await apiClient.post('/services', {
    serviceTypeId: data.serviceTypeId,
    description: data.description,
    deviceModel: data.deviceModel ?? null,
    serialNumber: data.serialNumber ?? null,
  });
  return unwrapData<ServiceRequestDto>(response.data);
}

/**
 * GET /services/my — список моих заявок
 */
async function getMyServices(page = 1, pageSize = 10): Promise<{ items: ServiceRequestDto[]; total: number }> {
  const response = await apiClient.get(`/services/my?page=${page}&pageSize=${pageSize}`);
  const data = unwrapData<{ items: ServiceRequestDto[]; totalCount: number }>(response.data);
  return {
    items: data.items ?? [],
    total: data.totalCount ?? 0,
  };
}

/**
 * GET /services/{id} — заявка по ID
 */
async function getServiceById(id: string): Promise<ServiceRequestDto> {
  const response = await apiClient.get(`/services/${id}`);
  return unwrapData<ServiceRequestDto>(response.data);
}

// ═══════════════════════════════════════════════
//  MASTER API-ФУНКЦИИ
// ═══════════════════════════════════════════════

/**
 * GET /services/master — список заявок, назначенных мастеру
 * [Authorize(Roles = "Master")]
 */
async function getMasterServices(
  page = 1,
  pageSize = 10,
  status?: string,
): Promise<{ items: ServiceRequestDto[]; total: number }> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (status != null && status !== '' && status !== 'all') params.append('status', status);

  const response = await apiClient.get(`/services/master?${params}`);
  const data = unwrapData<{ items: ServiceRequestDto[]; totalCount: number }>(response.data);
  return {
    items: data.items ?? [],
    total: data.totalCount ?? 0,
  };
}

/**
 * PATCH /services/{id}/status — обновить статус заявки
 * [Authorize(Roles = "Manager,Admin,Master")]
 */
async function updateTicketStatus(
  id: string,
  status: TicketStatus,
  masterComment?: string,
): Promise<ServiceRequestDto> {
  const response = await apiClient.patch(`/services/${id}/status`, {
    status,
    masterComment: masterComment ?? null,
  });
  return unwrapData<ServiceRequestDto>(response.data);
}

/**
 * PUT /services/{id}/complete — завершить работу мастера (→ ReadyForPickup)
 * [Authorize(Roles = "Master")]
 */
async function completeTicket(id: string, masterComment?: string): Promise<ServiceRequestDto> {
  const response = await apiClient.put(`/services/${id}/complete`, {
    masterComment: masterComment ?? '',
  });
  return unwrapData<ServiceRequestDto>(response.data);
}

/**
 * POST /services/{id}/parts — добавить запчасть
 * [Authorize(Roles = "Master")]
 */
async function addServicePart(id: string, dto: ServicePartDto): Promise<ServicePartDto> {
  const response = await apiClient.post(`/services/${id}/parts`, dto);
  return unwrapData<ServicePartDto>(response.data);
}

/**
 * POST /services/{id}/cancel — отменить заявку
 * [Authorize]
 */
async function cancelTicket(id: string): Promise<ServiceRequestDto> {
  const response = await apiClient.post(`/services/${id}/cancel`);
  return unwrapData<ServiceRequestDto>(response.data);
}

/**
 * POST /services/{id}/close — закрыть заявку (выдача клиенту)
 * [Authorize(Roles = "Manager,Admin")]
 */
async function closeTicket(id: string, comment?: string): Promise<ServiceRequestDto> {
  const response = await apiClient.post(`/services/${id}/close`, { comment: comment ?? null });
  return unwrapData<ServiceRequestDto>(response.data);
}

// ═══════════════════════════════════════════════
//  ЭКСПОРТ
// ═══════════════════════════════════════════════

export const servicesApi = {
  // Общие
  getServiceTypes,
  createService,
  getMyServices,
  getServiceById,
  // Master
  getMasterServices,
  updateTicketStatus,
  completeTicket,
  addServicePart,
  cancelTicket,
  closeTicket,
};
