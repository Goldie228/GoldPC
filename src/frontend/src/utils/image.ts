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
function isLocalCatalogImagePath(url: string): boolean {
  const normalized = url.trim();
  if (!normalized) return false;

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
 * Возвращает true, если в API пришёл локальный путь к файлу на нашем сервере.
 */
export function hasValidProductImage(url: string | null | undefined): boolean {
  const u = url?.trim();
  if (!u) return false;
  return isLocalCatalogImagePath(u) && !isXCorePlaceholderUrl(u);
}

/**
 * Абсолютный адрес для img src: только для путей /uploads/ (прокси Vite → CatalogService или origin).
 */
export function getProductImageUrl(url: string | null | undefined): string | null {
  const u = url?.trim();
  if (!u) return null;
  if (!isLocalCatalogImagePath(u)) return null;
  if (u.startsWith('/')) return `${window.location.origin}${u}`;
  const apiBase = import.meta.env?.VITE_API_URL;
  const base = apiBase ? String(apiBase).replace(/\/api\/v\d+(\/)?$/, '') : window.location.origin;
  return `${base.replace(/\/$/, '')}/${u.replace(/^\//, '')}`;
}
