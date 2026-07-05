/**
 * Утилиты безопасности для санитизации HTML и URL для предотвращения XSS-атак.
 * @module utils/sanitize
 */

import DOMPurify from 'dompurify';
import type { Config } from 'dompurify';

/**
 * Предустановки конфигурации уровня санитизации.
 * - **strict**: Для пользовательских комментариев, отзывов — минимум разрешённых тегов
 * - **moderate**: Для описаний товаров — больше возможностей форматирования
 * - **permissive**: Для контента, созданного админом — полное форматирование, включая изображения
 */
const SANITIZE_CONFIGS: Record<SanitizeLevel, Config> = {
  strict: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
  },

  moderate: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span'],
    ALLOWED_ATTR: ['href', 'title', 'class'],
    ALLOW_DATA_ATTR: false,
    FORCE_BODY: true,
  },

  permissive: {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'table', 'tr', 'td', 'th', 'thead', 'tbody',
      'img', 'figure', 'figcaption', 'blockquote', 'code', 'pre', 'span'
    ],
    ALLOWED_ATTR: ['href', 'title', 'class', 'src', 'alt', 'width', 'height'],
    ALLOW_DATA_ATTR: false,
    FORCE_BODY: true,
  },
};

/** Уровни санитизации */
export type SanitizeLevel = 'strict' | 'moderate' | 'permissive';

/**
 * Список опасных протоколов URL, которые должны быть заблокированы.
 */
const DANGEROUS_PROTOCOLS = [
  'javascript:',
  'vbscript:',
  'data:text/html',
  'data:application',
  'data:image/svg+xml',
  'file:',
  'about:blank',
  'blob:',
];

/**
 * Список разрешённых протоколов URL.
 */
const ALLOWED_PROTOCOLS = [
  'http://',
  'https://',
  'mailto:',
  'tel:',
  'ftp://',
];

/**
 * Проверяет, содержит ли URL опасные протоколы после декодирования.
 */
const hasDangerousProtocol = (url: string): boolean => {
  try {
    const decodedUrl = decodeURIComponent(url);
    return decodedUrl.includes('javascript:') || decodedUrl.includes('vbscript:');
  } catch {
    return true; // Неверная кодировка URL, считаем подозрительным
  }
};

/**
 * Проверяет, начинается ли URL с разрешённого протокола.
 */
const hasAllowedProtocol = (normalized: string): boolean => {
  return ALLOWED_PROTOCOLS.some((protocol) => normalized.startsWith(protocol));
};

/**
 * Проверяет, является ли URL относительным.
 */
const isRelativeUrl = (url: string): boolean => {
  return url.startsWith('/') || url.startsWith('#') || url.startsWith('.');
};

/**
 * Проверяет, не имеет ли URL протокола или является same-origin.
 */
const isProtocolFreeUrl = (normalized: string): boolean => {
  if (!normalized.includes(':')) {
    return true;
  }
  
  // Проверяем, что это не попытка внедрения протокола
  const slashIndex = normalized.indexOf('/');
  const colonIndex = normalized.indexOf(':');
  return slashIndex !== -1 && slashIndex < colonIndex;
};

/**
 * Нормализует URL, удаляя управляющие символы.
 */
const normalizeUrl = (url: string): string => {
  // eslint-disable-next-line no-control-regex
  return url.toLowerCase().replace(/[\s\u0000-\u001F]/g, '');
};

/**
 * Проверяет, заблокирован ли URL списком опасных протоколов.
 */
const isBlockedByDangerousProtocol = (normalized: string): boolean => {
  return DANGEROUS_PROTOCOLS.some((protocol) => 
    normalized.startsWith(protocol.toLowerCase())
  );
};

/**
 * Проверяет и возвращает безопасный URL.
 */
const validateAndReturnUrl = (trimmed: string, normalized: string): string | null => {
  // Проверяем на обфусцированный протокол javascript:
  if (hasDangerousProtocol(normalized)) {
    return null;
  }

  // Разрешаем относительные URL
  if (isRelativeUrl(trimmed)) {
    return trimmed;
  }

  // Проверяем разрешённые протоколы
  if (hasAllowedProtocol(normalized)) {
    return trimmed;
  }

  // Разрешаем URL без протокола
  if (isProtocolFreeUrl(normalized)) {
    return trimmed;
  }

  return null;
};

