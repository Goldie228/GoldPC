/**
 * Auth Service - API методы для аутентификации
 */
import apiClient from './client';
import type { LoginRequest, RegisterRequest, AuthResponse } from './types';
import { AxiosError } from 'axios';

const AUTH_BASE_URL = '/auth';

/**
 * Стандартизированные сообщения об ошибках аутентификации
 * Маппинг HTTP статус кодов на понятные пользователю сообщения
 */
const AUTH_ERROR_MESSAGES: Record<number, string> = {
  400: 'Некорректный запрос. Проверьте введенные данные.',
  401: 'Неверный email или пароль.',
  403: 'Этот аккаунт заблокирован. Обратитесь в поддержку.',
  404: 'Пользователь с таким email не найден.',
  409: 'Пользователь с таким email уже зарегистрирован.',
  422: 'Ошибка валидации данных. Проверьте введенные значения.',
  429: 'Слишком много попыток входа. Попробуйте позже.',
  500: 'Ошибка сервера. Попробуйте через несколько минут.',
  503: 'Сервис временно недоступен. Попробуйте позже.'
};

/**
 * Обработка ошибок API запросов аутентификации
 * Возвращает понятное пользователю сообщение об ошибке
 */
export const getAuthErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError && error.response) {
    const status = error.response.status;
    return AUTH_ERROR_MESSAGES[status] || 'Произошла ошибка. Попробуйте еще раз.';
  }
  return 'Проблема с подключением. Проверьте интернет соединение.';
};

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