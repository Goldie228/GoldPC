import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, HardDrive } from 'lucide-react';
import type { PCComponentType } from '../../hooks';
import { type WizardState, type Purpose, type Budget, STEP_LABELS, COMPONENT_LABELS, getTemplate } from './types';
import { StepPurpose } from './StepPurpose';
import { StepBudget } from './StepBudget';
import { StepPreferences } from './StepPreferences';
import { BuildResult } from './BuildResult';
import styles from './BuildWizard.module.css';

function ProgressBar({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className={styles.progressBar}>
      {STEP_LABELS.map((label, index) => (
        <div key={label} className={styles.progressStep}>
          <div
            className={`${styles.progressDot} ${
              index < currentStep ? styles.progressDotCompleted : index === currentStep ? styles.progressDotActive : ''
            }`}
          >
            {index < currentStep ? <Check size={16} /> : index + 1}
          </div>
          <span className={`${styles.progressLabel} ${index <= currentStep ? styles.progressLabelActive : ''}`}>
            {label}
          </span>
          {index < totalSteps - 1 && (
            <div className={`${styles.progressLine} ${index < currentStep ? styles.progressLineCompleted : ''}`} />
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
    <div className={styles.wizard}>
      <div className={styles.wizardHeader}>
        <h1 className={styles.wizardTitle}>Мастер подбора ПК</h1>
        <p className={styles.wizardSubtitle}>Ответьте на 3 вопроса, и мы подберём оптимальную конфигурацию</p>
      </div>

      {!showResult && <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />}

      <div className={styles.wizardBody}>
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

      <div className={styles.wizardFooter}>
        <button className={`${styles.wizardBtn} ${styles.wizardBtnSecondary}`} onClick={handleBack} disabled={currentStep === 0 && !showResult}>
          <ChevronLeft size={18} /> Назад
        </button>
        {!showResult && (
          <button className={`${styles.wizardBtn} ${styles.wizardBtnPrimary}`} onClick={handleNext} disabled={!canProceed()}>
            {currentStep === totalSteps - 1 ? 'Подобрать' : 'Далее'}
            {currentStep < totalSteps - 1 && <ChevronRight size={18} />}
          </button>
        )}
        {showResult && (
          <button className={`${styles.wizardBtn} ${styles.wizardBtnOutline}`} onClick={handleReset}>Начать заново</button>
        )}
      </div>
    </div>
  );
}

export default BuildWizard;
