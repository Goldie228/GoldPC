import { motion } from 'framer-motion';
import { type Budget, BUDGET_OPTIONS } from './types';
import styles from './BuildWizard.module.css';

export function StepBudget({ selected, onSelect }: { selected: Budget | null; onSelect: (b: Budget) => void }) {
  return (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className={styles.stepContent}>
      <h2 className={styles.stepTitle}>Укажите бюджет</h2>
      <p className={styles.stepDescription}>Мы подберём компоненты в рамках вашего бюджета</p>
      <div className={styles.budgetGrid}>
        {BUDGET_OPTIONS.map((option) => (
          <button key={option.id} className={`${styles.budgetCard} ${selected === option.id ? styles.budgetCardSelected : ''}`} onClick={() => onSelect(option.id)}>
            <div className={styles.budgetLabel}>{option.label}</div>
            <div className={styles.budgetRange}>{option.range}</div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
