import { motion } from 'framer-motion';
import { type Budget, BUDGET_OPTIONS } from './types';

export function StepBudget({
  selected, onSelect, customBudget, onCustomChange,
}: {
  selected: Budget | null;
  onSelect: (b: Budget) => void;
  customBudget?: number;
  onCustomChange?: (v: number) => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="[&:not(:has(+*))]:animate-[fadeIn_0.3s_ease]">
      <h2 className="text-title-md font-semibold text-on-dark text-center mb-2">Укажите бюджет</h2>
      <p className="text-body-md text-muted-text text-center mb-7">Мы подберём компоненты в рамках вашего бюджета</p>
      <div className="grid grid-cols-2 gap-4">
        {BUDGET_OPTIONS.map((option) => (
          <button key={option.id} className={`flex flex-col items-center gap-2 p-6 bg-surface-card border rounded-xl cursor-pointer transition-all duration-200 hover:border-gold/50 ${selected === option.id ? 'border-2 border-gold shadow-[0_0_20px_rgba(252,213,53,0.15)]' : 'border-hairline-dark'}`} onClick={() => onSelect(option.id)}>
            <div className="text-title-md font-semibold text-on-dark">{option.label}</div>
            <div className="font-['Nunito'] text-body-md font-medium text-gold">{option.range}</div>
          </button>
        ))}
      </div>
      {selected === 'custom' && customBudget != null && onCustomChange && (
        <div className="mt-6 flex flex-col gap-3">
          <div className="flex items-center justify-between text-body-md text-muted-text">
            <span>Свой бюджет</span>
            <span className="font-['Nunito'] font-semibold text-gold">{customBudget.toLocaleString('ru-BY')} BYN</span>
          </div>
          <input
            type="range"
            min={500}
            max={15000}
            step={100}
            value={customBudget}
            onChange={(e) => onCustomChange(Number(e.target.value))}
            className="w-full accent-[var(--color-gold)] cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-muted-text">
            <span>500 BYN</span>
            <span>15 000 BYN</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
