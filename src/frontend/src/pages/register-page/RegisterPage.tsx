import { useState, useMemo } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Страница регистрации
 * Соответствует прототипу prototypes/register.html
 */
export function RegisterPage() {
  const { register, isLoading } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
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
      await register({ firstName, lastName: '', phone, email, password });
    } catch {
      setError('Ошибка регистрации. Попробуйте другой email');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-6 relative">
      {/* Background decoration */}
      <div className="fixed w-[500px] h-[500px] bg-[radial-gradient(circle,var(--accent-glow)_0%,transparent_60%)] top-[-200px] left-[-150px] blur-[80px] pointer-events-none -z-1" aria-hidden="true" />

      <div className="w-full max-w-[400px] bg-[var(--bg-card)] border border-[var(--border)] p-10 relative before:content-[''] before:absolute before:top-0 before:left-0 before:w-0.5 before:h-full before:bg-[var(--accent)]">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline mb-8 justify-center">
          <div className="w-10 h-10 bg-[var(--accent)] flex items-center justify-center">
            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="w-[22px] h-[22px] text-[var(--bg)]">
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
          <span className="text-lg font-semibold tracking-[-0.02em] text-[var(--fg)]">
            Gold<span className="text-[var(--accent)]">PC</span>
          </span>
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-center mb-2 tracking-[-0.02em] text-[var(--fg)]">Создать аккаунт</h1>
          <p className="text-sm text-[var(--fg-muted)] text-center">Заполните форму для регистрации</p>
        </div>

        {/* Form */}
        <form className="flex flex-col" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[var(--error)] text-[0.85rem] mb-4" role="alert">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-medium text-[var(--fg-dim)] uppercase tracking-[0.08em] mb-2" htmlFor="firstName">
              Имя
            </label>
            <input
              id="firstName"
              type="text"
              className="w-full p-3.5 bg-[var(--bg-elevated)] border border-[var(--border-accent)] text-[var(--fg)] font-[var(--font-sans)] text-[0.9rem] box-border focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--bg)] hover:border-[var(--border-accent)]"
              placeholder="Ваше имя"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              autoComplete="given-name"
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-[var(--fg-dim)] uppercase tracking-[0.08em] mb-2" htmlFor="phone">
              Телефон
            </label>
            <input
              id="phone"
              type="tel"
              className="w-full p-3.5 bg-[var(--bg-elevated)] border border-[var(--border-accent)] text-[var(--fg)] font-[var(--font-sans)] text-[0.9rem] box-border focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--bg)] hover:border-[var(--border-accent)]"
              placeholder={"+375 (XX) XXX-XX-XX"}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="tel"
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-[var(--fg-dim)] uppercase tracking-[0.08em] mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full p-3.5 bg-[var(--bg-elevated)] border border-[var(--border-accent)] text-[var(--fg)] font-[var(--font-sans)] text-[0.9rem] box-border focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--bg)] hover:border-[var(--border-accent)]"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-[var(--fg-dim)] uppercase tracking-[0.08em] mb-2" htmlFor="password">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              className="w-full p-3.5 bg-[var(--bg-elevated)] border border-[var(--border-accent)] text-[var(--fg)] font-[var(--font-sans)] text-[0.9rem] box-border focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--bg)] hover:border-[var(--border-accent)]"
              placeholder="Минимум 8 символов"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <p className="text-[0.7rem] text-[var(--fg-dim)] mt-1.5">Минимум 8 символов, буквы и цифры</p>
            {password && (
              <div className="flex gap-1 mt-2">
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className={`flex-1 h-0.5 bg-[var(--border)] transition-colors ${
                      index >= passwordStrength ? '' : 
                      passwordStrength === 1 ? 'bg-[var(--error)]' :
                      passwordStrength === 2 ? 'bg-[#eab308]' :
                      'bg-[var(--color-green-500)]'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-[var(--fg-dim)] uppercase tracking-[0.08em] mb-2" htmlFor="confirm-password">
              Подтверждение пароля
            </label>
            <input
              id="confirm-password"
              type="password"
              className="w-full p-3.5 bg-[var(--bg-elevated)] border border-[var(--border-accent)] text-[var(--fg)] font-[var(--font-sans)] text-[0.9rem] box-border focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--bg)] hover:border-[var(--border-accent)]"
              placeholder="Повторите пароль"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="flex items-start gap-2.5 my-5">
            <input
              type="checkbox"
              id="terms"
              className="w-4 h-4 accent-[var(--accent)] cursor-pointer mt-0.5 shrink-0"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
            />
            <label htmlFor="terms" className="text-sm text-[var(--fg-muted)] cursor-pointer leading-[1.5]">
              Я принимаю{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] no-underline hover:text-[var(--accent-bright)]">
                условия использования
              </a>{' '}
              и{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] no-underline hover:text-[var(--accent-bright)]">
                политику конфиденциальности
              </a>
            </label>
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2.5 w-full p-3.5 font-[var(--font-sans)] text-[0.85rem] font-semibold bg-[var(--accent)] text-[var(--bg)] border-none cursor-pointer transition-all hover:bg-[var(--accent-bright)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            disabled={isLoading}
          >
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-7">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <span className="text-[0.7rem] text-[var(--fg-dim)] uppercase tracking-[0.1em]">или</span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-[0.85rem] text-[var(--fg-muted)]">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-[var(--accent)] no-underline font-medium transition-colors hover:text-[var(--accent-bright)]">
              Войти
            </Link>
          </p>
        </div>
      </div>

      {/* Back link */}
      <Link to="/" className="flex items-center justify-center gap-2 mt-6 text-sm text-[var(--fg-dim)] no-underline transition-colors hover:text-[var(--fg)]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Вернуться на главную
      </Link>
    </div>
  );
}