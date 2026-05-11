'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import './DualRangeSlider.css';

interface DualRangeSliderProps {
  min: number;
  max: number;
  step?: number;
  minVal: number;
  maxVal: number;
  /** Вызывается при каждом движении ползунка (для локального UI-состояния) */
  onChange?: (values: { min: number; max: number }) => void;
  /** Вызывается после завершения перетаскивания (для обновления фильтра) */
  onCommit?: (values: { min: number; max: number }) => void;
  /** Минимальный разрыв между ползунками */
  priceGap?: number;
  /** Форматирование значения для ARIA и тултипов */
  formatValue?: (value: number) => string;
}

export function DualRangeSlider({
  min,
  max,
  step = 10,
  minVal,
  maxVal,
  onChange,
  onCommit,
  priceGap: propPriceGap,
  formatValue = (v) => v.toString(),
}: DualRangeSliderProps) {
  // Рассчитываем priceGap: используем пропс, если передан, иначе вычисляем (10% от диапазона)
  const priceGap = propPriceGap ?? Math.max(step, Math.min((max - min) * 0.1, (max - min) * 0.5));

  // Локальное состояние для плавного перетаскивания
  const [localValues, setLocalValues] = useState({
    min: minVal,
    max: maxVal > 0 ? maxVal : max,
  });
  const [activeThumb, setActiveThumb] = useState<'min' | 'max' | null>(null);

  const trackRef = useRef<HTMLDivElement>(null);

  // Синхронизируем локальное состояние с пропсами (когда фильтр сбрасывается извне)
  useEffect(() => {
    setLocalValues({ min: minVal, max: maxVal > 0 ? maxVal : max });
  }, [minVal, maxVal]);

  // Проценты для позиционирования (с защитой от деления на 0 при min === max)
  const range = max - min;
  const minPercent = range > 0 ? Math.max(0, Math.min(100, ((localValues.min - min) / range) * 100)) : 0;
  const maxPercent = range > 0 ? Math.max(0, Math.min(100, ((localValues.max - min) / range) * 100)) : 100;

  // Получение значения из позиции курсора
  const getValueFromPosition = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return min;
      const rect = trackRef.current.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const rawValue = min + percentage * (max - min);
      // Округляем до ближайшего step
      return Math.round(rawValue / step) * step;
    },
    [min, max, step]
  );

  // Обработка начала перетаскивания
  const handlePointerDown = useCallback(
    (thumb: 'min' | 'max') => (e: React.PointerEvent) => {
      e.preventDefault();
      trackRef.current?.setPointerCapture(e.pointerId);
      setActiveThumb(thumb);
    },
    []
  );

  // Обработка движения (мышь + touch) — с "бумсь" при пересечении
  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!activeThumb || !trackRef.current) return;

      const newValue = getValueFromPosition(e.clientX);
      const clampedValue = Math.max(min, Math.min(max, newValue));

      if (activeThumb === 'min') {
        // "Бумсь": если min пересёк max — берём max как якорь, подгоняем min
        const proposedMin = clampedValue;
        const diff = localValues.max - proposedMin;
        const newMin = diff < priceGap ? localValues.max - priceGap : proposedMin;
        const updated = { min: newMin, max: localValues.max };
        setLocalValues(updated);
        onChange?.(updated);
      } else {
        // max тянем влево к min — если max < min + gap, якорь max, подгоняем
        const proposedMax = clampedValue;
        const diff = proposedMax - localValues.min;
        const newMax = diff < priceGap ? localValues.min + priceGap : proposedMax;
        const updated = { min: localValues.min, max: newMax };
        setLocalValues(updated);
        onChange?.(updated);
      }
    },
    [activeThumb, getValueFromPosition, localValues, min, max, priceGap, onChange]
  );

  // Обработка окончания перетаскивания
  const handlePointerUp = useCallback(() => {
    setActiveThumb(null);
    if (onCommit) {
      onCommit(localValues);
    }
  }, [onCommit, localValues]);

  // Глобальные слушатели для отслеживания движения и отпускания
  useEffect(() => {
    if (activeThumb) {
      const handleGlobalMove = (e: PointerEvent) => handlePointerMove(e);
      const handleGlobalUp = () => handlePointerUp();

      document.addEventListener('pointermove', handleGlobalMove);
      document.addEventListener('pointerup', handleGlobalUp);

      return () => {
        document.removeEventListener('pointermove', handleGlobalMove);
        document.removeEventListener('pointerup', handleGlobalUp);
      };
    }
  }, [activeThumb, handlePointerMove, handlePointerUp]);

  // Клик по треку перемещает ближайший ползунок
  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      if (activeThumb) return; // Игнорируем, если уже тащим

      const newValue = getValueFromPosition(e.clientX);

      // Определяем, к какому ползунку ближе
      const distToMin = Math.abs(newValue - localValues.min);
      const distToMax = Math.abs(newValue - localValues.max);

      if (distToMin <= distToMax) {
        // Ближе к min — двигаем min
        const newMin = Math.min(newValue, localValues.max - priceGap);
        const updated = { min: newMin, max: localValues.max };
        setLocalValues(updated);
        onChange?.(updated);
        onCommit?.(updated);
      } else {
        // Ближе к max — двигаем max
        const newMax = Math.max(newValue, localValues.min + priceGap);
        const updated = { min: localValues.min, max: newMax };
        setLocalValues(updated);
        onChange?.(updated);
        onCommit?.(updated);
      }
    },
    [activeThumb, getValueFromPosition, localValues, priceGap, onChange, onCommit]
  );

 // Правильное позиционирование ползунка:
  // Трек: left: 0; right: 0; (растянут на всю ширину контейнера)
  // Ползунок: transform: translate(-50%, -50%)
  //
  // При X=0: left: 0%, затем translate(-50%) → ползунок центрируется на левой границе трека ✅
  // При X=100: left: 100%, затем translate(-50%) → правый край ползунка на правой границе трека ✅
  // При X=50: left: 50%, затем translate(-50%) → ползунок по центру трека ✅

  const getLeftStyle = (percent: number): React.CSSProperties => {
    if (Number.isNaN(percent)) {
      return { left: '8px' };
    }
    // Кружок 16px с translate(-50%): центр на left:X%.
    // Чтобы ГРАНЬ кружка упиралась в край трека, отступаем на радиус (8px):
    //   left: calc(8px + (100% - 16px) * percent / 100)
    // При 0%  → left = 8px (центр на 8px, грань на 0px — вровень с левым краем трека) ✓
    // При 100% → left = calc(100% - 8px) (центр на -8px, грань на 100% — вровень с правым краем трека) ✓
    return {
      left: `calc(8px + (100% - 16px) * ${percent} / 100)`,
    };
  };

  return (
    <div className="dual-range-slider">
      {/* Трек (фон) */}
      <div
        ref={trackRef}
        className="dual-range-track"
        onClick={handleTrackClick}
      >
        {/* Активный диапазон (прогресс) */}
        <div
          className="dual-range-progress"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />
      </div>

      {/* Минимальный ползунок */}
      <div
        className={`dual-range-thumb dual-range-thumb--min ${activeThumb === 'min' ? 'active' : ''}`}
        style={getLeftStyle(minPercent)}
        onPointerDown={handlePointerDown('min')}
        role="slider"
        aria-label="Минимальная цена"
        aria-valuemin={min}
        aria-valuemax={max - priceGap}
        aria-valuenow={localValues.min}
        tabIndex={0}
      >
        <div className="dual-range-thumb-tooltip">
          {formatValue(localValues.min)}
        </div>
      </div>

      {/* Максимальный ползунок */}
      <div
        className={`dual-range-thumb dual-range-thumb--max ${activeThumb === 'max' ? 'active' : ''}`}
        style={getLeftStyle(maxPercent)}
        onPointerDown={handlePointerDown('max')}
        role="slider"
        aria-label="Максимальная цена"
        aria-valuemin={min + priceGap}
        aria-valuemax={max}
        aria-valuenow={localValues.max}
        tabIndex={0}
      >
        <div className="dual-range-thumb-tooltip">
          {formatValue(localValues.max)}
        </div>
      </div>
    </div>
  );
}
