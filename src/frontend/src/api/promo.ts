import apiClient from './client';

interface ApiResponse<T> {
  data?: T;
  success?: boolean;
  message?: string;
}

export interface ValidatePromoCodeRequest {
  code: string;
  orderAmount: number;
}

export interface ValidatePromoCodeResponse {
  valid: boolean;
  discount: number;
  message: string;
  discountAmount: number;
}

function unwrap<T>(response: T | ApiResponse<T>): T {
  if (response && typeof response === 'object' && 'data' in (response as object)) {
    const wrapped = response as ApiResponse<T>;
    if (wrapped.data !== undefined) return wrapped.data;
  }
  return response as T;
}

export const promoApi = {
  /**
   * Валидация промокода
   */
  async validatePromoCode(data: ValidatePromoCodeRequest): Promise<ValidatePromoCodeResponse> {
    const response = await apiClient.post<ValidatePromoCodeResponse | ApiResponse<ValidatePromoCodeResponse>>(
      '/promo/validate',
      data
    );
    return unwrap(response.data);
  },
};
