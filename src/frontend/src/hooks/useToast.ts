/**
 * useToast Hook - Управление уведомлениями (toasts)
 */
import { useToastStore, type Toast, type ToastType } from '../store/toastStore';

export interface UseToastReturn {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export function useToast(): UseToastReturn {
  const toasts = useToastStore((state) => state.toasts);
  const showToast = useToastStore((state) => state.showToast);
  const removeToast = useToastStore((state) => state.removeToast);
  const clearToasts = useToastStore((state) => state.clearToasts);

  return {
    toasts,
    showToast,
    removeToast,
    clearToasts,
  };
}

export default useToast;