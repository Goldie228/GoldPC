import { Package, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './EmptyState.module.css';

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
      className={styles.container}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className={styles.iconWrapper}>
        <Package size={64} className={styles.icon} />
      </div>
      
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      
      {showResetButton && onReset && (
        <button
          className={styles.resetButton}
          onClick={onReset}
          type="button"
        >
          <RotateCcw size={18} />
          <span>Сбросить фильтры</span>
        </button>
      )}

      {actions.length > 0 && (
        <div className={styles.actions}>
          {actions.map((a) => (
            <button key={a.label} type="button" className={styles.actionButton} onClick={a.onClick}>
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default EmptyState;