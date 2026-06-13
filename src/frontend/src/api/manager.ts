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

/* ─── Типы для отзывов/обратной связи ─── */

export interface FeedbackItem {
  id?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  productId?: string;
  productName?: string;
  rating?: number;
  title?: string;
  text?: string;
  createdAt?: string;
  isApproved?: boolean;
}

/* ─── Типы для статистики дашборда ─── */

/** Сводная статистика (из /admin/stats) */
export interface DashboardStats {
  totalUsers?: number;
  totalOrders?: number;
  totalRevenue?: number;
  usersChange?: number;
  ordersChange?: number;
  revenueChange?: number;
}

export interface StatsResponse {
  stats: DashboardStats;
  lastUpdated: string;
}

/** Точка данных для графика */
export interface ChartPoint {
  label: string;
  value: number;
}

export interface ChartResponse {
  orders: ChartPoint[];
  revenue: ChartPoint[];
}

/** Спарклайны для карточек */
export interface SparklinesResponse {
  users: number[];
  orders: number[];
  revenue: number[];
}

/** Элемент ленты активности */
export interface ActivityItem {
  id: string;
  type: 'order' | 'registration' | 'review' | 'product' | 'service';
  text: string;
  time: string;
  icon: string;
  color: string;
}

export interface ActivityResponse {
  items: ActivityItem[];
}

/* ─── Типы ответов от API ─── */

export interface WarrantyClaimItem {
  id?: string;
  claimNumber?: number;
  clientId?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  productId?: string;
  productName?: string;
  serialNumber?: string;
  issueDescription?: string;
  status?: string | number;
  createdAt?: string;
  updatedAt?: string;
  resolvedAt?: string;
  warrantyCardId?: string;
}

export interface WarrantyCardItem {
  id?: string;
  cardNumber?: string;
  clientId?: string;
  clientName?: string;
  productId?: string;
  productName?: string;
  orderId?: string;
  issuedAt?: string;
  expiresAt?: string;
  isAnnulled?: boolean;
  annulledAt?: string;
}

export interface ServiceRequestItem {
  id?: string;
  ticketNumber?: number;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  deviceType?: string;
  deviceBrand?: string;
  deviceModel?: string;
  problemDescription?: string;
  status?: string | number;
  priority?: string;
  createdAt?: string;
  updatedAt?: string;
  assignedMasterName?: string;
  assignedMasterId?: string;
  serviceTypeName?: string;
  estimatedCost?: number;
}

export interface ServiceMessage {
  id?: string;
  senderName?: string;
  senderRole?: string;
  message?: string;
  createdAt?: string;
}

export interface RawOrderItem {
  id?: string;
  status?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  total?: number;
  createdAt?: string;
  items?: Array<{
    id?: string;
    productId?: string;
    productName?: string;
    quantity?: number;
    price?: number;
  }>;
  deliveryAddress?: string;
  deliveryComment?: string;
  paymentMethod?: string;
  deliveryMethod?: string;
  timeline?: Array<{
    status: string;
    date: string;
    active?: boolean;
  }>;
}

export interface RawProductItem {
  id?: string;
  name?: string;
  sku?: string;
  slug?: string;
  stock?: number;
  price?: number;
  category?: string;
  categoryName?: string;
}

export interface DashboardData {
  orders: RawOrderItem[];
  products: RawProductItem[];
}

