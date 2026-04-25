/**
 * Manager API service
 * Интеграция с бэкендом для панели менеджера
 */

import apiClient from './client';
import type { Order, Product } from './types';

export interface DashboardWidget {
  id: string;
  title: string;
  value: string | number;
  change?: string;
  icon: string;
  trend?: 'up' | 'down' | 'neutral';
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  link?: string;
}

export interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  threshold: number;
}

export interface PendingTicket {
  id: string;
  customer: string;
  subject: string;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}

export interface DashboardData {
  widgets: DashboardWidget[];
  lowStock: LowStockItem[];
  pendingTickets: PendingTicket[];
}

export const managerApi = {
  async getDashboardData(): Promise<DashboardData> {
    const [ordersRes, catalogRes] = await Promise.all([
      apiClient.get<any>('/orders', { params: { page: 1, pageSize: 100 } }),
      apiClient.get<any>('/catalog/products', { params: { page: 1, pageSize: 100, inStock: true } })
    ]);

    const orders = ordersRes.data?.data || ordersRes.data || { items: [] };
    const products = catalogRes.data?.data || catalogRes.data || { items: [] };

    const widgets: DashboardWidget[] = [
      {
        id: 'today-orders',
        title: 'Заказы сегодня',
        value: orders.items?.length || 0,
        icon: '📦',
        trend: 'up',
        color: 'blue',
        link: '/manager/orders'
      },
      {
        id: 'pending-orders',
        title: 'Ожидают обработки',
        value: orders.items?.filter((o: any) => o.status === 'pending').length || 0,
        icon: '⏳',
        trend: 'neutral',
        color: 'yellow',
        link: '/manager/orders?status=pending'
      },
      {
        id: 'low-stock',
        title: 'Товары с низким остатком',
        value: products.items?.filter((p: any) => p.stock > 0 && p.stock < 5).length || 0,
        icon: '⚠️',
        trend: 'neutral',
        color: 'red',
        link: '/manager/inventory'
      }
    ];

    const lowStock: LowStockItem[] = (products.items || [])
      .filter((p: any) => p.stock > 0 && p.stock < 5)
      .slice(0, 10)
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stock: p.stock,
        threshold: 5
      }));

    return { widgets, lowStock, pendingTickets: [] };
  },

  async getOrders(page = 1, pageSize = 20, status?: string) {
    const params: any = { page, pageSize };
    if (status) params.status = status;
    const response = await apiClient.get<any>('/orders', { params });
    return response.data?.data || response.data || { items: [], totalCount: 0 };
  },

  async getOrderById(id: string) {
    const response = await apiClient.get<any>(`/orders/${id}`);
    return response.data?.data || response.data;
  },

  async getInventory(page = 1, pageSize = 50) {
    const response = await apiClient.get<any>('/catalog/products', {
      params: { page, pageSize, inStock: true }
    });
    return response.data?.data || response.data || { items: [], totalCount: 0 };
  }
};
