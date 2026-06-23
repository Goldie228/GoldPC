/**
 * BuildWizard — Multi-step PC configuration wizard
 *
 * Step 0: Presets — choose a pre-configured build or go manual
 * Step 1: Purpose — choose PC purpose (6 categories)
 * Step 2: Budget — choose budget tier (4 + custom slider)
 * Step 3: Preferences — CPU/GPU/RAM/form factor/noise/RGB/cooling
 * Result: Loading + recommendation display
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';

import type { WizardState, PresetBuild, FormFactor, NoiseLevel, RgbPreference, CoolingPreference } from './types';
import { STEP_LABELS } from './types';
import { buildRecommendation, type RecommendedBuild } from './recommendationEngine';

import { StepPresets } from './StepPresets';
import { StepPurpose } from './StepPurpose';
import { StepBudget } from './StepBudget';
import { StepPreferences } from './StepPreferences';
import BuildResult from './BuildResult';

const INITIAL_STATE: WizardState = {
  purpose: null,
  budget: null,
  customBudget: 3500,
  cpuPreference: 'any',
  gpuPreference: 'any',
  minRam: 16,
  formFactor: 'any',
  noiseLevel: 'balanced',
  rgbPreference: 'minimal',
  coolingPreference: 'any',
  presetId: null,
};

const TOTAL_STEPS = 4; // 0=Presets, 1=Purpose, 2=Budget, 3=Preferences

function updateState(partial: Partial<WizardState>): (prev: WizardState) => WizardState {
  return (prev) => ({ ...prev, ...partial });
}

interface BuildWizardProps {
  onBack?: () => void;
}

export default function BuildWizard({ onBack }: BuildWizardProps) {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 8, category: '' });
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendedBuild | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  /** Run the recommendation engine */
  const runRecommendation = useCallback(async (wizardState: WizardState) => {
    setLoading(true);
    setError(null);
    setResult(null);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const build = await buildRecommendation(
        wizardState,
        controller.signal,
        (current, total, category) => {
          setLoadingProgress({ current, total, category });
        },
      );
      setResult(build);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Не удалось подобрать сборку');
    } finally {
      setLoading(false);
    }
  }, []);

  /** Handle preset selection: null = go manual, preset = run immediately */
  const handlePresetSelect = useCallback((preset: PresetBuild | null) => {
    if (!preset) {
      setStep(1);
      return;
    }
    const presetState: WizardState = {
      ...INITIAL_STATE,
      purpose: preset.purpose,
      budget: preset.budget,
      cpuPreference: preset.cpuPreference,
      gpuPreference: preset.gpuPreference,
      minRam: preset.minRam,
      formFactor: preset.formFactor,
      noiseLevel: preset.noiseLevel,
      rgbPreference: preset.rgbPreference,
      coolingPreference: preset.coolingPreference,
      presetId: preset.id,
    };
    setState(presetState);
    runRecommendation(presetState);
  }, [runRecommendation]);

  /** Purpose selected — auto-advance to Budget */
  const handlePurposeSelect = useCallback((purpose: WizardState['purpose']) => {
    setState(updateState({ purpose }));
    setStep(2);
  }, []);

  /** Budget selected — auto-advance to Preferences */
  const handleBudgetSelect = useCallback((budget: WizardState['budget']) => {
    setState(updateState({ budget }));
    setStep(3);
  }, []);

  /** Custom budget slider change */
  const handleCustomBudgetChange = useCallback((value: number) => {
    setState(updateState({ customBudget: value, budget: 'custom' }));
  }, []);

  /** Preferences changes */
  const handleCpuChange = useCallback((v: WizardState['cpuPreference']) => {
    setState(updateState({ cpuPreference: v }));
  }, []);
  const handleGpuChange = useCallback((v: WizardState['gpuPreference']) => {
    setState(updateState({ gpuPreference: v }));
  }, []);
  const handleRamChange = useCallback((v: number) => {
    setState(updateState({ minRam: v }));
  }, []);
  const handleFormFactorChange = useCallback((v: FormFactor) => {
    setState(updateState({ formFactor: v }));
  }, []);
  const handleNoiseChange = useCallback((v: NoiseLevel) => {
    setState(updateState({ noiseLevel: v }));
  }, []);
  const handleRgbChange = useCallback((v: RgbPreference) => {
    setState(updateState({ rgbPreference: v }));
  }, []);
  const handleCoolingChange = useCallback((v: CoolingPreference) => {
    setState(updateState({ coolingPreference: v }));
  }, []);

  /** Submit preferences — run recommendation */
  const handleSubmitPreferences = useCallback(() => {
    runRecommendation(state);
  }, [state, runRecommendation]);

  /** Go back to preferences from result */
  const handleBackToPreferences = useCallback(() => {
    setResult(null);
    setStep(3);
  }, []);

  /** Navigate back one step */
  const goBack = useCallback(() => {
    if (step > 0) setStep(step - 1);
  }, [step]);

  // Show result screen
  if (loading || result || error) {
    if (loading) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
          <Loader2 size={48} className="animate-spin text-gold" />
          <div className="text-title-md font-semibold text-on-dark">Подбираем сборку...</div>
          {loadingProgress.category && (
            <div className="text-body-md text-muted-text">
              {loadingProgress.category} ({loadingProgress.current}/{loadingProgress.total})
            </div>
          )}
        </div>
      );
    }

    if (error) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
          <div className="text-title-md font-semibold text-red-400">Ошибка</div>
          <div className="text-body-md text-muted-text text-center max-w-md">{error}</div>
          <button
            className="px-6 py-3 bg-surface-elevated border border-hairline-dark rounded-xl text-body-md text-on-dark cursor-pointer hover:border-gold/50 transition-all"
            onClick={handleBackToPreferences}
          >
            Изменить параметры
          </button>
        </div>
      );
    }

    if (result) {
      return (
        <BuildResult
          build={result}
          onBack={handleBackToPreferences}
        />
      );
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  i <= step ? 'bg-gold shadow-[0_0_8px_rgba(252,213,53,0.4)]' : 'bg-surface-elevated'
                }`}
              />
              <span className={`text-[11px] font-medium transition-colors ${
                i <= step ? 'text-gold' : 'text-muted-text'
              }`}>
                {label}
              </span>
            </div>
          ))}
        </div>
        <div className="h-0.5 bg-surface-elevated rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gold"
            initial={{ width: 0 }}
            animate={{ width: `${((step) / (TOTAL_STEPS - 1)) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Back button */}
      {step > 0 && (
        <button
          className="flex items-center gap-1.5 text-body-sm text-muted-text hover:text-on-dark transition-colors mb-5 cursor-pointer"
          onClick={goBack}
        >
          <ArrowLeft size={16} />
          Назад
        </button>
      )}

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.25 }}
        >
          {step === 0 && (
            <StepPresets selected={state.presetId} onSelect={handlePresetSelect} />
          )}
          {step === 1 && (
            <StepPurpose selected={state.purpose} onSelect={handlePurposeSelect} />
          )}
          {step === 2 && (
            <StepBudget
              selected={state.budget}
              onSelect={handleBudgetSelect}
              customBudget={state.customBudget}
              onCustomChange={handleCustomBudgetChange}
            />
          )}
          {step === 3 && (
            <div>
              <StepPreferences
                cpuPreference={state.cpuPreference}
                gpuPreference={state.gpuPreference}
                minRam={state.minRam}
                onCpuChange={handleCpuChange}
                onGpuChange={handleGpuChange}
                onRamChange={handleRamChange}
              />
              {/* Extra preferences: FormFactor / Noise / RGB / Cooling */}
              <div className="mt-7 flex flex-col gap-6">
                {/* Form Factor */}
                <div className="flex flex-col gap-2">
                  <div className="text-title-sm font-semibold text-body-text">Форм-фактор</div>
                  <div className="flex flex-wrap gap-2.5">
                    {(['atx', 'micro-atx', 'mini-itx', 'any'] as FormFactor[]).map((ff) => (
                      <button
                        key={ff}
                        className={`px-4 py-2 bg-surface-elevated border rounded-md text-body-text text-body-sm cursor-pointer transition-all duration-200 hover:border-gold ${
                          state.formFactor === ff ? 'border-2 border-gold bg-gold text-gold-ink font-semibold' : 'border-hairline-dark'
                        }`}
                        onClick={() => handleFormFactorChange(ff)}
                      >
                        {ff === 'any' ? 'Любой' : ff.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Noise */}
                <div className="flex flex-col gap-2">
                  <div className="text-title-sm font-semibold text-body-text">Уровень шума</div>
                  <div className="flex flex-wrap gap-2.5">
                    {([
                      ['silent', 'Тихая'],
                      ['balanced', 'Сбалансированная'],
                      ['performance', 'Производительность'],
                    ] as [NoiseLevel, string][]).map(([val, label]) => (
                      <button
                        key={val}
                        className={`px-4 py-2 bg-surface-elevated border rounded-md text-body-text text-body-sm cursor-pointer transition-all duration-200 hover:border-gold ${
                          state.noiseLevel === val ? 'border-2 border-gold bg-gold text-gold-ink font-semibold' : 'border-hairline-dark'
                        }`}
                        onClick={() => handleNoiseChange(val)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* RGB */}
                <div className="flex flex-col gap-2">
                  <div className="text-title-sm font-semibold text-body-text">Подсветка</div>
                  <div className="flex flex-wrap gap-2.5">
                    {([
                      ['none', 'Без'],
                      ['minimal', 'Минимальная'],
                      ['full', 'Полная RGB'],
                    ] as [RgbPreference, string][]).map(([val, label]) => (
                      <button
                        key={val}
                        className={`px-4 py-2 bg-surface-elevated border rounded-md text-body-text text-body-sm cursor-pointer transition-all duration-200 hover:border-gold ${
                          state.rgbPreference === val ? 'border-2 border-gold bg-gold text-gold-ink font-semibold' : 'border-hairline-dark'
                        }`}
                        onClick={() => handleRgbChange(val)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Cooling */}
                <div className="flex flex-col gap-2">
                  <div className="text-title-sm font-semibold text-body-text">Охлаждение</div>
                  <div className="flex flex-wrap gap-2.5">
                    {([
                      ['air', 'Башня'],
                      ['aio', 'СЖО'],
                      ['any', 'Любое'],
                    ] as [CoolingPreference, string][]).map(([val, label]) => (
                      <button
                        key={val}
                        className={`px-4 py-2 bg-surface-elevated border rounded-md text-body-text text-body-sm cursor-pointer transition-all duration-200 hover:border-gold ${
                          state.coolingPreference === val ? 'border-2 border-gold bg-gold text-gold-ink font-semibold' : 'border-hairline-dark'
                        }`}
                        onClick={() => handleCoolingChange(val)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {/* Submit button */}
              <button
                className="mt-8 w-full py-3.5 px-6 bg-gold text-gold-ink font-semibold text-body-md rounded-xl cursor-pointer transition-all duration-200 hover:brightness-110 shadow-[0_0_20px_rgba(252,213,53,0.15)]"
                onClick={handleSubmitPreferences}
              >
                Подобрать сборку
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
