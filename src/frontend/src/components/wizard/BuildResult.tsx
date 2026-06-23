/**
 * BuildResult — Displays recommended PC build with component cards,
 * total price, and navigation to PC Builder with pre-selected components.
 */

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cpu, Monitor, CircuitBoard, MemoryStick, HardDrive,
  Zap, Box, Thermometer, Check, ArrowLeft, Loader2,
} from 'lucide-react';

import type { RecommendedBuild } from './recommendationEngine';
import { COMPONENT_LABELS } from './types';
import type { PCComponentType, PCBuilderSelectedState, SerializedBuildV2 } from '@/features/pc-builder/logic/types';
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
  onBack: () => void;
  isResolving?: boolean;
}

export default function BuildResult({ build, onBack, isResolving }: BuildResultProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleOpenInBuilder = useCallback(() => {
    try {
      const items = [
        ['cpu', build.cpu], ['gpu', build.gpu],
        ['motherboard', build.motherboard], ['ram', build.ram],
        ['storage', build.storage], ['psu', build.psu],
        ['case', build.case], ['cooling', build.cooling],
      ] as const;

      const state: PCBuilderSelectedState = { ram: [], storage: [], fan: [] };
      for (const [type, product] of items) {
        if (!product) continue;
        // Ensure category matches builder type (API returns 'processors' etc)
        const normalizedProduct = { ...product, category: type };
        if (type === 'ram' || type === 'storage') {
          state[type].push({ productId: normalizedProduct.id, product: normalizedProduct, type });
        } else {
          state[type] = { productId: normalizedProduct.id, product: normalizedProduct, type };
        }
      }

      const components: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(state)) {
        if (Array.isArray(value)) {
          if (value.length > 0) components[key] = value;
        } else if (value != null) {
          components[key] = value;
        }
      }

      const serialized: SerializedBuildV2 = {
        v: 2,
        savedAt: new Date().toISOString(),
        components: components as SerializedBuildV2['components'],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
      navigate('/pc-builder');
    } catch (err) {
      console.error('Failed to save build to localStorage:', err);
    } finally {
      setLoading(false);
    }
  }, [build, navigate]);

  // Loading skeleton while resolving
  if (isResolving) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Loader2 size={24} className="animate-spin text-gold" />
          <div className="text-title-md font-semibold text-on-dark">Загрузка...</div>
        </div>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 bg-surface-card rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back button */}
      <button
        className="flex items-center gap-1.5 text-body-sm text-muted-text hover:text-on-dark transition-colors mb-5 cursor-pointer"
        onClick={onBack}
      >
        <ArrowLeft size={16} />
        Изменить параметры
      </button>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-title-lg font-semibold text-on-dark mb-1">Ваша сборка</h2>
        <div className="flex items-center gap-3 text-body-md text-muted-text">
          <span className="capitalize">{build.purpose}</span>
          <span className="text-gold font-semibold font-['Nunito'] text-title-md">
            {build.totalPrice.toLocaleString('ru-BY')} BYN
          </span>
        </div>
      </div>

      {/* Component cards */}
      <div className="flex flex-col gap-3 mb-8">
        {COMPONENT_ORDER.map((type) => {
          const product = build[type as keyof RecommendedBuild];
          if (!product || typeof product !== 'object' || !('id' in product)) return null;
          const p = product as { id: string; name: string; price: number };
          const label = COMPONENT_LABELS[type] || type;

          return (
            <div
              key={type}
              className="flex items-center gap-4 p-4 bg-surface-card border border-hairline-dark rounded-xl"
            >
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-surface-elevated text-gold">
                {COMPONENT_ICONS[type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-muted-text font-medium uppercase tracking-wide">{label}</div>
                <div className="text-body-md text-on-dark truncate">{p.name}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Check size={14} className="text-emerald-400" />
                <span className="font-['Nunito'] font-semibold text-gold whitespace-nowrap">
                  {p.price.toLocaleString('ru-BY')} BYN
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <button
        className="w-full py-3.5 px-6 bg-gold text-gold-ink font-semibold text-body-md rounded-xl cursor-pointer transition-all duration-200 hover:brightness-110 shadow-[0_0_20px_rgba(252,213,53,0.15)] disabled:opacity-50 flex items-center justify-center gap-2"
        onClick={handleOpenInBuilder}
        disabled={loading}
      >
        {loading ? <><Loader2 size={18} className="animate-spin" /> Загрузка...</> : 'Открыть в конструкторе'}
      </button>
    </div>
  );
}
