import { useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { hasValidProductImage } from '../../utils/image';
import type { ProductSummary, ProductCategory } from '../../api/types';
import { useCart } from '../../hooks/useCart';
import { useToastStore } from '../../store/toastStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { useComparisonStore } from '../../store/comparisonStore';
import { Icon } from '../ui/Icon/Icon';
import { OptimizedImage } from '../ui/Image/OptimizedImage';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: ProductSummary;
  onAddToCart?: (productId: string) => void;
  viewMode?: 'grid' | 'list';
  /** Первые карточки above the fold: высокий приоритет LCP */
  imageFetchPriority?: 'high' | 'low' | 'auto';
}

interface ImageContainerProps {
  product: ProductSummary;
  hasDiscount: boolean;
  discountPercent: number;
  onToggleWishlist: () => void;
  inWishlist: boolean;
  isDisabled: boolean;
  imageFetchPriority?: 'high' | 'low' | 'auto';
}

interface ContentProps {
  product: ProductSummary;
  hasDiscount: boolean;
  inCart: boolean;
  quantityInCart: number;
  isAdding: boolean;
  inComparison: boolean;
  onAddToCart: () => void;
  onDecrement: () => void;
  onIncrement: () => void;
  canIncrement: boolean;
  onToggleComparison: () => void;
}

/**
 * Форматирование цены в BYN
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'BYN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function extractRatingValue(rating: ProductSummary['rating']): number | null {
  if (typeof rating === 'number') return rating;
  if (rating != null && typeof rating === 'object' && 'average' in rating) {
    return typeof rating.average === 'number' ? rating.average : null;
  }
  return null;
}

/**
 * Премиальный SVG-плейсхолдер — шестиугольник (отсылка к логотипу GoldPC).
 * Минимализм, тонкие линии, стиль Dark Luxury.
 */
