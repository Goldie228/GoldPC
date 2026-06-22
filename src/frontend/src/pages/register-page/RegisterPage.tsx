import { useState, useMemo, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Mail, User, Phone } from 'lucide-react';
import { PasswordField } from '@/components/ui/PasswordField';
import { useAuth } from '@/hooks/useAuth';

/**
 * RegisterPage — Страница регистрации
 *
 * Дизайн: тёмная тема в стиле GoldPC (DESIGN.md).
 * Полноценная страница с карточкой, валидацией полей, маской телефона, индикатором силы пароля.
 */

interface PageErrors {
  firstName?: string;
  phone?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

export function RegisterPage() {
  const { register, isLoading } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<PageErrors>({});

  // Phone mask logic (same as RegisterModal)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    const value = input.value;
    const deleting = value.length < phone.length;

    if (deleting) {
      setPhone(value);
      return;
    }

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

  // Password strength
  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    return Math.min(strength, 3);
  }, [password]);

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'firstName':
        if (!value) return 'Имя не может быть пустым';
        if (value.length < 2) return 'Имя должно содержать минимум 2 символа';
        return '';
      case 'email': {
        if (!value) return 'Email не может быть пустым';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Введите корректный email адрес';
        return '';
      }
      case 'password': {
        if (!value) return 'Пароль не может быть пустым';
        if (value.length < 8) return 'Пароль должен содержать минимум 8 символов';
        if (value.length > 64) return 'Пароль не может быть длиннее 64 символов';
        if (!/[A-Z]/.test(value)) return 'Пароль должен содержать минимум одну заглавную букву';
        if (!/[a-z]/.test(value)) return 'Пароль должен содержать минимум одну строчную букву';
        if (!/[0-9]/.test(value)) return 'Пароль должен содержать минимум одну цифру';
        return '';
      }
      default:
        return '';
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const errors: PageErrors = {};

    const firstNameErr = validateField('firstName', firstName);
    if (firstNameErr) errors.firstName = firstNameErr;

    if (!phone) errors.phone = 'Телефон не может быть пустым';
    else if (phone.replace(/\D/g, '').length < 9) errors.phone = 'Введите корректный номер телефона';

    const emailErr = validateField('email', email);
    if (emailErr) errors.email = emailErr;

    const passwordErr = validateField('password', password);
    if (passwordErr) errors.password = passwordErr;

    if (!confirmPassword) {
      errors.confirmPassword = 'Подтвердите пароль';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Пароли не совпадают';
    }

    if (!termsAccepted) {
      errors.terms = 'Необходимо принять условия использования';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      const cleanPhone = phone.replace(/[^\d+]/g, '');
      await register({ firstName, lastName: '', phone: cleanPhone, email, password });
    } catch (error: unknown) {
      // Показываем реальное сообщение с сервера вместо захардкоженной ошибки
      const err = error as { response?: { data?: { errors?: Record<string, string[]>, title?: string, message?: string }, status?: number } };
      const backendErrors = err.response?.data?.errors;

      if (backendErrors && typeof backendErrors === 'object') {
        // Ошибки валидации по полям
        const newFieldErrors: Record<string, string> = {};
        Object.entries(backendErrors).forEach(([field, messages]) => {
          newFieldErrors[field] = Array.isArray(messages) ? messages[0] : String(messages);
        });
        setFieldErrors(newFieldErrors);
        setError('Пожалуйста, исправьте ошибки в полях формы');
      } else {
        // Показываем сообщение от сервера или общее сообщение по коду статуса
        const serverMessage = err.response?.data?.title || err.response?.data?.message;
        const status = err.response?.status;
        if (serverMessage) {
          setError(serverMessage);
        } else if (status === 409) {
          setError('Пользователь с таким email уже зарегистрирован.');
        } else if (status === 422) {
          setError('Ошибка валидации данных. Проверьте введённые значения.');
        } else if (status && status >= 500) {
          setError('Ошибка сервера. Попробуйте через несколько минут.');
        } else {
          setError('Ошибка регистрации. Попробуйте позже.');
        }
      }
    }
  };

  const clearFieldError = (field: keyof PageErrors) => {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <div className="min-h-screen bg-canvas-dark flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-text text-sm no-underline transition-colors hover:text-body-text mb-8"
        >
          <ArrowLeft size={16} />
          <span>На главную</span>
        </Link>

        {/* Card */}
        <div className="bg-surface-card border border-hairline-dark rounded-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <span className="text-2xl font-bold text-gold tracking-tight">
              Gold<span className="text-body-text">PC</span>
            </span>
            <h1 className="text-title-sm text-body-text mt-4 mb-2">
              Создать аккаунт
            </h1>
            <p className="text-sm text-muted-text leading-relaxed">
              Заполните форму для регистрации
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-6 p-4 bg-price-rise/10 border border-price-rise/30 text-price-rise text-sm rounded-lg flex items-start gap-3" role="alert">
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form className="flex flex-col gap-4" onSubmit={(e) => void handleSubmit(e)}>
            {/* First name */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-text uppercase tracking-wider" htmlFor="register-firstName">
                Имя
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text" />
                <input
                  id="register-firstName"
                  type="text"
                  className={`w-full pl-10 pr-3.5 py-3 bg-surface-elevated border text-body-text text-sm rounded-lg transition-all duration-200 focus:outline-none focus:border-gold focus:bg-surface-card hover:not(:focus):border-gold/20 placeholder:text-muted-text/50 ${
                    fieldErrors.firstName ? 'border-price-rise outline outline-1 outline-price-rise/30' : 'border-hairline-dark'
                  }`}
                  placeholder="Ваше имя"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (fieldErrors.firstName) clearFieldError('firstName');
                  }}
                  required
                  autoComplete="given-name"
                  disabled={isLoading}
                />
              </div>
              {fieldErrors.firstName && (
                <span className="text-xs text-price-rise mt-1" role="alert">{fieldErrors.firstName}</span>
              )}
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-text uppercase tracking-wider" htmlFor="register-phone">
                Телефон
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text" />
                <input
                  id="register-phone"
                  type="tel"
                  className={`w-full pl-10 pr-3.5 py-3 bg-surface-elevated border text-body-text text-sm rounded-lg transition-all duration-200 focus:outline-none focus:border-gold focus:bg-surface-card hover:not(:focus):border-gold/20 placeholder:text-muted-text/50 ${
                    fieldErrors.phone ? 'border-price-rise outline outline-1 outline-price-rise/30' : 'border-hairline-dark'
                  }`}
                  placeholder="+375 (29) 123-45-67"
                  value={phone}
                  onChange={(e) => {
                    handlePhoneChange(e);
                    if (fieldErrors.phone) clearFieldError('phone');
                  }}
                  required
                  autoComplete="tel"
                  inputMode="numeric"
                  maxLength={19}
                  disabled={isLoading}
                />
              </div>
              {fieldErrors.phone && (
                <span className="text-xs text-price-rise mt-1" role="alert">{fieldErrors.phone}</span>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-text uppercase tracking-wider" htmlFor="register-email">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text" />
                <input
                  id="register-email"
                  type="email"
                  className={`w-full pl-10 pr-3.5 py-3 bg-surface-elevated border text-body-text text-sm rounded-lg transition-all duration-200 focus:outline-none focus:border-gold focus:bg-surface-card hover:not(:focus):border-gold/20 placeholder:text-muted-text/50 ${
                    fieldErrors.email ? 'border-price-rise outline outline-1 outline-price-rise/30' : 'border-hairline-dark'
                  }`}
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) clearFieldError('email');
                  }}
                  required
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>
              {fieldErrors.email && (
                <span className="text-xs text-price-rise mt-1" role="alert">{fieldErrors.email}</span>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <PasswordField
                id="register-password"
                label="Пароль"
                value={password}
                onChange={(value) => {
                  setPassword(value);
                  if (fieldErrors.password) clearFieldError('password');
                }}
                required
                minLength={8}
                maxLength={64}
                autoComplete="new-password"
                labelClassName="text-xs font-medium text-muted-text uppercase tracking-wider"
                inputClassName="w-full pl-10 pr-11 py-3 bg-surface-elevated border border-hairline-dark text-body-text font-sans text-sm rounded-lg transition-all duration-200 focus:outline-none focus:border-gold focus:bg-surface-card hover:not(:focus):border-gold/20 placeholder:text-muted-text/50"
              />
              {/* Password strength */}
              {password && (
                <div className="flex gap-1 mt-1">
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
              {fieldErrors.password && (
                <span className="text-xs text-price-rise mt-1" role="alert">{fieldErrors.password}</span>
              )}
            </div>

            {/* Confirm password */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-text uppercase tracking-wider" htmlFor="register-confirmPassword">
                Подтверждение пароля
              </label>
              <input
                id="register-confirmPassword"
                type="password"
                className={`w-full px-3.5 py-3 bg-surface-elevated border text-body-text text-sm rounded-lg transition-all duration-200 focus:outline-none focus:border-gold focus:bg-surface-card hover:not(:focus):border-gold/20 placeholder:text-muted-text/50 ${
                  fieldErrors.confirmPassword
                    ? 'border-price-rise outline outline-1 outline-price-rise/30'
                    : 'border-hairline-dark'
                }`}
                placeholder="Повторите пароль"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) clearFieldError('confirmPassword');
                }}
                required
                autoComplete="new-password"
                disabled={isLoading}
              />
              {fieldErrors.confirmPassword && (
                <span className="text-xs text-price-rise mt-1" role="alert">{fieldErrors.confirmPassword}</span>
              )}
            </div>

            {/* Terms checkbox */}
            <div className="flex items-start gap-2.5 my-1">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="register-terms"
                  className="peer absolute w-[18px] h-[18px] opacity-0 cursor-pointer z-10"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  disabled={isLoading}
                />
                <div className="w-[18px] h-[18px] border-2 border-hairline-dark rounded bg-surface-elevated transition-all duration-200 peer-hover:border-gold/50 peer-checked:bg-gold peer-checked:border-gold peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-gold peer-focus-visible:outline-offset-2" />
                <div className="absolute left-[6px] top-[3px] w-[5px] h-[9px] border-r-2 border-b-2 border-gold-ink rotate-45 opacity-0 transition-opacity duration-200 peer-checked:opacity-100" />
              </div>
              <label htmlFor="register-terms" className="cursor-pointer text-sm text-muted-text leading-6">
                Я принимаю{' '}
                <a href="/terms" className="text-gold no-underline transition-colors hover:text-gold-active" target="_blank" rel="noopener noreferrer">
                  условия использования
                </a>{' '}
                и{' '}
                <a href="/privacy" className="text-gold no-underline transition-colors hover:text-gold-active" target="_blank" rel="noopener noreferrer">
                  политику конфиденциальности
                </a>
              </label>
            </div>
            {fieldErrors.terms && (
              <span className="text-xs text-price-rise -mt-2" role="alert">{fieldErrors.terms}</span>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2.5 w-full px-6 py-3 bg-gold text-gold-ink font-sans text-sm font-semibold border-none rounded-md cursor-pointer transition-all duration-200 hover:not(:disabled):bg-gold-active disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              disabled={isLoading}
            >
              {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-hairline-dark" />
            <span className="text-[10px] text-muted-text uppercase tracking-wider">или</span>
            <div className="flex-1 h-px bg-hairline-dark" />
          </div>

          {/* Switch to login */}
          <div className="text-center">
            <p className="text-sm text-muted-text">
              Уже есть аккаунт?{' '}
              <Link to="/" className="text-gold no-underline font-medium transition-colors hover:text-gold-active">
                Войти
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
