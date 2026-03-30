import apiClient from './client';

interface ApiResponse<T> {
  data?: T;
  success?: boolean;
  message?: string;
}

export interface UserAddress {
  id: string;
  userId: string;
  name: string;
  city: string;
  address: string;
  apartment?: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface CreateAddressRequest {
  name: string;
  city: string;
  address: string;
  apartment?: string;
  postalCode?: string;
  isDefault?: boolean;
}

export interface UpdateAddressRequest {
  name: string;
  city: string;
  address: string;
  apartment?: string;
  postalCode?: string;
  isDefault?: boolean;
}

function unwrap<T>(response: T | ApiResponse<T>): T {
  if (response && typeof response === 'object' && 'data' in (response as object)) {
    const wrapped = response as ApiResponse<T>;
    if (wrapped.data !== undefined) return wrapped.data;
  }
  return response as T;
}

export const addressesApi = {
  /**
   * Получить список адресов пользователя
   */
  async getAddresses(): Promise<UserAddress[]> {
    const response = await apiClient.get<UserAddress[] | ApiResponse<UserAddress[]>>('/auth/address');
    return unwrap(response.data);
  },

  /**
   * Получить адрес по ID
   */
  async getAddress(id: string): Promise<UserAddress> {
    const response = await apiClient.get<UserAddress | ApiResponse<UserAddress>>(`/auth/address/${id}`);
    return unwrap(response.data);
  },

  /**
   * Создать новый адрес
   */
  async createAddress(data: CreateAddressRequest): Promise<UserAddress> {
    const response = await apiClient.post<UserAddress | ApiResponse<UserAddress>>('/auth/address', data);
    return unwrap(response.data);
  },

  /**
   * Обновить адрес
   */
  async updateAddress(id: string, data: UpdateAddressRequest): Promise<UserAddress> {
    const response = await apiClient.put<UserAddress | ApiResponse<UserAddress>>(`/auth/address/${id}`, data);
    return unwrap(response.data);
  },

  /**
   * Удалить адрес
   */
  async deleteAddress(id: string): Promise<void> {
    await apiClient.delete(`/auth/address/${id}`);
  },

  /**
   * Установить адрес по умолчанию
   */
  async setDefaultAddress(id: string): Promise<UserAddress> {
    const response = await apiClient.put<UserAddress | ApiResponse<UserAddress>>(`/auth/address/${id}/default`);
    return unwrap(response.data);
  },
};
