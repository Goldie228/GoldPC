import type { ReactElement } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useToast } from '../../../hooks/useToast';
import { Toast } from './Toast';

export function ToastContainer(): ReactElement | null {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-[1000] flex flex-col gap-2" aria-label="Уведомления">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={removeToast}
        />
      ))}
      </AnimatePresence>
    </div>
  );
}