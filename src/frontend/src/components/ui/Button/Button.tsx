import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { ReactElement } from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant: 'primary' (gold) or 'ghost' (transparent) */
  variant?: 'primary' | 'ghost';
  /** Button content */
  children: ReactNode;
  /** Optional icon (SVG) to display */
  icon?: ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Button component matching the luxury GoldPC prototype.
 * Supports primary (gold background) and ghost (transparent) variants.
 */
export function Button({
  variant = 'primary',
  children,
  icon,
  onClick,
  disabled = false,
  className = '',
  ...props
}: ButtonProps): ReactElement {
  const classNames = [
    styles.btn,
    styles[variant],
    className,
  ].filter((name): name is string => typeof name === 'string' && name.length > 0).join(' ');

  return (
    <button
      className={classNames}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
      {icon !== undefined && icon !== null && <span className={styles.icon}>{icon}</span>}
    </button>
  );
}

export default Button;