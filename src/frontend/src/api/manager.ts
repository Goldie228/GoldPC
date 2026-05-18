/**
 * Manager API service
 * Интеграция с бэкендом для панели менеджера
 */

import apiClient from './client';

interface ApiResponse<T> {
  data?: T;
  success?: boolean;
  message?: string;
}

interface ApiPagedResponse<T> {
  items?: T[];
  totalCount?: number;
}

export interface RawOrderItem {
  id?: string;
  status?: string;
}

export interface RawProductItem {
  id?: string;
  name?: string;
  sku?: string;
  stock?: number;
}

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
      apiClient.get<ApiResponse<ApiPagedResponse<RawOrderItem>>>('/orders', { params: { page: 1, pageSize: 100 } }),
      apiClient.get<ApiResponse<ApiPagedResponse<RawProductItem>>>('/catalog/products', { params: { page: 1, pageSize: 100, inStock: true } })
    ]);

    const ordersData = ordersRes.data?.data ?? ordersRes.data as ApiPagedResponse<RawOrderItem> ?? { items: [] };
    const productsData = catalogRes.data?.data ?? catalogRes.data as ApiPagedResponse<RawProductItem> ?? { items: [] };
    const ordersItems: RawOrderItem[] = ordersData.items ?? [];
    const productsItems: RawProductItem[] = productsData.items ?? [];

    const widgets: DashboardWidget[] = [
      {
        id: 'today-orders',
        title: 'Заказы сегодня',
        value: ordersItems.length,
        icon: '📦',
        trend: 'up',
        color: 'blue',
        link: '/manager/orders'
      },
      {
        id: 'pending-orders',
        title: 'Ожидают обработки',
        value: ordersItems.filter((o) => o.status === 'pending').length,
        icon: '⏳',
        trend: 'neutral',
        color: 'yellow',
        link: '/manager/orders?status=pending'
      },
      {
        id: 'low-stock',
        title: 'Товары с низким остатком',
        value: productsItems.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) < 5).length,
        icon: '⚠️',
        trend: 'neutral',
        color: 'red',
        link: '/manager/inventory'
      }
    ];

    const lowStock: LowStockItem[] = productsItems
      .filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) < 5)
      .slice(0, 10)
      .map((p) => ({
        id: p.id ?? '',
        name: p.name ?? '',
        sku: p.sku ?? '',
        stock: p.stock ?? 0,
        threshold: 5
      }));

    return { widgets, lowStock, pendingTickets: [] };
  },

  async getOrders(page = 1, pageSize = 20, status?: string): Promise<ApiPagedResponse<RawOrderItem>> {
    const params: Record<string, string | number> = { page, pageSize };
    if (status != null && status !== '') params.status = status;
    const response = await apiClient.get<ApiResponse<ApiPagedResponse<RawOrderItem>>>('/orders', { params });
    return response.data?.data ?? (response.data as ApiPagedResponse<RawOrderItem>) ?? { items: [], totalCount: 0 };
  },

  async getOrderById(id: string): Promise<RawOrderItem | undefined> {
    const response = await apiClient.get<ApiResponse<RawOrderItem>>(`/orders/${id}`);
    return response.data?.data ?? (response.data as RawOrderItem);
  },

  async getInventory(page = 1, pageSize = 50): Promise<ApiPagedResponse<RawProductItem>> {
    const response = await apiClient.get<ApiResponse<ApiPagedResponse<RawProductItem>>>('/catalog/products', {
      params: { page, pageSize, inStock: true }
    });
    return response.data?.data ?? (response.data as ApiPagedResponse<RawProductItem>) ?? { items: [], totalCount: 0 };
  }
};
