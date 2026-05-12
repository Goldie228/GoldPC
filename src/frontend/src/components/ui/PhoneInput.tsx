import { useCallback } from 'react';
import { formatPhone, parsePhone } from '../../utils/phone';

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
}

export function PhoneInput({ value, onChange, className = '', placeholder = '+375 (29) 123-45-67', ...props }: PhoneInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const digits = raw.replace(/\D/g, '');
      const formatted = formatPhone(digits);
      onChange(parsePhone(formatted));
    },
    [onChange],
  );

  return (
    <input
      type="tel"
      inputMode="tel"
      value={value || ''}
      onChange={handleChange}
      placeholder={placeholder}
      className={`w-full p-3 bg-elevated border border-border rounded-lg text-foreground text-sm transition-all focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--border-muted)] ${className}`}
      autoComplete="tel"
      {...props}
    />
  );
}