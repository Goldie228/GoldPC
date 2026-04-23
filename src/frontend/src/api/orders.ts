import apiClient from './client';

interface ApiResponse<T> {
  data?: T;
  success?: boolean;
  message?: string;
}

interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

interface DeliveryQuoteRequest {
  deliveryMethod: 'Pickup' | 'Delivery';
  subtotal: number;
  city?: string;
}

export interface DeliveryQuoteResponse {
  subtotal: number;
  deliveryCost: number;
  total: number;
}

export interface CreateOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateOrderRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  deliveryMethod: 'Pickup' | 'Delivery';
  paymentMethod: 'Online' | 'OnReceipt';
  address?: string;
  city?: string;
  comment?: string;
  promoCode?: string;
  discountAmount?: number;
  deliveryDate?: string;
  deliveryTimeSlot?: string;
  items: CreateOrderItem[];
}

export function extractApiErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const response = payload as ApiErrorResponse;
  if (typeof response.message === 'string' && response.message.trim().length > 0) {
    return response.message;
  }

  if (response.errors && typeof response.errors === 'object') {
    for (const value of Object.values(response.errors)) {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
        return value[0];
      }
    }
  }

  return null;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  customerEmail: string;
  status: string;
  total: number;
  subtotal: number;
  deliveryCost: number;
  discountAmount: number;
  deliveryMethod: string;
  paymentMethod: string;
  address?: string;
  promoCode?: string;
  deliveryDate?: string;
  deliveryTimeSlot?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt?: string;
  items: OrderItem[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

function unwrap<T>(response: T | ApiResponse<T>): T {
  if (response && typeof response === 'object' && 'data' in (response as object)) {
    const wrapped = response as ApiResponse<T>;
    if (wrapped.data !== undefined) return wrapped.data;
  }
  throw new Error('Unable to unwrap API response: data is undefined');
}

export const ordersApi = {
  /**
   * Пولучить расчёт стоимости доставки
   */
  async getDeliveryQuote(payload: DeliveryQuoteRequest): Promise<DeliveryQuoteResponse> {
    const response = await apiClient.post<ApiResponse<DeliveryQuoteResponse>>(
      '/orders/delivery/quote',
      payload
    );
    return unwrap<DeliveryQuoteResponse>(response.data);
  },

  /**
   * Создать новый заказ
   */
  async createOrder(data: CreateOrderRequest): Promise<Order> {
    const response = await apiClient.post<ApiResponse<Order>>('/orders', data);
    return unwrap<Order>(response.data);
  },

  /**
   * Пولучить мои заказы
   */
  async getMyOrders(page = 1, pageSize = 10, status?: string): Promise<PagedResult<Order>> {
    const params: Record<string, string | number> = { page, pageSize };
    if (status) {
      params.status = status;
    }
    const response = await apiClient.get<ApiResponse<PagedResult<Order>>>('/orders/my', { params });
    return unwrap<PagedResult<Order>>(response.data);
  },

  /**
   * Пولучить заказ по ID
   */
  async getOrder(id: string): Promise<Order> {
    const response = await apiClient.get<ApiResponse<Order>>(`/orders/${id}`);
    return unwrap<Order>(response.data);
  },

  /**
   * Пولучить заказ по номеру
   */
  async getOrderByNumber(orderNumber: string): Promise<Order> {
    const response = await apiClient.get<ApiResponse<Order>>(`/orders/number/${orderNumber}`);
    return unwrap<Order>(response.data);
  },

  /**
   * Пولучить информацию об отслеживании заказа
   */
  async getOrderTracking(orderNumber: string): Promise<Order> {
    return this.getOrderByNumber(orderNumber);
  },

  /**
   * Отменить заказ
   */
  async cancelOrder(id: string): Promise<Order> {
    const response = await apiClient.post<ApiResponse<Order>>(`/orders/${id}/cancel`);
    return unwrap<Order>(response.data);
  },
};
