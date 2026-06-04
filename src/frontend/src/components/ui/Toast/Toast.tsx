import type { ReactElement } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import type { ToastType } from '../../../store/toastStore';

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onClose: (id: string) => void;
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={18} className="text-price-drop" />,
  error: <XCircle size={18} className="text-price-rise" />,
  info: <Info size={18} className="text-info-blue" />,
  warning: <AlertTriangle size={18} className="text-warning" />,
};

const typeClasses: Record<ToastType, string> = {
  success: 'bg-surface-card border-l-4 border-price-drop',
  error: 'bg-surface-card border-l-4 border-price-rise',
  info: 'bg-surface-card border-l-4 border-info',
  warning: 'bg-surface-card border-l-4 border-gold',
};

export function Toast({ id, message, type, onClose }: ToastProps): ReactElement {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.9 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex items-center gap-2 p-3 pr-10 rounded-lg shadow-lg relative ${typeClasses[type]}`}
      role="alert"
      aria-live="polite"
    >
      <span className="flex-shrink-0">{icons[type]}</span>
      <p className="flex-1 text-sm text-body-text">{message}</p>
      <button
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-muted-text hover:text-body-text transition-colors"
        onClick={() => onClose(id)}
        aria-label="Закрыть уведомление"
        type="button"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}
