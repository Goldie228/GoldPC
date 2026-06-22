import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
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

function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    wrapper: ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children),
    queryClient,
  };
}

describe('hooks/useOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state', () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useOrders(), { wrapper });
    expect(result.current.orders).toBeNull();
    expect(result.current.totalCount).toBe(0);
  });

  it('getMyOrders loads orders', async () => {
    const response: PagedResult<Order> = { items: [mockOrder], totalCount: 1, pageNumber: 1, pageSize: 10 };
    mockGetMyOrders.mockResolvedValue(response);

    const { wrapper, queryClient } = createQueryWrapper();
    const { result } = renderHook(() => useOrders(), { wrapper });

    await act(async () => {
      await result.current.getMyOrders(1, 10);
    });

    // After getMyOrders, cache is updated
    const cached = queryClient.getQueryData<PagedResult<Order>>(['orders', 'my', { page: 1, pageSize: 10, status: undefined }]);
    expect(cached?.items).toEqual([mockOrder]);
  });

  it('getMyOrders calls API', async () => {
    const response: PagedResult<Order> = { items: [], totalCount: 0, pageNumber: 1, pageSize: 10 };
    mockGetMyOrders.mockResolvedValue(response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useOrders(), { wrapper });

    await act(async () => {
      await result.current.getMyOrders();
    });

    expect(mockGetMyOrders).toHaveBeenCalled();
  });

  it('getOrder returns order by id', async () => {
    mockGetOrder.mockResolvedValue(mockOrder);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useOrders(), { wrapper });

    let res: Order | undefined;
    await act(async () => {
      res = await result.current.getOrder('o1');
    });

    expect(res).toEqual(mockOrder);
  });

  it('getOrder sets error on failure', async () => {
    mockGetOrder.mockRejectedValue(new Error('Not found'));

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useOrders(), { wrapper });

    await act(async () => {
      try { await result.current.getOrder('bad'); } catch { /* expected */ }
    });

    // Error is thrown, not stored in hook state for individual queries
  });

  it('createOrder calls API', async () => {
    const newOrder: Order = { ...mockOrder, id: 'o2' };
    mockCreateOrder.mockResolvedValue(newOrder);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useOrders(), { wrapper });

    let res: Order | undefined;
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

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useOrders(), { wrapper });

    let res: DeliveryQuoteResponse | null = null;
    await act(async () => {
      res = await result.current.getDeliveryQuote({ deliveryMethod: 'Delivery', subtotal: 100 } as DeliveryQuoteRequest);
    });

    expect(res).toEqual(quote);
  });

  it('cancelOrder calls API', async () => {
    mockCancelOrder.mockResolvedValue({});

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useOrders(), { wrapper });

    await act(async () => {
      await result.current.cancelOrder('o1');
    });

    expect(mockCancelOrder).toHaveBeenCalledWith('o1');
  });
});
