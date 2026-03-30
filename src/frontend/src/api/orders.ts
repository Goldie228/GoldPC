import apiClient from './client';

interface ApiResponse<T> {
  data?: T;
  success?: boolean;
  message?: string;
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
  paymentMethod: string;
  address?: string;
  city?: string;
  comment?: string;
  promoCode?: string;
  discountAmount?: number;
  deliveryDate?: string;
  deliveryTimeSlot?: string;
  items: CreateOrderItem[];
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
  return response as T;
}

export const ordersApi = {
  /**
   * Получить расчёт стоимости доставки
   */
  async getDeliveryQuote(payload: DeliveryQuoteRequest): Promise<DeliveryQuoteResponse> {
    const response = await apiClient.post<DeliveryQuoteResponse | ApiResponse<DeliveryQuoteResponse>>(
      '/orders/delivery/quote',
      payload
    );
    return unwrap(response.data);
  },

  /**
   * Создать новый заказ
   */
  async createOrder(data: CreateOrderRequest): Promise<Order> {
    const response = await apiClient.post<Order | ApiResponse<Order>>('/orders', data);
    return unwrap(response.data);
  },

  /**
   * Получить мои заказы
   */
  async getMyOrders(page = 1, pageSize = 10, status?: string): Promise<PagedResult<Order>> {
    const params: Record<string, string | number> = { page, pageSize };
    if (status) {
      params.status = status;
    }
    const response = await apiClient.get<PagedResult<Order> | ApiResponse<PagedResult<Order>>>(
      '/orders/my',
      { params }
    );
    return unwrap(response.data);
  },

  /**
   * Получить заказ по ID
   */
  async getOrder(id: string): Promise<Order> {
    const response = await apiClient.get<Order | ApiResponse<Order>>(`/orders/${id}`);
    return unwrap(response.data);
  },

  /**
   * Получить заказ по номеру
   */
  async getOrderByNumber(orderNumber: string): Promise<Order> {
    const response = await apiClient.get<Order | ApiResponse<Order>>(`/orders/number/${orderNumber}`);
    return unwrap(response.data);
  },

  /**
   * Получить информацию об отслеживании заказа
   */
  async getOrderTracking(orderNumber: string): Promise<Order> {
    return this.getOrderByNumber(orderNumber);
  },

  /**
   * Отменить заказ
   */
  async cancelOrder(id: string): Promise<Order> {
    const response = await apiClient.post<Order | ApiResponse<Order>>(`/orders/${id}/cancel`);
    return unwrap(response.data);
  },
};
