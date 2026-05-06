import { motion } from 'framer-motion';
import { Monitor, Briefcase, Film, Sparkles } from 'lucide-react';
import { type Purpose, PURPOSE_OPTIONS } from './types';

const ICON_MAP: Record<string, React.ReactNode> = {
  Monitor: <Monitor size={28} />, Briefcase: <Briefcase size={28} />,
  Film: <Film size={28} />, Sparkles: <Sparkles size={28} />,
};

export function StepPurpose({ selected, onSelect }: { selected: Purpose | null; onSelect: (p: Purpose) => void }) {
  return (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="[&:not(:has(+*))]:animate-[fadeIn_0.3s_ease]">
      <h2 className="text-1.5xl font-semibold text-[var(--fg-primary,#f5f5f5)] text-center mb-2">Выберите назначение ПК</h2>
      <p className="text-sm text-[var(--fg-muted)] text-center mb-7">Это поможет нам подобрать оптимальные компоненты</p>
      <div className="grid grid-cols-2 gap-4">
        {PURPOSE_OPTIONS.map((o) => (
          <button key={o.id} className={`flex flex-col items-center gap-2.5 p-7 bg-[var(--surface-elevated,#1a1a2e)] border-2 border-[var(--border-default)] rounded-xl cursor-pointer transition-all duration-200 text-center hover:border-[var(--brand-primary,#c9a84c)] hover:bg-[var(--surface-hover,#222240)] ${selected === o.id ? 'border-[var(--brand-primary,#c9a84c)] bg-[rgba(201,168,76,0.08)] shadow-[0_0_20px_rgba(201,168,76,0.15)]' : ''}`} onClick={() => onSelect(o.id)}>
            <div className="text-[var(--brand-primary,#c9a84c)]">{ICON_MAP[o.icon]}</div>
            <div className="text-lg font-semibold text-[var(--fg-primary,#f5f5f5)]">{o.label}</div>
            <div className="text-xs text-[var(--fg-muted)]">{o.description}</div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
