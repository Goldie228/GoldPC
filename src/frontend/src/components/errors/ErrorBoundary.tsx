import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import './ErrorBoundary.css';

/**
 * Props for ErrorBoundary component
 */
interface ErrorBoundaryProps {
  /** Children to render when there's no error */
  children: ReactNode;
  /** Optional fallback UI */
  fallback?: ReactNode;
}

/**
 * State for ErrorBoundary component
 */
interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The error that was caught */
  error: Error | null;
}

/**
 * ErrorBoundary Component
 * 
 * A class component that catches JavaScript errors anywhere in the child
 * component tree, logs those errors, and displays a fallback UI.
 * 
 * Features:
 * - Catches errors during rendering, in lifecycle methods, and in constructors
 * - Provides a user-friendly fallback UI
 * - Includes a "Reload" button to recover from the error
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
   * Static lifecycle method called when an error is thrown in a descendant component
   * Updates the state to trigger a fallback UI render
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Lifecycle method called after an error has been thrown by a descendant component
   * Used for logging error information
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error Info:', errorInfo.componentStack);
    
    // In production, you might want to log to an error reporting service
    // Example: logErrorToService(error, errorInfo);
  }

  /**
   * Handler for the reload button
   * Resets the error state and reloads the page
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
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default fallback UI
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