/**
 * Проверяет, является ли URL известным placeholder'ом X-Core.by.
 * Такие картинки не показываем — вместо них показываем свою заглушку.
 */
const XCORE_PLACEHOLDER_PATTERNS = [
  '/upload/CNext/', // дефолтный placeholder x-core.by (логотип "X-core")
];

function isLocalImagePath(url: string): boolean {
  const normalized = url.trim();
  if (!normalized) return false;

  // strict local-only: внешние absolute URL не используем
  if (
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('//')
  ) {
    return false;
  }

  return normalized.startsWith('/uploads/') || normalized.startsWith('uploads/');
}

export function isXCorePlaceholderUrl(url: string | null | undefined): boolean {
  const u = url?.trim();
  if (!u) return true;
  return XCORE_PLACEHOLDER_PATTERNS.some((p) => u.includes(p));
}

/**
 * Возвращает true, если URL валидный и не является X-Core placeholder.
 */
export function hasValidProductImage(url: string | null | undefined): boolean {
  const u = url?.trim();
  if (!u) return false;
  return isLocalImagePath(u) && !isXCorePlaceholderUrl(u);
}

/**
 * Возвращает URL изображения товара. Относительные пути дополняются origin.
 */
export function getProductImageUrl(url: string | null | undefined): string | null {
  const u = url?.trim();
  if (!u) return null;
  if (!isLocalImagePath(u)) return null;
  if (u.startsWith('/')) return `${window.location.origin}${u}`;
  const apiBase = import.meta.env?.VITE_API_URL;
  const base = apiBase ? String(apiBase).replace(/\/api\/v\d+(\/)?$/, '') : window.location.origin;
  return `${base.replace(/\/$/, '')}/${u.replace(/^\//, '')}`;
}
