import { useState, type ReactElement } from 'react';
import type { ProductSummary } from '../../api/types';
import { useCart } from '../../hooks/useCart';
import { useToastStore } from '../../store/toastStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { Icon } from '../ui/Icon/Icon';
import { Modal } from '../ui/Modal/Modal';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: ProductSummary;
  onAddToCart?: (productId: string) => void;
}

interface StockStatus {
  text: string;
  className: string;
}

interface ImageContainerProps {
  product: ProductSummary;
  hasDiscount: boolean;
  discountPercent: number;
  isQuickViewHovered: boolean;
  onQuickViewOpen: () => void;
  onQuickViewClose: () => void;
  onQuickViewClick: () => void;
}

interface ContentProps {
  product: ProductSummary;
  stockStatus: StockStatus;
  hasDiscount: boolean;
  inCart: boolean;
  quantityInCart: number;
  isAdding: boolean;
  inWishlist: boolean;
  onAddToCart: () => void;
  onDecrement: () => void;
  onIncrement: () => void;
  canIncrement: boolean;
  onToggleWishlist: () => void;
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

/**
 * Получить статус наличия
 */
function getStockStatus(stock: number): StockStatus {
  if (stock === 0) {
    return { text: 'Под заказ', className: styles.outOfStock };
  }
  return { text: 'В наличии', className: styles.inStock };
}

/**
 * SVG-плейсхолдер для отсутствующего изображения (CPU chip icon)
 */
function ImagePlaceholder(): ReactElement {
  return (
    <svg
      className={styles.placeholder}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Центральный чип */}
      <rect x="16" y="16" width="32" height="32" rx="4" strokeWidth="2" stroke="currentColor" />
      {/* Внутренний квадрат */}
      <rect x="22" y="22" width="20" height="20" rx="2" strokeWidth="1.5" stroke="currentColor" opacity="0.6" />
      {/* Пины сверху */}
      <line x1="24" y1="16" x2="24" y2="8" strokeWidth="2" stroke="currentColor" />
      <line x1="32" y1="16" x2="32" y2="8" strokeWidth="2" stroke="currentColor" />
      <line x1="40" y1="16" x2="40" y2="8" strokeWidth="2" stroke="currentColor" />
      {/* Пины снизу */}
      <line x1="24" y1="48" x2="24" y2="56" strokeWidth="2" stroke="currentColor" />
      <line x1="32" y1="48" x2="32" y2="56" strokeWidth="2" stroke="currentColor" />
      <line x1="40" y1="48" x2="40" y2="56" strokeWidth="2" stroke="currentColor" />
      {/* Пины слева */}
      <line x1="16" y1="24" x2="8" y2="24" strokeWidth="2" stroke="currentColor" />
      <line x1="16" y1="32" x2="8" y2="32" strokeWidth="2" stroke="currentColor" />
      <line x1="16" y1="40" x2="8" y2="40" strokeWidth="2" stroke="currentColor" />
      {/* Пины справа */}
      <line x1="48" y1="24" x2="56" y2="24" strokeWidth="2" stroke="currentColor" />
      <line x1="48" y1="32" x2="56" y2="32" strokeWidth="2" stroke="currentColor" />
      <line x1="48" y1="40" x2="56" y2="40" strokeWidth="2" stroke="currentColor" />
      {/* Угловые маркеры */}
      <circle cx="26" cy="26" r="2" fill="currentColor" opacity="0.4" />
      <circle cx="38" cy="26" r="2" fill="currentColor" opacity="0.4" />
      <circle cx="26" cy="38" r="2" fill="currentColor" opacity="0.4" />
      <circle cx="38" cy="38" r="2" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

/**
 * Контейнер изображения с hover actions
 */
function ImageContainer({
  product,
  hasDiscount,
  discountPercent,
  isQuickViewHovered,
  onQuickViewOpen,
  onQuickViewClose,
  onQuickViewClick,
}: ImageContainerProps): ReactElement {
  const [imageError, setImageError] = useState(false);

  const hasValidImage =
    product.mainImage !== undefined &&
    product.mainImage.url.trim() !== '' &&
    !imageError;

  return (
    <div
      className={styles.imageContainer}
      onMouseEnter={onQuickViewOpen}
      onMouseLeave={onQuickViewClose}
    >
      {hasValidImage ? (
        <img
          src={product.mainImage!.url}
          alt={product.mainImage!.alt ?? product.name}
          className={styles.image}
          onError={() => setImageError(true)}
        />
      ) : (
        <ImagePlaceholder />
      )}

      {/* Badge logic: Discount takes priority, Hit shown on right if both exist */}
      {hasDiscount && (
        <span className={styles.discountBadge}>-{discountPercent}%</span>
      )}
      
      {product.rating !== undefined && product.rating >= 4.8 && !hasDiscount && (
        <span className={styles.hitBadge}>Хит</span>
      )}
      
      {product.rating !== undefined && product.rating >= 4.8 && hasDiscount && (
        <span className={styles.hitBadgeRight}>Хит</span>
      )}

      {/* Кнопка быстрого просмотра при hover */}
      <button
        className={`${styles.quickViewBtn} ${isQuickViewHovered ? styles.quickViewVisible : ''}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onQuickViewClick();
        }}
        aria-label="Быстрый просмотр"
        type="button"
      >
        <Icon name="eye" size="sm" />
        <span>Быстрый просмотр</span>
      </button>
    </div>
  );
}

/**
 * Контент карточки
 */
function Content({
  product,
  stockStatus,
  hasDiscount,
  inCart,
  quantityInCart,
  isAdding,
  inWishlist,
  onAddToCart,
  onDecrement,
  onIncrement,
  canIncrement,
  onToggleWishlist,
}: ContentProps): ReactElement {
  const isDisabled = product.stock === 0 || !product.isActive;

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
      {product.manufacturer !== undefined && (
        <span className={styles.manufacturer}>{product.manufacturer.name}</span>
      )}

      <h3 className={styles.name}>
        <a href={`/product/${product.id}`} className={styles.link}>
          {product.name}
        </a>
      </h3>

      <div className={styles.rating}>
        {product.rating !== undefined && (
          <>
            <span className={styles.stars}>
              {'★'.repeat(Math.round(product.rating))}
              {'☆'.repeat(5 - Math.round(product.rating))}
            </span>
            <span className={styles.ratingValue}>{product.rating.toFixed(1)}</span>
          </>
        )}
      </div>

      <p className={stockStatus.className}>{stockStatus.text}</p>

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
          {/* Кнопка избранного (Wishlist) */}
          <button
            className={`${styles.wishlistBtn} ${inWishlist ? styles.wishlistActive : ''}`}
            onClick={onToggleWishlist}
            disabled={isDisabled}
            aria-label={inWishlist ? 'Удалить из избранного' : 'Добавить в избранное'}
            type="button"
          >
            <Icon name="heart" size="md" color={inWishlist ? 'gold' : 'default'} />
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
 * Placeholder контент для модального окна быстрого просмотра
 */
function QuickViewContent({ product }: { product: ProductSummary }): ReactElement {
  return (
    <div className={styles.quickViewContent}>
      <div className={styles.quickViewImage}>
        {product.mainImage !== undefined && product.mainImage.url.trim() !== '' ? (
          <img
            src={product.mainImage.url}
            alt={product.mainImage.alt ?? product.name}
          />
        ) : (
          <div className={styles.quickViewPlaceholder}>
            <Icon name="image" size="2xl" color="secondary" />
          </div>
        )}
      </div>
      <div className={styles.quickViewDetails}>
        {product.manufacturer !== undefined && (
          <span className={styles.quickViewManufacturer}>
            {product.manufacturer.name}
          </span>
        )}
        <h2 className={styles.quickViewName}>{product.name}</h2>
        <div className={styles.quickViewPrice}>
          {formatPrice(product.price)}
        </div>
        {product.rating !== undefined && (
          <div className={styles.quickViewRating}>
            <span className={styles.stars}>
              {'★'.repeat(Math.round(product.rating))}
              {'☆'.repeat(5 - Math.round(product.rating))}
            </span>
            <span>{product.rating.toFixed(1)}</span>
          </div>
        )}
        <p className={styles.quickViewDescription}>
          Подробное описание товара будет доступно на странице товара.
        </p>
        <a
          href={`/product/${product.id}`}
          className={styles.quickViewLink}
        >
          Перейти к товару →
        </a>
      </div>
    </div>
  );
}

/**
 * Карточка товара для каталога
 */
export function ProductCard({ product, onAddToCart }: ProductCardProps): ReactElement {
  const { addToCart, changeQuantity, isInCart, getItemQuantity } = useCart();
  const showToast = useToastStore((state) => state.showToast);
  const { isInWishlist, toggleWishlist } = useWishlistStore();

  const [isAdding, setIsAdding] = useState(false);
  const [isQuickViewHovered, setIsQuickViewHovered] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const inCart = isInCart(product.id);
  const quantityInCart = getItemQuantity(product.id);
  const inWishlist = isInWishlist(product.id);
  const stockStatus = getStockStatus(product.stock);
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

  return (
    <>
      <article className={styles.card} aria-label={`Товар: ${product.name}`}>
        <ImageContainer
          product={product}
          hasDiscount={hasDiscount}
          discountPercent={discountPercent}
          isQuickViewHovered={isQuickViewHovered}
          onQuickViewOpen={() => setIsQuickViewHovered(true)}
          onQuickViewClose={() => setIsQuickViewHovered(false)}
          onQuickViewClick={() => setIsQuickViewOpen(true)}
        />
        <Content
          product={product}
          stockStatus={stockStatus}
          hasDiscount={hasDiscount}
          inCart={inCart}
          quantityInCart={quantityInCart}
          isAdding={isAdding}
          inWishlist={inWishlist}
          onAddToCart={handleAddToCart}
          onDecrement={handleDecrement}
          onIncrement={handleIncrement}
          canIncrement={canIncrement}
          onToggleWishlist={handleToggleWishlist}
        />
      </article>

      {/* Модальное окно быстрого просмотра */}
      <Modal
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        title="Быстрый просмотр"
        size="large"
      >
        <QuickViewContent product={product} />
      </Modal>
    </>
  );
}