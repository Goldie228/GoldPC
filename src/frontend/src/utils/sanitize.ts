/**
 * Security utilities for sanitizing HTML and URLs to prevent XSS attacks.
 * @module utils/sanitize
 */

import DOMPurify from 'dompurify';
import type { Config } from 'dompurify';

/**
 * Sanitization level configuration presets.
 * - **strict**: For user comments, reviews - minimal tags allowed
 * - **moderate**: For product descriptions - more formatting options
 * - **permissive**: For admin-created content - full formatting including images
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

/** Sanitization levels */
export type SanitizeLevel = 'strict' | 'moderate' | 'permissive';

/**
 * List of dangerous URL protocols that should be blocked.
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
 * List of allowed URL protocols.
 */
const ALLOWED_PROTOCOLS = [
  'http://',
  'https://',
  'mailto:',
  'tel:',
  'ftp://',
];

/**
 * Checks if a URL contains dangerous protocols after decoding.
 */
const hasDangerousProtocol = (url: string): boolean => {
  try {
    const decodedUrl = decodeURIComponent(url);
    return decodedUrl.includes('javascript:') || decodedUrl.includes('vbscript:');
  } catch {
    return true; // Invalid URL encoding, treat as suspicious
  }
};

/**
 * Checks if URL starts with an allowed protocol.
 */
const hasAllowedProtocol = (normalized: string): boolean => {
  return ALLOWED_PROTOCOLS.some((protocol) => normalized.startsWith(protocol));
};

/**
 * Checks if URL is a relative URL.
 */
const isRelativeUrl = (url: string): boolean => {
  return url.startsWith('/') || url.startsWith('#') || url.startsWith('.');
};

/**
 * Checks if URL has no protocol or is same-origin.
 */
const isProtocolFreeUrl = (normalized: string): boolean => {
  if (!normalized.includes(':')) {
    return true;
  }
  
  // Check it's not an attempted protocol injection
  const slashIndex = normalized.indexOf('/');
  const colonIndex = normalized.indexOf(':');
  return slashIndex !== -1 && slashIndex < colonIndex;
};

/**
 * Normalizes URL by removing control characters.
 */
const normalizeUrl = (url: string): string => {
  // eslint-disable-next-line no-control-regex
  return url.toLowerCase().replace(/[\s\u0000-\u001F]/g, '');
};

/**
 * Checks if URL is blocked by dangerous protocols list.
 */
const isBlockedByDangerousProtocol = (normalized: string): boolean => {
  return DANGEROUS_PROTOCOLS.some((protocol) => 
    normalized.startsWith(protocol.toLowerCase())
  );
};

/**
 * Validates and returns a safe URL.
 */
const validateAndReturnUrl = (trimmed: string, normalized: string): string | null => {
  // Check for obfuscated javascript: protocol
  if (hasDangerousProtocol(normalized)) {
    return null;
  }

  // Allow relative URLs
  if (isRelativeUrl(trimmed)) {
    return trimmed;
  }

  // Check for allowed protocols
  if (hasAllowedProtocol(normalized)) {
    return trimmed;
  }

  // Allow URLs without protocol
  if (isProtocolFreeUrl(normalized)) {
    return trimmed;
  }

  return null;
};

/**
 * Sanitizes a URL to prevent javascript: protocol and other injection attacks.
 * 
 * @param url - The URL string to sanitize
 * @returns Sanitized URL or null if the URL is dangerous
 * 
 * @example
 * ```tsx
 * // Safe URLs pass through
 * sanitizeUrl('https://example.com'); // 'https://example.com'
 * sanitizeUrl('/path/to/page'); // '/path/to/page'
 * sanitizeUrl('mailto:test@example.com'); // 'mailto:test@example.com'
 * 
 * // Dangerous URLs return null
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

  // Check for dangerous protocols
  if (isBlockedByDangerousProtocol(normalized)) {
    return null;
  }

  return validateAndReturnUrl(trimmed, normalized);
};

/**
 * Validates URL attributes during DOMPurify sanitization.
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
 * Sanitizes HTML with URL validation hooks enabled.
 */
const sanitizeWithUrlValidation = (html: string, config: Config): string => {
  DOMPurify.addHook('uponSanitizeAttribute', validateUrlAttribute);
  const sanitized = DOMPurify.sanitize(html, config);
  DOMPurify.removeAllHooks();
  return sanitized;
};

/**
 * Checks if the sanitization level requires URL validation.
 */
const requiresUrlValidation = (level: SanitizeLevel): boolean => {
  return level === 'moderate' || level === 'permissive';
};

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * 
 * @param html - The HTML string to sanitize
 * @param level - The sanitization level to apply (default: 'strict')
 * @returns Sanitized HTML string safe for rendering
 * 
 * @example
 * ```tsx
 * // For user comments (strict)
 * const safeComment = sanitizeHtml(userComment, 'strict');
 * 
 * // For product descriptions (moderate)
 * const safeDescription = sanitizeHtml(product.description, 'moderate');
 * 
 * // For admin content (permissive)
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
 * Creates a sanitized HTML object for use with dangerouslySetInnerHTML.
 * This is a convenience function for inline usage.
 * 
 * @param html - The HTML string to sanitize
 * @param level - The sanitization level (default: 'strict')
 * @returns Object with __html property containing sanitized HTML
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

// Re-export DOMPurify for advanced use cases
export { DOMPurify };