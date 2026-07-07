/**
 * Утилиты для проверки JWT access token.
 */

/**
 * Возвращает access token из localStorage/sessionStorage или null, если его нет.
 */
export function getAccessToken(): string | null {
  return localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken');
}

/**
 * Проверяет, что access token существует И не истёк (с запасом 5 секунд).
 * Если токен невалиден (нельзя декодировать) — считается невалидным.
 */
export function isAccessTokenValid(): boolean {
  const token = getAccessToken();
  if (token == null || token === '') return false;
  const parts = token.split('.');
  if (parts.length < 2) return false;
  try {
    const payload = JSON.parse(atob(parts[1])) as { exp?: number };
    if (typeof payload.exp !== 'number') return false;
    return payload.exp * 1000 > Date.now() - 5000;
  } catch {
    return false;
  }
}
