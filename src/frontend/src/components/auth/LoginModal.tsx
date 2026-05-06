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
    } catch {
      setError('Неверный email или пароль');
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
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        {error && (
          <div className="p-3 bg-price-rise/10 border border-price-rise/30 text-price-rise text-sm rounded-md" role="alert">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-[var(--fg-dim)] uppercase tracking-wider" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            className={`w-full p-3.5 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--fg)] font-sans text-sm rounded-[var(--radius)] transition-all duration-200 focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--bg)] hover:not(:focus):border-[var(--border-accent)] ${fieldErrors.email ? 'border-[var(--error)] shadow-[0_0_0_1px_var(--error)]' : ''}`}
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
            <span id="login-email-error" className="text-xs text-[var(--error)] mt-1" role="alert">
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
          labelClassName="text-xs font-medium text-[var(--fg-dim)] uppercase tracking-wider"
          inputClassName="w-full p-3.5 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--fg)] font-sans text-sm rounded-[var(--radius)] transition-all duration-200 focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--bg)] hover:not(:focus):border-[var(--border-accent)]"
        />

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="login-remember"
              className="peer absolute opacity-0 w-0 h-0"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <label htmlFor="login-remember" className="relative cursor-pointer pl-7 select-none text-sm text-[var(--fg-muted)] peer-hover:&+::before:border-[var(--border-accent)] peer-checked:&+::before:bg-[var(--accent)] peer-checked:&+::before:border-[var(--accent)] peer-focus-visible:&+::before:outline peer-focus-visible:&+::before:outline-2 peer-focus-visible:&+::before:outline-[var(--accent)] peer-focus-visible:&+::before:outline-offset-2">
              <span className="peer-checked:&::after:content-[''] peer-checked:&::after:absolute peer-checked:&::after:left-[6px] peer-checked:&::after:top-[3px] peer-checked:&::after:w-[5px] peer-checked:&::after:h-[9px] peer-checked:&::after:border peer-checked:&::after:border-[var(--bg)] peer-checked:&::after:border-r-2 peer-checked:&::after:border-b-2 peer-checked:&::after:rotate-45"></span>
              Запомнить меня
            </label>
          </div>
          <Link to="/forgot-password" className="text-sm text-[var(--accent)] no-underline transition-colors hover:text-[var(--accent-bright)]" onClick={handleClose}>
            Забыли пароль?
          </Link>
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2.5 w-full p-3.5 bg-[var(--accent)] text-[var(--bg)] font-sans text-sm font-semibold border-none rounded-[var(--radius)] cursor-pointer transition-all duration-200 hover:not(:disabled):bg-[var(--accent-bright)] hover:not(:disabled):translate-y-[-2px] active:not(:disabled):translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
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