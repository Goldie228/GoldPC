import type { ReactElement } from 'react';

/**
 * Простой скелетон загрузки страницы с shimmer-эаголовкой
 * Заменяет сложный ProductCardSkeleton для всех страниц
 */
export function SimplePageLoader(): ReactElement {
  return (
    <div className="space-y-4 p-4">
      <div className="h-4 bg-surface-elevated rounded animate-pulse" aria-hidden="true" />
      <div className="h-4 bg-surface-elevated rounded animate-pulse" aria-hidden="true" />
      <div className="h-4 bg-surface-elevated rounded animate-pulse" aria-hidden="true" />
      <div className="h-4 bg-surface-elevated rounded animate-pulse" aria-hidden="true" />
      <div className="h-4 bg-surface-elevated rounded animate-pulse" aria-hidden="true" />
      <div className="h-4 bg-surface-elevated rounded animate-pulse" aria-hidden="true" />
      <div className="h-4 bg-surface-elevated rounded animate-pulse" aria-hidden="true" />
      <div className="h-4 bg-surface-elevated rounded animate-pulse" aria-hidden="true" />
      <div className="h-4 bg-surface-elevated rounded animate-pulse" aria-hidden="true" />
      <div className="h-4 bg-surface-elevated rounded animate-pulse" aria-hidden="true" />
    </div>
  );
}