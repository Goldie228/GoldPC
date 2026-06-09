/**
 * useTokenRefresh — автоматический рефреш токена при загрузке приложения
 * Если accessToken протух, но refreshToken жив — обновляем тихо
 */
import { useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { BASE_URL } from '../api/client';

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

    // Тихий рефреш
    void (async () => {
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

          // Обновляем axios дефолтный хедер
          axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

          console.debug('[useTokenRefresh] Token refreshed successfully');
        }
      } catch {
        // Рефреш не удался — очищаем
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('auth-storage');
        console.debug('[useTokenRefresh] Refresh failed, cleared tokens');
      }
    })();
  }, [setUser, isAuthenticated]);
}
