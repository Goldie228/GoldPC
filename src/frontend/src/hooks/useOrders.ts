import { useMutation } from '@tanstack/react-query';
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
  const getMyOrdersMutation = useMutation({
    mutationFn: ({ page, pageSize, status }: { page: number; pageSize: number; status?: string }) =>
      ordersApi.getMyOrders(page, pageSize, status),
  });

  const getOrderMutation = useMutation({
    mutationFn: (id: string) => ordersApi.getOrder(id),
  });

  const getOrderByNumberMutation = useMutation({
    mutationFn: (orderNumber: string) => ordersApi.getOrderByNumber(orderNumber),
  });

  const getOrderTrackingMutation = useMutation({
    mutationFn: (orderNumber: string) => ordersApi.getOrderTracking(orderNumber),
  });

  const cancelOrderMutation = useMutation({
    mutationFn: (id: string) => ordersApi.cancelOrder(id),
  });

  const getDeliveryQuoteMutation = useMutation({
    mutationFn: (payload: DeliveryQuoteRequest) => ordersApi.getDeliveryQuote(payload),
  });

  const createOrderMutation = useMutation({
    mutationFn: (data: CreateOrderRequest) => ordersApi.createOrder(data),
  });

  const getMyOrders = async (page = 1, pageSize = 10, status?: string): Promise<PagedResult<Order> | null> => {
    try {
      return await getMyOrdersMutation.mutateAsync({ page, pageSize, status });
    } catch {
      return null;
    }
  };

  const getOrder = async (id: string): Promise<Order | null> => {
    try {
      return await getOrderMutation.mutateAsync(id);
    } catch {
      return null;
    }
  };

  const getOrderByNumber = async (orderNumber: string): Promise<Order | null> => {
    try {
      return await getOrderByNumberMutation.mutateAsync(orderNumber);
    } catch {
      return null;
    }
  };

  const getOrderTracking = async (orderNumber: string): Promise<Order | null> => {
    try {
      return await getOrderTrackingMutation.mutateAsync(orderNumber);
    } catch {
      return null;
    }
  };

  const cancelOrder = async (id: string): Promise<Order | null> => {
    try {
      return await cancelOrderMutation.mutateAsync(id);
    } catch {
      return null;
    }
  };

  const getDeliveryQuote = async (payload: DeliveryQuoteRequest): Promise<DeliveryQuoteResponse | null> => {
    try {
      return await getDeliveryQuoteMutation.mutateAsync(payload);
    } catch {
      return null;
    }
  };

  const createOrder = async (data: CreateOrderRequest): Promise<Order | null> => {
    try {
      return await createOrderMutation.mutateAsync(data);
    } catch {
      return null;
    }
  };

  const loading = getMyOrdersMutation.isPending
    || getOrderMutation.isPending
    || getOrderByNumberMutation.isPending
    || getOrderTrackingMutation.isPending
    || cancelOrderMutation.isPending
    || getDeliveryQuoteMutation.isPending
    || createOrderMutation.isPending;

  const error = getMyOrdersMutation.error
    || getOrderMutation.error
    || getOrderByNumberMutation.error
    || getOrderTrackingMutation.error
    || cancelOrderMutation.error
    || getDeliveryQuoteMutation.error
    || createOrderMutation.error;

  const orders = getMyOrdersMutation.data?.items ?? null;
  const totalCount = getMyOrdersMutation.data?.totalCount ?? 0;

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