function NeutralPlaceholder(): ReactElement {
  const cx = 32;
  const cy = 32;
  const r = 20;
  const angles = [0, 60, 120, 180, 240, 300].map((d) => {
    const rad = (d * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  });
  const pathD = angles
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ') + ' Z';
  return (
    <svg
      className={styles.placeholder}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d={pathD} strokeWidth="1.5" stroke="currentColor" strokeLinejoin="round" fill="none" opacity="0.4" />
    </svg>
  );
}

/**
 * CPU-чип плейсхолдер (только для процессоров)
 */
function CpuPlaceholder(): ReactElement {
  return (
    <svg
      className={styles.placeholder}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="16" y="16" width="32" height="32" rx="4" strokeWidth="2" stroke="currentColor" />
      <rect x="22" y="22" width="20" height="20" rx="2" strokeWidth="1.5" stroke="currentColor" opacity="0.6" />
      <line x1="24" y1="16" x2="24" y2="8" strokeWidth="2" stroke="currentColor" />
      <line x1="32" y1="16" x2="32" y2="8" strokeWidth="2" stroke="currentColor" />
      <line x1="40" y1="16" x2="40" y2="8" strokeWidth="2" stroke="currentColor" />
      <line x1="24" y1="48" x2="24" y2="56" strokeWidth="2" stroke="currentColor" />
      <line x1="32" y1="48" x2="32" y2="56" strokeWidth="2" stroke="currentColor" />
      <line x1="40" y1="48" x2="40" y2="56" strokeWidth="2" stroke="currentColor" />
      <line x1="16" y1="24" x2="8" y2="24" strokeWidth="2" stroke="currentColor" />
      <line x1="16" y1="32" x2="8" y2="32" strokeWidth="2" stroke="currentColor" />
      <line x1="16" y1="40" x2="8" y2="40" strokeWidth="2" stroke="currentColor" />
      <line x1="48" y1="24" x2="56" y2="24" strokeWidth="2" stroke="currentColor" />
      <line x1="48" y1="32" x2="56" y2="32" strokeWidth="2" stroke="currentColor" />
      <line x1="48" y1="40" x2="56" y2="40" strokeWidth="2" stroke="currentColor" />
      <circle cx="26" cy="26" r="2" fill="currentColor" opacity="0.4" />
      <circle cx="38" cy="26" r="2" fill="currentColor" opacity="0.4" />
      <circle cx="26" cy="38" r="2" fill="currentColor" opacity="0.4" />
      <circle cx="38" cy="38" r="2" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

function getImagePlaceholder(category: ProductCategory): ReactElement {
  return category === 'cpu' ? <CpuPlaceholder /> : <NeutralPlaceholder />;
}

/**
 * Контейнер изображения с переключением картинок
 */
function ImageContainer({
  product,
  hasDiscount,
  discountPercent,
  onToggleWishlist,
  inWishlist,
  isDisabled,
  imageFetchPriority,
}: ImageContainerProps): ReactElement {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const ratingValue = extractRatingValue(product.rating);

  const images = product.images && product.images.length > 0 
    ? product.images 
    : product.mainImage 
      ? [product.mainImage] 
      : [];
  
  const hasMultipleImages = images.length > 1;
  const currentImage = images[currentImageIndex];
  const hasValidImage = hasValidProductImage(currentImage?.url);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className={styles.imageContainer}>
      <Link to={`/product/${product.id}`} className={styles.imageLink}>
        <div className={styles.imageWrapper}>
          {hasValidImage ? (
            <OptimizedImage
              src={currentImage.url}
              alt={currentImage.alt ?? product.name}
              className={styles.image}
              aspectRatio={1}
              placeholder={getImagePlaceholder(product.category)}
              fetchPriority={imageFetchPriority}
              loading={imageFetchPriority === 'high' ? 'eager' : 'lazy'}
            />
          ) : (
            <div className={styles.placeholderWrapper}>
              {getImagePlaceholder(product.category)}
            </div>
          )}
        </div>
      </Link>

      {/* Навигация по изображениям */}
      {hasMultipleImages && (
        <>
          <button
            className={`${styles.navBtn} ${styles.prevBtn}`}
            onClick={handlePrevImage}
            aria-label="Предыдущее изображение"
            type="button"
          >
            <Icon name="chevron-left" size="sm" />
          </button>
          <button
            className={`${styles.navBtn} ${styles.nextBtn}`}
            onClick={handleNextImage}
            aria-label="Следующее изображение"
            type="button"
          >
            <Icon name="chevron-right" size="sm" />
          </button>
          <div className={styles.imageDots}>
            {images.map((_, i) => (
              <div
                key={i}
                className={`${styles.dot} ${i === currentImageIndex ? styles.dotActive : ''}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Badge logic: Discount takes priority, Hit shown on right if both exist */}
      {hasDiscount && (
        <span className={styles.discountBadge}>-{discountPercent}%</span>
      )}
      
      {ratingValue != null && ratingValue >= 4.8 && !hasDiscount && (
        <span className={styles.hitBadge}>Хит</span>
      )}
      
      {ratingValue != null && ratingValue >= 4.8 && hasDiscount && (
        <span className={styles.hitBadgeRight}>Хит</span>
      )}

      {/* Кнопка избранного всегда видна на мобильных или при hover на десктопе */}
      <button
        className={`${styles.wishlistCornerBtn} ${inWishlist ? styles.wishlistActive : ''}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleWishlist();
        }}
        disabled={isDisabled}
        aria-label={inWishlist ? 'Удалить из избранного' : 'Добавить в избранное'}
        type="button"
      >
        <Icon name="heart" size="sm" color={inWishlist ? 'gold' : 'default'} />
      </button>
    </div>
  );
}

/**
 * Контент карточки
 */
function Content({
  product,
  hasDiscount,
  inCart,
  quantityInCart,
  isAdding,
  inComparison,
  onAddToCart,
  onDecrement,
  onIncrement,
  canIncrement,
  onToggleComparison,
}: ContentProps): ReactElement {
  const isDisabled = product.stock === 0 || !product.isActive;
  const ratingValue = extractRatingValue(product.rating);

  // Определяем состояние кнопки корзины
  const getCartButtonContent = (): ReactElement => {
    if (isAdding) {
      return (
        <>
          <Icon name="loader" size="sm" animated />
          <span>Добавление...</span>
        </>
      );
    }
    return <span>В корзину</span>;
  };

  const buttonClassName = [
    styles.addToCartBtn,
    isAdding ? styles.adding : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.content}>
      {product.manufacturer != null && (
        <span className={styles.manufacturer}>{product.manufacturer.name}</span>
      )}

      <h3 className={styles.name}>
        <Link to={`/product/${product.id}`} className={styles.link}>
          {product.name}
        </Link>
      </h3>

      <div className={styles.rating}>
        {ratingValue != null && !Number.isNaN(ratingValue) && (
          <>
            <span className={styles.stars}>
              {'★'.repeat(Math.round(ratingValue))}
              {'☆'.repeat(5 - Math.round(ratingValue))}
            </span>
            <span className={styles.ratingValue}>{ratingValue.toFixed(1)}</span>
          </>
        )}
      </div>

      <div className={styles.priceRow}>
        <div className={styles.prices}>
          <span className={`${styles.price} tabular-nums`}>
            {formatPrice(product.price)}
          </span>
          {hasDiscount && product.oldPrice !== undefined && (
            <span className={`${styles.oldPrice} tabular-nums`}>
              {formatPrice(product.oldPrice)}
            </span>
          )}
        </div>

        <div className={styles.actions}>
          {/* Кнопка сравнения */}
          <button
            className={`${styles.compareBtn} ${inComparison ? styles.compareActive : ''}`}
            onClick={onToggleComparison}
            disabled={isDisabled}
            aria-label={inComparison ? 'Удалить из сравнения' : 'Добавить в сравнение'}
            type="button"
          >
            <Icon name="compare" size="md" color={inComparison ? 'gold' : 'default'} />
          </button>

          {/* Кнопка корзины или блок +/- */}
          {inCart ? (
            <div className={styles.quantityControls}>
              <button
                className={styles.quantityButton}
                onClick={onDecrement}
                disabled={isDisabled}
                aria-label="Уменьшить количество"
                type="button"
              >
                <Icon name="minus" size="sm" />
              </button>
              <span className={styles.quantityValue}>{quantityInCart}</span>
              <button
                className={styles.quantityButton}
                onClick={onIncrement}
                disabled={isDisabled || !canIncrement}
                aria-label="Увеличить количество"
                type="button"
              >
                <Icon name="plus" size="sm" />
              </button>
            </div>
          ) : (
            <button
              className={buttonClassName}
              onClick={onAddToCart}
              disabled={isDisabled || isAdding}
              aria-label="Добавить в корзину"
              type="button"
            >
              {getCartButtonContent()}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Карточка товара для каталога
 */
export function ProductCard({
  product,
  onAddToCart,
  viewMode = 'grid',
  imageFetchPriority,
}: ProductCardProps): ReactElement {
  const { addToCart, changeQuantity, isInCart, getItemQuantity } = useCart();
  const showToast = useToastStore((state) => state.showToast);
  const { isInWishlist, toggleWishlist } = useWishlistStore();
  const { isInComparison, toggleComparison } = useComparisonStore();

  const [isAdding, setIsAdding] = useState(false);

  const inCart = isInCart(product.id);
  const quantityInCart = getItemQuantity(product.id);
  const inWishlist = isInWishlist(product.id);
  const inComparison = isInComparison(product.id);
  const hasDiscount =
    product.oldPrice !== undefined && product.oldPrice > product.price;
  const discountPercent =
    hasDiscount && product.oldPrice !== undefined
      ? Math.round((1 - product.price / product.oldPrice) * 100)
      : 0;

  const canIncrement =
    product.stock <= 0 || quantityInCart < product.stock;

  const handleAddToCart = (): void => {
    if (product.stock === 0 || !product.isActive) return;

    setIsAdding(true);
    addToCart(product, 1);
    showToast('Товар добавлен в корзину', 'success');

    if (onAddToCart !== undefined) {
      onAddToCart(product.id);
    }

    setTimeout(() => setIsAdding(false), 500);
  };

  const handleDecrement = (): void => {
    if (quantityInCart <= 1) {
      changeQuantity(product.id, -1);
      showToast('Товар удалён из корзины', 'info');
    } else {
      changeQuantity(product.id, -1);
    }
  };

  const handleIncrement = (): void => {
    if (!canIncrement) return;
    changeQuantity(product.id, 1);
  };

  const handleToggleWishlist = (): void => {
    toggleWishlist(product.id);
    if (inWishlist) {
      showToast('Удалено из избранного', 'info');
    } else {
      showToast('Добавлено в избранное', 'success');
    }
  };

  const handleToggleComparison = (): void => {
    if (inComparison) {
      toggleComparison(product.id, product.category);
      showToast('Удалено из сравнения', 'info');
      return;
    }
    const result = toggleComparison(product.id, product.category);
    if (result.success) {
      showToast('Добавлено в сравнение', 'success');
    } else if (result.reason === 'category') {
      showToast('Можно сравнивать только товары одной категории', 'info');
    } else {
      showToast('Максимум 4 товара в сравнении', 'info');
    }
  };

  return (
    <article className={`${styles.card} ${viewMode === 'list' ? styles.cardList : ''}`} aria-label={`Товар: ${product.name}`}>
      <ImageContainer
        product={product}
        hasDiscount={hasDiscount}
        discountPercent={discountPercent}
        onToggleWishlist={handleToggleWishlist}
        inWishlist={inWishlist}
        isDisabled={product.stock === 0 || !product.isActive}
        imageFetchPriority={imageFetchPriority}
      />
      <Content
        product={product}
        hasDiscount={hasDiscount}
        inCart={inCart}
        quantityInCart={quantityInCart}
        isAdding={isAdding}
        inComparison={inComparison}
        onAddToCart={handleAddToCart}
        onDecrement={handleDecrement}
        onIncrement={handleIncrement}
        canIncrement={canIncrement}
        onToggleComparison={handleToggleComparison}
      />
    </article>
  );
}