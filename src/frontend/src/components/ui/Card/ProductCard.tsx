import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';
import styles from './Card.module.css';

export interface ProductCardProps {
  /** Product name */
  name: string;
  /** Product category label */
  category?: string;
  /** Product price in BYN */
  price: number;
  /** Optional badge text (TOP, NEW, etc.) */
  badge?: string;
  /** Product image URL or SVG element */
  image?: ReactNode;
  /** Alt text for image */
  imageAlt?: string;
  /** Add to cart callback */
  onAddToCart?: () => void;
  /** Product link */
  href?: string;
  /** Additional CSS class */
  className?: string;
}

/**
 * ProductCard component for displaying products
 * Styles based on prototypes/home.html .product-card
 */
export function ProductCard({
  name,
  category,
  price,
  badge,
  image,
  imageAlt: _imageAlt,
  onAddToCart,
  href,
  className = '',
}: ProductCardProps) {
  const formatPrice = (value: number): string => {
    return new Intl.NumberFormat('ru-BY', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const cardContent = (
    <>
      {/* Badge (TOP, NEW, etc.) */}
      {badge && (
        <span className={styles.productBadge}>{badge}</span>
      )}

      {/* Product Image */}
      <div className={styles.imageContainer}>
        {image || (
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="15" y="15" width="70" height="70" rx="4" fill="#1a1a1e" stroke="#3a3a3e"/>
            <rect x="30" y="30" width="40" height="40" rx="2" fill="#121214"/>
            <circle cx="50" cy="50" r="10" stroke="#d4a574" strokeWidth="1" fill="none"/>
          </svg>
        )}
      </div>

      {/* Product Info */}
      <div className={styles.productInfo}>
        {/* Category Label */}
        {category && (
          <div className={styles.productCategory}>{category}</div>
        )}

        {/* Product Name */}
        <h3 className={styles.productName}>
          {href ? (
            <a href={href} className={styles.productNameLink}>{name}</a>
          ) : (
            name
          )}
        </h3>

        {/* Price and Action */}
        <div className={styles.productMeta}>
          <span className={styles.productPrice}>{formatPrice(price)} BYN</span>
          
          {onAddToCart && (
            <button
              className={styles.productAction}
              onClick={onAddToCart}
              aria-label="Добавить в корзину"
              type="button"
            >
              <Plus />
            </button>
          )}
        </div>
      </div>
    </>
  );

  const classNames = [
    styles.card,
    styles.product,
    styles.hoverable,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={classNames}>
      {cardContent}
    </article>
  );
}

export default ProductCard;