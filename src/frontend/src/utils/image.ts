/**
 * Проверяет, является ли URL известным placeholder'ом X-Core.by.
 * Такие картинки не показываем — вместо них показываем свою заглушку.
 */
const XCORE_PLACEHOLDER_PATTERNS = [
  '/upload/CNext/', // дефолтный placeholder x-core.by (логотип "X-core")
];

function isPlaceholder(url: string): boolean {
  return XCORE_PLACEHOLDER_PATTERNS.some((p) => url.includes(p));
}

/**
 * Возвращает true, если URL указывает на валидное изображение:
 * - локальный путь /uploads/...
 * - внешний http(s):// URL (не placeholder)
 */
export function hasValidProductImage(url: unknown): boolean {
  if (typeof url !== 'string') return false;
  const u = url.trim();
  if (!u) return false;
  if (isPlaceholder(u)) return false;

  // Локальный путь
  if (u.startsWith('/uploads/') || u.startsWith('uploads/')) return true;

  // Data URI (inline SVG и т.п.)
  if (u.startsWith('data:')) return true;

  // Внешний HTTP(S) URL
  if (u.startsWith('http://') || u.startsWith('https://')) return true;

  return false;
}

export function isXCorePlaceholderUrl(url: unknown): boolean {
  if (typeof url !== 'string') return true;
  const u = url.trim();
  if (!u) return true;
  return isPlaceholder(u);
}

/**
 * Абсолютный адрес для img src.
 * Локальные /uploads/ пути — проксируем через origin.
 * Внешние URL — возвращаем как есть.
 */
export function getProductImageUrl(url: unknown): string | null {
  // Обрабатывает if url is an object (e.g., ProductImage) instead of string
  if (url != null && typeof url === 'object' && 'url' in url) {
    return getProductImageUrl((url as Record<string, unknown>).url);
  }
  
  if (typeof url !== 'string') return null;
  const u = url.trim();
  if (!u) return null;
  if (isPlaceholder(u)) return null;

  // Data URI (inline SVG placeholder и т.п.)
  if (u.startsWith('data:')) return u;

  // Локальный путь — проксируем через origin
  if (u.startsWith('/uploads/') || u.startsWith('uploads/')) {
    if (u.startsWith('/')) return `${window.location.origin}${u}`;
    const apiBase = typeof import.meta.env?.VITE_API_URL === 'string' ? import.meta.env.VITE_API_URL : undefined;
    const base = apiBase ? String(apiBase).replace(/\/api\/v\d+(\/)?$/, '') : window.location.origin;
    return `${base.replace(/\/$/, '')}/${u.replace(/^\//, '')}`;
  }

  // Внешний HTTP(S) URL — возвращаем как есть
  if (u.startsWith('http://') || u.startsWith('https://')) return u;

  return null;
}
