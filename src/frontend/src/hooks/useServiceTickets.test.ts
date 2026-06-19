import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ServiceType, ServiceRequestDto, CreateServiceRequest } from '../api/services';

const mockGetServiceTypes = vi.fn();
const mockCreateService = vi.fn();
const mockGetMyServices = vi.fn();
const mockGetServiceById = vi.fn();

vi.mock('../api/services', () => ({
  servicesApi: {
    getServiceTypes: (...args: any[]) => mockGetServiceTypes(...args),
    createService: (...args: any[]) => mockCreateService(...args),
    getMyServices: (...args: any[]) => mockGetMyServices(...args),
    getServiceById: (...args: any[]) => mockGetServiceById(...args),
  },
}));

import { useServiceTickets } from './useServiceTickets';

const mockServiceType: ServiceType = {
  id: 't1',
  name: 'Repair',
  slug: 'repair',
  description: 'Repair service',
  basePrice: 50,
  estimatedDurationMinutes: 60,
};

const mockServiceRequest: ServiceRequestDto = {
  id: 's1',
  requestNumber: 'SR-001',
  clientId: 'c1',
  serviceTypeId: 't1',
  serviceTypeName: 'Repair',
  description: 'Repair',
  status: 'Submitted',
  statusLabel: 'Подана',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('hooks/useServiceTickets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useServiceTickets());
    expect(result.current.serviceTypes).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetchServiceTypes loads service types', async () => {
    const types = [mockServiceType];
    mockGetServiceTypes.mockResolvedValue(types);

    const { result } = renderHook(() => useServiceTickets());
    let res: ServiceType[] = [];
    await act(async () => {
      res = await result.current.fetchServiceTypes();
    });

    expect(res).toEqual(types);
    expect(result.current.serviceTypes).toEqual(types);
    expect(result.current.loading).toBe(false);
  });

  it('fetchServiceTypes sets error on failure', async () => {
    mockGetServiceTypes.mockRejectedValue(new Error('Network'));

    const { result } = renderHook(() => useServiceTickets());
    await act(async () => {
      await result.current.fetchServiceTypes();
    });

    expect(result.current.error?.message).toBe('Network');
    expect(result.current.serviceTypes).toEqual([]);
  });

  it('createService calls API', async () => {
    const newService = mockServiceRequest;
    mockCreateService.mockResolvedValue(newService);

    const { result } = renderHook(() => useServiceTickets());
    let res: ServiceRequestDto | null = null;
    await act(async () => {
      res = await result.current.createService({ serviceTypeId: 't1', description: 'desc' });
    });

    expect(res).toEqual(newService);
  });

  it('createService sets error on failure', async () => {
    mockCreateService.mockRejectedValue(new Error('Bad Request'));

    const { result } = renderHook(() => useServiceTickets());
    let res: ServiceRequestDto | null = null;
    await act(async () => {
      res = await result.current.createService({ serviceTypeId: '', description: '' });
    });

    expect(res).toBeNull();
    expect(result.current.error?.message).toBe('Bad Request');
  });

  it('getMyServices loads services', async () => {
    const services = { items: [mockServiceRequest], total: 1 };
    mockGetMyServices.mockResolvedValue(services);

    const { result } = renderHook(() => useServiceTickets());
    let res: { items: ServiceRequestDto[]; total: number } | null = null;
    await act(async () => {
      res = await result.current.getMyServices(1, 10);
    });

    expect(res).toEqual(services);
    expect(mockGetMyServices).toHaveBeenCalledWith(1, 10);
  });

  it('getServiceById returns service', async () => {
    const service = mockServiceRequest;
    mockGetServiceById.mockResolvedValue(service);

    const { result } = renderHook(() => useServiceTickets());
    let res: ServiceRequestDto | null = null;
    await act(async () => {
      res = await result.current.getServiceById('s1');
    });

    expect(res).toEqual(service);
  });
});
