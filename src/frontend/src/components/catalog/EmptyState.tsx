import { Package, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  title?: string;
  description?: string;
  onReset?: () => void;
  showResetButton?: boolean;
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
    </motion.div>
  );
}

export default EmptyState;