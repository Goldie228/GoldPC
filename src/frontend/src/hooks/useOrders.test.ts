import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockGetMyOrders = vi.fn();
const mockGetOrder = vi.fn();
const mockGetOrderByNumber = vi.fn();
const mockGetOrderTracking = vi.fn();
const mockCancelOrder = vi.fn();
const mockGetDeliveryQuote = vi.fn();
const mockCreateOrder = vi.fn();

vi.mock('../api/orders', () => ({
  ordersApi: {
    getMyOrders: (...args: any[]) => mockGetMyOrders(...args),
    getOrder: (...args: any[]) => mockGetOrder(...args),
    getOrderByNumber: (...args: any[]) => mockGetOrderByNumber(...args),
    getOrderTracking: (...args: any[]) => mockGetOrderTracking(...args),
    cancelOrder: (...args: any[]) => mockCancelOrder(...args),
    getDeliveryQuote: (...args: any[]) => mockGetDeliveryQuote(...args),
    createOrder: (...args: any[]) => mockCreateOrder(...args),
  },
}));

import { useOrders } from './useOrders';

describe('hooks/useOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useOrders());
    expect(result.current.orders).toBeNull();
    expect(result.current.totalCount).toBe(0);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('getMyOrders loads orders', async () => {
    const response = { items: [{ id: 'o1', status: 'Confirmed' }], totalCount: 1 } as any;
    mockGetMyOrders.mockResolvedValue(response);

    const { result } = renderHook(() => useOrders());
    let res: any;
    await act(async () => {
      res = await result.current.getMyOrders(1, 10);
    });

    expect(res).toEqual(response);
    expect(result.current.orders).toEqual(response.items);
    expect(result.current.totalCount).toBe(1);
    expect(result.current.loading).toBe(false);
  });

  it('getMyOrders sets error on failure', async () => {
    mockGetMyOrders.mockRejectedValue(new Error('API error'));

    const { result } = renderHook(() => useOrders());
    await act(async () => {
      await result.current.getMyOrders();
    });

    expect(result.current.error?.message).toBe('API error');
  });

  it('getOrder returns order by id', async () => {
    const order = { id: 'o1', status: 'Delivered' } as any;
    mockGetOrder.mockResolvedValue(order);

    const { result } = renderHook(() => useOrders());
    let res: any;
    await act(async () => {
      res = await result.current.getOrder('o1');
    });

    expect(res).toEqual(order);
  });

  it('getOrder sets error on failure', async () => {
    mockGetOrder.mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useOrders());
    await act(async () => {
      await result.current.getOrder('bad');
    });

    expect(result.current.error?.message).toBe('Not found');
  });

  it('createOrder calls API', async () => {
    const newOrder = { id: 'o2' } as any;
    mockCreateOrder.mockResolvedValue(newOrder);

    const { result } = renderHook(() => useOrders());
    let res: any;
    await act(async () => {
      res = await result.current.createOrder({} as any);
    });

    expect(res).toEqual(newOrder);
  });

  it('getDeliveryQuote returns quote', async () => {
    const quote = { subtotal: 100, deliveryCost: 10, total: 110 } as any;
    mockGetDeliveryQuote.mockResolvedValue(quote);

    const { result } = renderHook(() => useOrders());
    let res: any;
    await act(async () => {
      res = await result.current.getDeliveryQuote({} as any);
    });

    expect(res).toEqual(quote);
  });

  it('cancelOrder calls API', async () => {
    mockCancelOrder.mockResolvedValue({});

    const { result } = renderHook(() => useOrders());
    await act(async () => {
      await result.current.cancelOrder('o1');
    });

    expect(mockCancelOrder).toHaveBeenCalledWith('o1');
  });
});
