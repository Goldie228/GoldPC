import type { ReactNode } from 'react';
import styles from './Card.module.css';

export interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'gold-glass' | 'elevated';
  className?: string;
  onClick?: () => void;
  as?: 'article' | 'div' | 'section';
}

export function Card({ 
  children, 
  variant = 'default', 
  className = '',
  onClick,
  as: Component = 'article'
}: CardProps) {
  const variantClass = variant === 'default' ? '' : styles[variant];
  
  return (
    <Component 
      className={`${styles.card} ${variantClass} ${className}`.trim()}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </Component>
  );
}

export interface CardImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function CardImage({ src, alt, className = '' }: CardImageProps) {
  return (
    <div className={`${styles.imageContainer} ${className}`.trim()}>
      <img 
        src={src} 
        alt={alt} 
        className={styles.image}
        loading="lazy"
      />
    </div>
  );
}

export interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return (
    <div className={`${styles.body} ${className}`.trim()}>
      {children}
    </div>
  );
}

export interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`${styles.header} ${className}`.trim()}>
      {children}
    </div>
  );
}

export interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`${styles.footer} ${className}`.trim()}>
      {children}
    </div>
  );
}