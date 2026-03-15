import type { ProductSummary } from '../../api/types';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: ProductSummary;
  onAddToCart?: (productId: string) => void;
}

/**
 * Карточка товара для каталога
 */
export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStockStatus = (): { text: string; className: string } => {
    if (product.stock === 0) {
      return { text: 'Нет в наличии', className: styles.outOfStock };
    }
    if (product.stock <= 3) {
      return { text: `Мало (${product.stock} шт)`, className: styles.lowStock };
    }
    return { text: `В наличии (${product.stock} шт)`, className: styles.inStock };
  };

  const stockStatus = getStockStatus();
  const hasDiscount = product.oldPrice && product.oldPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / product.oldPrice!) * 100)
    : 0;

  const handleAddToCart = () => {
    if (product.stock > 0 && product.isActive && onAddToCart) {
      onAddToCart(product.id);
    }
  };

  return (
    <article className={styles.card} aria-label={`Товар: ${product.name}`}>
      <div className={styles.imageContainer}>
        {product.mainImage ? (
          <img
            src={product.mainImage.url}
            alt={product.mainImage.alt || product.name}
            className={styles.image}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.png';
            }}
          />
        ) : (
          <div className={styles.placeholder}>📷</div>
        )}
        
        {hasDiscount && (
          <span className={styles.discountBadge}>-{discountPercent}%</span>
        )}
        
        {product.rating && product.rating >= 4.8 && (
          <span className={styles.hitBadge}>Хит</span>
        )}
      </div>

      <div className={styles.content}>
        {product.manufacturer && (
          <span className={styles.manufacturer}>{product.manufacturer.name}</span>
        )}
        
        <h3 className={styles.name}>
          <a href={`/products/${product.id}`} className={styles.link}>
            {product.name}
          </a>
        </h3>

        <div className={styles.rating}>
          {product.rating && (
            <>
              <span className={styles.stars}>{'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))}</span>
              <span className={styles.ratingValue}>{product.rating.toFixed(1)}</span>
            </>
          )}
        </div>

        <p className={stockStatus.className}>{stockStatus.text}</p>

        <div className={styles.priceRow}>
          <div className={styles.prices}>
            <span className={styles.price}>{formatPrice(product.price)}</span>
            {hasDiscount && (
              <span className={styles.oldPrice}>{formatPrice(product.oldPrice!)}</span>
            )}
          </div>
          
          <button
            className={styles.addToCartBtn}
            onClick={handleAddToCart}
            disabled={product.stock === 0 || !product.isActive}
            aria-label="Добавить в корзину"
          >
            В корзину
          </button>
        </div>
      </div>
    </article>
  );
}