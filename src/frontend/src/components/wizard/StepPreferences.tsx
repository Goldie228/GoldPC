import { motion } from 'framer-motion';
import { Cpu, Monitor, MemoryStick } from 'lucide-react';
import { type CpuPreference, type GpuPreference } from './types';
import styles from './BuildWizard.module.css';

export function StepPreferences({
  cpuPreference, gpuPreference, minRam,
  onCpuChange, onGpuChange, onRamChange,
}: {
  cpuPreference: CpuPreference; gpuPreference: GpuPreference; minRam: number;
  onCpuChange: (p: CpuPreference) => void; onGpuChange: (p: GpuPreference) => void; onRamChange: (r: number) => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className={styles.stepContent}>
      <h2 className={styles.stepTitle}>Предпочтения</h2>
      <p className={styles.stepDescription}>Настройте детали подбора компонентов</p>
      <div className={styles.preferencesSection}>
        <div className={styles.preferenceGroup}>
          <div className={styles.preferenceLabel}><Cpu size={20} /> Процессор</div>
          <div className={styles.preferenceOptions}>
            {(['amd', 'intel', 'any'] as CpuPreference[]).map((pref) => (
              <button key={pref} className={`${styles.preferenceBtn} ${cpuPreference === pref ? styles.preferenceBtnSelected : ''}`} onClick={() => onCpuChange(pref)}>
                {pref === 'amd' ? 'AMD' : pref === 'intel' ? 'Intel' : 'Любой'}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.preferenceGroup}>
          <div className={styles.preferenceLabel}><Monitor size={20} /> Видеокарта</div>
          <div className={styles.preferenceOptions}>
            {(['amd', 'nvidia', 'any'] as GpuPreference[]).map((pref) => (
              <button key={pref} className={`${styles.preferenceBtn} ${gpuPreference === pref ? styles.preferenceBtnSelected : ''}`} onClick={() => onGpuChange(pref)}>
                {pref === 'amd' ? 'AMD' : pref === 'nvidia' ? 'NVIDIA' : 'Любая'}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.preferenceGroup}>
          <div className={styles.preferenceLabel}><MemoryStick size={20} /> Минимальный объём ОЗУ</div>
          <div className={styles.preferenceOptions}>
            {[8, 16, 32, 64].map((ram) => (
              <button key={ram} className={`${styles.preferenceBtn} ${minRam === ram ? styles.preferenceBtnSelected : ''}`} onClick={() => onRamChange(ram)}>
                {ram} ГБ
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
