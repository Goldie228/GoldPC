import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Order, PagedResult, CreateOrderRequest, DeliveryQuoteRequest, DeliveryQuoteResponse } from '../api/orders';

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

const mockOrder: Order = {
  id: 'o1',
  userId: 'u1',
  orderNumber: 'ORD-001',
  customerFirstName: 'John',
  customerLastName: 'Doe',
  customerPhone: '+375291234567',
  customerEmail: 'john@test.com',
  status: 'Confirmed',
  total: 100,
  subtotal: 90,
  deliveryCost: 10,
  discountAmount: 0,
  deliveryMethod: 'Delivery',
  paymentMethod: 'Online',
  createdAt: '2024-01-01',
  items: [],
};

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
    const response: PagedResult<Order> = { items: [mockOrder], totalCount: 1, pageNumber: 1, pageSize: 10 };
    mockGetMyOrders.mockResolvedValue(response);

    const { result } = renderHook(() => useOrders());
    let res: PagedResult<Order> | null = null;
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
    mockGetOrder.mockResolvedValue(mockOrder);

    const { result } = renderHook(() => useOrders());
    let res: Order | null = null;
    await act(async () => {
      res = await result.current.getOrder('o1');
    });

    expect(res).toEqual(mockOrder);
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
    const newOrder: Order = { ...mockOrder, id: 'o2' };
    mockCreateOrder.mockResolvedValue(newOrder);

    const { result } = renderHook(() => useOrders());
    let res: Order | null = null;
    await act(async () => {
      res = await result.current.createOrder({
        firstName: 'John',
        lastName: 'Doe',
        phone: '+375291234567',
        email: 'john@test.com',
        deliveryMethod: 'Pickup',
        paymentMethod: 'Online',
        items: [],
      } as CreateOrderRequest);
    });

    expect(res).toEqual(newOrder);
  });

  it('getDeliveryQuote returns quote', async () => {
    const quote: DeliveryQuoteResponse = { subtotal: 100, deliveryCost: 10, total: 110 };
    mockGetDeliveryQuote.mockResolvedValue(quote);

    const { result } = renderHook(() => useOrders());
    let res: DeliveryQuoteResponse | null = null;
    await act(async () => {
      res = await result.current.getDeliveryQuote({ deliveryMethod: 'Delivery', subtotal: 100 } as DeliveryQuoteRequest);
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
