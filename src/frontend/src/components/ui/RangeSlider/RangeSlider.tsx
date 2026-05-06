import { useState, useRef, useCallback, useEffect } from 'react';

interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: { min: number; max: number };
  /**
   * Вызывается при каждом движении ползунка (для локального UI-состояния).
   * Можно опустить, если не нужно реагировать на каждый шаг.
   */
  onChange?: (value: { min: number; max: number }) => void;
  /**
   * Вызывается один раз после завершения перетаскивания (mouse up).
   * Используйте для «дорогих» операций: запросов к API, изменения фильтров и т.д.
   */
  onCommit?: (value: { min: number; max: number }) => void;
  formatValue?: (value: number) => string;
  label?: string;
}

export function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  onCommit,
  formatValue = (v) => v.toString(),
  label,
}: RangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  const [localValues, setLocalValues] = useState(value);

  useEffect(() => {
    setLocalValues(value);
  }, [value]);

  const getPercentage = useCallback(
    (val: number) => ((val - min) / (max - min)) * 100,
    [min, max]
  );

  const getValueFromPosition = useCallback(
    (position: number) => {
      if (!trackRef.current) return min;
      const rect = trackRef.current.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(1, (position - rect.left) / rect.width));
      const rawValue = min + percentage * (max - min);
      return Math.round(rawValue / step) * step;
    },
    [min, max, step]
  );

  const handleMouseDown = useCallback(
    (handle: 'min' | 'max') => (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(handle);
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !trackRef.current) return;
      const newValue = getValueFromPosition(e.clientX);
      const clampedValue = Math.max(min, Math.min(max, newValue));

      if (isDragging === 'min') {
        const newMin = Math.min(clampedValue, localValues.max - step);
        const updated = { ...localValues, min: newMin };
        setLocalValues(updated);
        onChange?.(updated);
      } else {
        const newMax = Math.max(clampedValue, localValues.min + step);
        const updated = { ...localValues, max: newMax };
        setLocalValues(updated);
        onChange?.(updated);
      }
    },
    [isDragging, getValueFromPosition, localValues, min, max, step, onChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
    if (onCommit) {
      onCommit(localValues);
    }
  }, [onCommit, localValues]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const minPercent = getPercentage(localValues.min);
  const maxPercent = getPercentage(localValues.max);

  return (
    <div className="flex flex-col gap-3">
      {label && <label className="block text-[0.65rem] font-semibold text-[var(--fg-dim)] uppercase tracking-[0.1em]">{label}</label>}
      <div className="relative px-4 py-4 overflow-hidden">
        <div ref={trackRef} className="relative h-1 bg-[color-mix(in_srgb,var(--border-muted)_6%,transparent)] rounded-sm cursor-pointer">
          <div
            className="absolute inset-y-0 bg-gradient-to-r from-[var(--color-gold-300)] via-[var(--brand-primary)] to-[var(--color-gold-300)] rounded-xs shadow-[var(--shadow-gold)] transition-shadow duration-[var(--transition-fast)]"
            style={{
              left: `${minPercent}%`,
              width: `${maxPercent - minPercent}%`,
            }}
          />
          <div
            className={`group absolute top-1/2 w-5 h-5 -translate-x-1/2 -translate-y-1/2 cursor-grab z-10 transition-transform duration-[var(--transition-fast)] ${isDragging === 'min' ? 'cursor-grabbing' : ''}`}
            style={{ left: `${minPercent}%` }}
            onMouseDown={handleMouseDown('min')}
          >
            <span className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--color-gold-600)] rounded-full border-2 border-[color-mix(in_srgb,var(--border-muted)_20%,transparent)] shadow-[var(--shadow-md),var(--shadow-gold),inset_0_1px_0_color-mix(in_srgb,var(--border-muted)_30%,transparent)] transition-all duration-[var(--transition-fast)] group-hover:scale-110 group-hover:shadow-[0_4px_16px_color-mix(in_srgb,var(--shadow-lg)_50%,transparent),0_0_20px_var(--border-brand),inset_0_1px_0_color-mix(in_srgb,var(--border-muted)_40%,transparent)]" />
            <span className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 bg-[color-mix(in_srgb,var(--border-muted)_80%,transparent)] rounded-full shadow-[0_0_4px_var(--border-brand)]" />
            <div className={`absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 px-2 py-1 bg-[color-mix(in_srgb,var(--bg-elevated)_95%,transparent)] backdrop-blur-md border border-[var(--border-brand)] rounded-sm font-sans text-[0.7rem] font-semibold text-[var(--accent)] whitespace-nowrap transition-all duration-150 ${isDragging === 'min' ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'}`}>
              {formatValue(localValues.min)}
            </div>
          </div>
          <div
            className={`group absolute top-1/2 w-5 h-5 -translate-x-1/2 -translate-y-1/2 cursor-grab z-10 transition-transform duration-[var(--transition-fast)] ${isDragging === 'max' ? 'cursor-grabbing' : ''}`}
            style={{ left: `${maxPercent}%` }}
            onMouseDown={handleMouseDown('max')}
          >
            <span className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--color-gold-600)] rounded-full border-2 border-[color-mix(in_srgb,var(--border-muted)_20%,transparent)] shadow-[var(--shadow-md),var(--shadow-gold),inset_0_1px_0_color-mix(in_srgb,var(--border-muted)_30%,transparent)] transition-all duration-[var(--transition-fast)] group-hover:scale-110 group-hover:shadow-[0_4px_16px_color-mix(in_srgb,var(--shadow-lg)_50%,transparent),0_0_20px_var(--border-brand),inset_0_1px_0_color-mix(in_srgb,var(--border-muted)_40%,transparent)]" />
            <span className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 bg-[color-mix(in_srgb,var(--border-muted)_80%,transparent)] rounded-full shadow-[0_0_4px_var(--border-brand)]" />
            <div className={`absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 px-2 py-1 bg-[color-mix(in_srgb,var(--bg-elevated)_95%,transparent)] backdrop-blur-md border border-[var(--border-brand)] rounded-sm font-sans text-[0.7rem] font-semibold text-[var(--accent)] whitespace-nowrap transition-all duration-150 ${isDragging === 'max' ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'}`}>
              {formatValue(localValues.max)}
            </div>
          </div>
        </div>
      </div>
       <div className="flex justify-between items-center gap-2">
        <span className="font-sans text-sm font-medium text-[var(--fg-muted)] px-2 py-1 bg-[color-mix(in_srgb,var(--border-muted)_3%,transparent)] rounded-sm border border-[color-mix(in_srgb,var(--border-muted)_4%,transparent)] transition-all duration-200 hover:text-[var(--accent)] hover:bg-[var(--border-brand)] hover:border-[var(--border-brand)]">{formatValue(localValues.min)}</span>
        <span className="font-sans text-sm font-medium text-[var(--fg-muted)] px-2 py-1 bg-[color-mix(in_srgb,var(--border-muted)_3%,transparent)] rounded-sm border border-[color-mix(in_srgb,var(--border-muted)_4%,transparent)] transition-all duration-200 hover:text-[var(--accent)] hover:bg-[var(--border-brand)] hover:border-[var(--border-brand)]">{formatValue(localValues.max)}</span>
      </div>
    </div>
  );
}