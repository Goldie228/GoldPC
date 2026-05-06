import type { ReactElement, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export interface ApiErrorBannerProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  children?: ReactNode;
}

/**
 * Блок ошибки загрузки данных: иконка, текст, кнопка повтора.
 */
export function ApiErrorBanner({
  message,
  onRetry,
  retryLabel = 'Попробовать снова',
  children,
}: ApiErrorBannerProps): ReactElement {
  return (
    <div className="flex items-center gap-3 p-4 bg-price-rise/10 border-l-4 border-price-rise rounded-lg" role="alert">
      <div className="flex-shrink-0" aria-hidden="true">
        <AlertCircle className="w-5 h-5 text-price-rise" strokeWidth={2} />
      </div>
      <p className="flex-1 text-sm text-price-rise">{message}</p>
      <div className="flex items-center gap-2">
        {onRetry && (
          <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 bg-price-rise text-on-dark text-sm font-medium rounded-md hover:bg-price-rise/90 transition-colors" onClick={onRetry}>
            <RefreshCw size={18} aria-hidden />
            <span>{retryLabel}</span>
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
