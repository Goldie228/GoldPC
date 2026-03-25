import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Header } from '../Header';
import { Footer } from '../Footer';
import { ToastContainer } from '../../ui/Toast';
import { ScrollToTop } from '../../ui';
import './MainLayout.css';

/**
 * MainLayout Component
 *
 * Структура:
 * - Header (навигация)
 * - main (контент страниц через Outlet, лёгкий cross-fade при смене маршрута)
 * - Footer (подвал)
 */
export function MainLayout() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  return (
    <div className="main-layout">
      <a href="#main-content" className="main-layout__skip">
        Перейти к основному контенту
      </a>
      <Header />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={location.pathname}
          id="main-content"
          className="main-layout__content"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{
            duration: reduceMotion ? 0 : 0.2,
            ease: [0.33, 1, 0.68, 1],
          }}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <Footer />
      <ToastContainer />
      <ScrollToTop threshold={300} />
    </div>
  );
}
