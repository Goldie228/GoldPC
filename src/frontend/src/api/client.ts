/**
 * Базовый API клиент для GoldPC
 * Настроен для работы с mock backend на http://localhost:5000/api/v1
 */

import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

/**
 * Базовый URL для API запросов
 * В режиме разработки использует относительный путь для MSW
 */
const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

/**
 * Экземпляр axios с базовой конфигурацией
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Перехватчик запросов для добавления токена авторизации
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // ✅ Проверяем ВСЕ хранилища в правильном порядке
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Извлекает полезные данные из обёрнутого ответа ApiResponse<T>
 */
function extractData<T>(payload: T | { data?: T; success?: boolean; message?: string }): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const wrapped = payload as { data?: T; success?: boolean; message?: string };
    if (wrapped.data !== undefined) return wrapped.data;
  }
  return payload as T;
}

/**
 * Перехватчик ответов для обработки ошибок авторизации
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Если 401 и есть refresh token - пытаемся обновить
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // ✅ Ищем refresh token в ОБОИХ хранилищах
      let refreshTokenSource: 'local' | 'session' | null = null;
      let refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        refreshTokenSource = 'local';
      } else {
        refreshToken = sessionStorage.getItem('refreshToken');
        if (refreshToken) {
          refreshTokenSource = 'session';
        }
      }

      if (refreshToken) {
        try {
          const response = await axios.post(`${BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = extractData<{
            accessToken: string;
            refreshToken: string;
          }>(response.data);

          // ✅ Сохраняем обратно в ТО ЖЕ хранилище, откуда пришёл токен
          if (refreshTokenSource === 'session') {
            sessionStorage.setItem('accessToken', accessToken);
            sessionStorage.setItem('refreshToken', newRefreshToken);
          } else {
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
          }

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          return apiClient(originalRequest);
        } catch {
          // ✅ При провале refresh очищаем токены и перезагружаем на /login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          sessionStorage.removeItem('accessToken');
          sessionStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(error);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
export { BASE_URL };