export const managerApi = {
  /* ─── Статистика дашборда (проксирует /admin/stats) ─── */

  /**
   * Сводная статистика из эндпоинта /admin/stats.
   * Используйте для общих показателей (totalUsers, totalOrders, revenue и т.д.).
   */
  async getDashboardStats(): Promise<StatsResponse> {
    const response = await apiClient.get<ApiResponse<StatsResponse>>('/admin/stats');
    return response.data?.data ?? (response.data as StatsResponse) ?? { stats: {}, lastUpdated: '' };
  },

  /**
   * Данные графиков за период (today | week | month | year)
   */
  async getCharts(period: 'today' | 'week' | 'month' | 'year' = 'month'): Promise<ChartResponse> {
    const response = await apiClient.get<ApiResponse<ChartResponse>>('/admin/stats/charts', {
      params: { period },
    });
    return response.data?.data ?? (response.data as ChartResponse) ?? { orders: [], revenue: [] };
  },

  /**
   * Спарклайны для карточек статистики
   */
  async getSparklines(period: 'today' | 'week' | 'month' | 'year' = 'month'): Promise<SparklinesResponse> {
    const response = await apiClient.get<ApiResponse<SparklinesResponse>>('/admin/stats/sparklines', {
      params: { period },
    });
    return response.data?.data ?? (response.data as SparklinesResponse) ?? { users: [], orders: [], revenue: [] };
  },

  /**
   * Лента активности дашборда
   */
  async getActivity(): Promise<ActivityResponse> {
    const response = await apiClient.get<ApiResponse<ActivityResponse>>('/admin/stats/activity');
    return response.data?.data ?? (response.data as ActivityResponse) ?? { items: [] };
  },

  /* ─── Целевые запросы для дашборда менеджера ─── */

  /**
   * Товары с низким остатком (stock > 0 и stock <= limit).
   * Загружает только нужные данные вместо всего каталога.
   */
  async getLowStockProducts(limit = 20): Promise<RawProductItem[]> {
    const response = await apiClient.get<ApiResponse<ApiPagedResponse<RawProductItem>>>('/catalog/products', {
      params: { page: 1, pageSize: 200 },
    });
    const items = response.data?.data?.items ?? [];
    // Фильтруем на клиенте: stock > 0 и stock <= limit
    return items.filter((p) => {
      const stock = p.stock ?? 0;
      return stock > 0 && stock <= limit;
    }).slice(0, limit);
  },

  /**
   * Ожидающие заказы (status = new/processing).
   * Загружает только заказы нужных статусов вместо всех.
   */
  async getPendingOrders(limit = 10): Promise<RawOrderItem[]> {
    // Загружаем заказы с фильтрацией по статусу (если API поддерживает)
    const response = await apiClient.get<ApiResponse<ApiPagedResponse<RawOrderItem>>>('/orders', {
      params: { page: 1, pageSize: limit * 2 },
    });
    const items = response.data?.data?.items ?? [];
    // Фильтруем заказы со статусом new/processing на клиенте
    return items.filter((o) => {
      const s = String(o.status ?? '').toLowerCase();
      return s === '0' || s === 'new' || s === 'pending' || s === '1' || s === 'processing';
    }).slice(0, limit);
  },

  /**
   * Заказы за сегодня (для карточки "Заказы сегодня")
   */
  async getTodayOrders(): Promise<RawOrderItem[]> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const response = await apiClient.get<ApiResponse<ApiPagedResponse<RawOrderItem>>>('/orders', {
      params: { page: 1, pageSize: 100 },
    });
    const items = response.data?.data?.items ?? [];
    return items.filter((o) => {
      if (o.createdAt == null) return false;
      return new Date(o.createdAt) >= startOfDay;
    });
  },

  /**
   * Выручка за текущий месяц (заказы со статусом completed/delivered за текущий месяц)
   */
  async getMonthlyRevenue(): Promise<{ revenue: number; orderCount: number }> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const response = await apiClient.get<ApiResponse<ApiPagedResponse<RawOrderItem>>>('/orders', {
      params: { page: 1, pageSize: 200 },
    });
    const items = response.data?.data?.items ?? [];
    const monthOrders = items.filter((o) => {
      const status = String(o.status ?? '').toLowerCase();
      return (
        (status === '5' || status === 'completed' || status === 'delivered') &&
        o.createdAt != null &&
        new Date(o.createdAt) >= monthStart
      );
    });
    return {
      revenue: monthOrders.reduce((sum, o) => sum + (o.total ?? 0), 0),
      orderCount: monthOrders.length,
    };
  },

  /**
   * @deprecated Используйте целевые запросы: getLowStockProducts, getPendingOrders, getTodayOrders, getMonthlyRevenue
   * Получение данных для дашборда менеджера — загружает ВСЕ заказы и товары.
   */
  async getDashboardData(): Promise<DashboardData> {
    const [ordersRes, catalogRes] = await Promise.all([
      apiClient.get<ApiResponse<ApiPagedResponse<RawOrderItem>>>('/orders', { params: { page: 1, pageSize: 1000 } }),
      apiClient.get<ApiResponse<ApiPagedResponse<RawProductItem>>>('/catalog/products', { params: { page: 1, pageSize: 1000 } })
    ]);

    const ordersData = ordersRes.data?.data ?? ordersRes.data as ApiPagedResponse<RawOrderItem> ?? { items: [] };
    const productsData = catalogRes.data?.data ?? catalogRes.data as ApiPagedResponse<RawProductItem> ?? { items: [] };

    return {
      orders: ordersData.items ?? [],
      products: productsData.items ?? [],
    };
  },

  /**
   * Получение списка заказов с фильтрацией по статусу и поиску
   */
  async getOrders(page = 1, pageSize = 20, status?: string, search?: string): Promise<ApiPagedResponse<RawOrderItem>> {
    const params: Record<string, string | number> = { page, pageSize };
    if (status != null && status !== '') params.status = status;
    if (search != null && search !== '') params.search = search;
    const response = await apiClient.get<ApiResponse<ApiPagedResponse<RawOrderItem>>>('/orders', { params });
    return response.data?.data ?? (response.data as ApiPagedResponse<RawOrderItem>) ?? { items: [], totalCount: 0 };
  },

  /**
   * Получение заказа по ID
   */
  async getOrderById(id: string): Promise<RawOrderItem | undefined> {
    const response = await apiClient.get<ApiResponse<RawOrderItem>>(`/orders/${id}`);
    return response.data?.data ?? (response.data as RawOrderItem);
  },

  /**
   * Изменение статуса заказа
   */
  async updateOrderStatus(orderId: string, status: string): Promise<RawOrderItem> {
    const response = await apiClient.put<ApiResponse<RawOrderItem>>(`/orders/${orderId}/status`, { status });
    return response.data?.data ?? (response.data as RawOrderItem);
  },

  /**
   * Отмена заказа
   */
  async cancelOrder(orderId: string): Promise<RawOrderItem> {
    const response = await apiClient.post<ApiResponse<RawOrderItem>>(`/orders/${orderId}/cancel`);
    return response.data?.data ?? (response.data as RawOrderItem);
  },

  /**
   * Получение списка товаров для инвентаря
   * Не фильтрует по inStock -- показываем все товары для полной картины склада
   */
  async getInventory(page = 1, pageSize = 50): Promise<ApiPagedResponse<RawProductItem>> {
    const response = await apiClient.get('/catalog/products', {
      params: { page, pageSize }
    });
    // API returns { data: [...products] } — data is the array of products
    const items: RawProductItem[] = response.data?.data ?? [];
    return {
      items,
      totalCount: items.length,
    };
  },

  /* ─── Сервисные заявки ─── */

  /**
   * Получение списка сервисных заявок с фильтрацией по статусу
   */
  async getServiceRequests(page = 1, pageSize = 20, status?: string): Promise<ApiPagedResponse<ServiceRequestItem>> {
    const params: Record<string, string | number> = { page, pageSize };
    if (status != null && status !== '') params.status = status;
    const response = await apiClient.get<ApiResponse<ApiPagedResponse<ServiceRequestItem>>>('/services', { params });
    return response.data?.data ?? (response.data as ApiPagedResponse<ServiceRequestItem>) ?? { items: [], totalCount: 0 };
  },

  /**
   * Получение сервисной заявки по ID
   */
  async getServiceRequestById(id: string): Promise<ServiceRequestItem | undefined> {
    const response = await apiClient.get<ApiResponse<ServiceRequestItem>>(`/services/${id}`);
    return response.data?.data ?? (response.data as ServiceRequestItem);
  },

  /**
   * Назначение мастера на заявку
   */
  async assignMaster(serviceId: string, masterId: string): Promise<void> {
    await apiClient.post(`/services/${serviceId}/assign/${masterId}`);
  },

  /**
   * Изменение статуса сервисной заявки
   */
  async updateServiceStatus(serviceId: string, status: string): Promise<void> {
    await apiClient.patch(`/services/${serviceId}/status`, { status });
  },

  /**
   * Закрытие сервисной заявки
   */
  async closeServiceRequest(serviceId: string): Promise<void> {
    await apiClient.post(`/services/${serviceId}/close`);
  },

  /**
   * Получение сообщений сервисной заявки
   */
  async getServiceMessages(serviceId: string): Promise<ServiceMessage[]> {
    const response = await apiClient.get<ApiResponse<ServiceMessage[]>>(`/services/${serviceId}/messages`);
    return response.data?.data ?? (response.data as ServiceMessage[]) ?? [];
  },

  /* ─── Гарантийные претензии ─── */

  /**
   * Получение списка гарантийных претензий с фильтрацией по статусу
   */
  async getWarrantyClaims(page = 1, pageSize = 20, status?: string): Promise<ApiPagedResponse<WarrantyClaimItem>> {
    const params: Record<string, string | number> = { page, pageSize };
    if (status != null && status !== '') params.status = status;
    const response = await apiClient.get<ApiResponse<ApiPagedResponse<WarrantyClaimItem>>>('/warranty/claim', { params });
    const data = response.data?.data ?? [];
    return { items: Array.isArray(data) ? data : [], totalCount: Array.isArray(data) ? data.length : 0 };
  },

  /**
   * Получение гарантийной претензии по ID
   */
  async getWarrantyClaimById(id: string): Promise<WarrantyClaimItem | undefined> {
    const response = await apiClient.get<ApiResponse<WarrantyClaimItem>>(`/warranty/claim/${id}`);
    return response.data?.data ?? (response.data as WarrantyClaimItem);
  },

  /**
   * Изменение статуса гарантийной претензии
   */
  async updateWarrantyClaimStatus(claimId: string, status: string): Promise<void> {
    await apiClient.put(`/warranty/claim/${claimId}/status`, { status });
  },

  /**
   * Завершение гарантийной претензии
   */
  async resolveWarrantyClaim(claimId: string): Promise<void> {
    await apiClient.post(`/warranty/claim/${claimId}/resolve`);
  },

  /* ─── Гарантийные карты ─── */

  /**
   * Получение списка гарантийных карт
   */
  async getWarrantyCards(page = 1, pageSize = 20): Promise<ApiPagedResponse<WarrantyCardItem>> {
    const params = { page, pageSize };
    const response = await apiClient.get<ApiResponse<ApiPagedResponse<WarrantyCardItem>>>('/warranty/card', { params });
    const data = response.data?.data ?? [];
    return { items: Array.isArray(data) ? data : [], totalCount: Array.isArray(data) ? data.length : 0 };
  },

  /**
   * Создание гарантийной карты
   */
  async createWarrantyCard(card: { productId: string; orderId: string; expiresAt: string }): Promise<void> {
    await apiClient.post('/warranty/card', card);
  },

  /**
   * Аннулирование гарантийной карты
   */
  async annulWarrantyCard(cardId: string): Promise<void> {
    await apiClient.post(`/warranty/card/${cardId}/annul`);
  },

  /* ─── Отзывы/обратная связь ─── */

  /**
   * Получение списка отзывов с пагинацией
   */
  async getFeedback(page = 1, pageSize = 20): Promise<ApiPagedResponse<FeedbackItem>> {
    const params = { page, pageSize };
    const response = await apiClient.get('/feedback', { params });
    const data = response.data?.data ?? [];
    return { items: Array.isArray(data) ? data : [], totalCount: Array.isArray(data) ? data.length : 0 };
  },

  /**
   * Удаление отзыва
   */
  async deleteFeedback(id: string): Promise<void> {
    await apiClient.delete(`/feedback/${id}`);
  },
};
