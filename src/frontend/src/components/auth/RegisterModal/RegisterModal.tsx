/**
 * RegisterModal - Модальное окно регистрации
 * 
 * Features:
 * - Имя и Фамилия поля
 * - Email поле
 * - Password с индикатором силы
 * - Подтверждение пароля
 * - Checkbox с условиями использования
 * - Ссылка на вход
 * - Использует Modal компонент
 */

import { useState, useMemo } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { Modal } from '../../ui/Modal/Modal';
import { useAuth } from '../../../hooks/useAuth';
import { useAuthModalStore } from '../../../store/authModalStore';
import styles from './RegisterModal.module.css';

export interface RegisterModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
}

export function RegisterModal({ isOpen, onClose }: RegisterModalProps) {
  const { register, isLoading } = useAuth();
  const { switchAuthModal } = useAuthModalStore();
  
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
      onClose();
      // Reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setTermsAccepted(false);
    } catch {
      setError('Ошибка регистрации. Попробуйте другой email');
    }
  };

  const handleSwitchToLogin = () => {
    switchAuthModal('login');
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Создать аккаунт"
      size="medium"
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="register-firstName">
            Имя
          </label>
          <input
            id="register-firstName"
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
          <label className={styles.label} htmlFor="register-lastName">
            Фамилия
          </label>
          <input
            id="register-lastName"
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
          <label className={styles.label} htmlFor="register-email">
            Email
          </label>
          <input
            id="register-email"
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
          <label className={styles.label} htmlFor="register-password">
            Пароль
          </label>
          <input
            id="register-password"
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
          <label className={styles.label} htmlFor="register-confirmPassword">
            Подтверждение пароля
          </label>
          <input
            id="register-confirmPassword"
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
            id="register-terms"
            className={styles.checkbox}
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
          />
          <label htmlFor="register-terms" className={styles.checkboxLabel}>
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
          <ArrowRight size={18} />
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
          <button
            type="button"
            className={styles.footerLink}
            onClick={handleSwitchToLogin}
          >
            Войти
          </button>
        </p>
      </div>
    </Modal>
  );
}

export default RegisterModal;