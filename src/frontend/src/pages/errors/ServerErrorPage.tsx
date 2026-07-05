import { useNavigate } from 'react-router-dom';
import { RotateCw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * ServerErrorPage Компонент
 *
 * A 500 error страница displayed when a server error occurs.
 */
export function ServerErrorPage() {
  const navigate = useNavigate();

  const handleRetry = () => {
    void navigate(0);
  };

  const handleGoHome = () => {
    void navigate('/');
  };

  const errorId = `ERR_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4">
      <div className="bg-surface-card border border-hairline-dark rounded-xl p-8 md:p-12 max-w-[480px] w-full text-center">
        <div className="flex justify-center mb-6 text-red-400" aria-hidden="true">
          <XCircle size={56} />
        </div>

        <h1 className="text-display-sm md:text-display-md font-bold text-body-text mb-4">
          Произошла ошибка
        </h1>
        <p className="text-base text-muted-text mb-6 leading-relaxed">
          Что-то пошло не так при обработке вашего запроса.
          Пожалуйста, попробуйте позже или обратитесь в службу поддержки.
        </p>

        <div className="text-xs text-muted-text font-mono mb-8 px-4 py-2 bg-surface-elevated rounded-md inline-block">
          Error ID: {errorId}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="primary" onClick={handleRetry}>
            <RotateCw className="w-4 h-4" />
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
