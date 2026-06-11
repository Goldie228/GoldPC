import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { X, RefreshCw, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { authService, getAuthErrorMessage } from '@/api/authService';

/**
 * EmailVerificationBanner — глобальный баннер для неверифицированных пользователей.
 *
 * Показывается на всех страницах, если пользователь авторизован,
 * но email не подтверждён. Можно скрыть (до перезагрузки страницы).
 */

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = useCallback(async () => {
    // Не отправляем если нет токена — пользователь не fully аутентифицирован
    const token = localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken');
    if (!token) {
      setError('Требуется повторный вход в аккаунт');
      return;
    }

    setResending(true);
    setError(null);
    try {
      await authService.sendVerificationEmail();
      setSent(true);
    } catch (err) {
      const msg = getAuthErrorMessage(err);
      setError(msg);
    } finally {
      setResending(false);
    }
  }, []);

  // Не показываем если:
  // - пользователь не авторизован
  // - email уже подтверждён
  // - баннер был скрыт в этой сессии
  if (!user || user.isEmailVerified || dismissed) {
    return null;
  }

  return (
    <div className="w-full bg-gold/5 border-b border-gold/20" role="alert">
      <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col gap-2">
        {/* Main row */}
        <div className="flex items-center justify-between gap-4">
          {/* Content */}
          <div className="flex items-center gap-3 min-w-0">
            <Mail size={16} className="text-gold shrink-0" />
            <p className="text-sm text-body-text truncate">
              {sent
                ? 'Письмо отправлено повторно! Проверьте почту.'
                : error
                  ? 'Не удалось отправить письмо.'
                  : 'Подтвердите ваш email, чтобы пользоваться всеми возможностями GoldPC.'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {!sent ? (
              <button
                onClick={() => void handleResend()}
                disabled={resending}
                className="flex items-center gap-1.5 text-xs font-medium text-gold hover:text-gold-active transition-colors disabled:opacity-50 bg-transparent border-none cursor-pointer whitespace-nowrap"
              >
                <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
                {resending ? 'Отправка...' : 'Отправить ещё раз'}
              </button>
            ) : (
              <Link
                to="/verify-email"
                className="flex items-center gap-1.5 text-xs font-medium text-gold hover:text-gold-active transition-colors whitespace-nowrap no-underline"
              >
                <Mail size={14} />
                Страница подтверждения
              </Link>
            )}

            {/* Dismiss */}
            <button
              onClick={() => setDismissed(true)}
              className="text-muted-text hover:text-body-text transition-colors bg-transparent border-none cursor-pointer p-1"
              aria-label="Закрыть"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 text-xs text-price-rise">
            <AlertCircle size={12} />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmailVerificationBanner;
