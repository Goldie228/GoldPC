/**
 * Проверяет, является ли URL известным placeholder'ом X-Core.by.
 * Такие картинки не показываем — вместо них показываем свою заглушку.
 */
const XCORE_PLACEHOLDER_PATTERNS = [
  '/upload/CNext/', // дефолтный placeholder x-core.by (логотип "X-core")
];

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
  return !isXCorePlaceholderUrl(u);
}
