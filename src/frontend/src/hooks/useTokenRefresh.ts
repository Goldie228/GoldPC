/**
 * useTokenRefresh — автоматический рефреш токена при загрузке приложения
 * Если accessToken протух, но refreshToken жив — обновляем тихо
 */
import { useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { BASE_URL } from '../api/client';
import apiClient from '../api/client';

// Модульный флаг для предотвращения параллельных refresh-запросов
let isRefreshing = false;

export function useTokenRefresh(): void {
  const hasRefreshed = useRef(false);
  const setUser = useAuthStore((s) => s.setUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    // Только один раз при загрузке
    if (hasRefreshed.current) return;
    hasRefreshed.current = true;

    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    // Если нет refresh token — ничего не делаем
    if (!refreshToken) return;

    // Если нет access token — тоже рефрешим (может быть первый вход)
    // Если есть access token — проверяем, не протух ли он
    if (accessToken) {
      try {
        // Декодируем JWT чтобы проверить exp
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        const expiresAt = payload.exp * 1000; // exp в миллисекунды
        const now = Date.now();
        const timeLeft = expiresAt - now;

        // Если до истечения > 5 минут — не рефрешим
        if (timeLeft > 5 * 60 * 1000) return;
      } catch {
        // Не смогли декодировать — рефрешим на всякий случай
      }
    }

    // Тихий рефреш — с защитой от параллельных вызовов
    void (async () => {
      if (isRefreshing) return;
      isRefreshing = true;
      try {
        const response = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const data = response.data?.data ?? response.data;
        const newAccessToken = data?.accessToken as string | undefined;
        const newRefreshToken = data?.refreshToken as string | undefined;

        if (newAccessToken) {
          localStorage.setItem('accessToken', newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }

          // Обновляем user данные если есть
          const user = data?.user;
          if (user) {
            setUser(user);
          }

          // Обновляем токен в apiClient (НЕ в глобальном axios)
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

          console.debug('[useTokenRefresh] Token refreshed successfully');
        }
      } catch (err: unknown) {
        // Only clear tokens on auth errors (401/403), not network/server errors
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 401 || status === 403) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('auth-storage');
          console.debug('[useTokenRefresh] Auth rejected, cleared tokens');
        } else {
          console.debug('[useTokenRefresh] Refresh failed (network/server error), tokens preserved');
        }
      } finally {
        isRefreshing = false;
      }
    })();
  }, [setUser, isAuthenticated]);
}
