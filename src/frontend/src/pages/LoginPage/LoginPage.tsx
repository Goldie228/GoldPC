import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from './LoginPage.module.css';

/**
 * Страница авторизации
 * Соответствует прототипу prototypes/login.html
 */
export function LoginPage() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await login({ email, password }, remember);
    } catch {
      setError('Неверный email или пароль');
    }
  };

  return (
    <div className={styles.container}>
      {/* Background decoration */}
      <div className={styles.bgGlow} aria-hidden="true" />

      <div className={styles.card}>
        {/* Logo */}
        <Link to="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M29,3H3C2.4,3,2,3.4,2,4v19c0,0.6,0.4,1,1,1h26c0.6,0,1-0.4,1-1V4C30,3.4,29.6,3,29,3z M18,21h-4c-0.6,0-1-0.4-1-1s0.4-1,1-1h4c0.6,0,1,0.4,1,1S18.6,21,18,21z"
                fill="currentColor"
              />
              <path
                d="M18,21h-4c-0.6,0-1-0.4-1-1s0.4-1,1-1h4c0.6,0,1,0.4,1,1S18.6,21,18,21z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20.7,26.3C20.5,26.1,20.3,26,20,26h-8c-0.3,0-0.5,0.1-0.7,0.3l-2,2C9,28.6,8.9,29,9.1,29.4C9.2,29.8,9.6,30,10,30h12c0.4,0,0.8-0.2,0.9-0.6c0.2-0.4,0.1-0.8-0.2-1.1L20.7,26.3z"
                fill="currentColor"
              />
            </svg>
          </div>
          <span className={styles.logoText}>
            Gold<span>PC</span>
          </span>
        </Link>

        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Вход в аккаунт</h1>
          <p className={styles.subtitle}>Введите свои данные для доступа</p>
        </div>

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit}>
          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className={styles.input}
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              className={styles.input}
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <div className={styles.options}>
            <div className={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="remember"
                className={styles.checkbox}
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <label htmlFor="remember" className={styles.checkboxLabel}>
                Запомнить меня
              </label>
            </div>
            <Link to="/forgot-password" className={styles.forgotLink}>
              Забыли пароль?
            </Link>
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isLoading}
          >
            {isLoading ? 'Вход...' : 'Войти'}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </form>

        {/* Divider */}
        <div className={styles.divider}>
          <div className={styles.dividerLine} />
          <span className={styles.dividerText}>или</span>
          <div className={styles.dividerLine} />
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <p className={styles.footerText}>
            Нет аккаунта?{' '}
            <Link to="/register" className={styles.footerLink}>
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>

      {/* Back link */}
      <Link to="/" className={styles.backLink}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Вернуться на главную
      </Link>
    </div>
  );
}