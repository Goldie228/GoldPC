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
const BASE_URL = (typeof import.meta.env?.VITE_API_URL === 'string' && import.meta.env.VITE_API_URL !== '') ? import.meta.env.VITE_API_URL : '/api/v1';

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
 * Читает значение cookie по имени (простой парсер без сторонних библиотек)
 */
function getCookieValue(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match != null ? decodeURIComponent(match[2]) : null;
}

/**
 * Перехватчик запросов для добавления CSRF-токена и токена авторизации
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // ✅ Добавляем CSRF-токен из cookie для unsafe методов
    const unsafeMethods = ['post', 'put', 'delete', 'patch'];
    if (config.method != null && unsafeMethods.includes(config.method.toLowerCase())) {
      const xsrfToken = getCookieValue('XSRF-TOKEN');
      if (xsrfToken != null && config.headers != null) {
        config.headers['X-XSRF-TOKEN'] = xsrfToken;
      }
    }

    // ✅ Проверяем ВСЕ хранилища в правильном порядке
    const token = localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken');
    if (token != null && config.headers != null) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// ✅ Восстанавливаем токен при загрузке страницы
const savedToken = localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken');
if (savedToken != null && savedToken !== '') {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
}

/**
 * Извлекает полезные данные из обёрнутого ответа ApiResponse<T>
 * Безопасно: если данных нет, возвращает undefined (вызывающий должен обработать)
 */
function extractData<T>(payload: unknown): T {
  if (payload != null && typeof payload === 'object' && 'data' in payload) {
    const wrapped = payload as { data?: T; success?: boolean; message?: string };
    if (wrapped.data !== undefined) return wrapped.data;
  }
  throw new Error('Unable to extract data from API response: data is undefined');
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
      if (refreshToken != null && refreshToken !== '') {
        refreshTokenSource = 'local';
      } else {
        refreshToken = sessionStorage.getItem('refreshToken');
        if (refreshToken != null && refreshToken !== '') {
          refreshTokenSource = 'session';
        }
      }

      if (refreshToken != null && refreshToken !== '') {
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

          if (originalRequest.headers != null) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          return apiClient(originalRequest);
        } catch {
          // ✅ При провале refresh очищаем токены + auth-storage и перезагружаем на /login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('auth-storage');
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