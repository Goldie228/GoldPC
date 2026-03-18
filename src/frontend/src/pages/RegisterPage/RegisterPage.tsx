import { useState, useMemo } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from './RegisterPage.module.css';

/**
 * Страница регистрации
 * Соответствует прототипу prototypes/register.html
 */
export function RegisterPage() {
  const { register, isLoading } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    return Math.min(strength, 3);
  }, [password]);

  const getStrengthClass = (index: number) => {
    if (index >= passwordStrength) return '';
    if (passwordStrength === 1) return styles.weak;
    if (passwordStrength === 2) return styles.medium;
    return styles.strong;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }

    if (!termsAccepted) {
      setError('Необходимо принять условия использования');
      return;
    }

    try {
      await register({ firstName, lastName, email, password });
    } catch {
      setError('Ошибка регистрации. Попробуйте другой email');
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <span className={styles.logoText}>
            Gold<span>PC</span>
          </span>
        </Link>

        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Создать аккаунт</h1>
          <p className={styles.subtitle}>Заполните форму для регистрации</p>
        </div>

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit}>
          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="firstName">
              Имя
            </label>
            <input
              id="firstName"
              type="text"
              className={styles.input}
              placeholder="Ваше имя"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              autoComplete="given-name"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="lastName">
              Фамилия
            </label>
            <input
              id="lastName"
              type="text"
              className={styles.input}
              placeholder="Ваша фамилия"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              autoComplete="family-name"
            />
          </div>

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
              placeholder="Минимум 8 символов"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <p className={styles.hint}>Минимум 8 символов, буквы и цифры</p>
            {password && (
              <div className={styles.passwordStrength}>
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className={`${styles.strengthBar} ${getStrengthClass(index)}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="confirm-password">
              Подтверждение пароля
            </label>
            <input
              id="confirm-password"
              type="password"
              className={styles.input}
              placeholder="Повторите пароль"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className={styles.checkboxGroup}>
            <input
              type="checkbox"
              id="terms"
              className={styles.checkbox}
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
            />
            <label htmlFor="terms" className={styles.checkboxLabel}>
              Я принимаю{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer">
                условия использования
              </a>{' '}
              и{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer">
                политику конфиденциальности
              </a>
            </label>
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isLoading}
          >
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
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
            Уже есть аккаунт?{' '}
            <Link to="/login" className={styles.footerLink}>
              Войти
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