import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, HardDrive } from 'lucide-react';
import type { PCComponentType } from '@/hooks';
import { type WizardState, type Purpose, type Budget, STEP_LABELS, COMPONENT_LABELS, getTemplate } from './types';
import { StepPurpose } from './StepPurpose';
import { StepBudget } from './StepBudget';
import { StepPreferences } from './StepPreferences';
import { BuildResult } from './BuildResult';

function ProgressBar({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-start justify-center gap-0 mb-10 px-5">
      {STEP_LABELS.map((label, index) => (
        <div key={label} className="flex flex-col items-center relative flex-none">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold bg-[var(--surface-secondary,#1a1a2e)] border-2 border-[var(--border-default)] text-[var(--fg-muted)] transition-all duration-300 z-10 ${
              index < currentStep ? 'bg-[var(--brand-primary,#c9a84c)] border-[var(--brand-primary,#c9a84c)] text-black' : index === currentStep ? 'bg-[var(--brand-primary,#c9a84c)] border-[var(--brand-primary,#c9a84c)] text-black' : ''
            }`}
          >
            {index < currentStep ? <Check size={16} /> : index + 1}
          </div>
          <span className={`mt-2 text-xs text-[var(--fg-muted)] whitespace-nowrap transition-colors duration-300 ${index <= currentStep ? 'text-[var(--brand-primary,#c9a84c)]' : ''}`}>
            {label}
          </span>
          {index < totalSteps - 1 && (
            <div className={`absolute top-[18px] left-[calc(50%+20px)] w-[calc(100%-20px)] h-0.5 bg-[var(--border-default)] transition-colors duration-300 ${index < currentStep ? 'bg-[var(--brand-primary,#c9a84c)]' : ''}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export function BuildWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [wizardState, setWizardState] = useState<WizardState>({
    purpose: null, budget: null, cpuPreference: 'any', gpuPreference: 'any', minRam: 16,
  });

  const totalSteps = STEP_LABELS.length;

  const canProceed = () => {
    if (currentStep === 0) return wizardState.purpose !== null;
    if (currentStep === 1) return wizardState.budget !== null;
    return true;
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) setCurrentStep((prev) => prev + 1);
    else setShowResult(true);
  };

  const handleBack = () => {
    if (showResult) setShowResult(false);
    else if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setShowResult(false);
    setWizardState({ purpose: null, budget: null, cpuPreference: 'any', gpuPreference: 'any', minRam: 16 });
  };

  return (
    <div className="max-w-[900px] mx-auto px-6 pb-[120px]">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[var(--fg-primary,#f5f5f5)] mb-2">Мастер подбора ПК</h1>
        <p className="text-base text-[var(--fg-muted)]">Ответьте на 3 вопроса, и мы подберём оптимальную конфигурацию</p>
      </div>

      {!showResult && <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />}

      <div className="[&>*]:animate-[fadeIn_0.3s_ease]">
        <AnimatePresence mode="wait">
          {showResult ? (
            <BuildResult key="result" wizardState={wizardState} onAddToBuilder={() => { window.location.href = '/pc-builder'; }} />
          ) : currentStep === 0 ? (
            <StepPurpose key="purpose" selected={wizardState.purpose} onSelect={(purpose) => setWizardState((prev) => ({ ...prev, purpose }))} />
          ) : currentStep === 1 ? (
            <StepBudget key="budget" selected={wizardState.budget} onSelect={(budget) => setWizardState((prev) => ({ ...prev, budget }))} />
          ) : (
            <StepPreferences key="preferences"
              cpuPreference={wizardState.cpuPreference} gpuPreference={wizardState.gpuPreference} minRam={wizardState.minRam}
              onCpuChange={(cpuPreference) => setWizardState((prev) => ({ ...prev, cpuPreference }))}
              onGpuChange={(gpuPreference) => setWizardState((prev) => ({ ...prev, gpuPreference }))}
              onRamChange={(minRam) => setWizardState((prev) => ({ ...prev, minRam }))}
            />
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-between items-center mt-9 pt-6 border-t border-[var(--border-muted,#2a2a3e)]">
        <button className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 border-none bg-transparent text-[var(--fg-secondary,#ccc)] border border-[var(--border-default)] hover:border-[var(--brand-primary,#c9a84c)] hover:text-[var(--brand-primary,#c9a84c)] disabled:opacity-40 disabled:cursor-not-allowed" onClick={handleBack} disabled={currentStep === 0 && !showResult}>
          <ChevronLeft size={18} /> Назад
        </button>
        {!showResult && (
          <button className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 border-none bg-[var(--brand-primary,#c9a84c)] text-black hover:bg-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed" onClick={handleNext} disabled={!canProceed()}>
            {currentStep === totalSteps - 1 ? 'Подобрать' : 'Далее'}
            {currentStep < totalSteps - 1 && <ChevronRight size={18} />}
          </button>
        )}
        {showResult && (
          <button className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 border-none bg-transparent text-[var(--fg-secondary,#ccc)] border border-[var(--border-default)] hover:border-[var(--brand-primary,#c9a84c)] hover:text-[var(--brand-primary,#c9a84c)]" onClick={handleReset}>Начать заново</button>
        )}
      </div>
    </div>
  );
}

export default BuildWizard;
