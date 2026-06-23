import { motion } from 'framer-motion';
import { Monitor, Briefcase, Film, Radio, Tv, Server } from 'lucide-react';
import { type Purpose, PURPOSE_OPTIONS } from './types';

const ICON_MAP: Record<string, React.ReactNode> = {
  Monitor: <Monitor size={28} />, Briefcase: <Briefcase size={28} />,
  Film: <Film size={28} />, Radio: <Radio size={28} />,
  Tv: <Tv size={28} />, Server: <Server size={28} />,
};

export function StepPurpose({ selected, onSelect }: { selected: Purpose | null; onSelect: (p: Purpose) => void }) {
  return (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="[&:not(:has(+*))]:animate-[fadeIn_0.3s_ease]">
      <h2 className="text-title-md font-semibold text-on-dark text-center mb-2">Выберите назначение ПК</h2>
      <p className="text-body-md text-muted-text text-center mb-7">Это поможет нам подобрать оптимальные компоненты</p>
      <div className="grid grid-cols-2 gap-4">
        {PURPOSE_OPTIONS.map((o) => (
          <button key={o.id} className={`flex flex-col items-center gap-2.5 p-6 bg-surface-card border rounded-xl cursor-pointer transition-all duration-200 text-center hover:border-gold/50 hover:bg-surface-elevated ${selected === o.id ? 'border-2 border-gold shadow-[0_0_20px_rgba(252,213,53,0.15)]' : 'border-hairline-dark'}`} onClick={() => onSelect(o.id)}>
            <div className={selected === o.id ? 'text-gold' : 'text-muted-text'}>{ICON_MAP[o.icon]}</div>
            <div className="text-title-sm font-semibold text-on-dark">{o.label}</div>
            <div className="text-xs text-muted-text">{o.description}</div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
