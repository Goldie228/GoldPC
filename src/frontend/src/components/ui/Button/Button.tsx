import type { ButtonHTMLAttributes, ReactNode, ReactElement } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  /** Vertical rhythm */
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  /**
   * Иконка справа (legacy API — то же, что `rightIcon`, если он не задан).
   */
  icon?: ReactNode;
  children: ReactNode;
}

/**
 * Кнопка в стиле GoldPC: primary (золото), secondary, outline, ghost, danger.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leftIcon,
  rightIcon,
  icon,
  children,
  className = '',
  disabled = false,
  ...props
}: ButtonProps): ReactElement {
  const trailing = rightIcon ?? icon;

  const baseClasses = "inline-flex items-center justify-center gap-2.5 font-semibold tracking-wider text-decoration-none whitespace-nowrap border cursor-pointer rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";

  const variantClasses: Record<string, string> = {
    primary: "bg-gold text-gold-ink border border-gold/10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),_var(--shadow-gold)] hover:bg-gold-active active:bg-gold/90 active:translate-y-[1px]",
    secondary: "bg-surface-elevated text-body-text border border-hairline-dark hover:bg-surface-card active:translate-y-[1px]",
    outline: "bg-transparent text-body-text border border-hairline-dark/10 hover:border-gold/30 hover:bg-gold/5 hover:text-gold active:bg-gold/5",
    ghost: "bg-transparent text-gold border border-gold/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-gold/30 hover:bg-gold/5 hover:text-gold-active active:bg-gold/5",
    danger: "bg-price-rise text-on-dark border border-price-rise/10 hover:bg-price-rise active:translate-y-[1px]",
  };

  const sizeClasses: Record<string, string> = {
    sm: "h-9 px-4 text-sm gap-2",
    md: "h-10 px-6 text-sm",
    lg: "h-12 px-8 text-base",
  };

  const fullWidthClass = "w-full";

  const classNames = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? fullWidthClass : '',
    className,
  ]
    .filter((name): name is string => typeof name === 'string' && name.length > 0)
    .join(' ');

  return (
    <button className={classNames} disabled={disabled} {...props}>
      {leftIcon !== undefined && leftIcon !== null && (
        <span className="inline-flex items-center justify-center flex-shrink-0">{leftIcon}</span>
      )}
      <span className="inline-flex items-center">{children}</span>
      {trailing !== undefined && trailing !== null && (
        <span className="inline-flex items-center justify-center flex-shrink-0">{trailing}</span>
      )}
    </button>
  );
}

export default Button;
