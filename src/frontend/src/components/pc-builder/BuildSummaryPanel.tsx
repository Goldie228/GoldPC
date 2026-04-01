/**
 * BuildSummaryPanel - Right panel for PC build summary
 */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  calculatePerformance,
  getPerformanceLabel,
  getPerformanceColor,
} from '../../utils/performanceCalculator';
import type { Product } from '../../api/types';
import type { PCComponentType, SelectedComponent } from '../../hooks';
import { PC_BUILDER_SLOTS } from '../../hooks';
import './BuildSummaryPanel.css';

export interface BuildSummaryPanelProps {
  selectedComponents: Partial<Record<PCComponentType, SelectedComponent>>;
  totalPrice: number;
  powerConsumption: number;
  recommendedPsu?: number;
  isCompatible: boolean;
  selectedCount: number;
  totalCount: number;
  psuWattage?: number;
  onAddToCart: () => void;
}

const MAX_POWER = 850;

function getImageUrl(product: Product | undefined): string | null {
  if (!product) return null;
  const url = (product as any).mainImage?.url as string | undefined;
  if (!url) return null;
  if (url.startsWith('/uploads/')) return url;
  return url;
}

export function BuildSummaryPanel({
  selectedComponents,
  totalPrice,
  powerConsumption,
  recommendedPsu: recommendedPsuProp,
  isCompatible,
  selectedCount,
  totalCount,
  psuWattage,
  onAddToCart,
}: BuildSummaryPanelProps) {
  const cpu = selectedComponents.cpu?.product ?? null;
  const gpu = selectedComponents.gpu?.product ?? null;
  const ram = selectedComponents.ram?.product ?? null;

  const performance = useMemo(() => calculatePerformance(cpu, gpu, ram), [cpu, gpu, ram]);
  const recommendedPsu = recommendedPsuProp ?? Math.ceil(powerConsumption * 1.3);
  const powerPercent = Math.min((powerConsumption / MAX_POWER) * 100, 100);
  const psuOk = psuWattage !== undefined && psuWattage >= powerConsumption * 1.2;
  const canAddToCart = isCompatible && selectedCount > 0;

  return (
    <div className="bsp" role="complementary" aria-label="Итоги сборки">
      <h2 className="bsp__title">Ваша сборка</h2>

      {/* Component list with prices */}
      <ul className="bsp__component-list">
        <AnimatePresence mode="popLayout">
          {PC_BUILDER_SLOTS.map((slot) => {
            const product = selectedComponents[slot.key]?.product;
            return (
              <motion.li
                key={slot.key}
                className="bsp__component-item"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.92 }}
                layout
              >
                <span className="bsp__component-label">{slot.label}</span>
                <motion.span
                  key={product?.id ?? 'empty'}
                  className="bsp__component-price"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {product ? `${product.price.toLocaleString('ru-BY')} BYN` : '—'}
                </motion.span>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {/* CPU/GPU previews 120x120 in white frame */}
      {(cpu || gpu) && (
        <div className="bsp__previews">
          {cpu && (
            <div className="bsp__preview-card">
              <div className="bsp__preview-img-wrap">
                {getImageUrl(cpu) ? (
                  <img src={getImageUrl(cpu)!} alt={cpu.name} className="bsp__preview-img" loading="lazy" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="bsp__preview-icon">
                    <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/>
                    <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/>
                  </svg>
                )}
              </div>
              <span className="bsp__preview-label">CPU</span>
            </div>
          )}
          {gpu && (
            <div className="bsp__preview-card">
              <div className="bsp__preview-img-wrap">
                {getImageUrl(gpu) ? (
                  <img src={getImageUrl(gpu)!} alt={gpu.name} className="bsp__preview-img" loading="lazy" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="bsp__preview-icon">
                    <rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h4v4H6z"/>
                    <path d="M14 10h4M14 14h4M18 6V4M6 6V4"/>
                  </svg>
                )}
              </div>
              <span className="bsp__preview-label">GPU</span>
            </div>
          )}
        </div>
      )}

      <div className="bsp__divider" />

      {/* Power consumption */}
      <section className="bsp__section" aria-label="Энергопотребление">
        <h3 className="bsp__section-title">⚡ Питание</h3>
        <div className="bsp__power-bar-track" role="progressbar" aria-valuenow={powerConsumption} aria-valuemin={0} aria-valuemax={MAX_POWER} aria-label={`Потребление ${powerConsumption}W`}> 
          <motion.div
            className="bsp__power-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${powerPercent}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        <div className="bsp__power-info">
          <span>Потребление:</span>
          <strong>~{powerConsumption} W</strong>
        </div>
        {psuWattage !== undefined ? (
          <div className={`bsp__power-info ${psuOk ? 'bsp__power-info--ok' : 'bsp__power-info--warn'}`}>
            <span>Блок питания:</span>
            <strong>{psuWattage}W {psuOk ? '✓' : '⚠'}</strong>
          </div>
        ) : (
          <div className="bsp__power-suggestion">
            Рекомендуется БП от <strong>{recommendedPsu}W</strong>
          </div>
        )}
      </section>

      <div className="bsp__divider" />

      {/* Performance scores */}
      <section className="bsp__section" aria-label="Производительность">
        <h3 className="bsp__section-title">📊 Производительность</h3>

        {/* Gaming */}
        <div className="bsp__score-row">
          <span className="bsp__score-label">Gaming</span>
          <div className="bsp__score-bar-track">
            <motion.div
              className={`bsp__score-bar-fill ${getPerformanceColor(performance.gamingScore)}`}
              initial={{ width: 0 }}
              animate={{ width: `${performance.gamingScore}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <span className={`bsp__score-value ${getPerformanceColor(performance.gamingScore)}`}>
            {performance.gamingScore}
          </span>
        </div>

        {/* FPS estimates */}
        <div className="bsp__fps-row">
          <span className="bsp__fps-label">1080p:</span>
          <span className="bsp__fps-value">{performance.estimatedFps.fps1080p} FPS</span>
          <span className="bsp__fps-label">1440p:</span>
          <span className="bsp__fps-value">{performance.estimatedFps.fps1440p}</span>
          <span className="bsp__fps-label">4K:</span>
          <span className="bsp__fps-value">{performance.estimatedFps.fps4k}</span>
        </div>

        {/* Workstation */}
        <div className="bsp__score-row">
          <span className="bsp__score-label">Workstation</span>
          <div className="bsp__score-bar-track">
            <motion.div
              className={`bsp__score-bar-fill ${getPerformanceColor(performance.workstationScore)}`}
              initial={{ width: 0 }}
              animate={{ width: `${performance.workstationScore}%` }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
            />
          </div>
          <span className={`bsp__score-value ${getPerformanceColor(performance.workstationScore)}`}>
            {performance.workstationScore}
          </span>
        </div>

        {/* Overall */}
        <div className="bsp__score-row bsp__score-row--overall">
          <span className="bsp__score-label">Overall</span>
          <div className="bsp__score-bar-track">
            <motion.div
              className={`bsp__score-bar-fill ${getPerformanceColor(performance.overallScore)}`}
              initial={{ width: 0 }}
              animate={{ width: `${performance.overallScore}%` }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
            />
          </div>
          <span className={`bsp__score-value bsp__score-value--overall ${getPerformanceColor(performance.overallScore)}`}>
            {performance.overallScore}
          </span>
        </div>

        <div className="bsp__performance-label">
          {getPerformanceLabel(performance.overallScore)}
        </div>
      </section>

      <div className="bsp__divider" />

      {/* Total price */}
      <div className="bsp__total">
        <span className="bsp__total-label">Итого:</span>
        <motion.span
          key={totalPrice}
          className="bsp__total-value"
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 0.3 }}
        >
          {totalPrice.toLocaleString('ru-BY')} BYN
        </motion.span>
      </div>

      {/* Add to cart button */}
      <button
        className="bsp__add-to-cart"
        disabled={!canAddToCart}
        onClick={onAddToCart}
        aria-disabled={!canAddToCart}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        Добавить в корзину
      </button>

      {/* Disabled hint */}
      {!canAddToCart && selectedCount > 0 && !isCompatible && (
        <p className="bsp__disabled-hint">Исправьте ошибки совместимости для добавления в корзину</p>
      )}
      {!canAddToCart && selectedCount === 0 && (
        <p className="bsp__disabled-hint">Выберите компоненты для сборки</p>
      )}
    </div>
  );
}
