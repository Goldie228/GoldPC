import type { ReactElement } from 'react';
import { useToastStore } from '../../../store/toastStore';
import { Toast } from './Toast';
import styles from './ToastContainer.module.css';

export function ToastContainer(): ReactElement | null {
  const { toasts, removeToast } = useToastStore();

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