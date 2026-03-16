/**
 * SafeHtml React component for securely rendering user-generated HTML content.
 * @module utils/SafeHtml
 */

import { memo, useMemo, type CSSProperties, type ReactElement } from 'react';
import { sanitizeHtml, type SanitizeLevel } from './sanitize';

/**
 * Props for the SafeHtml component.
 */
export interface SafeHtmlProps {
  /** HTML content to render safely */
  readonly html: string;
  /** Sanitization level (default: 'strict') */
  readonly level?: SanitizeLevel;
  /** CSS class name */
  readonly className?: string;
  /** Additional inline styles */
  readonly style?: CSSProperties;
  /** Test ID for testing */
  readonly 'data-testid'?: string;
  /** HTML element tag to render (default: 'div') */
  readonly as?: 'div' | 'span' | 'article' | 'section' | 'p';
}

/**
 * React component that safely renders HTML content using dangerouslySetInnerHTML.
 * The HTML is sanitized using DOMPurify before rendering to prevent XSS attacks.
 * 
 * @example
 * ```tsx
 * // Basic usage with strict sanitization (default)
 * <SafeHtml html={userComment} />
 * 
 * // Product description with moderate sanitization
 * <SafeHtml html={product.description} level="moderate" />
 * 
 * // Admin content with permissive sanitization
 * <SafeHtml html={adminContent} level="permissive" className="prose" />
 * 
 * // Render as a different element
 * <SafeHtml html={content} as="article" />
 * ```
 */
export const SafeHtml = memo(function SafeHtml({
  html,
  level = 'strict',
  className,
  style,
  'data-testid': testId,
  as: Component = 'div',
}: SafeHtmlProps): ReactElement {
  const sanitized = useMemo(() => sanitizeHtml(html, level), [html, level]);

  return (
    <Component
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: sanitized }}
      data-testid={testId}
    />
  );
});
