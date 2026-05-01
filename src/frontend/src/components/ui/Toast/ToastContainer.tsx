import type { ReactElement } from 'react';
import { useToast } from '../../../hooks/useToast';
import { Toast } from './Toast';
import styles from './ToastContainer.module.css';

export function ToastContainer(): ReactElement | null {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className={styles.container} aria-label="Уведомления">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={removeToast}
        />
      ))}
    </div>
  );
}