/**
 * Санитизирует URL для предотвращения протокола javascript: и других инъекционных атак.
 * 
 * @param url - Строка URL для санитизации
 * @returns Санитизированный URL или null, если URL опасен
 * 
 * @example
 * ```tsx
 * // Безопасные URL проходят
 * sanitizeUrl('https://example.com'); // 'https://example.com'
 * sanitizeUrl('/path/to/страница'); // '/path/to/страница'
 * sanitizeUrl('mailto:test@example.com'); // 'mailto:test@example.com'
 * 
 * // Опасные URL возвращают null
 * sanitizeUrl('javascript:alert(1)'); // null
 * sanitizeUrl('JAVASCRIPT:alert(1)'); // null
 * sanitizeUrl('data:text/html,<script>alert(1)</script>'); // null
 * ```
 */
export const sanitizeUrl = (url: string | null | undefined): string | null => {
  if (url === null || url === undefined || typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();
  if (trimmed === '') {
    return null;
  }

  const normalized = normalizeUrl(trimmed);

  // Проверяем на опасные протоколы
  if (isBlockedByDangerousProtocol(normalized)) {
    return null;
  }

  return validateAndReturnUrl(trimmed, normalized);
};

/**
 * Проверяет атрибуты URL во время санитизации DOMPurify.
 */
const validateUrlAttribute = (
  _node: globalThis.Element,
  data: { attrName: string; attrValue: string; keepAttr: boolean }
): void => {
  if (data.attrName === 'href' || data.attrName === 'src') {
    const sanitizedUrl = sanitizeUrl(data.attrValue);
    if (sanitizedUrl === null) {
      data.keepAttr = false;
    } else {
      data.attrValue = sanitizedUrl;
    }
  }
};

/**
 * Санитизирует HTML с включёнными хуками проверки URL.
 */
const sanitizeWithUrlValidation = (html: string, config: Config): string => {
  DOMPurify.addHook('uponSanitizeAttribute', validateUrlAttribute);
  const sanitized = DOMPurify.sanitize(html, config);
  DOMPurify.removeAllHooks();
  return sanitized;
};

/**
 * Проверяет, требуется ли проверка URL для данного уровня санитизации.
 */
const requiresUrlValidation = (level: SanitizeLevel): boolean => {
  return level === 'moderate' || level === 'permissive';
};

/**
 * Санитизирует HTML-контент для предотвращения XSS-атак.
 * 
 * @param html - Строка HTML для санитизации
 * @param level - Применяемый уровень санитизации (по умолчанию: 'strict')
 * @returns Санитизированная HTML-строка, безопасная для рендеринга
 * 
 * @example
 * ```tsx
 * // Для пользовательских комментариев (strict)
 * const safeComment = sanitizeHtml(userComment, 'strict');
 * 
 * // Для описаний товаров (moderate)
 * const safeDescription = sanitizeHtml(product.описание, 'moderate');
 * 
 * // Для контента админа (permissive)
 * const safeContent = sanitizeHtml(adminContent, 'permissive');
 * ```
 */
export const sanitizeHtml = (
  html: string,
  level: SanitizeLevel = 'strict'
): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  const config = { ...SANITIZE_CONFIGS[level] };
  
  if (requiresUrlValidation(level)) {
    return sanitizeWithUrlValidation(html, config);
  }

  return DOMPurify.sanitize(html, config);
};

/**
 * Создаёт санитизированный HTML-объект для использования с dangerouslySetInnerHTML.
 * Это вспомогательная функция для встроенного использования.
 * 
 * @param html - Строка HTML для санитизации
 * @param level - Уровень санитизации (по умолчанию: 'strict')
 * @returns Объект со свойством __html, содержащим санитизированный HTML
 * 
 * @example
 * ```tsx
 * <div dangerouslySetInnerHTML={createSafeHtml(userComment)} />
 * ```
 */
export const createSafeHtml = (
  html: string,
  level: SanitizeLevel = 'strict'
): { __html: string } => {
  return { __html: sanitizeHtml(html, level) };
};

// Ре-экспорт DOMPurify для продвинутых случаев использования
export { DOMPurify };