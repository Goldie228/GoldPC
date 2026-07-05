/**
 * React компонент SafeHtml для безопасного отображения пользовательского HTML-контента.
 * @module utils/SafeHtml
 */

import { memo, useMemo, type CSSProperties, type ReactElement } from 'react';
import { sanitizeHtml, type SanitizeLevel } from './sanitize';

/**
 * Свойства для компонента SafeHtml.
 */
export interface SafeHtmlProps {
  /** HTML-контент для безопасного отображения */
  readonly html: string;
  /** Уровень санитизации (по умолчанию: 'strict') */
  readonly level?: SanitizeLevel;
  /** Имя CSS-класса */
  readonly className?: string;
  /** Дополнительные inline-стили */
  readonly style?: CSSProperties;
  /** ID для тестирования */
  readonly 'data-testid'?: string;
  /** HTML-тег для отображения (по умолчанию: 'div') */
  readonly as?: 'div' | 'span' | 'article' | 'section' | 'p';
}

/**
 * React компонент, безопасно отображающий HTML-контент через dangerouslySetInnerHTML.
 * HTML санитизируется с помощью DOMPurify перед отображением для предотвращения XSS-атак.
 * 
 * @example
 * ```tsx
 * // Базовое использование со строгой санитизацией (по умолчанию)
 * <SafeHtml html={userComment} />
 * 
 * // Описание товара с умеренной санитизацией
 * <SafeHtml html={product.описание} level="moderate" />
 * 
 * // Контент админа с разрешительной санитизацией
 * <SafeHtml html={adminContent} level="permissive" className="prose" />
 * 
 * // Отрисовка как другой элемент
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
