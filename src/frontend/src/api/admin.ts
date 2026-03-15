/**
 * API для административных функций
 */

import api from './index';
import type { User, Product, PagedResponse } from './types';

// === Типы для администрирования ===

export type UserRole = 'Client' | 'Manager' | 'Master' | 'Admin' | 'Accountant';

export interface UpdateUserRoleRequest {
  role: UserRole;
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

export interface UserListResponse extends PagedResponse<User> {}

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