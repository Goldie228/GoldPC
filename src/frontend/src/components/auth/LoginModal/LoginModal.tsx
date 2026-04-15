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
import { AuthModalBase } from '../AuthModalBase/AuthModalBase';
import { PasswordField } from '../../ui/PasswordField';
import { useAuth } from '../../../hooks/useAuth';
import { useAuthModalStore } from '../../../store/authModalStore';
import styles from './LoginModal.module.css';

export interface LoginModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login, isLoading } = useAuth();
  const { switchAuthModal } = useAuthModalStore();

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
      <form className={styles.form} onSubmit={handleSubmit}>
        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            className={`${styles.input} ${fieldErrors.email ? styles.inputError : ''}`}
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
            <span id="login-email-error" className={styles.fieldError} role="alert">
              {fieldErrors.email}
            </span>
          )}
        </div>

        <PasswordField
          className={styles.field}
          id="login-password"
          label="Пароль"
          value={password}
          onChange={setPassword}
          required
          autoComplete="current-password"
          labelClassName={styles.label}
          inputClassName={styles.input}
        />

        <div className={styles.options}>
          <div className={styles.checkboxGroup}>
            <input
              type="checkbox"
              id="login-remember"
              className={styles.checkbox}
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <label htmlFor="login-remember" className={styles.checkboxLabel}>
              Запомнить меня
            </label>
          </div>
          <Link to="/forgot-password" className={styles.forgotLink} onClick={handleClose}>
            Забыли пароль?
          </Link>
        </div>

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <div className={styles.loadingSpinner} />
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