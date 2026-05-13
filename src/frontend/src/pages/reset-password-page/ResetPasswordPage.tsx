/**
 * ResetPasswordPage — Страница сброса пароля по токену из email
 *
 * Принимает токен из URL (/reset-password/:token), показывает форму нового пароля.
 * Дизайн: тёмная тема в стиле GoldPC (DESIGN.md).
 */

import { useState, useMemo, useEffect, type FormEvent } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, CheckCircle, AlertCircle, Lock, RefreshCw, Clock } from 'lucide-react';
import { authService } from '@/api/authService';
import { getAuthErrorMessage } from '@/api/authService';

type PageState = 'checking' | 'form' | 'loading' | 'success' | 'error' | 'expired';

/** Оценка сложности пароля */
function evaluatePasswordStrength(password: string): {
  score: 0 | 1 | 2 | 3;
  label: string;
  color: string;
  barColor: string;
} {
  if (!password) return { score: 0, label: '', color: '', barColor: '' };

  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;

  if (score <= 1) return { score: 0, label: 'Слабый', color: '#f6465d', barColor: 'bg-price-rise' };
  if (score === 2) return { score: 1, label: 'Средний', color: '#fcd535', barColor: 'bg-gold' };
  if (score === 3) return { score: 2, label: 'Надёжный', color: '#0ecb81', barColor: 'bg-price-drop' };
  return { score: 3, label: 'Надёжный', color: '#0ecb81', barColor: 'bg-price-drop' };
}

/** Проверки пароля */
function validatePassword(password: string, confirmPassword: string): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!password) {
    errors.password = 'Введите пароль';
  } else if (password.length < 8) {
    errors.password = 'Пароль должен содержать минимум 8 символов';
  } else if (password.length > 128) {
    errors.password = 'Пароль не должен превышать 128 символов';
  }

  if (password !== confirmPassword) {
    errors.confirmPassword = 'Пароли не совпадают';
  }

  return errors;
}

