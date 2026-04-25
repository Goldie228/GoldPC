import { useNavigate } from 'react-router-dom';
import { RotateCw, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import styles from "./ServerErrorPage.module.css";

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
          <XCircle size={48} />
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
            <RotateCw className="server-error__btn-icon" />
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