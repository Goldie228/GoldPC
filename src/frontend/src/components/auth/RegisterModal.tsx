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
import { AuthModalBase } from './AuthModalBase';
import { PasswordField } from '@/components/ui/PasswordField';
import { useAuth } from '@/hooks/useAuth';
import { useAuthModal } from '@/hooks/useAuthModal';

export interface RegisterModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
}

export function RegisterModal({ isOpen, onClose }: RegisterModalProps) {
  const { register, isLoading } = useAuth();
  const { switchAuthModal } = useAuthModal();

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
    } catch (error: unknown) {
      console.error('Registration error:', error);
      const err = error as { response?: { data?: { errors?: Record<string, string[]>, title?: string } } };
      console.error('Full error response:', err.response?.data);
      const backendErrors = err.response?.data?.errors;

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
        setError(err.response?.data?.title || 'Ошибка регистрации. Попробуйте позже.');
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
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {error && (
          <div className="p-3 bg-price-rise/10 border border-price-rise/30 text-price-rise text-sm rounded-md" role="alert">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-text uppercase tracking-wider" htmlFor="register-firstName">
            Имя
          </label>
          <input
            id="register-firstName"
            type="text"
            className={`w-full p-3.5 bg-surface-elevated border text-body-text font-sans text-sm rounded-lg transition-all duration-200 focus:outline-none focus:border-gold focus:bg-surface-card hover:not(:focus):border-gold/20 placeholder:text-muted-text/50 ${
              fieldErrors.firstName
                ? 'border-price-rise outline outline-1 outline-price-rise/30'
                : 'border-hairline-dark'
            }`}
            placeholder="Ваше имя"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              setFieldErrors(prev => ({ ...prev, firstName: undefined }));
            }}
            required
            autoComplete="given-name"
          />
          {fieldErrors.firstName && <div className="text-xs text-price-rise -mt-1 ml-0.5">{fieldErrors.firstName}</div>}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-text uppercase tracking-wider" htmlFor="register-phone">
            Телефон
          </label>
          <input
            id="register-phone"
            type="tel"
            className={`w-full p-3.5 bg-surface-elevated border text-body-text font-sans text-sm rounded-lg transition-all duration-200 focus:outline-none focus:border-gold focus:bg-surface-card hover:not(:focus):border-gold/20 placeholder:text-muted-text/50 ${
              fieldErrors.phone
                ? 'border-price-rise outline outline-1 outline-price-rise/30'
                : 'border-hairline-dark'
            }`}
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
          {fieldErrors.phone && <div className="text-xs text-price-rise -mt-1 ml-0.5">{fieldErrors.phone}</div>}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-text uppercase tracking-wider" htmlFor="register-email">
            Email
          </label>
          <input
            id="register-email"
            type="email"
            className={`w-full p-3.5 bg-surface-elevated border text-body-text font-sans text-sm rounded-lg transition-all duration-200 focus:outline-none focus:border-gold focus:bg-surface-card hover:not(:focus):border-gold/20 placeholder:text-muted-text/50 ${
              fieldErrors.email
                ? 'border-price-rise outline outline-1 outline-price-rise/30'
                : 'border-hairline-dark'
            }`}
            placeholder="your@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldErrors(prev => ({ ...prev, email: undefined }));
            }}
            required
            autoComplete="email"
          />
          {fieldErrors.email && <div className="text-xs text-price-rise -mt-1 ml-0.5">{fieldErrors.email}</div>}
        </div>

        <div className="flex flex-col gap-2">
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
            labelClassName="text-xs font-medium text-muted-text uppercase tracking-wider"
            inputClassName="w-full p-3.5 bg-surface-elevated border border-hairline-dark text-body-text font-sans text-sm rounded-lg transition-all duration-200 focus:outline-none focus:border-gold focus:bg-surface-card hover:not(:focus):border-gold/20 placeholder:text-muted-text/50"
          />
          <p className="text-[10px] text-muted-text mt-1">Минимум 8 символов, буквы и цифры</p>
          {password && (
            <div className="flex gap-1 mt-2">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className={`flex-1 h-[3px] rounded-sm transition-colors duration-200 ${
                    index >= passwordStrength
                      ? 'bg-hairline-dark'
                      : passwordStrength === 1
                        ? 'bg-price-rise'
                        : passwordStrength === 2
                          ? 'bg-gold'
                          : 'bg-price-drop'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-text uppercase tracking-wider" htmlFor="register-confirmPassword">
            Подтверждение пароля
          </label>
          <input
            id="register-confirmPassword"
            type="password"
            className={`w-full p-3.5 bg-surface-elevated border text-body-text font-sans text-sm rounded-lg transition-all duration-200 focus:outline-none focus:border-gold focus:bg-surface-card hover:not(:focus):border-gold/20 placeholder:text-muted-text/50 ${
              fieldErrors.confirmPassword
                ? 'border-price-rise outline outline-1 outline-price-rise/30'
                : 'border-hairline-dark'
            }`}
            placeholder="Повторите пароль"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setFieldErrors(prev => ({ ...prev, confirmPassword: undefined }));
            }}
            required
            autoComplete="new-password"
          />
          {fieldErrors.confirmPassword && <div className="text-xs text-price-rise -mt-1 ml-0.5">{fieldErrors.confirmPassword}</div>}
        </div>

        <div className="flex items-center gap-2.5 my-1">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              id="register-terms"
              className="peer absolute w-[18px] h-[18px] opacity-0 cursor-pointer z-10"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
            />
            <div className="w-[18px] h-[18px] border-2 border-hairline-dark rounded bg-surface-elevated transition-all duration-200 peer-hover:border-gold/50 peer-checked:bg-gold peer-checked:border-gold peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-gold peer-focus-visible:outline-offset-2"></div>
            <div className="absolute left-[6px] top-[3px] w-[5px] h-[9px] border-r-2 border-b-2 border-gold-ink rotate-45 opacity-0 transition-opacity duration-200 peer-checked:opacity-100"></div>
          </div>
          <label htmlFor="register-terms" className="cursor-pointer text-sm text-muted-text leading-6" onClick={(e) => {
            if ((e.target as HTMLElement).tagName !== 'A') {
              e.preventDefault();
              setTermsAccepted(!termsAccepted);
            }
          }}>
            Я принимаю{' '}
            <a
              href="/terms"
              className="text-gold no-underline transition-colors hover:text-gold-active"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              условия использования
            </a>{' '}
            и{' '}
            <a
              href="/privacy"
              className="text-gold no-underline transition-colors hover:text-gold-active"
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
          className="inline-flex items-center justify-center gap-2.5 w-full px-6 py-3 bg-gold text-gold-ink font-sans text-sm font-semibold border-none rounded-md cursor-pointer transition-all duration-200 hover:not(:disabled):bg-gold-active disabled:opacity-60 disabled:cursor-not-allowed mt-1"
          disabled={isLoading}
        >
          {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          <ArrowRight size={18} />
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-4 my-2">
        <div className="flex-1 h-px bg-hairline-dark" />
        <span className="text-[10px] text-muted-text uppercase tracking-wider">или</span>
        <div className="flex-1 h-px bg-hairline-dark" />
      </div>

    </AuthModalBase>
  );
}

export default RegisterModal;