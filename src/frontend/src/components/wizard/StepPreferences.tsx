import { motion } from 'framer-motion';
import { Cpu, Monitor, MemoryStick } from 'lucide-react';
import { type CpuPreference, type GpuPreference } from './types';

export function StepPreferences({
  cpuPreference, gpuPreference, minRam,
  onCpuChange, onGpuChange, onRamChange,
}: {
  cpuPreference: CpuPreference; gpuPreference: GpuPreference; minRam: number;
  onCpuChange: (p: CpuPreference) => void; onGpuChange: (p: GpuPreference) => void; onRamChange: (r: number) => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="[&:not(:has(+*))]:animate-[fadeIn_0.3s_ease]">
      <h2 className="text-1.5xl font-semibold text-[var(--fg-primary,#f5f5f5)] text-center mb-2">Предпочтения</h2>
      <p className="text-sm text-[var(--fg-muted)] text-center mb-7">Настройте детали подбора компонентов</p>
      <div className="flex flex-col gap-7">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-base font-semibold text-[var(--fg-primary,#f5f5f5)]"><Cpu size={20} /> Процессор</div>
          <div className="flex flex-wrap gap-2.5">
            {(['amd', 'intel', 'any'] as CpuPreference[]).map((pref) => (
              <button key={pref} className={`px-5 py-2.5 bg-[var(--surface-elevated,#1a1a2e)] border-2 border-[var(--border-default)] rounded-lg text-[var(--fg-secondary,#ccc)] text-sm cursor-pointer transition-all duration-200 hover:border-[var(--brand-primary,#c9a84c)] ${cpuPreference === pref ? 'border-[var(--brand-primary,#c9a84c)] bg-[rgba(201,168,76,0.12)] text-[var(--brand-primary,#c9a84c)] font-semibold' : ''}`} onClick={() => onCpuChange(pref)}>
                {pref === 'amd' ? 'AMD' : pref === 'intel' ? 'Intel' : 'Любой'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-base font-semibold text-[var(--fg-primary,#f5f5f5)]"><Monitor size={20} /> Видеокарта</div>
          <div className="flex flex-wrap gap-2.5">
            {(['amd', 'nvidia', 'any'] as GpuPreference[]).map((pref) => (
              <button key={pref} className={`px-5 py-2.5 bg-[var(--surface-elevated,#1a1a2e)] border-2 border-[var(--border-default)] rounded-lg text-[var(--fg-secondary,#ccc)] text-sm cursor-pointer transition-all duration-200 hover:border-[var(--brand-primary,#c9a84c)] ${gpuPreference === pref ? 'border-[var(--brand-primary,#c9a84c)] bg-[rgba(201,168,76,0.12)] text-[var(--brand-primary,#c9a84c)] font-semibold' : ''}`} onClick={() => onGpuChange(pref)}>
                {pref === 'amd' ? 'AMD' : pref === 'nvidia' ? 'NVIDIA' : 'Любая'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-base font-semibold text-[var(--fg-primary,#f5f5f5)]"><MemoryStick size={20} /> Минимальный объём ОЗУ</div>
          <div className="flex flex-wrap gap-2.5">
            {[8, 16, 32, 64].map((ram) => (
              <button key={ram} className={`px-5 py-2.5 bg-[var(--surface-elevated,#1a1a2e)] border-2 border-[var(--border-default)] rounded-lg text-[var(--fg-secondary,#ccc)] text-sm cursor-pointer transition-all duration-200 hover:border-[var(--brand-primary,#c9a84c)] ${minRam === ram ? 'border-[var(--brand-primary,#c9a84c)] bg-[rgba(201,168,76,0.12)] text-[var(--brand-primary,#c9a84c)] font-semibold' : ''}`} onClick={() => onRamChange(ram)}>
                {ram} ГБ
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
