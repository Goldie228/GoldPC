/**
 * StepPresets — Choose a pre-configured build or proceed to manual setup
 */

import { motion } from 'framer-motion';
import { Crosshair, Gamepad2, Film, Briefcase, Radio, Tv, Settings } from 'lucide-react';
import { PRESET_BUILDS, type PresetBuild } from './types';

const PRESET_ICONS: Record<string, React.ReactNode> = {
  Crosshair: <Crosshair size={24} />,
  Gamepad2: <Gamepad2 size={24} />,
  Film: <Film size={24} />,
  Briefcase: <Briefcase size={24} />,
  Radio: <Radio size={24} />,
  Tv: <Tv size={24} />,
};

interface StepPresetsProps {
  selected: string | null;
  onSelect: (preset: PresetBuild | null) => void;
}

export function StepPresets({ selected, onSelect }: StepPresetsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      <h2 className="text-title-md font-semibold text-on-dark text-center mb-2">
        Готовые сборки
      </h2>
      <p className="text-body-md text-muted-text text-center mb-7">
        Выберите пресет или настройте ПК вручную
      </p>

      <div className="grid grid-cols-2 gap-4 mb-5">
        {PRESET_BUILDS.map((preset) => (
          <button
            key={preset.id}
            className={`flex flex-col items-start gap-2 p-5 bg-surface-card border rounded-xl cursor-pointer transition-all duration-200 text-left hover:border-gold/50 hover:bg-surface-elevated ${
              selected === preset.id
                ? 'border-2 border-gold shadow-[0_0_20px_rgba(252,213,53,0.15)]'
                : 'border-hairline-dark'
            }`}
            onClick={() => onSelect(preset)}
          >
            <div className={selected === preset.id ? 'text-gold' : 'text-muted-text'}>
              {PRESET_ICONS[preset.icon]}
            </div>
            <div className="text-title-sm font-semibold text-on-dark">{preset.label}</div>
            <div className="text-xs text-muted-text">{preset.description}</div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {preset.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-surface-elevated text-muted-text border border-hairline-dark"
                >
                  {tag}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      <button
        className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-surface-elevated border border-hairline-dark rounded-xl text-body-md font-medium text-muted-text cursor-pointer transition-all duration-200 hover:border-gold/50 hover:text-on-dark"
        onClick={() => onSelect(null)}
      >
        <Settings size={18} />
        Настроить вручную
      </button>
    </motion.div>
  );
}
