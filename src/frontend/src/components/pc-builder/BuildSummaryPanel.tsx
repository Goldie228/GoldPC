/**
 * BuildSummaryPanel — правая панель итогов сборки
 */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, BarChart3, Check, AlertTriangle, Save } from 'lucide-react';
import {
  calculatePerformance,
  getPerformanceLabel,
  getPerformanceColor,
} from '../../utils/performanceCalculator';
import type { Product } from '../../api/types';
import type { PCComponentType, PCBuilderSelectedState } from '../../hooks';
import { PC_BUILDER_SLOTS } from '../../hooks';
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
  onAddToCart: () => void;
  onSave: () => void;
  onCheckout: () => void;
}

const MAX_POWER = 850;

function getImageUrl(product: Product | undefined): string | null {
  if (!product) return null;
  const url = (product as { mainImage?: { url?: string } }).mainImage?.url;
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
  const psuOk = psuWattage !== undefined && psuWattage >= Math.max(0, powerConsumption) * 1.2;
  const canAddToCart = isCompatible && selectedCount > 0;
  const canCheckout = canAddToCart;

  const listItems = useMemo(() => {
    const items: { key: string; label: string; price: number | null }[] = [];
    for (const slot of PC_BUILDER_SLOTS) {
      if (slot.key === 'ram') {
        if (selectedComponents.ram.length === 0) {
          items.push({ key: 'ram-empty', label: slot.label, price: null });
        } else {
          selectedComponents.ram.forEach((r, i) => {
            items.push({
              key: `ram-${i}`,
              label: selectedComponents.ram.length > 1 ? `ОЗУ (${i + 1})` : slot.label,
              price: r.product.price,
            });
          });
        }
        continue;
      }
      if (slot.key === 'storage') {
        if (selectedComponents.storage.length === 0) {
          items.push({ key: 'storage-empty', label: slot.label, price: null });
        } else {
          selectedComponents.storage.forEach((s, i) => {
            items.push({
              key: `storage-${i}`,
              label: selectedComponents.storage.length > 1 ? `Накопитель (${i + 1})` : slot.label,
              price: s.product.price,
            });
          });
        }
        continue;
      }
      const comp = selectedComponents[slot.key as Exclude<PCComponentType, 'ram' | 'storage'>];
      const p = comp?.product;
      items.push({
        key: slot.key,
        label: slot.label,
        price: p?.price ?? null,
      });
    }
    return items;
  }, [selectedComponents]);

  return (
    <div
      className="bsp"
      role="complementary"
      aria-label={`Итоги сборки, выбрано ${selectedCount} из ${totalCount} категорий`}
    >
      <h2 className="bsp__title">Ваша сборка</h2>

      <ul className="bsp__component-list">
        <AnimatePresence mode="popLayout">
          {listItems.map((row) => (
            <motion.li
              key={row.key}
              className="bsp__component-item"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              layout
            >
              <span className="bsp__component-label">{row.label}</span>
              <motion.span
                className="bsp__component-price"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {row.price != null ? `${row.price.toLocaleString('ru-BY')} BYN` : '—'}
              </motion.span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {(cpu || gpu) && (
        <div className="bsp__previews">
          {cpu && (
            <div className="bsp__preview-card">
              <div className="bsp__preview-img-wrap">
                {getImageUrl(cpu) ? (
                  <img src={getImageUrl(cpu)!} alt={cpu.name} className="bsp__preview-img" loading="lazy" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="bsp__preview-icon">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <rect x="9" y="9" width="6" height="6" />
                    <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
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
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <path d="M6 10h4v4H6z" />
                    <path d="M14 10h4M14 14h4M18 6V4M6 6V4" />
                  </svg>
                )}
              </div>
              <span className="bsp__preview-label">GPU</span>
            </div>
          )}
        </div>
      )}

      <div className="bsp__divider" />

      <section className="bsp__section" aria-label="Энергопотребление">
        <h3 className="bsp__section-title bsp__section-title--with-icon">
          <Zap size={16} strokeWidth={2} aria-hidden className="bsp__section-icon" />
          Питание
        </h3>
        <div
          className="bsp__power-bar-track"
          role="progressbar"
          aria-valuenow={displayPowerW}
          aria-valuemin={0}
          aria-valuemax={MAX_POWER}
          aria-label={`Потребление около ${displayPowerW} Вт`}
        >
          <motion.div
            className="bsp__power-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${powerPercent}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        <div className="bsp__power-info">
          <span>Потребление (оценочно):</span>
          <strong>~{displayPowerW} Вт</strong>
        </div>
        {psuWattage !== undefined ? (
          <div className={`bsp__power-info ${psuOk ? 'bsp__power-info--ok' : 'bsp__power-info--warn'}`}>
            <span>Блок питания:</span>
            <strong className="bsp__power-psu-strong">
              {psuWattage} Вт
              {psuOk ? (
                <Check size={14} strokeWidth={2.5} aria-hidden className="bsp__power-status-icon" />
              ) : (
                <AlertTriangle size={14} strokeWidth={2.5} aria-hidden className="bsp__power-status-icon" />
              )}
            </strong>
          </div>
        ) : (
          <div className="bsp__power-suggestion">
            Рекомендуется БП от <strong>{recommendedPsu} Вт</strong>
          </div>
        )}
      </section>

      <div className="bsp__divider" />

      <section className="bsp__section" aria-label="Производительность">
        <h3 className="bsp__section-title bsp__section-title--with-icon">
          <BarChart3 size={16} strokeWidth={2} aria-hidden className="bsp__section-icon" />
          Производительность
        </h3>

        {performance.isEmptyBuild ? (
          <p className="bsp__perf-placeholder">
            Выберите процессор и/или видеокарту — тогда появится оценка игровой и рабочей нагрузки.
          </p>
        ) : (
          <>
            <div className="bsp__score-row">
              <span className="bsp__score-label">Игры</span>
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

            <div className="bsp__fps-row">
              <span className="bsp__fps-label">1080p:</span>
              <span className="bsp__fps-value">{performance.estimatedFps.fps1080p} FPS</span>
              <span className="bsp__fps-label">1440p:</span>
              <span className="bsp__fps-value">{performance.estimatedFps.fps1440p}</span>
              <span className="bsp__fps-label">4K:</span>
              <span className="bsp__fps-value">{performance.estimatedFps.fps4k}</span>
            </div>

            <div className="bsp__score-row">
              <span className="bsp__score-label">Работа</span>
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

            <div className="bsp__score-row bsp__score-row--overall">
              <span className="bsp__score-label">Итого</span>
              <div className="bsp__score-bar-track">
                <motion.div
                  className={`bsp__score-bar-fill ${getPerformanceColor(performance.overallScore)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${performance.overallScore}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
                />
              </div>
              <span
                className={`bsp__score-value bsp__score-value--overall ${getPerformanceColor(performance.overallScore)}`}
              >
                {performance.overallScore}
              </span>
            </div>

            <div className="bsp__performance-label">{getPerformanceLabel(performance.overallScore)}</div>
          </>
        )}
      </section>

      <div className="bsp__divider" />

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

      <div className="bsp__actions">
        <button
          type="button"
          className="bsp__btn bsp__btn--save"
          disabled={selectedCount === 0}
          onClick={onSave}
        >
          <Save size={18} strokeWidth={2} aria-hidden />
          Сохранить
        </button>
        <button
          type="button"
          className="bsp__btn bsp__btn--cart"
          disabled={!canAddToCart}
          onClick={onAddToCart}
          aria-disabled={!canAddToCart}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
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
      </div>

      {!canAddToCart && selectedCount > 0 && !isCompatible && (
        <p className="bsp__disabled-hint">Исправьте ошибки совместимости для корзины и оформления</p>
      )}
      {!canAddToCart && selectedCount === 0 && (
        <p className="bsp__disabled-hint">Выберите компоненты для сборки</p>
      )}
    </div>
  );
}
