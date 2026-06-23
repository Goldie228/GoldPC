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
      <h2 className="text-title-md font-semibold text-on-dark text-center mb-2">Предпочтения</h2>
      <p className="text-body-md text-muted-text text-center mb-7">Настройте детали подбора компонентов</p>
      <div className="flex flex-col gap-7">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-title-sm font-semibold text-body-text"><Cpu size={20} /> Процессор</div>
          <div className="flex flex-wrap gap-2.5">
            {(['amd', 'intel', 'any'] as CpuPreference[]).map((pref) => (
              <button key={pref} className={`px-5 py-2.5 bg-surface-elevated border rounded-md text-body-md cursor-pointer transition-all duration-200 hover:border-gold ${cpuPreference === pref ? 'border-2 border-gold bg-gold text-gold-ink font-semibold' : 'border-hairline-dark text-body-text'}`} onClick={() => onCpuChange(pref)}>
                {pref === 'amd' ? 'AMD' : pref === 'intel' ? 'Intel' : 'Любой'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-title-sm font-semibold text-body-text"><Monitor size={20} /> Видеокарта</div>
          <div className="flex flex-wrap gap-2.5">
            {(['amd', 'nvidia', 'any'] as GpuPreference[]).map((pref) => (
              <button key={pref} className={`px-5 py-2.5 bg-surface-elevated border rounded-md text-body-md cursor-pointer transition-all duration-200 hover:border-gold ${gpuPreference === pref ? 'border-2 border-gold bg-gold text-gold-ink font-semibold' : 'border-hairline-dark text-body-text'}`} onClick={() => onGpuChange(pref)}>
                {pref === 'amd' ? 'AMD' : pref === 'nvidia' ? 'NVIDIA' : 'Любая'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-title-sm font-semibold text-body-text"><MemoryStick size={20} /> Минимальный объём ОЗУ</div>
          <div className="flex flex-wrap gap-2.5">
            {[8, 16, 32, 64].map((ram) => (
              <button key={ram} className={`px-5 py-2.5 bg-surface-elevated border rounded-md text-body-md cursor-pointer transition-all duration-200 hover:border-gold ${minRam === ram ? 'border-2 border-gold bg-gold text-gold-ink font-semibold' : 'border-hairline-dark text-body-text'}`} onClick={() => onRamChange(ram)}>
                {ram} ГБ
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
