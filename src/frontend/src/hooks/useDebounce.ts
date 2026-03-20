/**
 * Хук для debounce значения
 * Откладывает обновление значения до окончания ввода
 *
 * @param value - значение для debounce
 * @param delay - задержка в миллисекундах (по умолчанию 300ms)
 * @returns debounced значение
 */
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}