import apiClient from './client';

interface ApiResponse<T> {
  data?: T;
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

function unwrap<T>(response: T | ApiResponse<T>): T {
  if (response && typeof response === 'object' && 'data' in (response as object)) {
    const wrapped = response as ApiResponse<T>;
    if (wrapped.data !== undefined) return wrapped.data;
  }
  return response as T;
}

export const ordersApi = {
  async getDeliveryQuote(payload: DeliveryQuoteRequest): Promise<DeliveryQuoteResponse> {
    const response = await apiClient.post<DeliveryQuoteResponse | ApiResponse<DeliveryQuoteResponse>>(
      '/orders/delivery/quote',
      payload
    );
    return unwrap(response.data);
  },
};
