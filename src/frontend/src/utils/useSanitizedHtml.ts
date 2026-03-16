/**
 * React hook for sanitizing HTML in components.
 * @module utils/useSanitizedHtml
 */

import { useMemo } from 'react';
import { sanitizeHtml, type SanitizeLevel } from './sanitize';

/**
 * Hook for sanitizing HTML in React components.
 * Useful when you need the sanitized HTML as a string rather than a component.
 * 
 * @param html - The HTML string to sanitize
 * @param level - The sanitization level (default: 'strict')
 * @returns Memoized sanitized HTML string
 * 
 * @example
 * ```tsx
 * function Comment({ content }: { content: string }) {
 *   const safeContent = useSanitizedHtml(content, 'strict');
 *   
 *   return <div dangerouslySetInnerHTML={{ __html: safeContent }} />;
 * }
 * ```
 */
export function useSanitizedHtml(
  html: string,
  level: SanitizeLevel = 'strict'
): string {
  return useMemo(() => sanitizeHtml(html, level), [html, level]);
}