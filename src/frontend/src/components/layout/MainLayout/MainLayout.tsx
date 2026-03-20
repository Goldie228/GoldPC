import { Outlet } from 'react-router-dom';
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
 * - main (контент страниц через Outlet)
 * - Footer (подвал)
 * 
 * main имеет min-height для прижатия footer вниз
 */
export function MainLayout() {
  return (
    <div className="main-layout">
      <Header />
      <main className="main-layout__content">
        <Outlet />
      </main>
      <Footer />
      <ToastContainer />
      <ScrollToTop threshold={300} />
    </div>
  );
}
