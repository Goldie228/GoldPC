/**
 * Utility functions and components for the GoldPC frontend.
 * @module utils
 */

// Security utilities
export {
  sanitizeHtml,
  sanitizeUrl,
  createSafeHtml,
  type SanitizeLevel,
} from './sanitize';

// SafeHtml component
export { SafeHtml, type SafeHtmlProps } from './SafeHtml';

// Hooks
export { useSanitizedHtml } from './useSanitizedHtml';

// Pluralization (Russian)
export {
  pluralizeRu,
  formatCountRu,
  RU_FORMS,
} from './pluralizeRu';
