import { useState, type ReactNode } from 'react';
import { Plus, Check, ShoppingCart, Minus } from 'lucide-react';
import { useCartStore } from '../../../store/cartStore';
import type { ProductCategory } from '../../../api/types';
import styles from './Card.module.css';

export interface ProductCardProps {
  /** Product ID for cart operations */
  id?: string;
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
  /** Add to cart callback (optional - if not provided, uses built-in cart logic) */
  onAddToCart?: () => void;
  /** Product link */
  href?: string;
  /** Additional CSS class */
  className?: string;
  /** Is product a "Hit" (bestseller) */
  isHit?: boolean;
  /** Discount percentage (e.g., 15 for 15% off) */
  discount?: number;
  /** Show add to cart button even without onAddToCart callback */
  showCartButton?: boolean;
}

/**
 * ProductCard component for displaying products
 * Styles based on prototypes/home.html .product-card
 */
export function ProductCard({
  id,
  name,
  category,
  price,
  badge,
  image,
  imageAlt: _imageAlt,
  onAddToCart,
  href,
  className = '',
  isHit,
  discount,
  showCartButton = true,
}: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const cartItems = useCartStore((state) => state.items);
  
  // Get cart item for quantity
  const cartItem = id ? cartItems.find((item) => item.productId === id) : null;
  const isInCart = cartItem !== null;
  const quantity = cartItem?.quantity || 0;

  const formatPrice = (value: number): string => {
    return new Intl.NumberFormat('ru-BY', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart();
      return;
    }

    if (!id) {
      console.warn('ProductCard: Cannot add to cart without product id');
      return;
    }

    setIsAdding(true);
    
    // Create minimal product object for cart
    const product = {
      id,
      name,
      category: (category || 'keyboard') as ProductCategory,
      price,
      sku: '',
      stock: 1,
      isActive: true,
    };

    addItem(product);

    // Visual feedback
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      setIsAdding(false);
    }, 1500);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!id) return;
    const product = {
      id,
      name,
      category: (category || 'keyboard') as ProductCategory,
      price,
      sku: '',
      stock: 1,
      isActive: true,
    };
    addItem(product);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!id) return;
    if (quantity <= 1) {
      removeItem(id);
    } else {
      updateQuantity(id, quantity - 1);
    }
  };

  // Badge logic:
  // - Discount badge (Top-Left) if product has discount
  // - Hit badge (Top-Left) if product is Hit AND has no discount
  // - If both discount and hit: Discount (Top-Left) and Hit (Top-Right)
  const hasDiscount = discount !== undefined && discount > 0;
  const showDiscountBadge = hasDiscount;
  const showHitBadgeTopLeft = isHit && !hasDiscount;
  const showHitBadgeTopRight = isHit && hasDiscount;

  // Show cart button if onAddToCart is provided OR showCartButton is true with valid id
  const shouldShowCartButton = onAddToCart || (showCartButton && id);

  const cardContent = (
    <>
      {/* Discount Badge (Top-Left) */}
      {showDiscountBadge && (
        <span className={styles.discountBadge}>-{discount}%</span>
      )}

      {/* Hit Badge (Top-Left) - only when no discount */}
      {showHitBadgeTopLeft && (
        <span className={styles.hitBadge}>ХИТ</span>
      )}

      {/* Hit Badge (Top-Right) - when discount exists */}
      {showHitBadgeTopRight && (
        <span className={`${styles.hitBadge} ${styles.hitBadgeRight}`}>ХИТ</span>
      )}

      {/* Generic Badge (TOP, NEW, etc.) - kept for backward compatibility */}
      {badge && !showDiscountBadge && !showHitBadgeTopLeft && !showHitBadgeTopRight && (
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
          
          {shouldShowCartButton && (
            isInCart ? (
              <div className={styles.quantityControls}>
                <button
                  className={styles.quantityButton}
                  onClick={handleDecrement}
                  aria-label="Уменьшить количество"
                  type="button"
                >
                  <Minus size={14} />
                </button>
                <span className={styles.quantityValue}>{quantity}</span>
                <button
                  className={styles.quantityButton}
                  onClick={handleIncrement}
                  aria-label="Увеличить количество"
                  type="button"
                >
                  <Plus size={14} />
                </button>
                <Check className={styles.inCartCheck} size={14} />
              </div>
            ) : (
              <button
                className={`${styles.productAction} ${justAdded ? styles.added : ''}`}
                onClick={handleAddToCart}
                disabled={isAdding}
                aria-label={justAdded ? 'Добавлено в корзину' : 'Добавить в корзину'}
                type="button"
              >
                {justAdded ? (
                  <Check />
                ) : (
                  <Plus />
                )}
              </button>
            )
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