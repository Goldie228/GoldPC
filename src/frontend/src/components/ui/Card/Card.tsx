import type { ReactNode, ReactElement } from 'react';
import type { LucideIcon } from 'lucide-react';

const baseClasses = "bg-surface-card border border-hairline-dark shadow-[inset_0_0_20px_var(--hairline-dark)] transition-all relative overflow-hidden rounded-lg";

const variantClasses: Record<string, string> = {
  default: "",
  category: "p-6 md:p-6 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-gold after:scale-x-0 after:origin-left after:transition-transform after:duration-300 hover:after:scale-x-100",
  product: "relative",
  elevated: "shadow-lg hover:shadow-xl",
};

const hoverableClass = "hover:border-gold hover:shadow-[var(--shadow-lg),var(--shadow-gold)] hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2";

export type CardVariant = 'default' | 'category' | 'product' | 'elevated';
export type CardAs = 'article' | 'div' | 'section';

export interface CardProps {
  /** Карточка variant for different use cases */
  variant?: CardVariant;
  /** Карточка content */
  children: ReactNode;
  /** Optional icon (for category cards) */
  icon?: ReactElement<LucideIcon>;
  /** Карточка title */
  title?: string;
  /** Optional badge text */
  badge?: string;
  /** Enable hover effects */
  hoverable?: boolean;
  /** HTML element to render as */
  as?: CardAs;
  /** Дополнительный CSS class */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

/**
 * Generic Карточка component - dark background with thin border
 * Supports category and product карточка variants from prototypes/home.html
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
    baseClasses,
    variant !== 'default' ? variantClasses[variant] : '',
    hoverable ? hoverableClass : '',
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
        <div className="w-12 h-12 flex items-center justify-center bg-surface-elevated mb-6 text-muted-text">
          {icon}
        </div>
      )}

      {(title || badge) && (
        <div className="flex justify-between items-center mb-5">
          {title && <span className="text-xs font-semibold uppercase tracking-wider text-body-text">{title}</span>}
          {badge && <span className="font-sans text-[11px] px-2 py-1 bg-gold/10 text-gold border border-gold/30">{badge}</span>}
        </div>
      )}

      {children}
    </Component>
  );
}

// SUBCOMPONENTS =====

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className = '', ...props }: CardBodyProps) {
  return (
    <div className={`p-6 border-t border-hairline-dark ${className}`.trim()} {...props}>
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
    <div className={`flex justify-between items-center mb-5 ${className}`.trim()} {...props}>
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
    <span className={`text-xs font-semibold uppercase tracking-wider text-body-text ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}

export default Card;