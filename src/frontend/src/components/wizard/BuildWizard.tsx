/**
 * BuildWizard — Multi-step PC configuration wizard
 *
 * Step 1: Purpose (Gaming / Office / Workstation)
 * Step 2: Budget (Economy / Optimal / Gaming / Max)
 * Step 3: Preferences (CPU brand + resolution for gaming)
 * Step 4: Loading + Result
 */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Monitor, Briefcase, Film, Cpu, Check, ArrowRight, ArrowLeft, Zap, HardDrive,
  CircuitBoard, MemoryStick, Box, Thermometer, AlertCircle, Loader2, RefreshCw,
} from 'lucide-react';

import type {
  WizardState, Purpose, Budget, CpuBrand, Resolution,
} from './types';
import {
  PURPOSE_OPTIONS, BUDGET_OPTIONS, STEP_LABELS,
  COMPONENT_LABELS, BUDGET_RANGES, PURPOSE_BUDGET_ALLOC,
} from './types';
import { buildRecommendation, type RecommendedBuild } from './recommendationEngine';
import BuildResult from './BuildResult';

const PURPOSE_ICONS: Record<Purpose, React.ReactNode> = {
  gaming: <Monitor size={28} />,
  office: <Briefcase size={28} />,
  workstation: <Film size={28} />,
};

const COMPONENT_ICONS: Record<string, React.ReactNode> = {
  cpu: <Cpu size={18} />,
  gpu: <Monitor size={18} />,
  motherboard: <CircuitBoard size={18} />,
  ram: <MemoryStick size={18} />,
  storage: <HardDrive size={18} />,
  psu: <Zap size={18} />,
  case: <Box size={18} />,
  cooling: <Thermometer size={18} />,
};

interface BuildWizardProps {
  onBack?: () => void;
}

