import { goldpcApi } from './generated/client';

interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

export interface DeliveryQuoteRequest {
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
  if (payload == null || typeof payload !== 'object') {
    return null;
  }

  const response = payload as ApiErrorResponse;
  if (typeof response.message === 'string' && response.message.trim().length > 0) {
    return response.message;
  }

  if (response.errors != null && typeof response.errors === 'object') {
    return findFirstErrorString(response.errors);
  }

  return null;
}

function findFirstErrorString(errors: Record<string, unknown>): string | null {
  for (const value of Object.values(errors)) {
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
      return value[0];
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

/** Extract data from ApiResponse wrapper (success + data envelope) */
function unwrapResponse<T>(data: unknown): T {
  if (data != null && typeof data === 'object' && 'data' in (data as object)) {
    const wrapped = data as { data?: T };
    if (wrapped.data !== undefined) return wrapped.data;
  }
  throw new Error('Unable to unwrap API response: data is undefined');
}

export const ordersApi = {
  /**
   * Получить расчёт стоимости доставки
   */
  async getDeliveryQuote(payload: DeliveryQuoteRequest): Promise<DeliveryQuoteResponse> {
    try {
      const response = await goldpcApi.postOrdersDeliveryQuote({
        deliveryMethod: payload.deliveryMethod,
        subtotal: payload.subtotal,
        city: payload.city ?? null,
      });
      const result = unwrapResponse<{ subtotal?: number; deliveryCost?: number; total?: number }>(response.data);
      return {
        subtotal: result.subtotal ?? 0,
        deliveryCost: result.deliveryCost ?? 0,
        total: result.total ?? 0,
      };
    } catch (e) {
      throw new Error('Failed to get delivery quote: ' + (e instanceof Error ? e.message : String(e)));
    }
  },

  /**
   * Создать новый заказ
   */
  async createOrder(data: CreateOrderRequest): Promise<Order> {
    try {
      const response = await goldpcApi.postOrders({
        firstName: data.firstName,
        lastName: data.lastName ?? null,
        phone: data.phone,
        email: data.email,
        deliveryMethod: data.deliveryMethod,
        paymentMethod: data.paymentMethod,
        address: data.address ?? null,
        city: data.city ?? null,
        comment: data.comment ?? null,
        promoCode: data.promoCode ?? null,
        discountAmount: data.discountAmount,
        deliveryDate: data.deliveryDate ?? null,
        deliveryTimeSlot: data.deliveryTimeSlot ?? null,
        items: data.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });
      return unwrapResponse<Order>(response.data);
    } catch (e) {
      throw new Error('Failed to create order: ' + (e instanceof Error ? e.message : String(e)));
    }
  },

  /**
   * Получить мои заказы
   */
  async getMyOrders(page = 1, pageSize = 10, status?: string): Promise<PagedResult<Order>> {
    try {
      const response = await goldpcApi.getOrdersMy({
        page,
        pageSize,
        ...(status != null && status !== '' ? { status: Number(status) as never } : {}),
      });
      return unwrapResponse<PagedResult<Order>>(response.data);
    } catch (e) {
      throw new Error('Failed to fetch orders: ' + (e instanceof Error ? e.message : String(e)));
    }
  },

  /**
   * Получить заказ по ID
   */
  async getOrder(id: string): Promise<Order> {
    try {
      const response = await goldpcApi.getOrdersId(id);
      return unwrapResponse<Order>(response.data);
    } catch (e) {
      throw new Error('Failed to fetch order: ' + (e instanceof Error ? e.message : String(e)));
    }
  },

  /**
   * Получить заказ по номеру
   */
  async getOrderByNumber(orderNumber: string): Promise<Order> {
    try {
      const response = await goldpcApi.getOrdersNumberOrderNumber(orderNumber);
      return unwrapResponse<Order>(response.data);
    } catch (e) {
      throw new Error('Failed to fetch order by number: ' + (e instanceof Error ? e.message : String(e)));
    }
  },

  /**
   * Получить информацию об отслеживании заказа
   */
  async getOrderTracking(orderNumber: string): Promise<Order> {
    try {
      const response = await goldpcApi.getOrdersNumberOrderNumber(orderNumber);
      return unwrapResponse<Order>(response.data);
    } catch (e) {
      throw new Error('Failed to fetch order tracking: ' + (e instanceof Error ? e.message : String(e)));
    }
  },

  /**
   * Отменить заказ
   */
  async cancelOrder(id: string): Promise<Order> {
    try {
      const response = await goldpcApi.postOrdersIdCancel(id);
      return unwrapResponse<Order>(response.data);
    } catch (e) {
      throw new Error('Failed to cancel order: ' + (e instanceof Error ? e.message : String(e)));
    }
  },
};
