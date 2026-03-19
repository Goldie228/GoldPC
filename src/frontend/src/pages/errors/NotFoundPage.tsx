import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import './NotFoundPage.css';

/**
 * NotFoundPage Component
 * 
 * A 404 error page displayed when a route is not found.
 * Features:
 * - Large "404" text in Gold (accent color) with Space Grotesk font
 * - Russian text: "Страница не найдена"
 * - "На главную" button to navigate back to the home page
 * - Centered layout with background pattern
 * 
 * @example
 * // In router configuration
 * <Route path="*" element={<NotFoundPage />} />
 */
export function NotFoundPage() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoToCatalog = () => {
    navigate('/catalog');
  };

  return (
    <div className="not-found">
      <div className="not-found__bg-pattern" />
      <div className="not-found__container">
        <div className="not-found__code">404</div>
        <h1 className="not-found__title">Страница не найдена</h1>
        <p className="not-found__message">
          Кажется, запрашиваемая страница была перемещена или больше не существует.
          Проверьте URL или вернитесь на главную.
        </p>
        <div className="not-found__actions">
          <Button variant="primary" onClick={handleGoHome}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="not-found__btn-icon">
              <line x1="3" y1="12" x2="21" y2="12" />
              <polyline points="9 18 3 12 9 6" />
            </svg>
            На главную
          </Button>
          <Button variant="ghost" onClick={handleGoToCatalog}>
            Каталог
          </Button>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;