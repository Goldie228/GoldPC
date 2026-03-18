import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import styles from './Input.module.css';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Label text displayed above the input */
  label?: string;
  /** Error message displayed below the input */
  error?: string;
  /** Helper text displayed below the input (when no error) */
  helperText?: string;
  /** Size variant */
  size?: InputSize;
  /** Full width */
  fullWidth?: boolean;
  /** Left icon element */
  leftIcon?: ReactNode;
  /** Right icon element */
  rightIcon?: ReactNode;
  /** Additional class name for wrapper */
  className?: string;
}

/**
 * Input component with dark theme and gold accent.
 * Provides accessible form input with label, error, and helper text support.
 *
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   type="email"
 *   placeholder="Enter your email"
 *   error="Invalid email format"
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      size = 'md',
      fullWidth = true,
      leftIcon,
      rightIcon,
      className = '',
      id: providedId,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = providedId || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const hasError = Boolean(error);
    const hasHelper = Boolean(helperText) && !hasError;
    const hasLeftIcon = Boolean(leftIcon);
    const hasRightIcon = Boolean(rightIcon);

    // Build input class names
    const inputClassNames = [
      styles.input,
      hasError && styles.inputError,
      size !== 'md' && styles[size],
      hasLeftIcon && styles.hasLeftIcon,
      hasRightIcon && styles.hasRightIcon,
    ]
      .filter(Boolean)
      .join(' ');

    // Build wrapper class names
    const wrapperClassNames = [
      styles.wrapper,
      fullWidth && styles.fullWidth,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    // Build aria-describedby
    const ariaDescribedBy = [
      hasError && errorId,
      hasHelper && helperId,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className={wrapperClassNames}>
        {/* Label */}
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
            {required && <span className={styles.required} aria-hidden="true">*</span>}
          </label>
        )}

        {/* Input wrapper for icons */}
        <div className={styles.inputWrapper}>
          <input
            ref={ref}
            id={inputId}
            className={inputClassNames}
            disabled={disabled}
            required={required}
            aria-invalid={hasError}
            aria-describedby={ariaDescribedBy}
            aria-required={required}
            {...props}
          />

          {/* Left icon */}
          {hasLeftIcon && (
            <span className={styles.leftIconWrapper} aria-hidden="true">
              {leftIcon}
            </span>
          )}

          {/* Right icon */}
          {hasRightIcon && (
            <span className={styles.rightIconWrapper} aria-hidden="true">
              {rightIcon}
            </span>
          )}
        </div>

        {/* Error message */}
        {hasError && (
          <div id={errorId} className={styles.errorMessage} role="alert">
            <svg
              className={styles.errorIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {/* Helper text */}
        {hasHelper && (
          <div id={helperId} className={styles.helperText}>
            {helperText}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;