export function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pageState, setPageState] = useState<PageState>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const strength = useMemo(() => evaluatePasswordStrength(password), [password]);

  // При загрузке страницы — проверяем токен на бэкенде
  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    (async () => {
      try {
        await authService.validateResetToken(token);
        if (!cancelled) setPageState('form');
      } catch {
        if (!cancelled) setPageState('expired');
      }
    })();

    return () => { cancelled = true; };
  }, [token]);

  // Если токена нет — показываем ошибку
  if (!token) {
    return (
      <div className="min-h-screen bg-canvas-dark flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-surface-card border border-hairline-dark rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-price-rise/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-price-rise" />
            </div>
            <h1 className="text-title-sm text-body-text mb-3">Недействительная ссылка</h1>
            <p className="text-sm text-muted-text mb-6">
              Ссылка для восстановления пароля недействительна. Пожалуйста, запросите восстановление пароля заново.
            </p>
            <Link
              to="/forgot-password"
              className="inline-block px-6 py-2.5 bg-gold text-gold-ink rounded-md text-sm font-semibold no-underline transition-colors hover:bg-gold-active"
            >
              Восстановить пароль
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const errors = validatePassword(password, confirmPassword);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setPageState('loading');

    try {
      await authService.resetPassword({ token, password });
      setPageState('success');
    } catch (error) {
      const message = getAuthErrorMessage(error);
      // Если токен истёк/недействителен — показываем отдельный экран
      if (/истекл|недействительн|устаревш/i.test(message)) {
        setPageState('expired');
      } else {
        setPageState('error');
        setErrorMessage(message);
      }
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
            <h1 className="text-title-sm text-body-text mt-4 mb-2">
              Новый пароль
            </h1>
            <p className="text-sm text-muted-text leading-relaxed">
              Придумайте новый пароль для вашей учётной записи.
            </p>
          </div>

          {/* Checking State — пока проверяем токен на бэкенде */}
          {pageState === 'checking' && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-10 h-10 border-2 border-transparent border-t-gold rounded-full animate-spin mb-4" />
              <p className="text-sm text-muted-text">Проверка ссылки...</p>
            </div>
          )}

          {/* Success State */}
          {pageState === 'success' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-price-drop/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-price-drop" />
              </div>
              <h2 className="text-title-sm text-body-text mb-3">
                Пароль изменён!
              </h2>
              <p className="text-sm text-muted-text leading-relaxed mb-6">
                Ваш пароль успешно обновлён. Теперь вы можете войти в аккаунт с новым паролем.
              </p>
              <Link
                to="/"
                className="inline-block w-full px-4 py-2.5 bg-gold text-gold-ink rounded-md text-sm font-semibold text-center no-underline cursor-pointer transition-colors hover:bg-gold-active"
                onClick={() => navigate('/')}
              >
                Войти в аккаунт
              </Link>
            </div>
          )}

          {/* Expired State — ссылка устарела или уже использована */}
          {pageState === 'expired' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock size={32} className="text-gold" />
              </div>
              <h2 className="text-title-sm text-body-text mb-3">
                Срок действия ссылки истёк
              </h2>
              <p className="text-sm text-muted-text leading-relaxed mb-2">
                Ссылка для восстановления пароля больше недействительна.
              </p>
              <p className="text-sm text-muted-text leading-relaxed mb-6">
                Возможно, она уже была использована, или срок её действия истёк.
                Запросите новую ссылку — старые автоматически аннулируются.
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  to="/forgot-password"
                  className="w-full px-4 py-2.5 bg-gold text-gold-ink rounded-md text-sm font-semibold no-underline text-center cursor-pointer transition-colors hover:bg-gold-active inline-flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} />
                  Запросить новую ссылку
                </Link>
                <Link
                  to="/"
                  className="w-full px-4 py-2.5 bg-transparent border border-hairline-dark rounded-md text-body-text text-sm font-semibold text-center no-underline cursor-pointer transition-colors hover:border-gold/40 hover:bg-gold/5"
                >
                  Вернуться на главную
                </Link>
              </div>
            </div>
          )}

          {/* Error banner — для прочих ошибок (не expired) */}
          {pageState === 'error' && errorMessage && (
            <div className="mb-6 p-4 bg-price-rise/10 border border-price-rise/30 text-price-rise text-sm rounded-lg flex items-start gap-3" role="alert">
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          {(pageState === 'form' || pageState === 'loading' || pageState === 'error') && (
            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              {/* Password field */}
              <div className="flex flex-col gap-2">
                <label
                  className="text-xs font-medium text-muted-text uppercase tracking-wider"
                  htmlFor="reset-password"
                >
                  Новый пароль
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text z-10"
                  />
                  <input
                    id="reset-password"
                    type={showPassword ? 'text' : 'password'}
                    className={`w-full pl-10 pr-10 py-3 bg-surface-elevated border text-body-text text-sm rounded-lg transition-all duration-200 focus:outline-none focus:border-gold/50 focus:bg-surface-card hover:not(:focus):border-gold/20 placeholder:text-muted-text/50 ${
                      fieldErrors.password ? 'border-price-rise' : 'border-hairline-dark'
                    }`}
                    placeholder="Минимум 8 символов"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) {
                        setFieldErrors((prev) => ({ ...prev, password: '' }));
                      }
                    }}
                    required
                    autoComplete="new-password"
                    disabled={pageState === 'loading'}
                    aria-invalid={!!fieldErrors.password}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text cursor-pointer bg-transparent border-none p-0 hover:text-body-text transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password strength indicator */}
                {password && (
                  <div className="mt-2">
                    <div className="h-1 bg-surface-elevated rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          strength.barColor
                        }`}
                        style={{
                          width: `${((strength.score + 1) / 4) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs mt-1" style={{ color: strength.color }}>
                      {strength.label}
                    </p>
                  </div>
                )}

                {fieldErrors.password && (
                  <span className="text-xs text-price-rise mt-1" role="alert">
                    {fieldErrors.password}
                  </span>
                )}
              </div>

              {/* Confirm password field */}
              <div className="flex flex-col gap-2">
                <label
                  className="text-xs font-medium text-muted-text uppercase tracking-wider"
                  htmlFor="reset-confirm-password"
                >
                  Подтвердите пароль
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text z-10"
                  />
                  <input
                    id="reset-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    className={`w-full pl-10 pr-3.5 py-3 bg-surface-elevated border text-body-text text-sm rounded-lg transition-all duration-200 focus:outline-none focus:border-gold/50 focus:bg-surface-card hover:not(:focus):border-gold/20 placeholder:text-muted-text/50 ${
                      fieldErrors.confirmPassword ? 'border-price-rise' : 'border-hairline-dark'
                    }`}
                    placeholder="Повторите пароль"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword) {
                        setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                      }
                    }}
                    required
                    autoComplete="new-password"
                    disabled={pageState === 'loading'}
                    aria-invalid={!!fieldErrors.confirmPassword}
                  />
                </div>
                {fieldErrors.confirmPassword && (
                  <span className="text-xs text-price-rise mt-1" role="alert">
                    {fieldErrors.confirmPassword}
                  </span>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full px-4 py-3 bg-gold text-gold-ink rounded-md text-sm font-semibold cursor-pointer transition-all duration-200 hover:bg-gold-active disabled:opacity-60 disabled:cursor-not-allowed border-none flex items-center justify-center gap-2"
                disabled={pageState === 'loading'}
                aria-busy={pageState === 'loading'}
              >
                {pageState === 'loading' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-transparent border-t-gold-ink rounded-full animate-spin" />
                    <span>Сохранение...</span>
                  </>
                ) : (
                  'Сохранить новый пароль'
                )}
              </button>

              {/* Back to login */}
              <div className="text-center">
                <Link
                  to="/"
                  className="text-sm text-gold no-underline transition-colors hover:text-gold-active font-medium"
                >
                  Вернуться ко входу
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
