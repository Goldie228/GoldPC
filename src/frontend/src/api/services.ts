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
import type { AssemblyPartDto, ServiceRequestWithAssembly } from './types';

// ═══════════════════════════════════════════════
//  TICKET STATUSES (совместимы со статусами бэка)
// ═══════════════════════════════════════════════

export const TICKET_STATUSES = [
  { key: 'Submitted', label: 'Подана', color: 'blue' },
  { key: 'Assigned', label: 'Назначена', color: 'indigo' },
  { key: 'InProgress', label: 'В работе', color: 'yellow' },
  { key: 'AwaitingParts', label: 'Ожидание комплектующих', color: 'orange' },
  { key: 'PartsReady', label: 'Комплектующие готовы', color: 'cyan' },
  { key: 'PartsPending', label: 'Ожидание запчастей', color: 'purple' },
  { key: 'Assembled', label: 'Собран', color: 'emerald' },
  { key: 'ReadyForDelivery', label: 'Готов к доставке', color: 'teal' },
  { key: 'InDelivery', label: 'В доставке', color: 'blue' },
  { key: 'Delivered', label: 'Доставлен', color: 'green' },
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
    try {
      const response = await goldpcApi.getServicesTypes();
      return extractData<ServiceType[]>(response);
    } catch (e) {
      throw new Error('Failed to fetch service types: ' + (e instanceof Error ? e.message : String(e)));
    }
  },

  /** Получить тип услуги по slug */
  getServiceTypeBySlug: async (slug: string): Promise<ServiceType> => {
    try {
      const response = await goldpcApi.getServicesTypesSlug(slug);
      return extractData<ServiceType>(response);
    } catch (e) {
      throw new Error('Failed to fetch service type: ' + (e instanceof Error ? e.message : String(e)));
    }
  },

  /** Получить заявку по ID */
  getServiceRequestById: async (id: string): Promise<ServiceRequestDto> => {
    try {
      const response = await goldpcApi.getServicesId(id);
      return extractData<ServiceRequestDto>(response);
    } catch (e) {
      throw new Error('Failed to fetch service request: ' + (e instanceof Error ? e.message : String(e)));
    }
  },

  /** Получить мои заявки (пагинация) */
  getMyServiceRequests: async (
    page: number = 1,
    pageSize: number = 10,
  ): Promise<{ items: ServiceRequestDto[]; totalCount: number }> => {
    try {
      const response = await goldpcApi.getServicesMy({ page, pageSize });
      return extractData<{ items: ServiceRequestDto[]; totalCount: number }>(response);
    } catch (e) {
      throw new Error('Failed to fetch my service requests: ' + (e instanceof Error ? e.message : String(e)));
    }
  },

  /** Создать заявку на услугу */
  createServiceRequest: async (data: CreateServiceRequest): Promise<ServiceRequestDto> => {
    try {
      const response = await goldpcApi.postServices(data);
      return extractData<ServiceRequestDto>(response);
    } catch (e) {
      throw new Error('Failed to create service request: ' + (e instanceof Error ? e.message : String(e)));
    }
  },

  /** Отменить заявку */
  cancelServiceRequest: async (id: string): Promise<void> => {
    try {
      await goldpcApi.postServicesIdCancel(id);
    } catch (e) {
      throw new Error('Failed to cancel service request: ' + (e instanceof Error ? e.message : String(e)));
    }
  },

  // ─── Chat ───────────────────────────────────────

  /** Получить сообщения чата */
  getChatMessages: async (
    requestId: string,
    page: number = 1,
    pageSize: number = 50,
  ): Promise<{ items: ChatMessage[]; totalCount: number }> => {
    try {
      const response = await goldpcApi.getServicesIdMessages(requestId, { page, pageSize });
      return extractData<{ items: ChatMessage[]; totalCount: number }>(response);
    } catch (e) {
      throw new Error('Failed to fetch chat messages: ' + (e instanceof Error ? e.message : String(e)));
    }
  },

  /** Отправить сообщение в чат */
  sendChatMessage: async (requestId: string, message: string): Promise<ChatMessage> => {
    try {
      const response = await goldpcApi.postServicesIdMessages(requestId, { message });
      return extractData<ChatMessage>(response);
    } catch (e) {
      throw new Error('Failed to send chat message: ' + (e instanceof Error ? e.message : String(e)));
    }
  },

  /** Получить количество непрочитанных сообщений */
  getUnreadMessageCount: async (requestId: string): Promise<number> => {
    try {
      const response = await goldpcApi.getServicesIdMessagesUnreadCount(requestId);
      return extractData<number>(response);
    } catch (e) {
      throw new Error('Failed to fetch unread count: ' + (e instanceof Error ? e.message : String(e)));
    }
  },

  /** Загрузить вложение */
  uploadAttachment: async (requestId: string, file: File): Promise<{ url: string; fileName: string }> => {
    try {
      const response = await goldpcApi.postServicesIdUpload(requestId, { file });
      return extractData<{ url: string; fileName: string }>(response);
    } catch (e) {
      throw new Error('Failed to upload attachment: ' + (e instanceof Error ? e.message : String(e)));
    }
  },

  // ─── Admin / Master ─────────────────────────────

  /** Получить все заявки (с пагинацией, фильтрами) */
  getAllServiceRequests: async (params: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
  }): Promise<{ items: ServiceRequestDto[]; totalCount: number }> => {
    try {
      const { page, pageSize, status, search } = params;
      const response = await goldpcApi.getServices(
        { page, pageSize, status: status as any },
        search ? { params: { search } } : undefined,
      );
      return extractData<{ items: ServiceRequestDto[]; totalCount: number }>(response);
    } catch (e) {
      throw new Error('Failed to fetch all service requests: ' + (e instanceof Error ? e.message : String(e)));
    }
  },

  /** Получить неназначенные заявки */
  getUnassignedRequests: async (params: {
    page?: number;
    pageSize?: number;
  }): Promise<{ items: ServiceRequestDto[]; totalCount: number }> => {
    try {
      const { page, pageSize } = params;
      const response = await goldpcApi.getServicesUnassigned({ page, pageSize });
      return extractData<{ items: ServiceRequestDto[]; totalCount: number }>(response);
    } catch (e) {
      throw new Error('Failed to fetch unassigned requests: ' + (e instanceof Error ? e.message : String(e)));
    }
  },

  /** Назначить мастера на заявку */
  assignMaster: async (requestId: string, masterId: string): Promise<ServiceRequestDto> => {
    try {
      const response = await goldpcApi.postServicesIdAssignMasterId(requestId, masterId);
      return extractData<ServiceRequestDto>(response);
    } catch (e) {
      throw new Error('Failed to assign master: ' + (e instanceof Error ? e.message : String(e)));
    }
  },

  /** Добавить запчасть к заявке */
  addServicePart: async (requestId: string, dto: { productName: string; quantity: number; unitPrice: number }): Promise<void> => {
    try {
      const response = await goldpcApi.postServicesIdParts(requestId, dto as any);
      return extractData<void>(response);
    } catch (e) {
      throw new Error('Failed to add part: ' + (e instanceof Error ? e.message : String(e)));
    }
  },

  /** Обновить статус заявки */
  updateRequestStatus: async (requestId: string, status: string, comment?: string): Promise<ServiceRequestDto> => {
    try {
      const response = await goldpcApi.patchServicesIdStatus(requestId, { status: status as any, comment });
      return extractData<ServiceRequestDto>(response);
    } catch (e) {
      throw new Error('Failed to update request status: ' + (e instanceof Error ? e.message : String(e)));
    }
  },

  /** Добавить запчасть к заявке */
  addParts: async (requestId: string, part: ServicePartDto): Promise<ServiceRequestDto> => {
    try {
      const response = await goldpcApi.postServicesIdParts(requestId, part);
      return extractData<ServiceRequestDto>(response);
    } catch (e) {
      throw new Error('Failed to add part: ' + (e instanceof Error ? e.message : String(e)));
    }
  },

  /** Завершить заявку (с отчётом) */
  completeRequest: async (requestId: string, report: WorkReport): Promise<ServiceRequestDto> => {
    try {
      const response = await goldpcApi.putServicesIdComplete(requestId, report);
      return extractData<ServiceRequestDto>(response);
    } catch (e) {
      throw new Error('Failed to complete request: ' + (e instanceof Error ? e.message : String(e)));
    }
  },

  /** Получить отчёт по заявке */
  getReport: async (requestId: string): Promise<WorkReport> => {
    try {
      const response = await goldpcApi.getServicesIdReport(requestId);
      return extractData<WorkReport>(response);
    } catch (e) {
      throw new Error('Failed to fetch report: ' + (e instanceof Error ? e.message : String(e)));
    }
  },

  /** Получить заявки мастера */
  getMasterRequests: async (params: {
    page?: number;
    pageSize?: number;
    status?: string;
  }): Promise<{ items: ServiceRequestDto[]; totalCount: number }> => {
    try {
      const { page, pageSize, status } = params;
      const response = await goldpcApi.getServicesMaster(
        { page, pageSize, status: status as any },
      );
      return extractData<{ items: ServiceRequestDto[]; totalCount: number }>(response);
    } catch (e) {
      throw new Error('Failed to fetch master requests: ' + (e instanceof Error ? e.message : String(e)));
    }
  },

  /** Получить неназначенные заявки (для мастеров — самоназначение) */
  getAvailableServices: async (
    page: number = 1,
    pageSize: number = 15,
  ): Promise<{ items: ServiceRequestDto[]; totalCount: number }> => {
    try {
      const response = await goldpcApi.getServicesUnassigned({ page, pageSize });
      return extractData<{ items: ServiceRequestDto[]; totalCount: number }>(response);
    } catch (e) {
      throw new Error('Failed to fetch available requests: ' + (e instanceof Error ? e.message : String(e)));
    }
  },

  /** Закрыть заявку */
  closeRequest: async (requestId: string, data?: { comment?: string }): Promise<ServiceRequestDto> => {
    try {
      const response = await goldpcApi.postServicesIdClose(requestId, data);
      return extractData<ServiceRequestDto>(response);
    } catch (e) {
      throw new Error('Failed to close request: ' + (e instanceof Error ? e.message : String(e)));
    }
  },

  // ─── Backward-compatible aliases ────────────────

  /** Alias for getMasterRequests (used by master panel pages) */
  getMasterServices: async (page: number = 1, pageSize: number = 10, status?: string): Promise<{ items: ServiceRequestDto[]; totalCount: number }> => {
    return servicesApi.getMasterRequests({ page, pageSize, status });
  },

  /** Alias for updateRequestStatus (used by master panel) */
  updateTicketStatus: async (requestId: string, status: string, comment?: string): Promise<ServiceRequestDto> => {
    return servicesApi.updateRequestStatus(requestId, status, comment);
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

  // ─── Assembly methods ──────────────────────────

  /** Получить комплектующие заявки на сборку */
  getAssemblyParts: async (requestId: string): Promise<AssemblyPartDto[]> => {
    try {
      const response = await goldpcApi.getServicesIdAssemblyParts(requestId);
      return extractData<AssemblyPartDto[]>(response);
    } catch (e) {
      throw new Error('Failed to fetch assembly parts: ' + (e instanceof Error ? e.message : String(e)));
    }
  },

  /** Отметить комплектующую как полученную */
  collectPart: async (requestId: string, partId: string): Promise<ServiceRequestWithAssembly> => {
    try {
      const response = await goldpcApi.postServicesIdPartsPartIdCollect(requestId, partId);
      return extractData<ServiceRequestWithAssembly>(response);
    } catch (e) {
      throw new Error('Failed to collect part: ' + (e instanceof Error ? e.message : String(e)));
    }
  },

  /** Отметить комплектующую как установленную */
  installPart: async (requestId: string, partId: string): Promise<ServiceRequestWithAssembly> => {
    try {
      const response = await goldpcApi.postServicesIdPartsPartIdInstall(requestId, partId);
      return extractData<ServiceRequestWithAssembly>(response);
    } catch (e) {
      throw new Error('Failed to install part: ' + (e instanceof Error ? e.message : String(e)));
    }
  },

  /** Начать сборку ПК */
  startAssembly: async (requestId: string): Promise<ServiceRequestWithAssembly> => {
    try {
      const response = await goldpcApi.postServicesIdStartAssembly(requestId);
      return extractData<ServiceRequestWithAssembly>(response);
    } catch (e) {
      throw new Error('Failed to start assembly: ' + (e instanceof Error ? e.message : String(e)));
    }
  },

  /** Завершить сборку ПК */
  completeAssembly: async (requestId: string, serialNumber: string): Promise<ServiceRequestWithAssembly> => {
    try {
      const response = await goldpcApi.postServicesIdCompleteAssembly(requestId, { serialNumber });
      return extractData<ServiceRequestWithAssembly>(response);
    } catch (e) {
      throw new Error('Failed to complete assembly: ' + (e instanceof Error ? e.message : String(e)));
    }
  },

  /** Передать в доставку */
  handToDelivery: async (requestId: string): Promise<ServiceRequestWithAssembly> => {
    try {
      const response = await goldpcApi.postServicesIdHandToDelivery(requestId);
      return extractData<ServiceRequestWithAssembly>(response);
    } catch (e) {
      throw new Error('Failed to hand to delivery: ' + (e instanceof Error ? e.message : String(e)));
    }
  },

  /** Переназначить мастера */
  reassignMaster: async (requestId: string, newMasterId: string): Promise<any> => {
    try {
      const response = await goldpcApi.postServicesIdReassignNewMasterId(requestId, newMasterId);
      return extractData<any>(response);
    } catch (e) {
      throw new Error('Failed to reassign master: ' + (e instanceof Error ? e.message : String(e)));
    }
  },
};
