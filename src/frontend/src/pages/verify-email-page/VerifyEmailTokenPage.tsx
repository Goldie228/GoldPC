import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { authService } from '../../api/authService';

/**
 * VerifyEmailTokenPage — Страница подтверждения email по токену из письма
 *
 * Открывается при клике по ссылке из письма: /verify-email/{token}
 * Состояния: загрузка → успех | ошибка
 *
 * Дизайн: тёмная тема в стиле GoldPC.
 */

type VerificationState = 'loading' | 'success' | 'error';

export function VerifyEmailTokenPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<VerificationState>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setState('error');
      setErrorMessage('Недействительная ссылка подтверждения.');
      return;
    }

    let cancelled = false;

    const verify = async () => {
      try {
        await authService.verifyEmail(token);
        if (!cancelled) {
          setState('success');
        }
      } catch (err) {
        if (!cancelled) {
          setState('error');
          setErrorMessage(
            'Ссылка для подтверждения email истекла или уже была использована. Запросите новую ссылку.'
          );
        }
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-canvas-dark flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Back link (only show on error) */}
        {state !== 'loading' && (
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-text text-sm no-underline transition-colors hover:text-body-text mb-8"
          >
            <ArrowLeft size={16} />
            <span>На главную</span>
          </Link>
        )}

        {/* Card */}
        <div className="bg-surface-card border border-hairline-dark rounded-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <span className="text-2xl font-bold text-gold tracking-tight">
              Gold<span className="text-body-text">PC</span>
            </span>
          </div>

          {/* Loading state */}
          {state === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 size={48} className="text-gold animate-spin" />
              <p className="text-body-text text-sm">Подтверждение email...</p>
            </div>
          )}

          {/* Success state */}
          {state === 'success' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-price-drop/10 flex items-center justify-center">
                <CheckCircle2 size={36} className="text-price-drop" />
              </div>
              <h1 className="text-title-sm text-body-text text-center">
                Email подтверждён!
              </h1>
              <p className="text-sm text-muted-text text-center leading-relaxed max-w-sm">
                Спасибо! Ваш email успешно подтверждён. Теперь вам доступны все
                возможности GoldPC.
              </p>
              <button
                onClick={handleGoHome}
                className="mt-4 inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-gold text-gold-ink font-sans text-sm font-semibold border-none rounded-md cursor-pointer transition-all duration-200 hover:bg-gold-active"
              >
                На главную
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* Error state */}
          {state === 'error' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-price-rise/10 flex items-center justify-center">
                <XCircle size={36} className="text-price-rise" />
              </div>
              <h1 className="text-title-sm text-body-text text-center">
                Ссылка недействительна
              </h1>
              <p className="text-sm text-muted-text text-center leading-relaxed max-w-sm">
                {errorMessage}
              </p>
              <Link
                to="/verify-email"
                className="mt-4 inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-gold text-gold-ink font-sans text-sm font-semibold border-none rounded-md cursor-pointer transition-all duration-200 hover:bg-gold-active no-underline"
              >
                Запросить новую ссылку
                <ArrowRight size={18} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyEmailTokenPage;
