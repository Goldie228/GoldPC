import { Package, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

type EmptyStateAction = {
  label: string;
  onClick: () => void;
};

interface EmptyStateProps {
  title?: string;
  description?: string;
  onReset?: () => void;
  showResetButton?: boolean;
  actions?: EmptyStateAction[];
}

/**
 * Компонент для отображения пустого состояния каталога
 * Показывается когда товары не найдены по заданным фильтрам
 */
export function EmptyState({
  title = 'Ничего не найдено',
  description = 'Попробуйте изменить параметры поиска или сбросить фильтры',
  onReset,
  showResetButton = true,
  actions = [],
}: EmptyStateProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center p-12 px-8 text-center w-full max-w-[480px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-center w-[120px] h-[120px] rounded-full bg-[linear-gradient(135deg,var(--border-brand)_0%,var(--border-brand)_100%)] mb-6">
        <Package size={64} className="text-[var(--accent)] opacity-85" />
      </div>
      
      <h3 className="text-2xl font-semibold text-[var(--fg)] mb-3 tracking-tight">{title}</h3>
      <p className="text-base text-[var(--fg-muted)] mb-8 max-w-[400px] leading-relaxed">{description}</p>
      
      {showResetButton && onReset && (
        <button
          className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-[var(--bg)] border border-[var(--border-accent)] rounded-[var(--radius-lg)] text-sm font-semibold cursor-pointer shadow-[0_2px_8px_var(--border-brand)] hover:bg-[var(--accent-hover)] hover:border-[var(--border-brand)] hover:-translate-y-px hover:shadow-[0_4px_12px_var(--border-brand)] active:translate-y-0 focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2"
          onClick={onReset}
          type="button"
        >
          <RotateCcw size={18} />
          <span>Сбросить фильтры</span>
        </button>
      )}

      {actions.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-3">
          {actions.map((a) => (
            <button key={a.label} type="button" className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-transparent text-[var(--fg)] border border-[var(--border)] rounded-[var(--radius-lg)] text-sm cursor-pointer hover:bg-[var(--border-brand)] hover:border-[var(--border-brand)]" onClick={a.onClick}>
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default EmptyState;