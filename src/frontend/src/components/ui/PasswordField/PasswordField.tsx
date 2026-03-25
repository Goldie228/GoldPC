import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import styles from './PasswordField.module.css';

export interface PasswordFieldProps {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
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
  autoComplete = 'current-password',
  className,
  labelClassName,
  inputClassName,
}: PasswordFieldProps) {
  const reactId = useId();
  const id = idProp ?? `password-${reactId}`;
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`${styles.field} ${className ?? ''}`}>
      <label className={labelClassName ?? styles.label} htmlFor={id}>
        {label}
      </label>
      <div className={styles.inputWrap}>
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          className={`${styles.input} ${inputClassName ?? ''}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className={styles.toggleBtn}
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
