import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface PasswordFieldProps {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  autoComplete?: string;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
}

/**
 * Поле пароля с кнопкой показа/скрытия для экранных читалок и клавиатуры.
 */
export function PasswordField({
  id: idProp,
  label,
  value,
  onChange,
  placeholder = 'Введите пароль',
  required,
  minLength,
  maxLength,
  autoComplete = 'current-password',
  className,
  labelClassName,
  inputClassName,
}: PasswordFieldProps) {
  const reactId = useId();
  const id = idProp ?? `password-${reactId}`;
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      <label className={labelClassName ?? "flex items-center gap-1 font-sans text-xs font-medium uppercase tracking-wider text-body-text"} htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          className={`w-full px-4 py-3 font-sans text-base text-body-text bg-surface-elevated border border-hairline-dark rounded-md outline-none transition-all focus:border-gold focus:shadow-[0_0_0_3px_var(--border-brand)] focus:bg-surface-card pr-11 ${inputClassName ?? ''}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-muted-text hover:text-body-text transition-colors"
          onClick={() => setShowPassword((v) => !v)}
          aria-label={showPassword ? 'Скрыть введённый пароль' : 'Показать введённый пароль'}
          aria-pressed={showPassword}
        >
          {showPassword ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
        </button>
      </div>
    </div>
  );
}
