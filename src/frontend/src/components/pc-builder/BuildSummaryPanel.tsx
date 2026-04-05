/**
 * BuildSummaryPanel — правая панель итогов сборки
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Zap, BarChart3, Check, AlertTriangle, Save, Gamepad2, Printer, ShoppingBag, CircleCheck, XCircle } from 'lucide-react';
import {
  calculatePerformance,
  getPerformanceLabel,
  getPerformanceColor,
} from '../../utils/performanceCalculator';
import type { FpsApiResponse } from '../../api/pcBuilderService';
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
  /** Ошибки совместимости из usePCBuilder */
  compatibilityErrors?: string[];
  /** Предупреждения совместимости из usePCBuilder */
  compatibilityWarnings?: string[];
  /** Данные с backend FPS API (если CPU+GPU выбраны) */
  apiFpsData?: FpsApiResponse;
  /** Показывает, идёт ли сейчас запрос к API совместимости */
  isApiLoading?: boolean;
  onAddToCart: () => void;
  onSave: () => void;
  onCheckout: () => void;
  onExportPdf?: () => void;
}

const MAX_POWER = 850;

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
  apiFpsData,
  isApiLoading,
  onAddToCart,
  onSave,
  onCheckout,
  onExportPdf,
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
  const reducedMotion = useReducedMotion();
  const barDur = reducedMotion ? 0 : 0.6;
  const scoreDur = reducedMotion ? 0 : 0.5;
  const priceDur = reducedMotion ? 0 : 0.3;

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
      if (slot.key === 'fan') {
        if (selectedComponents.fan.length === 0) {
          items.push({ key: 'fan-empty', label: slot.label, price: null });
        } else {
          selectedComponents.fan.forEach((f, i) => {
            items.push({
              key: `fan-${i}`,
              label: selectedComponents.fan.length > 1 ? `Вентилятор (${i + 1})` : slot.label,
              price: f.product.price,
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

      {selectedCount > 0 && (
        <div
          className={`bsp__compat-status ${compatibilityErrors && compatibilityErrors.length > 0 ? 'bsp__compat-status--error' : compatibilityWarnings && compatibilityWarnings.length > 0 ? 'bsp__compat-status--warning' : 'bsp__compat-status--ok'}`}
          role="status"
          aria-live="polite"
        >
          {compatibilityErrors && compatibilityErrors.length > 0 ? (
            <XCircle size={18} strokeWidth={2} aria-hidden className="bsp__compat-icon" />
          ) : compatibilityWarnings && compatibilityWarnings.length > 0 ? (
            <AlertTriangle size={18} strokeWidth={2} aria-hidden className="bsp__compat-icon" />
          ) : (
            <CircleCheck size={18} strokeWidth={2} aria-hidden className="bsp__compat-icon" />
          )}
          <span className="bsp__compat-text">
            {compatibilityErrors && compatibilityErrors.length > 0
              ? 'Есть проблемы совместимости'
              : compatibilityWarnings && compatibilityWarnings.length > 0
                ? 'Обратите внимание на рекомендации'
                : 'Сборка совместима'}
          </span>
          {isApiLoading && (
            <span className="bsp__api-loading" aria-hidden>
              <span className="bsp__api-loading-spinner" />
              Обновление...
            </span>
          )}
        </div>
      )}

      {(compatibilityErrors && compatibilityErrors.length > 0) && (
        <ul className="bsp__compat-list" aria-label="Ошибки совместимости">
          {compatibilityErrors.map((err, index) => (
            <li key={index} className="bsp__compat-item bsp__compat-item--error">
              <XCircle size={14} strokeWidth={2} aria-hidden className="bsp__compat-list-icon" />
              {err}
            </li>
          ))}
        </ul>
      )}

      {(compatibilityWarnings && compatibilityWarnings.length > 0) && (
        <ul className="bsp__compat-list" aria-label="Предупреждения совместимости">
          {compatibilityWarnings.map((warn, index) => (
            <li key={index} className="bsp__compat-item bsp__compat-item--warning">
              <AlertTriangle size={14} strokeWidth={2} aria-hidden className="bsp__compat-list-icon" />
              {warn}
            </li>
          ))}
        </ul>
      )}

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
            transition={{ duration: barDur, ease: 'easeOut' }}
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
                  transition={{ duration: scoreDur, ease: 'easeOut' }}
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

            {apiFpsData && apiFpsData.games.length > 0 && (
              <div className="bsp__api-fps">
                <div className="bsp__api-fps-header">
                  <Gamepad2 size={14} strokeWidth={2} aria-hidden />
                  <span>FPS по {apiFpsData.games.length} играм</span>
                </div>
                {apiFpsData.bottleneck && (
                  <div className="bsp__api-fps-bottleneck">
                    {apiFpsData.bottleneck === 'cpu-bound' && 'Упор в CPU'}
                    {apiFpsData.bottleneck === 'gpu-bound' && 'Упор в GPU'}
                    {apiFpsData.bottleneck === 'balanced' && 'Баланс CPU/GPU'}
                  </div>
                )}
                <table className="bsp__api-fps-table">
                  <thead>
                    <tr>
                      <th>Игра</th>
                      <th>1080p</th>
                      <th>1440p</th>
                      <th>4K</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiFpsData.games.map((game) => (
                      <tr key={game.gameId}>
                        <td>{game.gameName}</td>
                        <td>{game.resolutions.resolution1080p} FPS</td>
                        <td>{game.resolutions.resolution1440p} FPS</td>
                        <td>{game.resolutions.resolution4k} FPS</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

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
          transition={{ duration: priceDur }}
        >
          {totalPrice.toLocaleString('ru-BY')} BYN
        </motion.span>
      </div>

      <div className="bsp__actions">
        <div className="bsp__actions-row">
          <button
            type="button"
            className="bsp__btn bsp__btn--save"
            disabled={selectedCount === 0}
            onClick={onSave}
          >
            <Save size={18} strokeWidth={2} aria-hidden />
            Сохранить
          </button>
          {onExportPdf && (
            <button
              type="button"
              className="bsp__btn bsp__btn--export"
              disabled={selectedCount === 0}
              onClick={onExportPdf}
            >
              <Printer size={18} strokeWidth={2} aria-hidden />
              Печать
            </button>
          )}
        </div>
        <button
          type="button"
          className="bsp__btn bsp__btn--cart"
          disabled={!canAddToCart}
          onClick={onAddToCart}
          aria-disabled={!canAddToCart}
        >
          <ShoppingBag size={18} strokeWidth={2} aria-hidden="true" />
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
    </div>
  );
});
