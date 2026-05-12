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

function getStockStatus(stock: number): { text: string; variant: 'in' | 'low' | 'out' } {
  if (stock === 0) return { text: 'Нет в наличии', variant: 'out' };
  if (stock <= 5) return { text: `Мало (${stock} шт.)`, variant: 'low' };
  return { text: 'В наличии', variant: 'in' };
}

const stockConfig = {
  in: { dot: 'bg-price-drop shadow-[0_0_8px_rgba(14,203,129,0.4)]', text: 'text-price-drop' },
  low: { dot: 'bg-gold shadow-[0_0_8px_rgba(252,213,53,0.35)]', text: 'text-gold' },
  out: { dot: 'bg-destructive', text: 'text-destructive' },
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ProductInfo({ product }: ProductInfoProps): ReactElement {
  const { addToCart, removeFromCart, updateQuantity, isInCart, getItemQuantity } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlistStore();
  const showToast = useToastStore((state) => state.showToast);
  const { isInComparison, toggleComparison } = useComparisonStore();
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySent, setNotifySent] = useState(false);

  const stock = getStockStatus(product.stock);
  const stockStyle = stockConfig[stock.variant];
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
    <div className="flex flex-col">
      {/* Manufacturer */}
      {product.manufacturer && (
        <span className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">
          {product.manufacturer.name}
        </span>
      )}

      {/* Product Name */}
      <h1 className="text-[28px] font-bold text-foreground m-0 mb-4 leading-tight">
        {product.name}
      </h1>

      {/* SKU + Stock Status */}
      <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mb-6 text-sm">
        <span className="text-muted-foreground">
          АРТ: <span className="font-mono">{product.sku}</span>
        </span>
        <span className={`inline-flex items-center gap-2 text-sm font-medium ${stockStyle.text}`}>
          <span className={`w-2 h-2 rounded-full ${stockStyle.dot}`} />
          {stock.text}
        </span>
      </div>

      {/* Price Card */}
      <div className="bg-card border border-border rounded-xl p-6 mb-8">
        <div className="flex items-baseline gap-4">
          <span className="font-mono text-[36px] font-bold text-primary tracking-tight">
            {formatPrice(product.price)}
          </span>
          {hasDiscount && product.oldPrice && (
            <span className="font-mono text-xl text-muted-foreground line-through">
              {formatPrice(product.oldPrice)}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-10">
        {/* Add to Cart / Quantity Controls */}
        {inCart ? (
          <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 h-14">
            <button
              className="w-8 h-8 flex items-center justify-center bg-transparent border border-border rounded text-foreground cursor-pointer transition-all duration-200 hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleUpdateQty(-1)}
              aria-label="Уменьшить количество"
              type="button"
            >
              <Minus size={18} />
            </button>
            <span className="font-mono text-lg font-semibold min-w-6 text-center text-foreground">
              {quantityInCart}
            </span>
            <button
              className="w-8 h-8 flex items-center justify-center bg-transparent border border-border rounded text-foreground cursor-pointer transition-all duration-200 hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleUpdateQty(1)}
              aria-label="Увеличить количество"
              type="button"
            >
              <Plus size={18} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isDisabled}
            className="flex-1 h-14 inline-flex items-center justify-center gap-2.5 bg-price-drop text-on-dark rounded-sm px-5 text-sm font-semibold border-none cursor-pointer transition-all duration-200 hover:brightness-110 active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={20} />
            Добавить в корзину
          </button>
        )}

        {/* Wishlist */}
        <button
          type="button"
          className={`w-14 h-14 flex items-center justify-center bg-card border border-border rounded-lg text-muted-foreground transition-all duration-200 hover:border-primary hover:text-primary hover:bg-card ${
            inWishlist
              ? '!text-primary !border-primary/35 !bg-primary/10'
              : ''
          }`}
          onClick={handleToggleWishlist}
          aria-label={inWishlist ? 'Удалить из избранного' : 'Добавить в избранное'}
        >
          <Heart size={20} fill={inWishlist ? 'currentColor' : 'none'} />
        </button>

        {/* Compare */}
        <button
          type="button"
          className={`w-14 h-14 flex items-center justify-center bg-card border border-border rounded-lg text-muted-foreground transition-all duration-200 hover:border-primary hover:text-primary hover:bg-card disabled:opacity-50 disabled:cursor-not-allowed ${
            inComparison
              ? '!text-primary !border-primary/35 !bg-primary/10'
              : ''
          }`}
          onClick={handleToggleComparison}
          disabled={isDisabled}
          aria-label={inComparison ? 'Удалить из сравнения' : 'Добавить в сравнение'}
        >
          <Icon name="compare" size="md" color={inComparison ? 'gold' : 'default'} />
        </button>

        {/* Share */}
        <button
          type="button"
          className="w-14 h-14 flex items-center justify-center bg-card border border-border rounded-lg text-muted-foreground transition-all duration-200 hover:border-primary hover:text-primary hover:bg-card"
          aria-label="Поделиться товаром"
          onClick={() => void handleShare()}
        >
          <Share2 size={20} />
        </button>
      </div>

      {/* Stock Notification */}
      {product.stock === 0 && (
        <div className="mb-8 p-4 bg-card border border-border rounded-lg">
          <p className="text-sm font-semibold text-foreground mb-3">
            Сообщить о поступлении
          </p>
          <div className="flex flex-wrap gap-3 items-center">
            <label htmlFor="stock-notify-email" className="sr-only">
              Email для уведомления
            </label>
            <input
              id="stock-notify-email"
              type="email"
              className="flex-1 min-w-[200px] px-3.5 py-2.5 bg-surface-elevated border border-border rounded-md text-foreground text-sm focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(252,213,53,0.15)]"
              placeholder="your@email.com"
              value={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.value)}
              disabled={notifySent}
              autoComplete="email"
            />
            <button
              type="button"
              className="px-5 py-2.5 text-sm font-semibold bg-primary text-primary-foreground border-none rounded-md cursor-pointer transition-all duration-200 hover:brightness-110 active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleNotifyStock}
              disabled={notifySent}
            >
              {notifySent ? 'Готово' : 'Подписаться'}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Оформляя подписку, вы соглашаетесь получить одно письмо о появлении товара. Без рассылок.
          </p>
        </div>
      )}

      {/* Delivery Section */}
      <section
        className="bg-card border border-border rounded-xl overflow-hidden"
        aria-label="Доставка по Минску"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <p className="m-0 text-sm font-semibold text-foreground">Доставка</p>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold whitespace-nowrap">
            по Минску
          </span>
        </div>

        {/* Options */}
        <div className="divide-y divide-border">
          {/* Courier by time */}
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3.5 px-5 py-4">
            <div className="grid gap-1 min-w-0">
              <p className="m-0 text-sm font-semibold text-foreground">Курьером в ваше время</p>
              <p className="m-0 text-xs text-muted-foreground leading-relaxed">
                Доставим заказ в удобный для вас 30-минутный интервал времени
              </p>
            </div>
            <p className="m-0 font-mono text-sm font-bold text-foreground whitespace-nowrap">от 7 BYN</p>
            <Link
              to="/delivery"
              className="w-9 h-9 rounded-lg inline-flex items-center justify-center text-muted-foreground border border-border bg-transparent text-decoration-none transition-all duration-150 hover:text-primary hover:border-primary/30"
              aria-label="Условия доставки"
            >
              <ArrowRight size={18} aria-hidden />
            </Link>
          </div>

          {/* Standard Courier */}
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3.5 px-5 py-4">
            <div className="grid gap-1 min-w-0">
              <p className="m-0 text-sm font-semibold text-foreground">Курьером</p>
              <p className="m-0 text-xs text-muted-foreground leading-relaxed">Обычно 1–2 дня</p>
            </div>
            <p className="m-0 font-mono text-sm font-bold text-price-drop whitespace-nowrap">бесплатно</p>
            <Link
              to="/delivery"
              className="w-9 h-9 rounded-lg inline-flex items-center justify-center text-muted-foreground border border-border bg-transparent text-decoration-none transition-all duration-150 hover:text-primary hover:border-primary/30"
              aria-label="Условия доставки"
            >
              <ArrowRight size={18} aria-hidden />
            </Link>
          </div>

          {/* Pickup */}
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3.5 px-5 py-4">
            <div className="grid gap-1 min-w-0">
              <p className="m-0 text-sm font-semibold text-foreground">Самовывоз</p>
              <p className="m-0 text-xs text-muted-foreground leading-relaxed">Заберите в пункте выдачи</p>
            </div>
            <p className="m-0 font-mono text-sm font-bold text-price-drop whitespace-nowrap">бесплатно</p>
            <Link
              to="/delivery"
              className="w-9 h-9 rounded-lg inline-flex items-center justify-center text-muted-foreground border border-border bg-transparent text-decoration-none transition-all duration-150 hover:text-primary hover:border-primary/30"
              aria-label="Условия самовывоза"
            >
              <ArrowRight size={18} aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
