import { motion } from 'framer-motion';
import type { HTMLMotionProps, Variants } from 'framer-motion';
import { forwardRef } from 'react';
import type { ReactNode } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'gold' | 'ghost' | 'primary' | 'secondary';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isLoading?: boolean;
  className?: string;
}

const buttonVariants: Variants = {
  initial: {
    scale: 1,
  },
  hover: {
    scale: 1.02,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 17,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 17,
    },
  },
};

const shimmerVariants: Variants = {
  initial: {
    x: '-100%',
  },
  hover: {
    x: '100%',
    transition: {
      duration: 0.6,
      ease: 'easeInOut',
    },
  },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'gold',
      size = 'md',
      children,
      fullWidth = false,
      leftIcon,
      rightIcon,
      isLoading = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const classNames = [
      styles.button,
      styles[variant],
      styles[size],
      fullWidth ? styles.fullWidth : '',
      isLoading ? styles.loading : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <motion.button
        ref={ref}
        className={classNames}
        variants={buttonVariants}
        initial="initial"
        whileHover={!disabled && !isLoading ? 'hover' : undefined}
        whileTap={!disabled && !isLoading ? 'tap' : undefined}
        disabled={disabled || isLoading}
        {...props}
      >
        {/* Shimmer effect for gold variant */}
        {variant === 'gold' && !disabled && (
          <motion.span
            className={styles.shimmer}
            variants={shimmerVariants}
            initial="initial"
            whileHover="hover"
          />
        )}

        {/* Loading spinner */}
        {isLoading && (
          <span className={styles.spinner}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </span>
        )}

        {/* Left icon */}
        {leftIcon && !isLoading && (
          <span className={styles.leftIcon}>{leftIcon}</span>
        )}

        {/* Button text */}
        <span className={styles.content}>{children}</span>

        {/* Right icon */}
        {rightIcon && !isLoading && (
          <span className={styles.rightIcon}>{rightIcon}</span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;