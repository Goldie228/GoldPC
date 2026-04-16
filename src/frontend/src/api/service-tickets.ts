import apiClient from './client';

/**
 * Service Ticket statuses
 */
export const TICKET_STATUSES = [
  { key: 'New', label: 'Новый', color: 'blue' },
  { key: 'Diagnosing', label: 'Диагностика', color: 'yellow' },
  { key: 'Repairing', label: 'Ремонт', color: 'orange' },
  { key: 'WaitingParts', label: 'Ожидание запчастей', color: 'purple' },
  { key: 'Testing', label: 'Тестирование', color: 'cyan' },
  { key: 'Ready', label: 'Готов к выдаче', color: 'green' },
  { key: 'Completed', label: 'Завершён', color: 'gray' },
  { key: 'Cancelled', label: 'Отменён', color: 'red' },
] as const;

export type TicketStatus = typeof TICKET_STATUSES[number]['key'];

/**
 * Service Ticket interface
 */
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
  technician?: {
    id: string;
    name: string;
  };
  notes: string;
  estimatedCompletion?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

/**
 * Ticket status history entry
 */
export interface TicketStatusHistory {
  id: string;
  status: TicketStatus;
  createdAt: string;
  note?: string;
  author?: string;
}

/**
 * Ticket message
 */
export interface TicketMessage {
  id: string;
  author: 'customer' | 'technician' | 'system';
  authorName?: string;
  content: string;
  createdAt: string;
  attachments?: string[];
}

/**
 * Create ticket request
 */
export interface CreateTicketRequest {
  deviceType: string;
  brand: string;
  model: string;
  issueDescription: string;
  preferredContact: 'phone' | 'email' | 'whatsapp' | 'telegram';
  serialNumber?: string;
  purchaseDate?: string;
}

/**
 * Create ticket response
 */
export interface CreateTicketResponse {
  id: string;
  ticketNumber: string;
  status: TicketStatus;
  createdAt: string;
}

/**
 * Get user tickets
 */
async function getMyTickets(page = 1, pageSize = 10, status?: string): Promise<{ items: ServiceTicket[], total: number }> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (status && status !== 'all') params.append('status', status);

  const response = await apiClient.get(`/service-tickets?${params}`);
  return response.data;
}

/**
 * Get ticket by ID
 */
async function getTicket(id: string): Promise<ServiceTicket> {
  const response = await apiClient.get(`/service-tickets/${id}`);
  return response.data;
}

/**
 * Get ticket status history
 */
async function getTicketHistory(id: string): Promise<TicketStatusHistory[]> {
  const response = await apiClient.get(`/service-tickets/${id}/history`);
  return response.data;
}

/**
 * Get ticket messages
 */
async function getTicketMessages(id: string): Promise<TicketMessage[]> {
  const response = await apiClient.get(`/service-tickets/${id}/messages`);
  return response.data;
}

/**
 * Send message to technician
 */
async function sendMessage(ticketId: string, content: string): Promise<TicketMessage> {
  const response = await apiClient.post(`/service-tickets/${ticketId}/messages`, { content });
  return response.data;
}

/**
 * Create new service ticket
 */
async function createTicket(data: CreateTicketRequest): Promise<CreateTicketResponse> {
  const response = await apiClient.post('/service-tickets', data);
  return response.data;
}

export const serviceTicketsApi = {
  getMyTickets,
  getTicket,
  getTicketHistory,
  getTicketMessages,
  sendMessage,
  createTicket,
};
