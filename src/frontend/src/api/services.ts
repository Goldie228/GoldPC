/**
 * API для взаимодействия с ServicesService (порт 5003)
 *
 * Бэкенд-роуты: /api/v1/services
 * - GET  /services/types    — типы услуг (ServiceTypeDto) [AllowAnonymous]
 * - POST /services          — создать заявку [Authorize]
 * - GET  /services/my       — мои заявки
 * - GET  /services/{id}     — заявка по ID
 */

import { goldpcApi } from './generated/client';

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
  description: string;
  deviceModel?: string;
  serialNumber?: string;
  status: TicketStatus;
  statusLabel: string;
  createdAt: string; // ISO datetime
  updatedAt: string;
  completedAt?: string;
  closedAt?: string;
  estimatedCompletion?: string;
  clientRating?: number;
  clientReview?: string;
  closeComment?: string;
}

/** Сообщение чата */
export interface ChatMessage {
  id: string;
  serviceRequestId: string;
  senderId: string;
  senderName: string;
  message: string;
  isSystemMessage: boolean;
  createdAt: string;
}

/** Запчасть в заявке */
export interface ServicePartDto {
  id?: string;
  productId?: string;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
}

/** Отчёт о выполнении */
export interface WorkReport {
  diagnosis?: string;
  workPerformed?: string;
  recommendations?: string;
  totalPartsCost?: number;
  laborCost?: number;
  totalCost?: number;
}

// ═══════════════════════════════════════════════
//  HELPER: извлечение data из ответа
// ═══════════════════════════════════════════════

function extractData<T>(response: { data: unknown }): T {
  return (response.data as any)?.data ?? (response.data as T);
}

// ═══════════════════════════════════════════════
//  API
// ═══════════════════════════════════════════════

