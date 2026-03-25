import type { ReactElement, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import styles from './ApiErrorBanner.module.css';

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
    <div className={styles.wrap} role="alert">
      <div className={styles.iconWrap} aria-hidden="true">
        <AlertCircle className={styles.icon} strokeWidth={2} />
      </div>
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        {onRetry && (
          <button type="button" className={styles.retryBtn} onClick={onRetry}>
            <RefreshCw size={18} aria-hidden />
            <span>{retryLabel}</span>
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
