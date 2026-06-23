import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Header } from '../header/Header';
import { Footer } from '../footer/Footer';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
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
      <main
          id="main-content"
          className="main-layout__content pt-0 pb-0"
        >
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
      </main>
      <Footer />
      <ToastContainer />
      <ScrollToTop threshold={300} />
    </div>
  );
}
