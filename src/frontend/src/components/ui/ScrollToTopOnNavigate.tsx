import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Автоматический скролл наверх при смене маршрута
 */
export function ScrollToTopOnNavigate() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
