import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Header } from '../header/Header';
import { Footer } from '../footer/Footer';
import { EmailVerificationBanner } from '@/components/email-verification/EmailVerificationBanner';
import { ToastContainer } from '@/components/ui/Toast';
import { ScrollToTop } from '@/components/ui';
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
    <div className="main-layout overflow-x-hidden">
      <a href="#main-content" className="main-layout__skip">
        Перейти к основному контенту
      </a>
      <Header />
      <EmailVerificationBanner />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          id="main-content"
          className="main-layout__content pt-0 pb-0"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -20 }}
          transition={{
            duration: reduceMotion ? 0 : 0.25,
            ease: [0.33, 1, 0.68, 1] as const,
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
