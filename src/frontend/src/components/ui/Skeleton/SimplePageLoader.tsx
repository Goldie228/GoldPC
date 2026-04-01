import type { ReactElement } from 'react';
import styles from './SimplePageLoader.module.css';

/**
 * Простой скелетон загрузки страницы с shimmer-эаголовкой
 * Заменяет сложный ProductCardSkeleton для всех страниц
 */
export function SimplePageLoader(): ReactElement {
  return (
    <div className={styles.wrapper}>
      <div className={styles.shimmer} aria-hidden="true" />
      <div className={styles.shimmer} aria-hidden="true" />
      <div className={styles.shimmer} aria-hidden="true" />
      <div className={styles.shimmer} aria-hidden="true" />
      <div className={styles.shimmer} aria-hidden="true" />
      <div className={styles.shimmer} aria-hidden="true" />
      <div className={styles.shimmer} aria-hidden="true" />
      <div className={styles.shimmer} aria-hidden="true" />
      <div className={styles.shimmer} aria-hidden="true" />
      <div className={styles.shimmer} aria-hidden="true" />
      <div className={styles.shimmer} aria-hidden="true" />
      <div className={styles.shimmer} aria-hidden="true" />
      <div className={styles.shimmer} aria-hidden="true" />
    </div>
  );
}