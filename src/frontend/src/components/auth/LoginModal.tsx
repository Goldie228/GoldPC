/**
 * LoginModal - Модальное окно авторизации
 * 
 * Features:
 * - Email и Password поля
 * - Checkbox "Запомнить меня"
 * - Ссылка "Забыли пароль?"
 * - Ссылка на регистрацию
 * - Использует Modal компонент
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { AuthModalBase } from './AuthModalBase';
import { PasswordField } from '@/components/ui/PasswordField';
import { useAuth } from '@/hooks/useAuth';
import { useAuthModal } from '@/hooks/useAuthModal';
import { getAuthErrorMessage } from '@/api/authService';

export interface LoginModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login, isLoading } = useAuth();
  const { switchAuthModal } = useAuthModal();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) return 'Email не может быть пустым';
    if (!emailRegex.test(value)) return 'Введите корректный email адрес';
    return '';
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    const err = validateEmail(value);
    setFieldErrors(prev => ({ ...prev, email: err }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Client-side validation
    const emailError = validateEmail(email);
    if (emailError || !password) {
      setFieldErrors({
        email: emailError,
        password: !password ? 'Пароль не может быть пустым' : ''
      });
      return;
    }

    try {
      await login({ email, password }, remember);
      onClose();
      // Reset form
      setEmail('');
      setPassword('');
      setRemember(false);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    }
  };

  const handleSwitchToRegister = () => {
    switchAuthModal('register');
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <AuthModalBase
      isOpen={isOpen}
      onClose={handleClose}
      title="Вход в аккаунт"
      size="small"
      switchLink={{
        text: 'Нет аккаунта?',
        actionText: 'Зарегистрироваться',
        onClick: handleSwitchToRegister
      }}
    >
      <form className="flex flex-col gap-5" onSubmit={(e) => void handleSubmit(e)}>
        {error && (
          <div className="p-3 bg-price-rise/10 border border-price-rise/30 text-price-rise text-sm rounded-md" role="alert">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-text uppercase tracking-wider" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            className={`w-full p-3.5 bg-surface-elevated border text-body-text font-sans text-sm rounded-lg transition-all duration-200 focus:outline-none focus:border-gold focus:bg-surface-card hover:not(:focus):border-gold/20 placeholder:text-muted-text/50 ${
              fieldErrors.email
                ? 'border-price-rise outline outline-1 outline-price-rise/30'
                : 'border-hairline-dark'
            }`}
            placeholder="your@email.com"
            value={email}
            onChange={handleEmailChange}
            required
            autoComplete="email"
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
            disabled={isLoading}
          />
          {fieldErrors.email && (
            <span id="login-email-error" className="text-xs text-price-rise mt-1" role="alert">
              {fieldErrors.email}
            </span>
          )}
        </div>

        <PasswordField
          className="flex flex-col gap-2"
          id="login-password"
          label="Пароль"
          value={password}
          onChange={setPassword}
          required
          autoComplete="current-password"
          labelClassName="text-xs font-medium text-muted-text uppercase tracking-wider"
          inputClassName="w-full p-3.5 bg-surface-elevated border border-hairline-dark text-body-text font-sans text-sm rounded-lg transition-all duration-200 focus:outline-none focus:border-gold focus:bg-surface-card hover:not(:focus):border-gold/20 placeholder:text-muted-text/50"
        />

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                id="login-remember"
                className="peer absolute w-[18px] h-[18px] opacity-0 cursor-pointer z-10"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <div className="w-[18px] h-[18px] border-2 border-hairline-dark rounded bg-surface-elevated transition-all duration-200 peer-hover:border-gold/50 peer-checked:bg-gold peer-checked:border-gold peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-gold peer-focus-visible:outline-offset-2"></div>
              <div className="absolute left-[6px] top-[3px] w-[5px] h-[9px] border-r-2 border-b-2 border-gold-ink rotate-45 opacity-0 transition-opacity duration-200 peer-checked:opacity-100"></div>
            </div>
            <label htmlFor="login-remember" className="cursor-pointer text-sm text-muted-text select-none">
              Запомнить меня
            </label>
          </div>
          <Link to="/forgot-password" className="text-sm text-gold no-underline transition-colors hover:text-gold-active font-medium" onClick={handleClose}>
            Забыли пароль?
          </Link>
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2.5 w-full px-6 py-3 bg-gold text-gold-ink font-sans text-sm font-semibold border-none rounded-md cursor-pointer transition-all duration-200 hover:not(:disabled):bg-gold-active disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-transparent border-t-[var(--bg)] rounded-full animate-spin" />
              <span>Вход...</span>
            </>
          ) : (
            <>
              Войти
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </AuthModalBase>
  );
}

export default LoginModal;