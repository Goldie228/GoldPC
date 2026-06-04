/**
 * Хук для отслеживания медиа-запроса
 * Использует window.matchMedia для реактивного отслеживания состояния
 *
 * @param query - CSS медиа-запрос (например, '(max-width: 767px)')
 * @returns boolean - соответствует ли запрос текущему размеру экрана
 */
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
