import { useMemo, useState, useEffect, useRef } from 'react';
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
  const [retryToken, setRetryToken] = useState(0);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const effectiveSrc = useMemo(() => {
    if (!src) return src;
    // Allow retry without relying on browser cache behavior
    if (retryToken === 0) return src;
    const sep = src.includes('?') ? '&' : '?';
    return `${src}${sep}retry=${retryToken}`;
  }, [src, retryToken]);

  useEffect(() => {
    if (!src) return;
    setIsLoaded(false);
    setError(false);
    setRetryToken(0);
  }, [src]);

  useEffect(() => {
    if (!effectiveSrc) return;

    let finished = false;
    const preload = new Image();
    preload.decoding = decoding;
    const timeoutId = window.setTimeout(() => {
      if (finished) return;
      finished = true;
      setError(true);
    }, 12000);

    preload.onload = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timeoutId);
      setIsLoaded(true);
    };
    preload.onerror = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timeoutId);
      setError(true);
    };

    preload.src = effectiveSrc;

    // If the DOM <img> already has it cached/complete, sync state
    if (imgRef.current && imgRef.current.src === effectiveSrc && imgRef.current.complete) {
      setIsLoaded(true);
      window.clearTimeout(timeoutId);
      finished = true;
    }

    return () => {
      window.clearTimeout(timeoutId);
      preload.onload = null;
      preload.onerror = null;
      finished = true;
    };
  }, [effectiveSrc, decoding]);

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
          ref={imgRef}
          src={effectiveSrc}
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
          <span>Не удалось загрузить изображение</span>
          <button
            type="button"
            className={styles.retryButton}
            onClick={() => {
              setError(false);
              setIsLoaded(false);
              setRetryToken((t) => t + 1);
            }}
          >
            Повторить
          </button>
        </div>
      )}
    </div>
  );
}
