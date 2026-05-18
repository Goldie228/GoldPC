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
  description: string;
  basePrice: number;
  estimatedDurationMinutes: number;
}

/** Запрос на создание заявки (CreateServiceRequestRequest) */
export interface CreateServiceRequest {
  serviceTypeId: string;
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
  createdAt: string;
  completedAt?: string;
}

// ═══════════════════════════════════════════════
//  СТАРЫЕ ТИПЫ (обратная совместимость, deprecated)
// ═══════════════════════════════════════════════

/** @deprecated Используйте ServiceRequestDto */
export interface ServiceTicket {
  id: string;
  ticketNumber: string;
  deviceType: string;
  brand: string;
  model: string;
  issueDescription: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  technician?: { id: string; name: string };
  notes: string;
  estimatedCompletion?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

/** @deprecated */
export interface TicketStatusHistory {
  id: string;
  status: TicketStatus;
  createdAt: string;
  note?: string;
  author?: string;
}

/** @deprecated */
export interface TicketMessage {
  id: string;
  author: 'customer' | 'technician' | 'system';
  authorName?: string;
  content: string;
  createdAt: string;
  attachments?: string[];
}

/** @deprecated Используйте CreateServiceRequest */
export interface CreateTicketRequest {
  deviceType: string;
  brand: string;
  model: string;
  issueDescription: string;
  preferredContact: 'phone' | 'email' | 'whatsapp' | 'telegram';
  serialNumber?: string;
  purchaseDate?: string;
}

/** @deprecated */
export interface CreateTicketResponse {
  id: string;
  ticketNumber: string;
  status: TicketStatus;
  createdAt: string;
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
//  СТАРЫЕ API-ФУНКЦИИ (обратная совместимость, deprecated)
// ═══════════════════════════════════════════════

/**
 * Маппер ServiceRequestDto → ServiceTicket (для обратной совместимости)
 */
function mapServiceRequestToTicket(dto: ServiceRequestDto): ServiceTicket {
  return {
    id: dto.id,
    ticketNumber: dto.requestNumber,
    deviceType: (dto.deviceModel != null && dto.deviceModel !== '') ? dto.deviceModel : (dto.serviceTypeName != null && dto.serviceTypeName !== '') ? dto.serviceTypeName : 'Устройство',
    brand: '',
    model: dto.deviceModel ?? '',
    issueDescription: dto.description,
    status: dto.status,
    createdAt: dto.createdAt,
    updatedAt: dto.completedAt ?? dto.createdAt,
    notes: '',
    priority: 'normal',
  };
}

/** @deprecated Используйте getMyServices */
async function getMyTickets(page = 1, pageSize = 10, status?: string): Promise<{ items: ServiceTicket[]; total: number }> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (status != null && status !== '' && status !== 'all') params.append('status', status);

  const response = await apiClient.get(`/services/my?${params}`);
  const data = unwrapData<{ items: ServiceRequestDto[]; totalCount: number }>(response.data);
  return {
    items: (data.items ?? []).map(mapServiceRequestToTicket),
    total: data.totalCount ?? 0,
  };
}

/** @deprecated Используйте getServiceById */
async function getTicket(id: string): Promise<ServiceTicket> {
  const response = await apiClient.get(`/services/${id}`);
  return unwrapData<ServiceTicket>(response.data);
}

/** @deprecated */
async function getTicketHistory(id: string): Promise<TicketStatusHistory[]> {
  const response = await apiClient.get(`/services/${id}/history`);
  return unwrapData<TicketStatusHistory[]>(response.data);
}

/** @deprecated */
async function getTicketMessages(id: string): Promise<TicketMessage[]> {
  const response = await apiClient.get(`/services/${id}/messages`);
  return unwrapData<TicketMessage[]>(response.data);
}

/** @deprecated */
async function sendMessage(ticketId: string, content: string): Promise<TicketMessage> {
  const response = await apiClient.post(`/services/${ticketId}/messages`, { content });
  return unwrapData<TicketMessage>(response.data);
}

/** @deprecated Используйте createService */
async function createTicket(data: CreateTicketRequest): Promise<CreateTicketResponse> {
  const response = await apiClient.post('/services', data);
  return unwrapData<CreateTicketResponse>(response.data);
}

// ═══════════════════════════════════════════════
//  ЭКСПОРТ
// ═══════════════════════════════════════════════

export const servicesApi = {
  // Новые
  getServiceTypes,
  createService,
  getMyServices,
  getServiceById,
  // Старые (deprecated)
  getMyTickets,
  getTicket,
  getTicketHistory,
  getTicketMessages,
  sendMessage,
  createTicket,
};
