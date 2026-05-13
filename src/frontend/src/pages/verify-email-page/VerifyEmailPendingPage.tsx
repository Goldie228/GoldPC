import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Mail, RefreshCw, CircleCheckBig } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../api/authService';

/**
 * VerifyEmailPendingPage — Страница после регистрации
 *
 * Показывается сразу после успешной регистрации.
 * Сообщает пользователю, что на почту отправлена ссылка для подтверждения.
 * Позволяет переотправить письмо и проверить статус верификации.
 *
 * Дизайн: тёмная тема в стиле GoldPC (как RegisterPage).
 */

export function VerifyEmailPendingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const setUser = useAuthStore((state) => state.setUser);
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [emailSent, setEmailSent] = useState(true);

  // Если пользователь не авторизован — ничего не показываем
  if (!user && !authLoading) {
    return null;
  }

  // Если email уже подтверждён — редирект на главную
  useEffect(() => {
    if (user?.isEmailVerified) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleResend = async () => {
    setResending(true);
    setMessage(null);

    try {
      await authService.sendVerificationEmail();
      setMessage({ type: 'success', text: 'Письмо отправлено повторно. Проверьте почту.' });
      setEmailSent(true);
    } catch (err) {
      setMessage({ type: 'error', text: 'Не удалось отправить письмо. Попробуйте позже.' });
    } finally {
      setResending(false);
    }
  };

  const handleCheckVerified = async () => {
    setCheckingStatus(true);
    setMessage(null);

    try {
      // Подтягиваем свежие данные пользователя с сервера
      const freshUser = await authService.getCurrentUser();
      setUser(freshUser);

      if (freshUser.isEmailVerified) {
        navigate('/', { replace: true });
      } else {
        setMessage({
          type: 'error',
          text: 'Email ещё не подтверждён. Проверьте почту или нажмите «Отправить ещё раз».'
        });
      }
    } catch {
      setMessage({ type: 'error', text: 'Не удалось проверить статус. Попробуйте ещё раз.' });
    } finally {
      setCheckingStatus(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas-dark flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-text text-sm no-underline transition-colors hover:text-body-text mb-8"
        >
          <ArrowLeft size={16} />
          <span>На главную</span>
        </Link>

        {/* Card */}
        <div className="bg-surface-card border border-hairline-dark rounded-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <span className="text-2xl font-bold text-gold tracking-tight">
              Gold<span className="text-body-text">PC</span>
            </span>
          </div>

          {/* Email icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center">
              <Mail size={28} className="text-gold" />
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-title-sm text-body-text mb-2">
              Подтвердите email
            </h1>
            <p className="text-sm text-muted-text leading-relaxed">
              Мы отправили ссылку для подтверждения на{' '}
              <span className="text-gold font-medium">{user?.email}</span>
            </p>
          </div>

          {/* Status message */}
          {message && (
            <div
              className={`mb-6 p-4 text-sm rounded-lg flex items-start gap-3 ${
                message.type === 'success'
                  ? 'bg-price-drop/10 border border-price-drop/30 text-price-drop'
                  : 'bg-price-rise/10 border border-price-rise/30 text-price-rise'
              }`}
              role="alert"
            >
              <span>{message.text}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {/* Resend button */}
            <button
              onClick={handleResend}
              disabled={resending || authLoading}
              className="inline-flex items-center justify-center gap-2.5 w-full px-6 py-3 bg-gold text-gold-ink font-sans text-sm font-semibold border-none rounded-md cursor-pointer transition-all duration-200 hover:not(:disabled):bg-gold-active disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {resending ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Отправка...
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  Отправить ещё раз
                </>
              )}
            </button>

            {/* I confirmed button */}
            <button
              onClick={handleCheckVerified}
              disabled={checkingStatus || authLoading}
              className="inline-flex items-center justify-center gap-2.5 w-full px-6 py-3 bg-surface-elevated text-body-text font-sans text-sm font-semibold border border-hairline-dark rounded-md cursor-pointer transition-all duration-200 hover:not(:disabled):bg-surface-card disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {checkingStatus ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Проверка...
                </>
              ) : (
                <>
                  <CircleCheckBig size={18} />
                  Я подтвердил
                </>
              )}
            </button>
          </div>

          {/* Tips */}
          <div className="mt-8 p-4 bg-surface-elevated rounded-lg border border-hairline-dark">
            <h2 className="text-xs font-medium text-muted-text uppercase tracking-wider mb-3">
              Не пришло письмо?
            </h2>
            <ul className="text-sm text-muted-text space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-gold mt-0.5">•</span>
                <span>Проверьте папку «Спам» или «Промоакции»</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold mt-0.5">•</span>
                <span>Убедитесь, что адрес <strong className="text-body-text">{user?.email}</strong> указан верно</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold mt-0.5">•</span>
                <span>
                  Если письмо так и не пришло, нажмите «Отправить ещё раз»
                </span>
              </li>
            </ul>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-hairline-dark" />
            <span className="text-[10px] text-muted-text uppercase tracking-wider">или</span>
            <div className="flex-1 h-px bg-hairline-dark" />
          </div>

          {/* Back to home */}
          <div className="text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-gold no-underline font-medium text-sm transition-colors hover:text-gold-active"
            >
              Вернуться на главную
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmailPendingPage;
