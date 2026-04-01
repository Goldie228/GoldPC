import { motion } from 'framer-motion';
import { Monitor, Briefcase, Film, Sparkles } from 'lucide-react';
import { type Purpose, PURPOSE_OPTIONS } from './types';
import styles from './BuildWizard.module.css';

const ICON_MAP: Record<string, React.ReactNode> = {
  Monitor: <Monitor size={28} />, Briefcase: <Briefcase size={28} />,
  Film: <Film size={28} />, Sparkles: <Sparkles size={28} />,
};

export function StepPurpose({ selected, onSelect }: { selected: Purpose | null; onSelect: (p: Purpose) => void }) {
  return (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className={styles.stepContent}>
      <h2 className={styles.stepTitle}>Выберите назначение ПК</h2>
      <p className={styles.stepDescription}>Это поможет нам подобрать оптимальные компоненты</p>
      <div className={styles.optionsGrid}>
        {PURPOSE_OPTIONS.map((o) => (
          <button key={o.id} className={`${styles.optionCard} ${selected === o.id ? styles.optionCardSelected : ''}`} onClick={() => onSelect(o.id)}>
            <div className={styles.optionIcon}>{ICON_MAP[o.icon]}</div>
            <div className={styles.optionLabel}>{o.label}</div>
            <div className={styles.optionDescription}>{o.description}</div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
