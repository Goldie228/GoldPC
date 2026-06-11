import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import './ErrorBoundary.css';

/**
 * Пропсы компонента ErrorBoundary
 */
interface ErrorBoundaryProps {
  /** Дочерние элементы для отображения при отсутствии ошибки */
  children: ReactNode;
  /** Необязательный запасной UI */
  fallback?: ReactNode;
}

/**
 * Состояние компонента ErrorBoundary
 */
interface ErrorBoundaryState {
  /** Была ли поймана ошибка */
  hasError: boolean;
  /** Пойманная ошибка */
  error: Error | null;
}

/**
 * Компонент ErrorBoundary
 * 
 * Классовый компонент, который перехватывает ошибки JavaScript в дочерних
 * компонентах, логирует их и отображает запасной UI.
 * 
 * Особенности:
 * - Перехватывает ошибки рендеринга, в жизненном цикле и в конструкторах
 * - Предоставляет дружелюбный запасной UI
 * - Включает кнопку "Перезагрузить" для восстановления после ошибки
 * 
 * @example
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  /**
   * Статический метод жизненного цикла, вызываемый при выбросе ошибки в дочернем компоненте
   * Обновляет состояние для отрисовки запасного UI
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Метод жизненного цикла, вызываемый после выброса ошибки дочерним компонентом
   * Используется для логирования информации об ошибке
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Логируем ошибку в консоль в режиме разработки
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error Info:', errorInfo.componentStack);
    
    // В продакшене можно отправлять в сервис сбора ошибок
    // Пример: logErrorToService(error, errorInfo);
  }

  /**
   * Обработчик кнопки перезагрузки
   * Сбрасывает состояние ошибки и перезагружает страницу
   */
  handleReload = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
    window.location.reload();
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Используем пользовательский запасной UI если предоставлен
      if (fallback) {
        return fallback;
      }

      // Запасной UI по умолчанию
      return (
        <div className="error-boundary">
          <div className="error-boundary__container">
            <div className="error-boundary__icon">
              <AlertCircle size={48} />
            </div>
            <h1 className="error-boundary__title">Something went wrong</h1>
            <p className="error-boundary__message">
              We're sorry, but something unexpected happened. Please try reloading the page.
            </p>
            {error && import.meta.env.DEV && (
              <details className="error-boundary__details">
                <summary>Error Details</summary>
                <pre>{error.message}</pre>
                <pre>{error.stack}</pre>
              </details>
            )}
            <Button variant="primary" onClick={this.handleReload}>
              Reload
            </Button>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;