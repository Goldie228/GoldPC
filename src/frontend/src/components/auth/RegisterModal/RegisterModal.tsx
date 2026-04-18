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
import { AuthModalBase } from '../AuthModalBase/AuthModalBase';
import { PasswordField } from '../../ui/PasswordField/PasswordField';
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
  const [lastName, setLastName] = useState(''); // Опционально
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(''); // Опционально

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    const value = input.value;
    const deleting = value.length < phone.length;

    // ✅ ЕСЛИ СТИРАЕМ - НИКАКОЙ МАСКИ, НИЧЕГО. СТИРАЙ СКОЛЬКО ХОЧЕШЬ.
    if (deleting) {
      setPhone(value);
      return;
    }

    // ✅ ТОЛЬКО ЕСЛИ ВВОДИМ НОВЫЕ ЦИФРЫ - ФОРМАТИРУЕМ
    const clean = value.replace(/\D/g, '');
    let digits = clean;

    if (digits.startsWith('375')) digits = digits.slice(3);

    let formatted = '+375 ';
    if (digits.length > 0) formatted += '(' + digits.slice(0, Math.min(2, digits.length));
    if (digits.length >= 2) formatted += ') ';
    if (digits.length >= 3) formatted += digits.slice(2, 5);
    if (digits.length >= 5) formatted += '-';
    if (digits.length >= 6) formatted += digits.slice(5, 7);
    if (digits.length >= 7) formatted += '-';
    if (digits.length >= 8) formatted += digits.slice(7, 9);

    setPhone(formatted);
  };
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) return 'Email не может быть пустым';
    if (!emailRegex.test(value)) return 'Введите корректный email адрес';
    return '';
  };

  const validatePassword = (value: string): string => {
    if (!value) return 'Пароль не может быть пустым';
    if (value.length < 8) return 'Пароль должен содержать минимум 8 символов';
    if (value.length > 64) return 'Пароль не может быть длиннее 64 символов';
    if (!/[A-Z]/.test(value)) return 'Пароль должен содержать минимум одну заглавную букву';
    if (!/[a-z]/.test(value)) return 'Пароль должен содержать минимум одну строчную букву';
    if (!/[0-9]/.test(value)) return 'Пароль должен содержать минимум одну цифру';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) return 'Пароль должен содержать минимум один специальный символ';
    if (/(.)\1{2,}/.test(value)) return 'Пароль не может содержать 3 и более одинаковых символов подряд';
    if (/012|123|234|345|456|567|678|789|890|abc|bcd|cde|def/i.test(value)) return 'Пароль не может содержать последовательные символы';

    // Проверка на наличие персональных данных в пароле
    if (firstName && value.toLowerCase().includes(firstName.toLowerCase())) {
      return 'Пароль не должен содержать ваше имя';
    }
    if (lastName && value.toLowerCase().includes(lastName.toLowerCase())) {
      return 'Пароль не должен содержать вашу фамилию';
    }
    if (email) {
      const emailUsername = email.split('@')[0];
      if (value.toLowerCase().includes(emailUsername.toLowerCase())) {
        return 'Пароль не должен содержать имя пользователя из email';
      }
    }

    return '';
  };

  const validateConfirmPassword = (value: string) => {
    if (password && value !== password) return 'Пароли не совпадают';
    return '';
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    const err = validateEmail(value);
    setFieldErrors(prev => ({ ...prev, email: err }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    const err = validatePassword(value);
    setFieldErrors(prev => ({ ...prev, password: err }));

    // Re-validate confirm password if it was already entered
    if (confirmPassword) {
      const confirmErr = validateConfirmPassword(confirmPassword);
      setFieldErrors(prev => ({ ...prev, confirmPassword: confirmErr }));
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    const err = validateConfirmPassword(value);
    setFieldErrors(prev => ({ ...prev, confirmPassword: err }));
  };

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
      // Clean phone number for backend: remove all non-digit characters except leading +
      const cleanPhone = phone.replace(/[^\d+]/g, '');
      await register({ firstName, lastName, email, password, phone: cleanPhone });
      onClose();
      // Reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setTermsAccepted(false);
      setFieldErrors({});
    } catch (error: any) {
      console.error('Registration error:', error);
      console.error('Full error response:', error.response?.data);
      const backendErrors = error?.response?.data?.errors;

      if (backendErrors && typeof backendErrors === 'object') {
        // Set field-specific errors from backend validation
        const newFieldErrors: Record<string, string> = {};
        Object.entries(backendErrors).forEach(([field, messages]) => {
          newFieldErrors[field] = Array.isArray(messages) ? messages[0] : String(messages);
        });
        setFieldErrors(newFieldErrors);

        // If there are multiple errors, show generic message
        const fieldCount = Object.keys(newFieldErrors).length;
        if (fieldCount === 1) {
          setError(`Ошибка в поле ${Object.keys(newFieldErrors)[0]}: ${Object.values(newFieldErrors)[0]}`);
        } else {
          setError('Пожалуйста, исправьте ошибки в полях формы');
        }
      } else {
        // Generic fallback error
        setError(error?.response?.data?.title || 'Ошибка регистрации. Попробуйте позже.');
        setFieldErrors({});
      }
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
    <AuthModalBase
      isOpen={isOpen}
      onClose={handleClose}
      title="Создать аккаунт"
      size="medium"
      switchLink={{
        text: 'Уже есть аккаунт?',
        actionText: 'Войти',
        onClick: handleSwitchToLogin
      }}
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
            className={`${styles.input} ${fieldErrors.firstName ? styles.inputError : ''}`}
            placeholder="Ваше имя"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              setFieldErrors(prev => ({ ...prev, firstName: undefined }));
            }}
            required
            autoComplete="given-name"
          />
          {fieldErrors.firstName && <div className={styles.fieldError}>{fieldErrors.firstName}</div>}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="register-phone">
            Телефон
          </label>
          <input
            id="register-phone"
            type="tel"
            className={`${styles.input} ${fieldErrors.phone ? styles.inputError : ''}`}
            placeholder="+375 (29) 123-45-67"
            value={phone}
            onChange={(e) => {
              handlePhoneChange(e);
              setFieldErrors(prev => ({ ...prev, phone: undefined }));
            }}
            required
            autoComplete="tel"
            inputMode="numeric"
            maxLength={19}
          />
          {fieldErrors.phone && <div className={styles.fieldError}>{fieldErrors.phone}</div>}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="register-email">
            Email
          </label>
          <input
            id="register-email"
            type="email"
            className={`${styles.input} ${fieldErrors.email ? styles.inputError : ''}`}
            placeholder="your@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldErrors(prev => ({ ...prev, email: undefined }));
            }}
            required
            autoComplete="email"
          />
          {fieldErrors.email && <div className={styles.fieldError}>{fieldErrors.email}</div>}
        </div>

        <div className={styles.field}>
          <PasswordField
            id="register-password"
            label="Пароль"
            value={password}
            onChange={(value) => {
              setPassword(value);
              const err = validatePassword(value);
              setFieldErrors(prev => ({ ...prev, password: err }));
            }}
            required
            minLength={8}
            maxLength={64}
            autoComplete="new-password"
            labelClassName={styles.label}
            inputClassName={styles.input}
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
            className={`${styles.input} ${fieldErrors.confirmPassword ? styles.inputError : ''}`}
            placeholder="Повторите пароль"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setFieldErrors(prev => ({ ...prev, confirmPassword: undefined }));
            }}
            required
            autoComplete="new-password"
          />
          {fieldErrors.confirmPassword && <div className={styles.fieldError}>{fieldErrors.confirmPassword}</div>}
        </div>

        <div className={styles.checkboxGroup}>
          <input
            type="checkbox"
            id="register-terms"
            className={styles.checkbox}
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
          />
          <label htmlFor="register-terms" className={styles.checkboxLabel} onClick={(e) => {
            // Prevent label click from triggering nested links
            if ((e.target as HTMLElement).tagName !== 'A') {
              e.preventDefault();
              setTermsAccepted(!termsAccepted);
            }
          }}>
            Я принимаю{' '}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              условия использования
            </a>{' '}
            и{' '}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
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

    </AuthModalBase>
  );
}

export default RegisterModal;