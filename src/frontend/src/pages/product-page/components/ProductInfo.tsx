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
    <div className="flex flex-col">
      {product.manufacturer && (
        <span className="text-xs font-semibold text-[var(--accent)] uppercase tracking-[0.1em] mb-2">{product.manufacturer.name}</span>
      )}
      <h1 className="font-[var(--font-sans)] text-3xl font-bold text-[var(--fg)] m-0 mb-4 leading-1.2">{product.name}</h1>
      
      <div className="flex items-center flex-wrap gap-4 mb-6 text-sm">
        <span className="text-[var(--fg-muted)] font-[var(--font-mono)]">АРТ: {product.sku}</span>
        <div className={`flex items-center gap-2 text-sm font-medium ${stockStatus.className}`}>
          <span className={`w-2 h-2 rounded-full ${stockStatus.text.includes('Нет') ? 'text-[var(--error)] bg-[var(--error)]' : stockStatus.text.includes('Мало') ? 'text-[var(--accent)] opacity-85 [&>span]:bg-[var(--color-amber-500)] [&>span]:shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'text-[var(--accent)] [&>span]:bg-[var(--accent)] [&>span]:shadow-[0_0_8px_var(--accent-glow)]'}`}>
            <span className="w-2 h-2 rounded-full inline-block" />
            {stockStatus.text}
          </span>
        </div>
      </div>

      <div className="bg-[var(--border-muted)] border border-[var(--border)] rounded-xl p-6 mb-8">
        <div className="flex items-baseline gap-4 mb-2">
          <span className="font-[var(--font-sans)] text-4xl font-bold text-[var(--accent)]">{formatPrice(product.price)}</span>
          {hasDiscount && product.oldPrice && (
            <span className="font-[var(--font-sans)] text-xl text-[var(--fg-dim)] line-through">{formatPrice(product.oldPrice)}</span>
          )}
        </div>
      </div>

      <div className="flex gap-4 mb-10">
        {inCart ? (
          <div className="flex items-center gap-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-4 h-14">
            <button 
              className="w-8 h-8 flex items-center justify-center bg-transparent border border-[var(--border)] rounded text-[var(--fg)] cursor-pointer transition-all duration-200 hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleUpdateQty(-1)}
              aria-label="Уменьшить количество"
              type="button"
            >
              <Minus size={18} />
            </button>
            <span className="font-[var(--font-mono)] text-lg font-semibold min-w-6 text-center">{quantityInCart}</span>
            <button 
              className="w-8 h-8 flex items-center justify-center bg-transparent border border-[var(--border)] rounded text-[var(--fg)] cursor-pointer transition-all duration-200 hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="flex-1 h-14 text-base font-semibold"
          >
            <ShoppingCart size={20} style={{ marginRight: '10px' }} />
            Добавить в корзину
          </Button>
        )}
        
        <button 
          type="button" 
          className={`w-14 h-14 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-[var(--fg-muted)] transition-all duration-200 hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--border-muted)] ${inWishlist ? 'text-[var(--accent)]!important border-[color-mix(in_srgb,var(--accent)_35%,transparent)]!important bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]' : ''}`}
          onClick={handleToggleWishlist}
          aria-label={inWishlist ? "Удалить из избранного" : "Добавить в избранное"}
        >
          <Heart size={20} fill={inWishlist ? 'currentColor' : 'none'} />
        </button>

        <button
          type="button"
          className={`w-14 h-14 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-[var(--fg-muted)] transition-all duration-200 hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--border-muted)] ${inComparison ? 'text-[var(--accent)] border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
          onClick={handleToggleComparison}
          disabled={isDisabled}
          aria-label={inComparison ? 'Удалить из сравнения' : 'Добавить в сравнение'}
        >
          <Icon name="compare" size="md" color={inComparison ? 'gold' : 'default'} />
        </button>

        <button
          type="button"
          className="w-14 h-14 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-[var(--fg-muted)] transition-all duration-200 hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--border-muted)]"
          aria-label="Поделиться товаром"
          onClick={() => void handleShare()}
        >
          <Share2 size={20} />
        </button>
      </div>

      {product.stock === 0 && (
        <div className="mb-[var(--spacing-lg)] p-[var(--spacing-md)] bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-md)]">
          <p className="text-[var(--text-sm)] font-[var(--font-semibold)] mb-[var(--spacing-sm)] text-[var(--fg)]">Сообщить о поступлении</p>
          <div className="flex flex-wrap gap-[var(--spacing-sm)] items-center">
            <label htmlFor="stock-notify-email" className="sr-only">
              Email для уведомления
            </label>
            <input
              id="stock-notify-email"
              type="email"
              className="flex-1 min-w-[200px] p-2.5 px-3.5 bg-[var(--bg-elevated)] border border-[var(--border-accent)] rounded-[var(--radius-sm)] text-[var(--fg)] text-sm focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)]"
              placeholder="your@email.com"
              value={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.value)}
              disabled={notifySent}
              autoComplete="email"
            />
            <button
              type="button"
              className="px-4.5 py-2.5 text-sm font-semibold bg-[var(--accent)] text-[var(--bg-primary)] border-none rounded-[var(--radius-sm)] cursor-pointer transition-opacity duration-[var(--transition-fast)] hover:opacity-92 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleNotifyStock}
              disabled={notifySent}
            >
              {notifySent ? 'Готово' : 'Подписаться'}
            </button>
          </div>
          <p className="text-[var(--text-xs)] text-[var(--fg-muted)] mt-[var(--spacing-sm)]">
            Оформляя подписку, вы соглашаетесь получить одно письмо о появлении товара. Без рассылок.
          </p>
        </div>
      )}

      <section className="mt-4.5 border border-[var(--border)] rounded-xl bg-[var(--border-muted)] overflow-hidden" aria-label="Доставка по Минску">
        <div className="flex items-center justify-between gap-3 p-4 border-b border-[var(--border-muted)] bg-[var(--border-muted)]">
          <p className="m-0 text-[0.95rem] font-semibold text-[var(--fg)]">Доставка</p>
          <span className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-[var(--border-muted)] bg-[var(--border-muted)] text-[var(--accent)] text-xs font-semibold whitespace-nowrap">по Минску</span>
        </div>

        <div className="grid">
          <div className="grid grid-cols-1fr_auto_auto items-center gap-3.5 p-3.5 border-t border-[var(--border-muted)]">
            <div className="grid gap-1 min-w-0">
              <p className="m-0 text-[0.9rem] font-semibold text-[var(--fg)]">Курьером в ваше время</p>
              <p className="m-0 text-[0.85rem] text-[var(--fg-muted)] leading-1.35">Доставим заказ в удобный для вас 30-минутный интервал времени</p>
            </div>
            <p className="m-0 font-[var(--font-mono)] text-sm font-bold text-[var(--fg)] whitespace-nowrap">от 7 BYN</p>
            <Link to="/delivery" className="w-9 h-9 rounded-xl inline-flex items-center justify-center text-[var(--fg-muted)] border border-[var(--border-muted)] bg-[var(--border-muted)] text-decoration-none transition-[transform,border-color,background,color] duration-120 hover:-translate-y-px hover:text-[var(--accent)] hover:border-[var(--border-muted)] hover:bg-[var(--border-muted)]" aria-label="Условия доставки">
              <ArrowRight size={18} aria-hidden />
            </Link>
          </div>

          <div className="grid grid-cols-1fr_auto_auto items-center gap-3.5 p-3.5 border-t border-[var(--border-muted)]">
            <div className="grid gap-1 min-w-0">
              <p className="m-0 text-[0.9rem] font-semibold text-[var(--fg)]">Курьером</p>
              <p className="m-0 text-[0.85rem] text-[var(--fg-muted)] leading-1.35">Обычно 1–2 дня</p>
            </div>
            <p className="m-0 font-[var(--font-mono)] text-sm font-bold text-[var(--accent)] whitespace-nowrap">бесплатно</p>
            <Link to="/delivery" className="w-9 h-9 rounded-xl inline-flex items-center justify-center text-[var(--fg-muted)] border border-[var(--border-muted)] bg-[var(--border-muted)] text-decoration-none transition-[transform,border-color,background,color] duration-120 hover:-translate-y-px hover:text-[var(--accent)] hover:border-[var(--border-muted)] hover:bg-[var(--border-muted)]" aria-label="Условия доставки">
              <ArrowRight size={18} aria-hidden />
            </Link>
          </div>

          <div className="grid grid-cols-1fr_auto_auto items-center gap-3.5 p-3.5 border-t border-[var(--border-muted)]">
            <div className="grid gap-1 min-w-0">
              <p className="m-0 text-[0.9rem] font-semibold text-[var(--fg)]">Самовывоз</p>
              <p className="m-0 text-[0.85rem] text-[var(--fg-muted)] leading-1.35">Заберите в пункте выдачи</p>
            </div>
            <p className="m-0 font-[var(--font-mono)] text-sm font-bold text-[var(--accent)] whitespace-nowrap">бесплатно</p>
            <Link to="/delivery" className="w-9 h-9 rounded-xl inline-flex items-center justify-center text-[var(--fg-muted)] border border-[var(--border-muted)] bg-[var(--border-muted)] text-decoration-none transition-[transform,border-color,background,color] duration-120 hover:-translate-y-px hover:text-[var(--accent)] hover:border-[var(--border-muted)] hover:bg-[var(--border-muted)]" aria-label="Условия самовывоза">
              <ArrowRight size={18} aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
