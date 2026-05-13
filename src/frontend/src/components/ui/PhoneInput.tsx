import { useCallback, useRef } from 'react';

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
}

export function PhoneInput({ value, onChange, className = '', placeholder = '+375 (29) 123-45-67', ...props }: PhoneInputProps) {
  const prevRef = useRef(value);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target as HTMLInputElement;
      const raw = input.value;
      const deleting = raw.length < prevRef.current.length;

      // Стираем — никакой маски
      if (deleting) {
        prevRef.current = raw;
        onChange(raw);
        return;
      }

      // Вводим новые цифры — форматируем
      const clean = raw.replace(/\D/g, '');
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

      prevRef.current = formatted;
      onChange(formatted);
    },
    [onChange],
  );

  return (
    <input
      type="tel"
      inputMode="numeric"
      value={value || ''}
      onChange={handleChange}
      placeholder={placeholder}
      maxLength={19}
      className={`w-full p-3.5 bg-surface-elevated border text-body-text font-sans text-sm rounded-lg transition-all duration-200 focus:outline-none focus:border-gold focus:bg-surface-card hover:not(:focus):border-gold/20 placeholder:text-muted-text/50 ${className}`}
      autoComplete="tel"
      {...props}
    />
  );
}
