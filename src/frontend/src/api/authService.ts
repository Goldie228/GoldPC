/**
 * Auth Service - API методы для аутентификации
 */
import apiClient from './client';
import type { LoginRequest, RegisterRequest, AuthResponse } from './types';
import { AxiosError } from 'axios';

const AUTH_BASE_URL = '/auth';

/**
 * Извлекает полезные данные из обёрнутого ответа ApiResponse<T>
 * Безопасно: если данных нет, возвращает undefined
 */
function extractData<T>(payload: T | { data?: T; success?: boolean; message?: string }): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const wrapped = payload as { data?: T; success?: boolean; message?: string };
    if (wrapped.data !== undefined) return wrapped.data;
  }
  throw new Error('Unable to extract data from API response: data is undefined');
}

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
    const response = await apiClient.post(`${AUTH_BASE_URL}/login`, credentials);
    return extractData<AuthResponse>(response.data);
  },

  /**
   * Регистрация нового пользователя
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post(`${AUTH_BASE_URL}/register`, data);
    return extractData<AuthResponse>(response.data);
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
    const response = await apiClient.post(`${AUTH_BASE_URL}/refresh`, { refreshToken });
    return extractData<AuthResponse>(response.data);
  },

  /**
   * Получение текущего пользователя
   */
  async getCurrentUser(): Promise<AuthResponse['user']> {
    const response = await apiClient.get(`${AUTH_BASE_URL}/me`);
    return extractData<AuthResponse['user']>(response.data);
  },
};