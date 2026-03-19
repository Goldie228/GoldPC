/**
 * API для административных функций
 */

import api from './index';
import type { User, Product, PagedResponse } from './types';

// === Типы для администрирования ===

export type UserRole = 'Client' | 'Manager' | 'Master' | 'Admin' | 'Accountant';

// === Типы для статистики дашборда ===

export interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  revenue: number;
  usersChange: number;
  ordersChange: number;
  revenueChange: number;
}

export interface StatsResponse {
  stats: DashboardStats;
  lastUpdated: string;
}

export interface UpdateUserRoleRequest {
  role: UserRole;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UpdateProductRequest {
  name?: string;
  price?: number;
  stock?: number;
  isActive?: boolean;
  description?: string;
}

export interface GetUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
}

export type UserListResponse = PagedResponse<User>;

/**
 * API администрирования пользователей
 */
export const usersAdminApi = {
  /**
   * Получить список пользователей с пагинацией
   */
  async getUsers(params?: GetUsersParams): Promise<UserListResponse> {
    const response = await api.get<UserListResponse>('/admin/users', {
      params,
    });
    return response.data;
  },

  /**
   * Получить пользователя по ID
   */
  async getUser(userId: string): Promise<User> {
    const response = await api.get<User>(`/admin/users/${userId}`);
    return response.data;
  },

  /**
   * Изменить роль пользователя
   */
  async updateUserRole(userId: string, data: UpdateUserRoleRequest): Promise<User> {
    const response = await api.patch<User>(`/admin/users/${userId}/role`, data);
    return response.data;
  },

  /**
   * Деактивировать пользователя
   */
  async deactivateUser(userId: string): Promise<User> {
    const response = await api.post<User>(`/admin/users/${userId}/deactivate`);
    return response.data;
  },

  /**
   * Активировать пользователя
   */
  async activateUser(userId: string): Promise<User> {
    const response = await api.post<User>(`/admin/users/${userId}/activate`);
    return response.data;
  },

  /**
   * Обновить пользователя
   */
  async updateUser(userId: string, data: UpdateUserRequest): Promise<User> {
    const response = await api.put<User>(`/admin/users/${userId}`, data);
    return response.data;
  },

  /**
   * Удалить пользователя
   */
  async deleteUser(userId: string): Promise<void> {
    await api.delete(`/admin/users/${userId}`);
  },
};

/**
 * API администрирования каталога
 */
export const catalogAdminApi = {
  /**
   * Получить все продукты (включая неактивные)
   */
  async getProducts(params?: {
    page?: number;
    pageSize?: number;
    category?: string;
    isActive?: boolean;
  }): Promise<PagedResponse<Product>> {
    const response = await api.get<PagedResponse<Product>>('/admin/products', {
      params,
    });
    return response.data;
  },

  /**
   * Обновить продукт
   */
  async updateProduct(productId: string, data: UpdateProductRequest): Promise<Product> {
    const response = await api.put<Product>(`/admin/products/${productId}`, data);
    return response.data;
  },

  /**
   * Удалить продукт
   */
  async deleteProduct(productId: string): Promise<void> {
    await api.delete(`/admin/products/${productId}`);
  },

  /**
   * Создать продукт
   */
  async createProduct(data: Partial<Product>): Promise<Product> {
    const response = await api.post<Product>('/admin/products', data);
    return response.data;
  },
};

/**
 * API статистики дашборда
 */
export const statsApi = {
  /**
   * Получить статистику для административной панели
   */
  async getStats(): Promise<StatsResponse> {
    const response = await api.get<StatsResponse>('/admin/stats');
    return response.data;
  },
};

// === Типы для справочников ===

export interface DictionaryItem {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface DictionaryCategory extends DictionaryItem {
  productCount: number;
}

export interface DictionaryManufacturer extends DictionaryItem {
  productCount: number;
  country?: string;
}

export interface CreateDictionaryItemRequest {
  name: string;
  slug: string;
}

export interface UpdateDictionaryItemRequest {
  name?: string;
  slug?: string;
  isActive?: boolean;
}

/**
 * API для управления справочниками
 */
export const dictionariesApi = {
  /**
   * Получить список категорий
   */
  async getCategories(): Promise<DictionaryCategory[]> {
    const response = await api.get<DictionaryCategory[]>('/admin/dictionaries/categories');
    return response.data;
  },

  /**
   * Получить список производителей
   */
  async getManufacturers(): Promise<DictionaryManufacturer[]> {
    const response = await api.get<DictionaryManufacturer[]>('/admin/dictionaries/manufacturers');
    return response.data;
  },

  /**
   * Получить список характеристик
   */
  async getAttributes(): Promise<DictionaryItem[]> {
    const response = await api.get<DictionaryItem[]>('/admin/dictionaries/attributes');
    return response.data;
  },

  /**
   * Создать запись в справочнике
   */
  async createItem(
    type: 'categories' | 'manufacturers' | 'attributes',
    data: CreateDictionaryItemRequest
  ): Promise<DictionaryItem> {
    const response = await api.post<DictionaryItem>(`/admin/dictionaries/${type}`, data);
    return response.data;
  },

  /**
   * Обновить запись в справочнике
   */
  async updateItem(
    type: 'categories' | 'manufacturers' | 'attributes',
    id: string,
    data: UpdateDictionaryItemRequest
  ): Promise<DictionaryItem> {
    const response = await api.put<DictionaryItem>(`/admin/dictionaries/${type}/${id}`, data);
    return response.data;
  },

  /**
   * Удалить запись из справочника
   */
  async deleteItem(
    type: 'categories' | 'manufacturers' | 'attributes',
    id: string
  ): Promise<void> {
    await api.delete(`/admin/dictionaries/${type}/${id}`);
  },
};

// === Типы для настроек системы ===

export interface SiteSettings {
  siteName: string;
  adminEmail: string;
  storeAddress: string;
  phone: string;
  workingHours: string;
  freeDeliveryThreshold: number;
  deliveryCost: number;
  deliveryTime: string;
  twoFactorRequired: boolean;
  auditLogging: boolean;
  loginNotifications: boolean;
  orderEmailNotifications: boolean;
  smsNotifications: boolean;
  lowStockNotifications: boolean;
  maintenanceMode: boolean;
}

export interface UpdateSettingsRequest extends Partial<SiteSettings> {}

/**
 * API для управления настройками системы
 */
export const settingsApi = {
  /**
   * Получить текущие настройки
   */
  async getSettings(): Promise<SiteSettings> {
    const response = await api.get<SiteSettings>('/admin/settings');
    return response.data;
  },

  /**
   * Обновить настройки
   */
  async updateSettings(data: UpdateSettingsRequest): Promise<SiteSettings> {
    const response = await api.put<SiteSettings>('/admin/settings', data);
    return response.data;
  },

  /**
   * Сбросить настройки к значениям по умолчанию
   */
  async resetSettings(): Promise<SiteSettings> {
    const response = await api.post<SiteSettings>('/admin/settings/reset');
    return response.data;
  },
};
