import type { ReactNode, ReactElement } from 'react';
import type { LucideIcon } from 'lucide-react';
import styles from './Card.module.css';

export type CardVariant = 'default' | 'category' | 'product' | 'elevated';
export type CardAs = 'article' | 'div' | 'section';

export interface CardProps {
  /** Card variant for different use cases */
  variant?: CardVariant;
  /** Card content */
  children: ReactNode;
  /** Optional icon (for category cards) */
  icon?: ReactElement<LucideIcon>;
  /** Card title */
  title?: string;
  /** Optional badge text */
  badge?: string;
  /** Enable hover effects */
  hoverable?: boolean;
  /** HTML element to render as */
  as?: CardAs;
  /** Additional CSS class */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

/**
 * Generic Card component - dark background with thin border
 * Supports category and product card variants from prototypes/home.html
 */
export function Card({
  variant = 'default',
  children,
  icon,
  title,
  badge,
  hoverable = true,
  as = 'article',
  className = '',
  onClick,
}: CardProps) {
  const classNames = [
    styles.card,
    variant !== 'default' ? styles[variant] : '',
    hoverable ? styles.hoverable : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const Component = as;

  return (
    <Component 
      className={classNames} 
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {icon && (
        <div className={styles.iconWrapper}>
          {icon}
        </div>
      )}
      
      {(title || badge) && (
        <div className={styles.header}>
          {title && <span className={styles.title}>{title}</span>}
          {badge && <span className={styles.badge}>{badge}</span>}
        </div>
      )}
      
      {children}
    </Component>
  );
}

// ===== SUBCOMPONENTS =====

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className = '', ...props }: CardBodyProps) {
  return (
    <div className={`${styles.body} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '', ...props }: CardHeaderProps) {
  return (
    <div className={`${styles.header} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export interface CardTitleProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  className?: string;
}

export function CardTitle({ children, className = '', ...props }: CardTitleProps) {
  return (
    <span className={`${styles.title} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}

export default Card;