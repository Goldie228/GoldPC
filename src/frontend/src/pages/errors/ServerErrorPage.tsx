import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import './ServerErrorPage.css';

/**
 * ServerErrorPage Component
 * 
 * A 500 error page displayed when a server error occurs.
 * Features:
 * - Error icon with red accent
 * - "500 Internal Error" message
 * - "Повторить" (Retry) button
 * - Error ID for support reference
 * 
 * @example
 * // Can be used in ErrorBoundary or as a route
 * <Route path="/500" element={<ServerErrorPage />} />
 */
export function ServerErrorPage() {
  const navigate = useNavigate();

  const handleRetry = () => {
    // Navigate to the same page to retry
    navigate(0);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  // Generate a simple error ID for support reference
  const errorId = `ERR_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

  return (
    <div className="server-error">
      <div className="server-error__card">
        <div className="server-error__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h1 className="server-error__title">Произошла ошибка</h1>
        <p className="server-error__message">
          Что-то пошло не так при обработке вашего запроса.
          Пожалуйста, попробуйте позже или обратитесь в службу поддержки.
        </p>
        <div className="server-error__code">
          Error ID: {errorId}
        </div>
        <div className="server-error__actions">
          <Button variant="primary" onClick={handleRetry}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="server-error__btn-icon">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Повторить
          </Button>
          <Button variant="ghost" onClick={handleGoHome}>
            На главную
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ServerErrorPage;