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
import { Modal } from '../../ui/Modal/Modal';
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Вход в аккаунт"
      size="small"
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
            className={styles.input}
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
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
          <button
            type="button"
            className={styles.footerLink}
            onClick={handleSwitchToRegister}
          >
            Зарегистрироваться
          </button>
        </p>
      </div>
    </Modal>
  );
}

export default LoginModal;