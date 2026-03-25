import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './OptimizedImage.module.css';

interface OptimizedImageProps {
  src: string;
  alt: string;
  aspectRatio?: number; // width / height
  className?: string;
  placeholder?: React.ReactNode;
  loading?: 'lazy' | 'eager';
  /** LCP / hero: передать high для приоритета загрузки */
  fetchPriority?: 'high' | 'low' | 'auto';
  sizes?: string;
  srcSet?: string;
  width?: number;
  height?: number;
  decoding?: 'async' | 'auto' | 'sync';
}

export function OptimizedImage({
  src,
  alt,
  aspectRatio = 1,
  className = '',
  placeholder,
  loading = 'lazy',
  fetchPriority,
  sizes,
  srcSet,
  width,
  height,
  decoding = 'async',
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) return;
    setIsLoaded(false);
    setError(false);
  }, [src]);

  return (
    <div 
      className={`${styles.container} ${className}`} 
      style={{ aspectRatio: String(aspectRatio) }}
    >
      <AnimatePresence>
        {!isLoaded && !error && (
          <motion.div 
            className={styles.placeholder}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {placeholder || <div className={styles.skeleton} />}
          </motion.div>
        )}
      </AnimatePresence>

      {!error ? (
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding={decoding}
          width={width}
          height={height}
          fetchPriority={fetchPriority}
          className={`${styles.image} ${isLoaded ? styles.loaded : ''}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
          sizes={sizes}
          srcSet={srcSet}
        />
      ) : (
        <div className={styles.error}>
          <span>Failed to load image</span>
        </div>
      )}
    </div>
  );
}
