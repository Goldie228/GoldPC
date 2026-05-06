import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

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
      "w-full px-4 py-3 font-sans text-base text-body-text bg-surface-elevated border border-hairline-dark rounded-md outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-canvas-dark focus:border-gold focus:shadow-[0_0_0_3px_var(--border-brand)] focus:bg-surface-card",
      hasError && "border-price-rise focus:border-price-rise focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]",
      size === 'sm' && "px-3 py-2 text-sm",
      size === 'lg' && "px-5 py-4 text-lg",
      hasLeftIcon && "pl-11",
      hasRightIcon && "pr-11",
    ]
      .filter(Boolean)
      .join(' ');

    // Build wrapper class names
    const wrapperClassNames = [
      "flex flex-col gap-1.5",
      fullWidth && "w-full",
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
          <label htmlFor={inputId} className="flex items-center gap-1 font-sans text-xs font-medium uppercase tracking-wider text-body-text">
            {label}
            {required && <span className="text-gold" aria-hidden="true">*</span>}
          </label>
        )}

        {/* Input wrapper for icons */}
        <div className="relative w-full">
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
            <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-text pointer-events-none transition-colors peer-focus:text-gold" aria-hidden="true">
              {leftIcon}
            </span>
          )}

          {/* Right icon */}
          {hasRightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-text" aria-hidden="true">
              {rightIcon}
            </span>
          )}
        </div>

        {/* Error message */}
        {hasError && (
          <div id={errorId} className="flex items-center gap-1.5 font-sans text-xs text-price-rise" role="alert">
            <AlertCircle className="flex-shrink-0 w-3.5 h-3.5" aria-hidden="true" />
            {error}
          </div>
        )}

        {/* Helper text */}
        {hasHelper && (
          <div id={helperId} className="font-sans text-xs text-muted-text">
            {helperText}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;