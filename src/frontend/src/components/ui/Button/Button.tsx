import type { ButtonHTMLAttributes, ReactNode, ReactElement } from 'react';
import styles from './Button.module.css';

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

  const classNames = [
    styles.btn,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    className,
  ]
    .filter((name): name is string => typeof name === 'string' && name.length > 0)
    .join(' ');

  return (
    <button className={classNames} disabled={disabled} {...props}>
      {leftIcon !== undefined && leftIcon !== null && (
        <span className={styles.icon}>{leftIcon}</span>
      )}
      <span className={styles.text}>{children}</span>
      {trailing !== undefined && trailing !== null && (
        <span className={styles.icon}>{trailing}</span>
      )}
    </button>
  );
}

export default Button;
