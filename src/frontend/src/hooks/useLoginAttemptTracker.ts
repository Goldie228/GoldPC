/**
 * useLoginAttemptTracker - Хук для защиты от брутфорс атак
 * Реализует экспоненциальную задержку после неудачных попыток входа
 */
import { useState, useCallback, useEffect } from 'react';

interface LoginAttemptTracker {
  /** Количество неудачных попыток входа */
  attempts: number;
  /** Время до которого заблокированы попытки входа (timestamp) */
  lockoutUntil: number | null;
  /** Оставшееся время блокировки в секундах */
  remainingLockoutSeconds: number;
  /** Флаг - заблокированы ли сейчас попытки входа */
  isLocked: boolean;
  /** Зарегистрировать неудачную попытку входа */
  recordFailedAttempt: () => void;
  /** Сбросить счетчик попыток (после успешного входа) */
  resetAttempts: () => void;
}

export const useLoginAttemptTracker = (): LoginAttemptTracker => {
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  /**
   * Рассчитываем длительность блокировки по экспоненциальной шкале
   * Попытка 3: 2 секунды
   * Попытка 4: 4 секунды
   * Попытка 5: 8 секунды
   * Попытка 6: 16 секунды
   * и т.д.
   */
  const calculateLockoutDuration = (failedAttempts: number): number => {
    if (failedAttempts < 3) return 0;
    return Math.pow(2, failedAttempts - 3) * 1000;
  };

  const recordFailedAttempt = useCallback(() => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    const lockoutDuration = calculateLockoutDuration(newAttempts);
    if (lockoutDuration > 0) {
      setLockoutUntil(Date.now() + lockoutDuration);
    }
  }, [attempts]);

  const resetAttempts = useCallback(() => {
    setAttempts(0);
    setLockoutUntil(null);
    setRemainingSeconds(0);
  }, []);

  // Обновляем оставшееся время блокировки каждую секунду
  useEffect(() => {
    if (!lockoutUntil) {
      setRemainingSeconds(0);
      return;
    }

    const updateRemainingTime = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((lockoutUntil - now) / 1000));
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        setLockoutUntil(null);
      }
    };

    updateRemainingTime();
    const interval = setInterval(updateRemainingTime, 1000);

    return () => clearInterval(interval);
  }, [lockoutUntil]);

  return {
    attempts,
    lockoutUntil,
    remainingLockoutSeconds: remainingSeconds,
    isLocked: lockoutUntil !== null && Date.now() < lockoutUntil,
    recordFailedAttempt,
    resetAttempts
  };
};

export default useLoginAttemptTracker;
