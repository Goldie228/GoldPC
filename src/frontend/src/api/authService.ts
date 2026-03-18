/**
 * Auth Service - API методы для аутентификации
 */
import apiClient from './client';
import type { LoginRequest, RegisterRequest, AuthResponse } from './types';

const AUTH_BASE_URL = '/auth';

export const authService = {
  /**
   * Авторизация пользователя
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(`${AUTH_BASE_URL}/login`, credentials);
    return response.data;
  },

  /**
   * Регистрация нового пользователя
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(`${AUTH_BASE_URL}/register`, data);
    return response.data;
  },

  /**
   * Выход из системы (отзыв токенов на сервере)
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(`${AUTH_BASE_URL}/logout`);
    } catch {
      // Игнорируем ошибки при logout - очищаем токены локально в любом случае
    }
  },

  /**
   * Обновление токенов
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(`${AUTH_BASE_URL}/refresh`, { refreshToken });
    return response.data;
  },

  /**
   * Получение текущего пользователя
   */
  async getCurrentUser(): Promise<AuthResponse['user']> {
    const response = await apiClient.get<AuthResponse['user']>(`${AUTH_BASE_URL}/me`);
    return response.data;
  },
};