export const servicesApi = {
  /** Получить все типы услуг ( publicly ) */
  getServiceTypes: async (): Promise<ServiceType[]> => {
    const response = await goldpcApi.getServicesTypes();
    return extractData<ServiceType[]>(response);
  },

  /** Получить тип услуги по slug */
  getServiceTypeBySlug: async (slug: string): Promise<ServiceType> => {
    const response = await goldpcApi.getServicesTypesSlug(slug);
    return extractData<ServiceType>(response);
  },

  /** Получить заявку по ID */
  getServiceRequestById: async (id: string): Promise<ServiceRequestDto> => {
    const response = await goldpcApi.getServicesId(id);
    return extractData<ServiceRequestDto>(response);
  },

  /** Получить мои заявки (пагинация) */
  getMyServiceRequests: async (
    page: number = 1,
    pageSize: number = 10,
  ): Promise<{ items: ServiceRequestDto[]; totalCount: number }> => {
    const response = await goldpcApi.getServicesMy({ page, pageSize });
    return extractData<{ items: ServiceRequestDto[]; totalCount: number }>(response);
  },

  /** Создать заявку на услугу */
  createServiceRequest: async (data: CreateServiceRequest): Promise<ServiceRequestDto> => {
    const response = await goldpcApi.postServices(data);
    return extractData<ServiceRequestDto>(response);
  },

  /** Отменить заявку */
  cancelServiceRequest: async (id: string): Promise<void> => {
    await goldpcApi.postServicesIdCancel(id);
  },

  // ─── Chat ───────────────────────────────────────

  /** Получить сообщения чата */
  getChatMessages: async (
    requestId: string,
    page: number = 1,
    pageSize: number = 50,
  ): Promise<{ items: ChatMessage[]; totalCount: number }> => {
    const response = await goldpcApi.getServicesIdMessages(requestId, { page, pageSize });
    return extractData<{ items: ChatMessage[]; totalCount: number }>(response);
  },

  /** Отправить сообщение в чат */
  sendChatMessage: async (requestId: string, message: string): Promise<ChatMessage> => {
    const response = await goldpcApi.postServicesIdMessages(requestId, { message });
    return extractData<ChatMessage>(response);
  },

  /** Получить количество непрочитанных сообщений */
  getUnreadMessageCount: async (requestId: string): Promise<number> => {
    const response = await goldpcApi.getServicesIdMessagesUnreadCount(requestId);
    return extractData<number>(response);
  },

  /** Загрузить вложение */
  uploadAttachment: async (requestId: string, file: File): Promise<{ url: string; fileName: string }> => {
    const response = await goldpcApi.postServicesIdUpload(requestId, { file });
    return extractData<{ url: string; fileName: string }>(response);
  },

  // ─── Admin / Master ─────────────────────────────

  /** Получить все заявки (с пагинацией, фильтрами) */
  getAllServiceRequests: async (params: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
  }): Promise<{ items: ServiceRequestDto[]; totalCount: number }> => {
    const { page, pageSize, status, search } = params;
    const response = await goldpcApi.getServices(
      { page, pageSize, status: status as any },
      search ? { params: { search } } : undefined,
    );
    return extractData<{ items: ServiceRequestDto[]; totalCount: number }>(response);
  },

  /** Получить неназначенные заявки */
  getUnassignedRequests: async (params: {
    page?: number;
    pageSize?: number;
  }): Promise<{ items: ServiceRequestDto[]; totalCount: number }> => {
    const { page, pageSize } = params;
    const response = await goldpcApi.getServicesUnassigned({ page, pageSize });
    return extractData<{ items: ServiceRequestDto[]; totalCount: number }>(response);
  },

  /** Назначить мастера на заявку */
  assignMaster: async (requestId: string, masterId: string): Promise<ServiceRequestDto> => {
    const response = await goldpcApi.postServicesIdAssignMasterId(requestId, masterId);
    return extractData<ServiceRequestDto>(response);
  },

  /** Обновить статус заявки */
  updateRequestStatus: async (requestId: string, status: string): Promise<ServiceRequestDto> => {
    const response = await goldpcApi.patchServicesIdStatus(requestId, { status: status as any });
    return extractData<ServiceRequestDto>(response);
  },

  /** Добавить запчасти к заявке */
  addParts: async (requestId: string, parts: ServicePartDto[]): Promise<ServiceRequestDto> => {
    const response = await goldpcApi.postServicesIdParts(requestId, parts);
    return extractData<ServiceRequestDto>(response);
  },

  /** Завершить заявку (с отчётом) */
  completeRequest: async (requestId: string, report: WorkReport): Promise<ServiceRequestDto> => {
    const response = await goldpcApi.putServicesIdComplete(requestId, report);
    return extractData<ServiceRequestDto>(response);
  },

  /** Получить отчёт по заявке */
  getReport: async (requestId: string): Promise<WorkReport> => {
    const response = await goldpcApi.getServicesIdReport(requestId);
    return extractData<WorkReport>(response);
  },

  /** Получить заявки мастера */
  getMasterRequests: async (params: {
    page?: number;
    pageSize?: number;
    status?: string;
  }): Promise<{ items: ServiceRequestDto[]; totalCount: number }> => {
    const { page, pageSize, status } = params;
    const response = await goldpcApi.getServicesMaster(
      { page, pageSize, status: status as any },
    );
    return extractData<{ items: ServiceRequestDto[]; totalCount: number }>(response);
  },

  /** Закрыть заявку */
  closeRequest: async (requestId: string, data?: { comment?: string }): Promise<ServiceRequestDto> => {
    const response = await goldpcApi.postServicesIdClose(requestId, data);
    return extractData<ServiceRequestDto>(response);
  },

  // ─── Backward-compatible aliases ────────────────

  /** Alias for getMasterRequests (used by master panel pages) */
  getMasterServices: async (page: number = 1, pageSize: number = 10, status?: string): Promise<{ items: ServiceRequestDto[]; totalCount: number }> => {
    return servicesApi.getMasterRequests({ page, pageSize, status });
  },

  /** Alias for updateRequestStatus (used by master panel) */
  updateTicketStatus: async (requestId: string, status: string): Promise<ServiceRequestDto> => {
    return servicesApi.updateRequestStatus(requestId, status);
  },

  /** Alias for completeRequest (used by TicketDetailPage) */
  completeTicket: async (requestId: string, report: WorkReport): Promise<ServiceRequestDto> => {
    return servicesApi.completeRequest(requestId, report);
  },

  /** Alias for getServiceRequestById (used by useServiceTickets) */
  getServiceById: async (id: string): Promise<ServiceRequestDto> => {
    return servicesApi.getServiceRequestById(id);
  },

  /** Alias for createServiceRequest (used by useServiceTickets) */
  createService: async (data: CreateServiceRequest): Promise<ServiceRequestDto> => {
    return servicesApi.createServiceRequest(data);
  },

  /** Alias for getMyServiceRequests (used by useServiceTickets) */
  getMyServices: async (page: number = 1, pageSize: number = 10, status?: string): Promise<{ items: ServiceRequestDto[]; totalCount: number }> => {
    return servicesApi.getMyServiceRequests(page, pageSize, status);
  },
};
