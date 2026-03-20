import { useState, useRef, useCallback, useEffect } from 'react';
import styles from './RangeSlider.module.css';

interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: { min: number; max: number };
  onChange: (value: { min: number; max: number }) => void;
  formatValue?: (value: number) => string;
  label?: string;
}

export function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
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
        onChange(updated);
      } else {
        const newMax = Math.max(clampedValue, localValues.min + step);
        const updated = { ...localValues, max: newMax };
        setLocalValues(updated);
        onChange(updated);
      }
    },
    [isDragging, getValueFromPosition, localValues, min, max, step, onChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

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
    <div className={styles.rangeSlider}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.trackContainer}>
        <div ref={trackRef} className={styles.track}>
          <div
            className={styles.trackFill}
            style={{
              left: `${minPercent}%`,
              width: `${maxPercent - minPercent}%`,
            }}
          />
          <div
            className={`${styles.thumb} ${styles.thumbMin} ${isDragging === 'min' ? styles.active : ''}`}
            style={{ left: `${minPercent}%` }}
            onMouseDown={handleMouseDown('min')}
          >
            <div className={styles.thumbTooltip}>
              {formatValue(localValues.min)}
            </div>
          </div>
          <div
            className={`${styles.thumb} ${styles.thumbMax} ${isDragging === 'max' ? styles.active : ''}`}
            style={{ left: `${maxPercent}%` }}
            onMouseDown={handleMouseDown('max')}
          >
            <div className={styles.thumbTooltip}>
              {formatValue(localValues.max)}
            </div>
          </div>
        </div>
      </div>
      <div className={styles.values}>
        <span className={styles.valueMin}>{formatValue(localValues.min)}</span>
        <span className={styles.valueMax}>{formatValue(localValues.max)}</span>
      </div>
    </div>
  );
}