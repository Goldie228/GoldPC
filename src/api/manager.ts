/**
 * Manager API service
 * Интеграция с бэкендом для панели менеджера
 */

import apiClient from './client';

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
  /**
   * Получить данные для дашборда менеджера
   * Агрегирует данные из Orders API и Catalog API
   */
  async getDashboardData(): Promise<DashboardData> {
    // Получаем заказы
    const ordersResponse = await apiClient.get<any>('/orders', {
      params: { page: 1, pageSize: 100 }
    });
    const orders = ordersResponse.data?.data || ordersResponse.data || { items: [], totalCount: 0 };

    // Получаем товары
    const catalogResponse = await apiClient.get<any>('/catalog/products', {
      params: { page: 1, pageSize: 100, inStock: true }
    });
    const products = catalogResponse.data?.data || catalogResponse.data || { items: [] };

    // Формируем виджеты
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

    // Товары с низким остатком
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
  }
};
