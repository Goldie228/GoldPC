import { motion } from 'framer-motion';
import { HardDrive } from 'lucide-react';
import type { PCComponentType } from '../../hooks';
import { type WizardState, type Purpose, type Budget, PURPOSE_OPTIONS, BUDGET_OPTIONS, COMPONENT_LABELS, getTemplate } from './types';
import styles from './BuildWizard.module.css';

export function BuildResult({ wizardState, onAddToBuilder }: { wizardState: WizardState; onAddToBuilder: () => void }) {
  const template = getTemplate(wizardState.purpose as Purpose, wizardState.budget as Budget);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={styles.resultContent}>
      <h2 className={styles.stepTitle}>Подбор завершён!</h2>
      <p className={styles.stepDescription}>Мы подобрали оптимальную конфигурацию на основе ваших предпочтений</p>

      <div className={styles.resultSummary}>
        <div className={styles.resultRow}>
          <span>Назначение</span>
          <span>{PURPOSE_OPTIONS.find((o) => o.id === wizardState.purpose)?.label}</span>
        </div>
        <div className={styles.resultRow}>
          <span>Бюджет</span>
          <span>{BUDGET_OPTIONS.find((o) => o.id === wizardState.budget)?.range}</span>
        </div>
        <div className={styles.resultRow}>
          <span>Процессор</span>
          <span>{wizardState.cpuPreference === 'any' ? 'Любой' : wizardState.cpuPreference.toUpperCase()}</span>
        </div>
        <div className={styles.resultRow}>
          <span>Видеокарта</span>
          <span>{wizardState.gpuPreference === 'any' ? 'Любая' : wizardState.gpuPreference.toUpperCase()}</span>
        </div>
        <div className={styles.resultRow}>
          <span>ОЗУ</span>
          <span>от {wizardState.minRam} ГБ</span>
        </div>
      </div>

      <div className={styles.resultTemplate}>
        <h3>Рекомендуемый диапазон цен</h3>
        <div className={styles.templateGrid}>
          {Object.entries(template).map(([key, value]) => (
            <div key={key} className={styles.templateItem}>
              <span className={styles.templateLabel}>{COMPONENT_LABELS[key as PCComponentType] || key}</span>
              <span className={styles.templatePrice}>
                {value.minPrice > 0
                  ? `${value.minPrice.toLocaleString('ru-BY')} — ${value.maxPrice.toLocaleString('ru-BY')} BYN`
                  : 'Интегрированная'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button className={styles.resultBtn} onClick={onAddToBuilder}>
        <HardDrive size={20} />
        Перейти в конструктор
      </button>
    </motion.div>
  );
}