export default function BuildWizard({ onBack }: BuildWizardProps) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 8, category: '' });
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendedBuild | null>(null);

  const [state, setState] = useState<WizardState>({
    purpose: null,
    budget: null,
    cpuBrand: 'any',
    resolution: '1080p',
  });

  const canGoNext = useMemo(() => {
    if (step === 0) return state.purpose !== null;
    if (step === 1) return state.budget !== null;
    if (step === 2) return true;
    return false;
  }, [step, state]);

  const handleNext = useCallback(() => {
    if (step < 2) {
      setStep(step + 1);
    } else if (step === 2) {
      // Start recommendation
      setStep(3);
      setLoading(true);
      setError(null);

      buildRecommendation(
        state.purpose!,
        state.budget!,
        state.cpuBrand,
        state.resolution,
        (current, total, category) => {
          setLoadingProgress({ current, total, category });
        },
      )
        .then((build) => {
          setResult(build);
          setLoading(false);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Произошла ошибка при подборе');
          setLoading(false);
        });
    }
  }, [step, state]);

  const handlePrev = useCallback(() => {
    if (step > 0 && step < 3) {
      setStep(step - 1);
    }
  }, [step]);

  const handleReset = useCallback(() => {
    setStep(0);
    setLoading(false);
    setError(null);
    setResult(null);
    setLoadingProgress({ current: 0, total: 8, category: '' });
    setState({
      purpose: null,
      budget: null,
      cpuBrand: 'any',
      resolution: '1080p',
    });
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setResult(null);
    setStep(3);
    setLoading(true);
    buildRecommendation(
      state.purpose!,
      state.budget!,
      state.cpuBrand,
      state.resolution,
      (current, total, category) => {
        setLoadingProgress({ current, total, category });
      },
    )
      .then((build) => {
        setResult(build);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Произошла ошибка при подборе');
        setLoading(false);
      });
  }, [state]);

  return (
    <div className="flex flex-col gap-6">
      {/* Progress indicator */}
      {step < 3 && (
        <div className="flex items-center justify-center gap-2">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    i < step
                      ? 'bg-[var(--color-brand-primary)] text-[var(--color-canvas-dark)]'
                      : i === step
                        ? 'bg-[var(--color-brand-primary)] text-[var(--color-canvas-dark)] scale-110'
                        : 'bg-[var(--color-surface-raised)] text-[var(--color-text-muted)]'
                  }`}
                >
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                <span className="hidden sm:inline text-sm text-[var(--color-text-secondary)]">
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div
                  className={`w-8 h-0.5 ${
                    i < step ? 'bg-[var(--color-brand-primary)]' : 'bg-[var(--color-surface-raised)]'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Step content */}
      <AnimatePresence mode="wait">
        {/* Step 0: Purpose */}
        {step === 0 && (
          <motion.div
            key="purpose"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
              Что важнее всего?
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-5">
              От назначения зависит распределение бюджета по компонентам
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PURPOSE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setState((s) => ({ ...s, purpose: opt.id }))}
                  className={`group flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all cursor-pointer ${
                    state.purpose === opt.id
                      ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10'
                      : 'border-[var(--color-border-default)] bg-[var(--color-surface-card)] hover:border-[var(--color-brand-primary)]/50'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      state.purpose === opt.id
                        ? 'bg-[var(--color-brand-primary)] text-[var(--color-canvas-dark)]'
                        : 'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] group-hover:text-[var(--color-brand-primary)]'
                    }`}
                  >
                    {PURPOSE_ICONS[opt.id as Purpose]}
                  </div>
                  <span className="font-medium text-[var(--color-text-primary)]">{opt.label}</span>
                  <span className="text-xs text-[var(--color-text-muted)] text-center">
                    {opt.description}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 1: Budget */}
        {step === 1 && (
          <motion.div
            key="budget"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
              Какой бюджет?
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-5">
              Выберите ценовую категорию. Мастер подберет лучшие компоненты в рамках бюджета.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BUDGET_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setState((s) => ({ ...s, budget: opt.id }))}
                  className={`flex flex-col p-5 rounded-xl border-2 transition-all text-left cursor-pointer ${
                    state.budget === opt.id
                      ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10'
                      : 'border-[var(--color-border-default)] bg-[var(--color-surface-card)] hover:border-[var(--color-brand-primary)]/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-[var(--color-text-primary)]">{opt.label}</span>
                    <span className="text-sm font-semibold text-[var(--color-brand-primary)]">
                      {opt.range}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--color-text-muted)]">{opt.description}</span>
                  {/* Budget bar */}
                  <div className="mt-3 h-1.5 rounded-full bg-[var(--color-surface-raised)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--color-brand-primary)] transition-all"
                      style={{
                        width:
                          opt.id === 'economy' ? '25%'
                          : opt.id === 'optimal' ? '50%'
                          : opt.id === 'gaming' ? '75%'
                          : '100%',
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Preferences */}
        {step === 2 && (
          <motion.div
            key="preferences"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
              Предпочтения
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-5">
              Настройте подбор под себя
            </p>

            <div className="space-y-5">
              {/* CPU Brand */}
              <div>
                <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                  Процессор
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {(['intel', 'amd', 'any'] as CpuBrand[]).map((brand) => {
                    const labels: Record<CpuBrand, string> = {
                      intel: 'Intel',
                      amd: 'AMD',
                      any: 'Без разницы',
                    };
                    return (
                      <button
                        key={brand}
                        onClick={() => setState((s) => ({ ...s, cpuBrand: brand }))}
                        className={`py-2.5 px-4 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer ${
                          state.cpuBrand === brand
                            ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]'
                            : 'border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-[var(--color-text-secondary)] hover:border-[var(--color-brand-primary)]/50'
                        }`}
                      >
                        {labels[brand]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Resolution (only for gaming/workstation) */}
              {(state.purpose === 'gaming' || state.purpose === 'workstation') && (
                <div>
                  <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                    Разрешение (для подбора видеокарты)
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {(['1080p', '1440p', '4k'] as Resolution[]).map((res) => {
                      const labels: Record<Resolution, string> = {
                        '1080p': '1080p',
                        '1440p': '1440p',
                        '4k': '4K',
                      };
                      return (
                        <button
                          key={res}
                          onClick={() => setState((s) => ({ ...s, resolution: res }))}
                          className={`py-2.5 px-4 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer ${
                            state.resolution === res
                              ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]'
                              : 'border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-[var(--color-text-secondary)] hover:border-[var(--color-brand-primary)]/50'
                          }`}
                        >
                          {labels[res]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 3: Loading */}
        {step === 3 && loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16 gap-4"
          >
            <Loader2 size={40} className="text-[var(--color-brand-primary)] animate-spin" />
            <p className="text-[var(--color-text-secondary)]">
              Подбираем компоненты...
            </p>
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                <span>{COMPONENT_LABELS[loadingProgress.category] ?? loadingProgress.category}</span>
                <span>{loadingProgress.current}/{loadingProgress.total}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--color-surface-raised)] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-[var(--color-brand-primary)]"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(loadingProgress.current / loadingProgress.total) * 100}%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Error */}
        {step === 3 && error && !loading && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-12 gap-4"
          >
            <AlertCircle size={40} className="text-red-400" />
            <p className="text-red-300 text-center max-w-md">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-brand-primary)] text-[var(--color-canvas-dark)] text-sm font-medium hover:opacity-90 cursor-pointer"
              >
                <RefreshCw size={16} /> Повторить
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-lg bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] text-sm hover:bg-[var(--color-surface-card)] cursor-pointer"
              >
                Начать заново
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Result */}
        {step === 3 && !loading && !error && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <BuildResult build={result} onReset={handleReset} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation buttons */}
      {step < 3 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={step === 0 ? onBack : handlePrev}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            {step === 0 ? 'Назад' : 'Предыдущий шаг'}
          </button>
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className={`flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              canGoNext
                ? 'bg-[var(--color-brand-primary)] text-[var(--color-canvas-dark)] hover:opacity-90'
                : 'bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] cursor-not-allowed'
            }`}
          >
            {step === 2 ? 'Подобрать конфигурацию' : 'Далее'}
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
