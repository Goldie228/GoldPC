/**
 * Проверяет, является ли URL известным placeholder'ом X-Core.by.
 * Такие картинки не показываем — вместо них показываем свою заглушку.
 */
const XCORE_PLACEHOLDER_PATTERNS = [
  '/upload/CNext/', // дефолтный placeholder x-core.by (логотип "X-core")
];

/**
 * Допустимы только пути к файлам на нашем бэкенде (/uploads/...).
 * Внешние URL (x-core и др.) с API не приходят и в img не подставляем.
 */
function isLocalCatalogImagePath(url: unknown): boolean {
  if (typeof url !== 'string') return false;
  const str = url;
  if (!str) return false;
  const normalized = str.replace(/^\s+|\s+$/g, ''); // trim без .trim()
  
  if (
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('//')
  ) {
    return false;
  }

  return normalized.startsWith('/uploads/') || normalized.startsWith('uploads/');
}

export function isXCorePlaceholderUrl(url: unknown): boolean {
  if (typeof url !== 'string') return true;
  const str = url;
  const u = str.replace(/^\s+|\s+$/g, '');
  if (!u) return true;
  return XCORE_PLACEHOLDER_PATTERNS.some((p) => u.includes(p));
}

/**
 * Возвращает true, если в API пришёл локальный путь к файлу на нашем сервере.
 */
export function hasValidProductImage(url: unknown): boolean {
  if (typeof url !== 'string') return false;
  const str = url;
  const u = str.replace(/^\s+|\s+$/g, '');
  if (!u) return false;
  return isLocalCatalogImagePath(u) && !isXCorePlaceholderUrl(u);
}

/**
 * Абсолютный адрес для img src: только для путей /uploads/ (прокси Vite → CatalogService или origin).
 */
export function getProductImageUrl(url: unknown): string | null {
  // Handle if url is an object (e.g., ProductImage) instead of string
  if (url != null && typeof url === 'object' && 'url' in url) {
    return getProductImageUrl((url as Record<string, unknown>).url);
  }
  
  if (typeof url !== 'string') return null;
  const str = url;
  const u = str.replace(/^\s+|\s+$/g, '');
  if (!u) return null;
  if (!isLocalCatalogImagePath(u)) return null;
  if (u.startsWith('/')) return `${window.location.origin}${u}`;
  const apiBase = typeof import.meta.env?.VITE_API_URL === 'string' ? import.meta.env.VITE_API_URL : undefined;
  const base = apiBase ? String(apiBase).replace(/\/api\/v\d+(\/)?$/, '') : window.location.origin;
  return `${base.replace(/\/$/, '')}/${u.replace(/^\//, '')}`;
}
