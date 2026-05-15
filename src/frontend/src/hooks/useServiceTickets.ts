import { useState, useCallback } from 'react';
import {
  servicesApi,
  type ServiceTicket,
  type TicketStatusHistory,
  type TicketMessage,
  type CreateTicketRequest,
  type ServiceType,
  type CreateServiceRequest,
  type ServiceRequestDto,
} from '../api/services';

export interface UseServiceTicketsReturn {
  // Новые методы
  serviceTypes: ServiceType[];
  fetchServiceTypes: () => Promise<ServiceType[]>;
  createService: (data: CreateServiceRequest) => Promise<ServiceRequestDto | null>;
  // Старые методы (deprecated)
  tickets: ServiceTicket[];
  total: number;
  loading: boolean;
  error: Error | null;
  getMyTickets: (page?: number, pageSize?: number, status?: string) => Promise<{ items: ServiceTicket[]; total: number } | null>;
  getTicket: (id: string) => Promise<ServiceTicket | null>;
  getTicketHistory: (id: string) => Promise<TicketStatusHistory[] | null>;
  getTicketMessages: (id: string) => Promise<TicketMessage[] | null>;
  sendMessage: (ticketId: string, content: string) => Promise<TicketMessage | null>;
  /** @deprecated Используйте createService */
  createTicket: (data: CreateTicketRequest) => Promise<{ id: string; ticketNumber: string; status: string; createdAt: string } | null>;
}

export function useServiceTickets(): UseServiceTicketsReturn {
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);

  // ─── Новые методы ───

  const fetchServiceTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const types = await servicesApi.getServiceTypes();
      setServiceTypes(types);
      return types;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to fetch service types');
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createService = useCallback(async (data: CreateServiceRequest) => {
    setLoading(true);
    setError(null);
    try {
      return await servicesApi.createService(data);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to create service request');
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Старые методы ───

  const getMyTickets = useCallback(async (page = 1, pageSize = 10, status?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await servicesApi.getMyTickets(page, pageSize, status);
      setTickets(result.items);
      setTotal(result.total);
      return result;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to fetch tickets');
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTicket = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      return await servicesApi.getTicket(id);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to fetch ticket');
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTicketHistory = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      return await servicesApi.getTicketHistory(id);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to fetch ticket history');
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTicketMessages = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      return await servicesApi.getTicketMessages(id);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to fetch messages');
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (ticketId: string, content: string) => {
    setLoading(true);
    setError(null);
    try {
      return await servicesApi.sendMessage(ticketId, content);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to send message');
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createTicket = useCallback(async (data: CreateTicketRequest) => {
    setLoading(true);
    setError(null);
    try {
      return await servicesApi.createTicket(data);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to create ticket');
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // Новые
    serviceTypes,
    fetchServiceTypes,
    createService,
    // Старые
    tickets,
    total,
    loading,
    error,
    getMyTickets,
    getTicket,
    getTicketHistory,
    getTicketMessages,
    sendMessage,
    createTicket,
  };
}

export default useServiceTickets;
