import type { ReactElement } from 'react';
import type { ToastType } from '../../../store/toastStore';
import styles from './Toast.module.css';

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onClose: (id: string) => void;
}

const icons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

export function Toast({ id, message, type, onClose }: ToastProps): ReactElement {
  return (
    <div className={`${styles.toast} ${styles[type]}`} role="alert" aria-live="polite">
      <span className={styles.icon}>{icons[type]}</span>
      <p className={styles.message}>{message}</p>
      <button
        className={styles.closeButton}
        onClick={() => onClose(id)}
        aria-label="Закрыть уведомление"
        type="button"
      >
        ✕
      </button>
    </div>
  );
}