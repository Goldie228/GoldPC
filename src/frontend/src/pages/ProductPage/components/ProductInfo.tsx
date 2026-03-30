import { type ReactElement, useCallback, useState } from 'react';
import { ShoppingCart, Heart, Share2, Minus, Plus, ArrowRight } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useCart } from '../../../hooks/useCart';
import { useWishlistStore } from '../../../store/wishlistStore';
import { useToastStore } from '../../../store/toastStore';
import { useComparisonStore } from '../../../store/comparisonStore';
import { Icon } from '../../../components/ui/Icon/Icon';
import type { Product } from '../../../api/types';
import { Link } from 'react-router-dom';
import styles from '../ProductPage.module.css';

export interface ProductInfoProps {
  product: Product;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'BYN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function getStockStatus(stock: number): { text: string; className: string } {
  if (stock === 0) {
    return { 
      text: 'Нет в наличии', 
      className: styles.stockOut
    };
  }
  if (stock <= 5) {
    return { 
      text: `Мало (${stock} шт)`, 
      className: styles.stockLow
    };
  }
  return { 
    text: `В наличии`, 
    className: styles.stockIn
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ProductInfo({ product }: ProductInfoProps): ReactElement {
  const { addToCart, removeFromCart, updateQuantity, isInCart, getItemQuantity } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlistStore();
  const showToast = useToastStore((state) => state.showToast);
  const { isInComparison, toggleComparison } = useComparisonStore();
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySent, setNotifySent] = useState(false);

  const stockStatus = getStockStatus(product.stock);
  const hasDiscount = product.oldPrice !== undefined && product.oldPrice > product.price;

  const inCart = isInCart(product.id);
  const quantityInCart = getItemQuantity(product.id);
  const isDisabled = product.stock === 0 || !product.isActive;
  const inWishlist = isInWishlist(product.id);
  const inComparison = isInComparison(product.id);

  const handleAddToCart = (): void => {
    if (isDisabled) return;
    addToCart(product, 1);
    showToast('Товар добавлен в корзину', 'success');
  };

  const handleUpdateQty = (delta: number) => {
    const next = quantityInCart + delta;
    if (next < 1) {
      removeFromCart(product.id);
      return;
    }
    if (next > product.stock) {
      showToast(`Доступно только ${product.stock} шт.`, 'error');
      return;
    }
    updateQuantity(product.id, next);
  };

  const handleToggleWishlist = () => {
    toggleWishlist(product.id);
    showToast(
      inWishlist ? 'Удалено из избранного' : 'Добавлено в избранное',
      inWishlist ? 'info' : 'success'
    );
  };

  const handleToggleComparison = (): void => {
    if (isDisabled) return;

    if (inComparison) {
      toggleComparison(product.id, product.category);
      showToast('Удалено из сравнения', 'info');
      return;
    }

    const result = toggleComparison(product.id, product.category);
    if (result.success) {
      showToast('Добавлено в сравнение', 'success');
    } else {
      showToast('В сравнении уже 4 товара этой категории', 'info');
    }
  };

  const handleNotifyStock = (): void => {
    if (!EMAIL_RE.test(notifyEmail.trim())) {
      showToast('Укажите корректный email', 'error');
      return;
    }
    setNotifySent(true);
    showToast('Мы уведомим вас о поступлении на ' + notifyEmail.trim(), 'success');
  };

  const handleShare = useCallback(async (): Promise<void> => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const title = product.name;
    
    if (typeof navigator !== 'undefined' && 'share' in navigator && navigator.share) {
      try {
        await navigator.share({ title, text: title, url });
        return;
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }
    
    try {
      await navigator.clipboard.writeText(url);
      showToast('Ссылка скопирована в буфер обмена', 'success');
    } catch {
      showToast('Не удалось скопировать ссылку', 'error');
    }
  }, [product.name, showToast]);

  return (
    <div className={styles.info}>
      {product.manufacturer && (
        <span className={styles.manufacturer}>{product.manufacturer.name}</span>
      )}
      <h1 className={styles.title}>{product.name}</h1>
      
      <div className={styles.meta}>
        <span className={styles.sku}>АРТ: {product.sku}</span>
        <div className={`${styles.stockStatus} ${stockStatus.className}`}>
          <span className={styles.stockDot}></span>
          {stockStatus.text}
        </div>
      </div>

      <div className={styles.priceSection}>
        <div className={styles.priceRow}>
          <span className={styles.priceCurrent}>{formatPrice(product.price)}</span>
          {hasDiscount && product.oldPrice && (
            <span className={styles.priceOld}>{formatPrice(product.oldPrice)}</span>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        {inCart ? (
          <div className={styles.quantityControls}>
            <button 
              className={styles.qtyBtn} 
              onClick={() => handleUpdateQty(-1)}
              aria-label="Уменьшить количество"
              type="button"
            >
              <Minus size={18} />
            </button>
            <span className={styles.qtyValue}>{quantityInCart}</span>
            <button 
              className={styles.qtyBtn} 
              onClick={() => handleUpdateQty(1)}
              aria-label="Увеличить количество"
              type="button"
            >
              <Plus size={18} />
            </button>
          </div>
        ) : (
          <Button 
            variant="primary" 
            onClick={handleAddToCart} 
            disabled={isDisabled}
            className={styles.cartBtn}
          >
            <ShoppingCart size={20} style={{ marginRight: '10px' }} />
            Добавить в корзину
          </Button>
        )}
        
        <button 
          type="button" 
          className={`${styles.wishlistBtn} ${inWishlist ? styles.activeWishlistBtn : ''}`} 
          onClick={handleToggleWishlist}
          aria-label={inWishlist ? "Удалить из избранного" : "Добавить в избранное"}
        >
          <Heart size={20} fill={inWishlist ? 'currentColor' : 'none'} />
        </button>

        <button
          type="button"
          className={`${styles.actionIconBtn} ${inComparison ? styles.actionIconBtnActive : ''}`}
          onClick={handleToggleComparison}
          disabled={isDisabled}
          aria-label={inComparison ? 'Удалить из сравнения' : 'Добавить в сравнение'}
        >
          <Icon name="compare" size="md" color={inComparison ? 'gold' : 'default'} />
        </button>

        <button
          type="button"
          className={styles.wishlistBtn}
          aria-label="Поделиться товаром"
          onClick={() => void handleShare()}
        >
          <Share2 size={20} />
        </button>
      </div>

      {product.stock === 0 && (
        <div className={styles.notifyBlock}>
          <p className={styles.notifyTitle}>Сообщить о поступлении</p>
          <div className={styles.notifyRow}>
            <label htmlFor="stock-notify-email" className="sr-only">
              Email для уведомления
            </label>
            <input
              id="stock-notify-email"
              type="email"
              className={styles.notifyInput}
              placeholder="your@email.com"
              value={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.value)}
              disabled={notifySent}
              autoComplete="email"
            />
            <button
              type="button"
              className={styles.notifyBtn}
              onClick={handleNotifyStock}
              disabled={notifySent}
            >
              {notifySent ? 'Готово' : 'Подписаться'}
            </button>
          </div>
          <p className={styles.notifyHint}>
            Оформляя подписку, вы соглашаетесь получить одно письмо о появлении товара. Без рассылок.
          </p>
        </div>
      )}

      <section className={styles.deliveryDetails} aria-label="Доставка по Минску">
        <div className={styles.deliveryHeadline}>
          <p className={styles.deliveryTitle}>Доставка</p>
          <span className={styles.deliveryCity}>по Минску</span>
        </div>

        <div className={styles.deliveryItems}>
          <div className={styles.deliveryItem} aria-label="Курьером в ваше время">
            <div className={styles.deliveryText}>
              <p className={styles.deliveryItemTitle}>Курьером в ваше время</p>
              <p className={styles.deliveryItemDesc}>Доставим заказ в удобный для вас 30‑минутный интервал времени</p>
            </div>
            <p className={styles.deliveryPrice}>от 7 BYN</p>
            <Link to="/delivery" className={styles.deliveryLinkBtn} aria-label="Условия доставки">
              <ArrowRight size={18} aria-hidden />
            </Link>
          </div>

          <div className={styles.deliveryItem} aria-label="Курьером">
            <div className={styles.deliveryText}>
              <p className={styles.deliveryItemTitle}>Курьером</p>
              <p className={styles.deliveryItemDesc}>Обычно 1–2 дня</p>
            </div>
            <p className={`${styles.deliveryPrice} ${styles.deliveryPriceFree}`}>бесплатно</p>
            <Link to="/delivery" className={styles.deliveryLinkBtn} aria-label="Условия доставки">
              <ArrowRight size={18} aria-hidden />
            </Link>
          </div>

          <div className={styles.deliveryItem} aria-label="Самовывоз">
            <div className={styles.deliveryText}>
              <p className={styles.deliveryItemTitle}>Самовывоз</p>
              <p className={styles.deliveryItemDesc}>Заберите в пункте выдачи</p>
            </div>
            <p className={`${styles.deliveryPrice} ${styles.deliveryPriceFree}`}>бесплатно</p>
            <Link to="/delivery" className={styles.deliveryLinkBtn} aria-label="Условия самовывоза">
              <ArrowRight size={18} aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
