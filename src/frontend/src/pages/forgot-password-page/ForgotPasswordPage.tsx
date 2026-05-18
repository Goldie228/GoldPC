/**
 * ForgotPasswordPage — Страница восстановления пароля
 *
 * Пользователь вводит email, на который приходит ссылка для сброса пароля.
 * Дизайн: тёмная тема в стиле GoldPC (DESIGN.md), bg-canvas-dark, gold-акценты.
 */

import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { authService } from '@/api/authService';
import { getAuthErrorMessage } from '@/api/authService';

type PageState = 'form' | 'loading' | 'success' | 'error';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [pageState, setPageState] = useState<PageState>('form');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validateEmail = (value: string): string => {
    if (!value) return 'Введите email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Введите корректный email адрес';
    return '';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationError = validateEmail(email);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setPageState('loading');
    setErrorMessage(null);

    try {
      await authService.forgotPassword({ email });
      setPageState('success');
    } catch (error) {
      setPageState('error');
      setErrorMessage(getAuthErrorMessage(error));
    }
  };

  return (
    <div className="min-h-screen bg-canvas-dark flex flex-col items-center justify-center px-4 py-12">
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
              Восстановление пароля
            </h1>
            <p className="text-sm text-muted-text leading-relaxed">
              Введите email, привязанный к вашей учётной записи. Мы отправим ссылку для сброса пароля.
            </p>
          </div>

          {/* Success State */}
          {pageState === 'success' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-price-drop/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-price-drop" />
              </div>
              <h2 className="text-title-sm text-body-text mb-3">
                Письмо отправлено
              </h2>
              <p className="text-sm text-muted-text leading-relaxed mb-6">
                Если аккаунт с email <strong className="text-body-text">{email}</strong> существует,
                вы получите письмо с инструкцией по восстановлению пароля.
              </p>
              <p className="text-xs text-muted-strong leading-relaxed mb-6">
                Письмо может прийти в течение нескольких минут. Проверьте папку «Спам», если не видите его во «Входящих».
              </p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  className="w-full px-4 py-2.5 bg-gold text-gold-ink rounded-md text-sm font-semibold cursor-pointer transition-colors hover:bg-gold-active border-none"
                  onClick={() => {
                    setPageState('form');
                    setEmail('');
                  }}
                >
                  Отправить ещё раз
                </button>
                <Link
                  to="/"
                  className="w-full px-4 py-2.5 bg-transparent border border-hairline-dark rounded-md text-body-text text-sm font-semibold text-center no-underline cursor-pointer transition-colors hover:border-gold/40 hover:bg-gold/5"
                >
                  Вернуться на главную
                </Link>
              </div>
            </div>
          )}

          {/* Error State */}
          {pageState === 'error' && errorMessage && (
            <div className="mb-6 p-4 bg-price-rise/10 border border-price-rise/30 text-price-rise text-sm rounded-lg flex items-start gap-3" role="alert">
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          {(pageState === 'form' || pageState === 'loading' || pageState === 'error') && (
            <form className="flex flex-col gap-5" onSubmit={(e) => void handleSubmit(e)}>
              {/* Error message */}
              {pageState === 'error' && !errorMessage && (
                <div className="p-3 bg-price-rise/10 border border-price-rise/30 text-price-rise text-sm rounded-md" role="alert">
                  Произошла ошибка. Попробуйте позже.
                </div>
              )}

              {/* Email field */}
              <div className="flex flex-col gap-2">
                <label
                  className="text-xs font-medium text-muted-text uppercase tracking-wider"
                  htmlFor="forgot-email"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text"
                  />
                  <input
                    id="forgot-email"
                    type="email"
                    className="w-full pl-10 pr-3.5 py-3 bg-surface-elevated border border-hairline-dark text-body-text text-sm rounded-lg transition-all duration-200 focus:outline-none focus:border-gold/50 focus:bg-surface-card hover:not(:focus):border-gold/20 placeholder:text-muted-text/50"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    required
                    autoComplete="email"
                    disabled={pageState === 'loading'}
                  />
                </div>
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
                    <span>Отправка...</span>
                  </>
                ) : (
                  'Отправить ссылку'
                )}
              </button>

              {/* Back to login */}
              <div className="text-center">
                <span className="text-sm text-muted-text mr-1">
                  Вспомнили пароль?
                </span>
                <Link
                  to="/"
                  className="text-sm text-gold no-underline transition-colors hover:text-gold-active font-medium"
                >
                  Войти
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
