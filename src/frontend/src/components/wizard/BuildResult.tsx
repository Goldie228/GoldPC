/**
 * BuildResult — Displays recommended PC build with component cards,
 * total price, and navigation to PC Builder with pre-selected components.
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cpu, Monitor, CircuitBoard, MemoryStick, HardDrive,
  Zap, Box, Thermometer, CheckCircle, AlertTriangle,
} from 'lucide-react';

import type { RecommendedBuild } from './recommendationEngine';
import { COMPONENT_LABELS } from './types';
import type { PCComponentType } from '@/features/pc-builder/logic/types';
import { STORAGE_KEY } from '@/features/pc-builder/logic/constants';

const COMPONENT_ICONS: Record<string, React.ReactNode> = {
  cpu: <Cpu size={20} />,
  gpu: <Monitor size={20} />,
  motherboard: <CircuitBoard size={20} />,
  ram: <MemoryStick size={20} />,
  storage: <HardDrive size={20} />,
  psu: <Zap size={20} />,
  case: <Box size={20} />,
  cooling: <Thermometer size={20} />,
};

const COMPONENT_ORDER: PCComponentType[] = [
  'cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooling',
];

interface BuildResultProps {
  build: RecommendedBuild;
  onReset: () => void;
}

export default function BuildResult({ build, onReset }: BuildResultProps) {
  const navigate = useNavigate();

  const handleGoToBuilder = useCallback(() => {
    // Save wizard selections to localStorage so PC Builder can load them
    const selected: Record<string, unknown> = {};
    for (const cat of COMPONENT_ORDER) {
      const product = build[cat as keyof RecommendedBuild];
      if (product && typeof product === 'object' && 'id' in product) {
        selected[cat] = {
          productId: (product as { id: string }).id,
          product,
          type: cat,
        };
      }
    }

    // Build a V2 serialized build and write to storage
    const serialized = {
      v: 2,
      savedAt: new Date().toISOString(),
      components: selected,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
    } catch {
      // localStorage may be full or unavailable
    }

    navigate('/pc-builder');
  }, [build, navigate]);

  const foundCount = COMPONENT_ORDER.filter(
    (cat) => build[cat as keyof RecommendedBuild] != null,
  ).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Рекомендуемая конфигурация
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {foundCount} из 8 компонентов подобрано
          </p>
        </div>
        {build.totalPrice > 0 && (
          <div className="text-right">
            <p className="text-xs text-[var(--color-text-muted)]">Общая стоимость</p>
            <p className="text-2xl font-bold text-[var(--color-brand-primary)]">
              {build.totalPrice.toLocaleString('ru-RU')} BYN
            </p>
          </div>
        )}
      </div>

      {/* Component cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {COMPONENT_ORDER.map((cat) => {
          const product = build[cat as keyof RecommendedBuild];
          const hasProduct = product != null && typeof product === 'object' && 'id' in product;

          return (
            <div
              key={cat}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                hasProduct
                  ? 'border-[var(--color-border-default)] bg-[var(--color-surface-card)]'
                  : 'border-[var(--color-surface-raised)] bg-[var(--color-surface-raised)]/50 opacity-50'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  hasProduct
                    ? 'bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]'
                    : 'bg-[var(--color-surface-raised)] text-[var(--color-text-muted)]'
                }`}
              >
                {COMPONENT_ICONS[cat]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[var(--color-text-muted)]">
                  {COMPONENT_LABELS[cat]}
                </p>
                {hasProduct ? (
                  <>
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {(product as { name: string }).name}
                    </p>
                    <p className="text-xs text-[var(--color-brand-primary)] font-medium">
                      {(product as { price: number }).price.toLocaleString('ru-RU')} BYN
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-[var(--color-text-muted)] italic">
                    Не найден
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Compatibility note */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--color-surface-raised)]">
        {foundCount === 8 ? (
          <CheckCircle size={16} className="text-emerald-400 mt-0.5 shrink-0" />
        ) : (
          <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
        )}
        <div className="text-xs text-[var(--color-text-secondary)]">
          {foundCount === 8 ? (
            <p>Все компоненты подобраны. Совместимость будет проверена в конструкторе.</p>
          ) : (
            <p>
              Не удалось найти некоторые компоненты в наличии.
              Вы можете добавить их вручную в конструкторе.
            </p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleGoToBuilder}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-brand-primary)] text-[var(--color-canvas-dark)] font-medium hover:opacity-90 transition-opacity cursor-pointer"
        >
          Перейти в конструктор
        </button>
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] transition-colors cursor-pointer"
        >
          Изменить выбор
        </button>
      </div>
    </div>
  );
}
