/**
 * BuildSummaryPanel — правая панель итогов сборки
 * Redesign: компактная, сгруппированная, по DESIGN.md
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Zap, BarChart3, Save, ShoppingBag, AlertTriangle, XCircle } from 'lucide-react';
import {
  calculatePerformance,
  getPerformanceLabel,
  getPerformanceColor,
} from '@/features/pc-builder/logic/performance';
import type { PCComponentType, PCBuilderSelectedState } from '@/hooks';
import { PC_BUILDER_SLOTS } from '@/hooks';
import './BuildSummaryPanel.css';

export interface BuildSummaryPanelProps {
  selectedComponents: PCBuilderSelectedState;
  totalPrice: number;
  powerConsumption: number;
  recommendedPsu?: number;
  isCompatible: boolean;
  selectedCount: number;
  totalCount: number;
  psuWattage?: number;
  compatibilityErrors?: string[];
  compatibilityWarnings?: string[];
  onAddToCart: () => void;
  onSave: () => void;
  onCheckout: () => void;
  onExportPdf?: () => void;
}

const MAX_POWER = 850;

// Группировка слотов для отображения
const SLOT_GROUPS = [
  { label: 'Основа', keys: ['cpu', 'motherboard', 'ram'] },
  { label: 'Накопители', keys: ['storage'] },
  { label: 'Графика и охлаждение', keys: ['gpu', 'cooling'] },
  { label: 'Питание и корпус', keys: ['psu', 'case'] },
  { label: 'Периферия', keys: ['fan', 'monitor', 'keyboard', 'mouse', 'headphones'] },
] as const;

export const BuildSummaryPanel = React.memo(function BuildSummaryPanel({
  selectedComponents,
  totalPrice,
  powerConsumption,
  recommendedPsu: recommendedPsuProp,
  isCompatible,
  selectedCount,
  totalCount,
  psuWattage,
  compatibilityErrors,
  compatibilityWarnings,
  onAddToCart,
  onSave,
  onCheckout,
}: BuildSummaryPanelProps) {
  const cpu = selectedComponents.cpu?.product ?? null;
  const gpu = selectedComponents.gpu?.product ?? null;
  const ramFirst = selectedComponents.ram[0]?.product ?? null;

  const performance = useMemo(
    () => calculatePerformance(cpu, gpu, ramFirst),
    [cpu, gpu, ramFirst]
  );
  const displayPowerW = Math.max(0, Math.round(powerConsumption));
  const recommendedPsu = recommendedPsuProp ?? Math.ceil(Math.max(0, powerConsumption) * 1.3);
  const powerPercent = Math.min((Math.max(0, powerConsumption) / MAX_POWER) * 100, 100);
  const canAddToCart = isCompatible && selectedCount > 0;
  const canCheckout = canAddToCart;
  const reducedMotion = useReducedMotion();
  const barDur = reducedMotion ? 0 : 0.6;
  const scoreDur = reducedMotion ? 0 : 0.5;
  const priceDur = reducedMotion ? 0 : 0.3;

  // Построение сгруппированного списка компонентов (только выбранные)
  const groupedItems = useMemo(() => {
    const groups: { label: string; items: { key: string; label: string; price: number }[] }[] = [];

    for (const group of SLOT_GROUPS) {
      const items: { key: string; label: string; price: number }[] = [];

      for (const slotKey of group.keys) {
        const slot = PC_BUILDER_SLOTS.find(s => s.key === slotKey);
        if (!slot) continue;

        if (slotKey === 'ram') {
          selectedComponents.ram.forEach((r, i) => {
            items.push({
              key: `ram-${i}`,
              label: selectedComponents.ram.length > 1 ? `ОЗУ (${i + 1})` : slot.label,
              price: r.product.price,
            });
          });
        } else if (slotKey === 'storage') {
          selectedComponents.storage.forEach((s, i) => {
            items.push({
              key: `storage-${i}`,
              label: selectedComponents.storage.length > 1 ? `Накопитель (${i + 1})` : slot.label,
              price: s.product.price,
            });
          });
        } else if (slotKey === 'fan') {
          selectedComponents.fan.forEach((f, i) => {
            items.push({
              key: `fan-${i}`,
              label: selectedComponents.fan.length > 1 ? `Вентилятор (${i + 1})` : slot.label,
              price: f.product.price,
            });
          });
        } else {
          const comp = selectedComponents[slotKey];
          const p = comp && 'product' in comp ? comp.product : null;
          if (p) {
            items.push({ key: slotKey, label: slot.label, price: p.price });
          }
        }
      }

      if (items.length > 0) {
        groups.push({ label: group.label, items });
      }
    }

    return groups;
  }, [selectedComponents]);

  const hasSelectedComponents = groupedItems.length > 0;

  return (
    <div
      className="bsp"
      role="complementary"
      aria-label={`Итоги сборки, выбрано ${selectedCount} из ${totalCount} категорий`}
    >
      {/* Header */}
      <div className="bsp__header">
        <h2 className="bsp__title">Ваша сборка</h2>
        <span className="bsp__progress">{selectedCount} / {totalCount}</span>
      </div>

      {/* Compatibility alerts */}
      <AnimatePresence>
        {compatibilityErrors && compatibilityErrors.length > 0 && (
          <motion.div
            className="bsp__alerts bsp__alerts--error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {compatibilityErrors.map((err, index) => (
              <div key={index} className="bsp__alert-item">
                <XCircle size={14} strokeWidth={2} aria-hidden />
                <span>{err}</span>
              </div>
            ))}
          </motion.div>
        )}
        {compatibilityWarnings && compatibilityWarnings.length > 0 && (
          <motion.div
            className="bsp__alerts bsp__alerts--warning"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {compatibilityWarnings.map((warn, index) => (
              <div key={index} className="bsp__alert-item">
                <AlertTriangle size={14} strokeWidth={2} aria-hidden />
                <span>{warn}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Component list (grouped, selected only) */}
      {hasSelectedComponents && (
        <div className="bsp__components">
          <AnimatePresence mode="popLayout">
            {groupedItems.map((group) => (
              <div key={group.label} className="bsp__component-group">
                <div className="bsp__group-label">{group.label}</div>
                {group.items.map((item) => (
                  <motion.div
                    key={item.key}
                    className="bsp__component-row"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    layout
                  >
                    <span className="bsp__component-name">{item.label}</span>
                    <span className="bsp__component-price">{item.price.toLocaleString('ru-BY')} BYN</span>
                  </motion.div>
                ))}
              </div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {!hasSelectedComponents && (
        <p className="bsp__empty">Выберите компоненты для начала сборки</p>
      )}

      {/* Power section */}
      {hasSelectedComponents && (
        <section className="bsp__section" aria-label="Энергопотребление">
          <h3 className="bsp__section-title">
            <Zap size={14} strokeWidth={2} aria-hidden />
            Питание
          </h3>
          <div className="bsp__power-bar-track" role="progressbar" aria-valuenow={displayPowerW} aria-valuemin={0} aria-valuemax={MAX_POWER}>
            <motion.div
              className="bsp__power-bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${powerPercent}%` }}
              transition={{ duration: barDur, ease: 'easeOut' }}
            />
          </div>
          <div className="bsp__power-row">
            <span>Потребление</span>
            <strong>~{displayPowerW} Вт</strong>
          </div>
          {psuWattage !== undefined ? (
            <div className="bsp__power-row bsp__power-row--psu">
              <span>Блок питания</span>
              <strong>{psuWattage} Вт</strong>
            </div>
          ) : (
            <div className="bsp__power-suggestion">
              Рекомендуется БП от <strong>{recommendedPsu} Вт</strong>
            </div>
          )}
        </section>
      )}

      {/* Performance section */}
      {hasSelectedComponents && !performance.isEmptyBuild && (
        <section className="bsp__section" aria-label="Производительность">
          <h3 className="bsp__section-title">
            <BarChart3 size={14} strokeWidth={2} aria-hidden />
            Производительность
          </h3>
          <div className="bsp__scores">
            <div className="bsp__score-row">
              <span className="bsp__score-label">Игры</span>
              <div className="bsp__score-bar-track">
                <motion.div
                  className={`bsp__score-bar-fill ${getPerformanceColor(performance.gamingScore)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${performance.gamingScore}%` }}
                  transition={{ duration: scoreDur, ease: 'easeOut' }}
                />
              </div>
              <span className={`bsp__score-value ${getPerformanceColor(performance.gamingScore)}`}>
                {performance.gamingScore}
              </span>
            </div>
            <div className="bsp__score-row">
              <span className="bsp__score-label">Работа</span>
              <div className="bsp__score-bar-track">
                <motion.div
                  className={`bsp__score-bar-fill ${getPerformanceColor(performance.workstationScore)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${performance.workstationScore}%` }}
                  transition={{ duration: scoreDur, ease: 'easeOut', delay: 0.1 }}
                />
              </div>
              <span className={`bsp__score-value ${getPerformanceColor(performance.workstationScore)}`}>
                {performance.workstationScore}
              </span>
            </div>
            <div className="bsp__score-row bsp__score-row--overall">
              <span className="bsp__score-label">Итого</span>
              <div className="bsp__score-bar-track">
                <motion.div
                  className={`bsp__score-bar-fill ${getPerformanceColor(performance.overallScore)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${performance.overallScore}%` }}
                  transition={{ duration: scoreDur, ease: 'easeOut', delay: 0.2 }}
                />
              </div>
              <span className={`bsp__score-value bsp__score-value--overall ${getPerformanceColor(performance.overallScore)}`}>
                {performance.overallScore}
              </span>
            </div>
          </div>
          <div className="bsp__perf-label">{getPerformanceLabel(performance.overallScore)}</div>
        </section>
      )}

      {/* Total */}
      {hasSelectedComponents && (
        <div className="bsp__total">
          <span className="bsp__total-label">Итого</span>
          <motion.span
            key={totalPrice}
            className="bsp__total-value"
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: priceDur }}
          >
            {totalPrice.toLocaleString('ru-BY')} BYN
          </motion.span>
        </div>
      )}

      {/* Actions */}
      <div className="bsp__actions">
        <button
          type="button"
          className="bsp__btn bsp__btn--cart"
          disabled={!canAddToCart}
          onClick={onAddToCart}
        >
          <ShoppingBag size={16} strokeWidth={2} aria-hidden />
          В корзину
        </button>
        <button
          type="button"
          className="bsp__btn bsp__btn--checkout"
          disabled={!canCheckout}
          onClick={onCheckout}
        >
          Оформить
        </button>
        <button
          type="button"
          className="bsp__btn bsp__btn--save"
          disabled={selectedCount === 0}
          onClick={onSave}
        >
          <Save size={16} strokeWidth={2} aria-hidden />
          Сохранить
        </button>
      </div>

      {!canAddToCart && selectedCount > 0 && !isCompatible && (
        <p className="bsp__hint">Исправьте ошибки совместимости</p>
      )}
    </div>
  );
});
