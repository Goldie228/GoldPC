import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi, type Order, type PagedResult, type CreateOrderRequest, type DeliveryQuoteRequest, type DeliveryQuoteResponse } from '../api/orders';

/* ── Query keys ─────────────────────────────────────────────── */
export const orderKeys = {
  all: ['orders'] as const,
  my: (page: number, pageSize: number, status?: string) =>
    [...orderKeys.all, 'my', { page, pageSize, status }] as const,
  detail: (id: string) => [...orderKeys.all, id] as const,
  byNumber: (num: string) => [...orderKeys.all, 'num', num] as const,
  tracking: (num: string) => [...orderKeys.all, 'tracking', num] as const,
};

/* ── Hook ───────────────────────────────────────────────────── */
export function useOrders() {
  const qc = useQueryClient();

  /* ── Reads (cached) ─────────────────────────────────────── */
  const myOrdersQuery = useQuery<PagedResult<Order>>({
    queryKey: orderKeys.my(1, 10),
    queryFn: () => ordersApi.getMyOrders(1, 10),
    staleTime: 30_000,
  });

  const getMyOrders = useCallback(
    async (page = 1, pageSize = 10, status?: string) => {
      return qc.fetchQuery({
        queryKey: orderKeys.my(page, pageSize, status),
        queryFn: () => ordersApi.getMyOrders(page, pageSize, status),
        staleTime: 30_000,
      });
    },
    [qc],
  );

  const getOrder = useCallback(
    async (id: string) => {
      return qc.fetchQuery({
        queryKey: orderKeys.detail(id),
        queryFn: () => ordersApi.getOrder(id),
        staleTime: 30_000,
      });
    },
    [qc],
  );

  const getOrderByNumber = useCallback(
    async (orderNumber: string) => {
      return qc.fetchQuery({
        queryKey: orderKeys.byNumber(orderNumber),
        queryFn: () => ordersApi.getOrderByNumber(orderNumber),
        staleTime: 30_000,
      });
    },
    [qc],
  );

  const getOrderTracking = useCallback(
    async (orderNumber: string) => {
      return qc.fetchQuery({
        queryKey: orderKeys.tracking(orderNumber),
        queryFn: () => ordersApi.getOrderTracking(orderNumber),
        staleTime: 60_000,
      });
    },
    [qc],
  );

  /* ── Writes (mutate + invalidate) ───────────────────────── */
  const cancelMutation = useMutation({
    mutationFn: (id: string) => ordersApi.cancelOrder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: orderKeys.all }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateOrderRequest) => ordersApi.createOrder(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: orderKeys.all }),
  });

  const cancelOrder = useCallback(
    async (id: string) => cancelMutation.mutateAsync(id),
    [cancelMutation],
  );

  const createOrder = useCallback(
    async (data: CreateOrderRequest) => createMutation.mutateAsync(data),
    [createMutation],
  );

  /* ── Delivery quote (no cache) ──────────────────────────── */
  const getDeliveryQuote = useCallback(
    async (payload: DeliveryQuoteRequest): Promise<DeliveryQuoteResponse | null> => {
      try {
        return await ordersApi.getDeliveryQuote(payload);
      } catch {
        return null;
      }
    },
    [],
  );

  return {
    orders: myOrdersQuery.data?.items ?? null,
    totalCount: myOrdersQuery.data?.totalCount ?? 0,
    loading: myOrdersQuery.isLoading || cancelMutation.isPending || createMutation.isPending,
    error: myOrdersQuery.error,
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
