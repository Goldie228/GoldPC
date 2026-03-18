import type { ReactElement } from 'react';
import { Skeleton } from './Skeleton';
import styles from './ProductCardSkeleton.module.css';

/**
 * Скелетон карточки товара
 * Имитирует структуру ProductCard для отображения при загрузке
 */
export function ProductCardSkeleton(): ReactElement {
  return (
    <article className={styles.card} aria-hidden="true">
      {/* Image Container */}
      <div className={styles.imageContainer}>
        <Skeleton 
          width="100%" 
          height="100%" 
          borderRadius="none"
        />
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Manufacturer */}
        <Skeleton 
          width={80} 
          height={12} 
          className={styles.manufacturer}
        />

        {/* Product Name */}
        <Skeleton 
          width="90%" 
          height={20} 
          className={styles.name}
        />

        {/* Rating */}
        <div className={styles.rating}>
          <Skeleton 
            width={60} 
            height={14} 
            borderRadius="sm"
          />
          <Skeleton 
            width={24} 
            height={14} 
            borderRadius="sm"
          />
        </div>

        {/* Stock Status */}
        <Skeleton 
          width={100} 
          height={12} 
          className={styles.stock}
        />

        {/* Price Row */}
        <div className={styles.priceRow}>
          <div className={styles.prices}>
            <Skeleton 
              width={100} 
              height={20} 
              borderRadius="sm"
            />
          </div>
          
          <Skeleton 
            width={100} 
            height={40} 
            borderRadius="sm"
          />
        </div>
      </div>
    </article>
  );
}

export default ProductCardSkeleton;