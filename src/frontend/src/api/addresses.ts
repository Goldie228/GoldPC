/**
 * Addresses API — работа с адресами доставки пользователя
 * Использует сгенерированные orval-функции из generated/client.ts
 */

import { goldpcApi } from './generated/client';

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

/**
 * Безопасное извлечение data из ApiResponse<T>
 */
function unwrap<T>(response: T | ApiResponse<T>): T {
  if (response != null && typeof response === 'object' && 'data' in (response as object)) {
    const wrapped = response as ApiResponse<T>;
    if (wrapped.data !== undefined) return wrapped.data;
  }
  return response as T;
}

/**
 * Маппинг сгенерированного DTO → фронтовый UserAddress
 * Генерированные DTO используют nullable-поля, приводим к нужному формату
 */
function mapAddress(raw: {
  id?: string;
  userId?: string;
  name?: string | null;
  city?: string | null;
  address?: string | null;
  apartment?: string | null;
  postalCode?: string | null;
  isDefault?: boolean;
  createdAt?: string;
}): UserAddress {
  return {
    id: raw.id ?? '',
    userId: raw.userId ?? '',
    name: raw.name ?? '',
    city: raw.city ?? '',
    address: raw.address ?? '',
    apartment: raw.apartment ?? undefined,
    postalCode: raw.postalCode ?? undefined,
    isDefault: raw.isDefault ?? false,
    createdAt: raw.createdAt ?? '',
  };
}

/** Тип raw-объекта адреса для кастов */
type RawAddress = Parameters<typeof mapAddress>[0];

export const addressesApi = {
  /**
   * Получить список адресов пользователя
   */
  async getAddresses(): Promise<UserAddress[]> {
    const response = await goldpcApi.getApiV1AuthAddress();
    const list = unwrap(response.data as ApiResponse<RawAddress[]>);
    return (Array.isArray(list) ? list : []).map(mapAddress);
  },

  /**
   * Получить адрес по ID
   */
  async getAddress(id: string): Promise<UserAddress> {
    const response = await goldpcApi.getApiV1AuthAddressId(id);
    const raw = unwrap(response.data as ApiResponse<RawAddress>);
    return mapAddress(raw);
  },

  /**
   * Создать новый адрес
   */
  async createAddress(data: CreateAddressRequest): Promise<UserAddress> {
    const response = await goldpcApi.postApiV1AuthAddress(data);
    const raw = unwrap(response.data as ApiResponse<RawAddress>);
    return mapAddress(raw);
  },

  /**
   * Обновить адрес
   */
  async updateAddress(id: string, data: UpdateAddressRequest): Promise<UserAddress> {
    const response = await goldpcApi.putApiV1AuthAddressId(id, data);
    const raw = unwrap(response.data as ApiResponse<RawAddress>);
    return mapAddress(raw);
  },

  /**
   * Удалить адрес
   */
  async deleteAddress(id: string): Promise<void> {
    await goldpcApi.deleteApiV1AuthAddressId(id);
  },

  /**
   * Установить адрес как основной
   */
  async setDefaultAddress(id: string): Promise<UserAddress> {
    const response = await goldpcApi.putApiV1AuthAddressIdDefault(id);
    const raw = unwrap(response.data as ApiResponse<RawAddress>);
    return mapAddress(raw);
  },
};

export default addressesApi;
