import { useState, type ReactElement } from 'react';
import type { ProductSummary } from '../../api/types';
import { useCart } from '../../hooks/useCart';
import { useToastStore } from '../../store/toastStore';
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
}

interface ContentProps {
  product: ProductSummary;
  stockStatus: StockStatus;
  hasDiscount: boolean;
  inCart: boolean;
  quantityInCart: number;
  isAdding: boolean;
  onAddToCart: () => void;
}

/**
 * Форматирование цены
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Получить статус наличия
 */
function getStockStatus(stock: number): StockStatus {
  if (stock === 0) {
    return { text: 'Нет в наличии', className: styles.outOfStock };
  }
  if (stock <= 3) {
    return { text: `Мало (${stock} шт)`, className: styles.lowStock };
  }
  return { text: `В наличии (${stock} шт)`, className: styles.inStock };
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
 * Контейнер изображения
 */
function ImageContainer({ product, hasDiscount, discountPercent }: ImageContainerProps): ReactElement {
  return (
    <div className={styles.imageContainer}>
      {product.mainImage !== undefined && product.mainImage.url.trim() !== '' ? (
        <img
          src={product.mainImage.url}
          alt={product.mainImage.alt ?? product.name}
          className={styles.image}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            const placeholder = document.createElement('div');
            placeholder.setAttribute('data-placeholder', 'true');
            (e.target as HTMLImageElement).parentElement?.appendChild(placeholder);
          }}
        />
      ) : (
        <ImagePlaceholder />
      )}
      
      {hasDiscount && (
        <span className={styles.discountBadge}>-{discountPercent}%</span>
      )}
      
      {product.rating !== undefined && product.rating >= 4.8 && (
        <span className={styles.hitBadge}>Хит</span>
      )}
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
  onAddToCart 
}: ContentProps): ReactElement {
  const isDisabled = product.stock === 0 || !product.isActive;
  const buttonLabel = inCart 
    ? `Добавить ещё (в корзине ${quantityInCart} шт)` 
    : 'Добавить в корзину';
  const buttonText = inCart ? `В корзине (${quantityInCart})` : 'В корзину';
  const buttonClassName = `${styles.addToCartBtn} ${isAdding ? styles.adding : ''} ${inCart ? styles.inCart : ''}`;

  return (
    <div className={styles.content}>
      {product.manufacturer !== undefined && (
        <span className={styles.manufacturer}>{product.manufacturer.name}</span>
      )}
      
      <h3 className={styles.name}>
        <a href={`/products/${product.id}`} className={styles.link}>
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
          <span className={styles.price}>{formatPrice(product.price)}</span>
          {hasDiscount && product.oldPrice !== undefined && (
            <span className={styles.oldPrice}>{formatPrice(product.oldPrice)}</span>
          )}
        </div>
        
        <button
          className={buttonClassName}
          onClick={onAddToCart}
          disabled={isDisabled}
          aria-label={buttonLabel}
          type="button"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}

/**
 * Карточка товара для каталога
 */
export function ProductCard({ product, onAddToCart }: ProductCardProps): ReactElement {
  const { addToCart, isInCart, getItemQuantity } = useCart();
  const showToast = useToastStore((state) => state.showToast);
  const [isAdding, setIsAdding] = useState(false);

  const inCart = isInCart(product.id);
  const quantityInCart = getItemQuantity(product.id);
  const stockStatus = getStockStatus(product.stock);
  const hasDiscount = product.oldPrice !== undefined && product.oldPrice > product.price;
  const discountPercent = hasDiscount && product.oldPrice !== undefined
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;

  const handleAddToCart = (): void => {
    if (product.stock === 0 || !product.isActive) return;

    setIsAdding(true);
    addToCart(product, 1);
    showToast('Товар добавлен в корзину', 'success');
    
    if (onAddToCart !== undefined) {
      onAddToCart(product.id);
    }

    setTimeout(() => setIsAdding(false), 300);
  };

  return (
    <article className={styles.card} aria-label={`Товар: ${product.name}`}>
      <ImageContainer 
        product={product} 
        hasDiscount={hasDiscount} 
        discountPercent={discountPercent} 
      />
      <Content 
        product={product}
        stockStatus={stockStatus}
        hasDiscount={hasDiscount}
        inCart={inCart}
        quantityInCart={quantityInCart}
        isAdding={isAdding}
        onAddToCart={handleAddToCart}
      />
    </article>
  );
}