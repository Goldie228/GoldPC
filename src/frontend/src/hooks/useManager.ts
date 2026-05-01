import { useState, useCallback } from 'react';
import { managerApi, type DashboardData } from '../api/manager';

export interface UseManagerReturn {
  dashboardData: DashboardData | null;
  orders: any[] | null;
  totalCount: number;
  loading: boolean;
  error: Error | null;
  getDashboardData: () => Promise<DashboardData | null>;
  getOrders: (page?: number, pageSize?: number, status?: string) => Promise<{ items: any[], totalCount: number } | null>;
  getOrderById: (id: string) => Promise<any | null>;
  getInventory: (page?: number, pageSize?: number) => Promise<{ items: any[], totalCount: number } | null>;
}

export function useManager(): UseManagerReturn {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [orders, setOrders] = useState<any[] | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await managerApi.getDashboardData();
      setDashboardData(result);
      return result;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to fetch dashboard');
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getOrders = useCallback(async (page = 1, pageSize = 20, status?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await managerApi.getOrders(page, pageSize, status);
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

  const getOrderById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      return await managerApi.getOrderById(id);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to fetch order');
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getInventory = useCallback(async (page = 1, pageSize = 50) => {
    setLoading(true);
    setError(null);
    try {
      return await managerApi.getInventory(page, pageSize);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to fetch inventory');
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    dashboardData,
    orders,
    totalCount,
    loading,
    error,
    getDashboardData,
    getOrders,
    getOrderById,
    getInventory,
  };
}

export default useManager;