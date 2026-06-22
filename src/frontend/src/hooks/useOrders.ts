import { useState, useCallback } from 'react';
import { ordersApi, type Order, type PagedResult, type CreateOrderRequest, type DeliveryQuoteRequest, type DeliveryQuoteResponse } from '../api/orders';

export interface UseOrdersReturn {
  orders: Order[] | null;
  totalCount: number;
  loading: boolean;
  error: Error | null;
  getMyOrders: (page?: number, pageSize?: number, status?: string) => Promise<PagedResult<Order> | null>;
  getOrder: (id: string) => Promise<Order | null>;
  getOrderByNumber: (orderNumber: string) => Promise<Order | null>;
  getOrderTracking: (orderNumber: string) => Promise<Order | null>;
  cancelOrder: (id: string) => Promise<Order | null>;
  getDeliveryQuote: (payload: DeliveryQuoteRequest) => Promise<DeliveryQuoteResponse | null>;
  createOrder: (data: CreateOrderRequest) => Promise<Order | null>;
}

export function useOrders(): UseOrdersReturn {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getMyOrders = useCallback(async (page = 1, pageSize = 10, status?: string): Promise<PagedResult<Order> | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await ordersApi.getMyOrders(page, pageSize, status);
      setOrders(result.items);
      setTotalCount(result.totalCount);
      return result;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to fetch orders');
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getOrder = useCallback(async (id: string): Promise<Order | null> => {
    setLoading(true);
    setError(null);
    try {
      return await ordersApi.getOrder(id);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to fetch order');
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getOrderByNumber = useCallback(async (orderNumber: string): Promise<Order | null> => {
    setLoading(true);
    setError(null);
    try {
      return await ordersApi.getOrderByNumber(orderNumber);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to fetch order');
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getOrderTracking = useCallback(async (orderNumber: string): Promise<Order | null> => {
    setLoading(true);
    setError(null);
    try {
      return await ordersApi.getOrderTracking(orderNumber);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to fetch tracking');
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelOrder = useCallback(async (id: string): Promise<Order | null> => {
    setLoading(true);
    setError(null);
    try {
      return await ordersApi.cancelOrder(id);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to cancel order');
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDeliveryQuote = useCallback(async (payload: DeliveryQuoteRequest): Promise<DeliveryQuoteResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      return await ordersApi.getDeliveryQuote(payload);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to get delivery quote');
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrder = useCallback(async (data: CreateOrderRequest): Promise<Order | null> => {
    setLoading(true);
    setError(null);
    try {
      return await ordersApi.createOrder(data);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to create order');
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    orders,
    totalCount,
    loading,
    error,
    getMyOrders,
    getOrder,
    getOrderByNumber,
    getOrderTracking,
    cancelOrder,
    getDeliveryQuote,
    createOrder,
  };
}

export default useOrders;