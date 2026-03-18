import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import './NotFoundPage.css';

/**
 * NotFoundPage Component
 * 
 * A 404 error page displayed when a route is not found.
 * Features:
 * - Large "404" text in Gold (accent color)
 * - User-friendly message
 * - "Go Home" button to navigate back to the home page
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

  return (
    <div className="not-found">
      <div className="not-found__container">
        <div className="not-found__code">404</div>
        <h1 className="not-found__title">Page Not Found</h1>
        <p className="not-found__message">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>
        <Button variant="primary" onClick={handleGoHome}>
          Go Home
        </Button>
      </div>
    </div>
  );
}

export default NotFoundPage;