import { motion } from 'framer-motion';
import { type Budget, BUDGET_OPTIONS } from './types';

export function StepBudget({ selected, onSelect }: { selected: Budget | null; onSelect: (b: Budget) => void }) {
  return (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="[&:not(:has(+*))]:animate-[fadeIn_0.3s_ease]">
      <h2 className="text-1.5xl font-semibold text-[var(--fg-primary,#f5f5f5)] text-center mb-2">Укажите бюджет</h2>
      <p className="text-sm text-[var(--fg-muted)] text-center mb-7">Мы подберём компоненты в рамках вашего бюджета</p>
      <div className="grid grid-cols-2 gap-4">
        {BUDGET_OPTIONS.map((option) => (
          <button key={option.id} className={`flex flex-col items-center gap-2 p-6 bg-[var(--surface-elevated,#1a1a2e)] border-2 border-[var(--border-default)] rounded-xl cursor-pointer transition-all duration-200 hover:border-[var(--brand-primary,#c9a84c)] ${selected === option.id ? 'border-[var(--brand-primary,#c9a84c)] bg-[rgba(201,168,76,0.08)] shadow-[0_0_20px_rgba(201,168,76,0.15)]' : ''}`} onClick={() => onSelect(option.id)}>
            <div className="text-lg font-semibold text-[var(--fg-primary,#f5f5f5)]">{option.label}</div>
            <div className="text-sm text-[var(--brand-primary,#c9a84c)] font-medium">{option.range}</div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
