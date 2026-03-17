import { motion } from 'framer-motion';
import type { HTMLMotionProps, Variants } from 'framer-motion';
import type { ReactNode, ReactElement } from 'react';
import { forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import styles from './Card.module.css';

export type CardVariant = 'glass' | 'elevated' | 'outline' | 'gold';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  variant?: CardVariant;
  padding?: CardPadding;
  children: ReactNode;
  icon?: ReactElement<LucideIcon>;
  iconBgColor?: string;
  title?: string;
  subtitle?: string;
  className?: string;
  hoverable?: boolean;
}

const cardVariants: Variants = {
  initial: {
    y: 0,
    boxShadow: 'var(--shadow-md)',
  },
  hover: {
    y: -4,
    boxShadow: 'var(--shadow-lg)',
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'glass',
      padding = 'md',
      children,
      icon,
      iconBgColor,
      title,
      subtitle,
      className = '',
      hoverable = true,
      ...props
    },
    ref
  ) => {
    const classNames = [
      styles.card,
      styles[variant],
      styles[`padding-${padding}`],
      hoverable ? styles.hoverable : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <motion.div
        ref={ref}
        className={classNames}
        variants={hoverable ? cardVariants : undefined}
        initial="initial"
        whileHover={hoverable ? 'hover' : undefined}
        {...props}
      >
        {/* Icon */}
        {icon && (
          <div
            className={styles.iconWrapper}
            style={iconBgColor ? { background: iconBgColor } : undefined}
          >
            {icon}
          </div>
        )}

        {/* Title & Subtitle */}
        {(title || subtitle) && (
          <div className={styles.header}>
            {title && <h3 className={styles.title}>{title}</h3>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        )}

        {/* Content */}
        <div className={styles.content}>{children}</div>
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

export default Card;