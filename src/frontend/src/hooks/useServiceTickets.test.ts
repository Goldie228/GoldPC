import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

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

describe('hooks/useServiceTickets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useServiceTickets());
    expect(result.current.serviceTypes).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetchServiceTypes loads service types', async () => {
    const types = [{ id: 't1', name: 'Repair' }] as any[];
    mockGetServiceTypes.mockResolvedValue(types);

    const { result } = renderHook(() => useServiceTickets());
    let res: any;
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
    const newService = { id: 's1', title: 'New' } as any;
    mockCreateService.mockResolvedValue(newService);

    const { result } = renderHook(() => useServiceTickets());
    let res: any;
    await act(async () => {
      res = await result.current.createService({ title: 'New', description: 'desc', serviceTypeId: 't1' } as any);
    });

    expect(res).toEqual(newService);
  });

  it('createService sets error on failure', async () => {
    mockCreateService.mockRejectedValue(new Error('Bad Request'));

    const { result } = renderHook(() => useServiceTickets());
    let res: any;
    await act(async () => {
      res = await result.current.createService({} as any);
    });

    expect(res).toBeNull();
    expect(result.current.error?.message).toBe('Bad Request');
  });

  it('getMyServices loads services', async () => {
    const services = { items: [{ id: 's1' }], total: 1 } as any;
    mockGetMyServices.mockResolvedValue(services);

    const { result } = renderHook(() => useServiceTickets());
    let res: any;
    await act(async () => {
      res = await result.current.getMyServices(1, 10);
    });

    expect(res).toEqual(services);
    expect(mockGetMyServices).toHaveBeenCalledWith(1, 10);
  });

  it('getServiceById returns service', async () => {
    const service = { id: 's1', title: 'Repair' } as any;
    mockGetServiceById.mockResolvedValue(service);

    const { result } = renderHook(() => useServiceTickets());
    let res: any;
    await act(async () => {
      res = await result.current.getServiceById('s1');
    });

    expect(res).toEqual(service);
  });
});
