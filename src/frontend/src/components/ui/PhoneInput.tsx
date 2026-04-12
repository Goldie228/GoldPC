import { forwardRef, InputHTMLAttributes } from 'react';
import { usePhoneFormat } from '../../hooks/usePhoneFormat';
import styles from './Input/Input.module.css';

interface PhoneInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type' | 'value'> {
  value?: string;
  onChange?: (value: string) => void;
}

/**
 * Компонент для ввода телефонного номера Беларуси с автоматической маской
 * Форматирует ввод по шаблону +375 (XX) XXX-XX-XX
 */
export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, className, placeholder = '+375 (29) 123-45-67', ...props }, ref) => {
    const {
      displayValue,
      inputRef,
      handleChange,
      handleKeyDown,
      handlePaste,
      handleBlur,
      handleFocus,
    } = usePhoneFormat({ value, onChange });

    return (
      <input
        {...props}
        ref={inputRef}
        type="tel"
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`${styles.input} ${className || ''}`}
        placeholder={placeholder}
        autoComplete="tel"
        inputMode="numeric"
      />
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
