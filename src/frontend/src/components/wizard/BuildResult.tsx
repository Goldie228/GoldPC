import { motion } from 'framer-motion';
import { HardDrive } from 'lucide-react';
import type { PCComponentType } from '../../hooks';
import { type WizardState, type Purpose, type Budget, type BuildTemplate, PURPOSE_OPTIONS, BUDGET_OPTIONS, COMPONENT_LABELS, getTemplate } from './types';

type BuildTemplateKey = keyof BuildTemplate;

export function BuildResult({ wizardState, onAddToBuilder }: { wizardState: WizardState; onAddToBuilder: () => void }) {
  const template = getTemplate(wizardState.purpose as Purpose, wizardState.budget as Budget);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="[&:not(:has(+*))]:animate-[fadeIn_0.3s_ease]">
      <h2 className="text-1.5xl font-semibold text-[var(--fg-primary,#f5f5f5)] text-center mb-2">Подбор завершён!</h2>
      <p className="text-sm text-[var(--fg-muted)] text-center mb-7">Мы подобрали оптимальную конфигурацию на основе ваших предпочтений</p>

      <div className="bg-[var(--surface-elevated,#1a1a2e)] border border-[var(--border-default)] rounded-xl p-5 mb-6">
        <div className="flex justify-between py-2.5 border-b border-[var(--border-muted,#2a2a3e)] text-[var(--fg-secondary,#ccc)] text-sm last:border-b-0">
          <span>Назначение</span>
          <span className="text-[var(--fg-primary,#f5f5f5)] font-medium">{PURPOSE_OPTIONS.find((o) => o.id === wizardState.purpose)?.label}</span>
        </div>
        <div className="flex justify-between py-2.5 border-b border-[var(--border-muted,#2a2a3e)] text-[var(--fg-secondary,#ccc)] text-sm last:border-b-0">
          <span>Бюджет</span>
          <span className="text-[var(--fg-primary,#f5f5f5)] font-medium">{BUDGET_OPTIONS.find((o) => o.id === wizardState.budget)?.range}</span>
        </div>
        <div className="flex justify-between py-2.5 border-b border-[var(--border-muted,#2a2a3e)] text-[var(--fg-secondary,#ccc)] text-sm last:border-b-0">
          <span>Процессор</span>
          <span className="text-[var(--fg-primary,#f5f5f5)] font-medium">{wizardState.cpuPreference === 'any' ? 'Любой' : wizardState.cpuPreference.toUpperCase()}</span>
        </div>
        <div className="flex justify-between py-2.5 border-b border-[var(--border-muted,#2a2a3e)] text-[var(--fg-secondary,#ccc)] text-sm last:border-b-0">
          <span>Видеокарта</span>
          <span className="text-[var(--fg-primary,#f5f5f5)] font-medium">{wizardState.gpuPreference === 'any' ? 'Любая' : wizardState.gpuPreference.toUpperCase()}</span>
        </div>
        <div className="flex justify-between py-2.5 text-[var(--fg-secondary,#ccc)] text-sm">
          <span>ОЗУ</span>
          <span className="text-[var(--fg-primary,#f5f5f5)] font-medium">от {wizardState.minRam} ГБ</span>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg text-[var(--fg-primary,#f5f5f5)] mb-4">Рекомендуемый диапазон цен</h3>
        <div className="grid grid-cols-2 gap-2.5">
          {(Object.entries(template) as [BuildTemplateKey, BuildTemplate[BuildTemplateKey]][]).map(([key, value]) => (
            <div key={key} className="flex justify-between p-2.5 px-3.5 bg-[var(--surface-elevated,#1a1a2e)] rounded-lg text-xs">
              <span className="text-[var(--fg-muted)]">{COMPONENT_LABELS[key as PCComponentType] || key}</span>
              <span className="text-[var(--brand-primary,#c9a84c)] font-medium">
                {value.minPrice > 0
                  ? `${value.minPrice.toLocaleString('ru-BY')} — ${value.maxPrice.toLocaleString('ru-BY')} BYN`
                  : 'Интегрированная'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button className="flex items-center justify-center gap-2.5 w-full p-3.5 bg-[var(--brand-primary,#c9a84c)] text-black border-none rounded-xl text-base font-semibold cursor-pointer transition-all duration-200 hover:bg-[var(--accent)]" onClick={onAddToBuilder}>
        <HardDrive size={20} />
        Перейти в конструктор
      </button>
    </motion.div>
  );
}
