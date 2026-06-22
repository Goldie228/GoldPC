import { useState, useCallback } from 'react';
import {
  servicesApi,
  type ServiceType,
  type CreateServiceRequest,
  type ServiceRequestDto,
} from '../api/services';

export interface UseServiceTicketsReturn {
  serviceTypes: ServiceType[];
  fetchServiceTypes: () => Promise<ServiceType[]>;
  createService: (data: CreateServiceRequest) => Promise<ServiceRequestDto | null>;
  getMyServices: (page?: number, pageSize?: number, status?: string) => Promise<{ items: ServiceRequestDto[]; total: number } | null>;
  getServiceById: (id: string) => Promise<ServiceRequestDto | null>;
  loading: boolean;
  error: Error | null;
}

export function useServiceTickets(): UseServiceTicketsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);

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

  const getMyServices = useCallback(async (page = 1, pageSize = 10, status?: string) => {
    setLoading(true);
    setError(null);
    try {
      return await servicesApi.getMyServiceRequests(page, pageSize);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to fetch services');
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getServiceById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      return await servicesApi.getServiceById(id);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to fetch service');
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    serviceTypes,
    fetchServiceTypes,
    createService,
    getMyServices,
    getServiceById,
    loading,
    error,
  };
}

export default useServiceTickets;
