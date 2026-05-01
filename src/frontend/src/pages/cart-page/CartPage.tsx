'use client';

import { useState, useEffect, useRef, type ReactElement } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  ArrowLeft,
  Tag,
  X,
} from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { hasValidProductImage } from '../../utils/image';
import { useToastStore } from '../../store/toastStore';
import { RelatedProducts } from '../../components/cart/RelatedProducts';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs/Breadcrumbs';
import styles from './CartPage.module.css';

const CATEGORY_LABELS: Record<string, string> = {
  cpu: 'Процессор',
  gpu: 'Видеокарта',
  motherboard: 'Материнская плата',
  ram: 'Память',
  storage: 'Накопитель',
  psu: 'Блок питания',
  case: 'Корпус',
  cooling: 'Охлаждение',
  monitor: 'Монитор',
  keyboard: 'Клавиатура',
  mouse: 'Мышь',
  headphones: 'Наушники',
};

function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

/**
 * Пустая корзина
 */
function EmptyCart(): ReactElement {
  return (
    <div className={styles.container}>
      <div className={styles.emptyContainer}>
        <motion.div
          className={styles.emptyIconWrapper}
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', duration: 0.6 }}
        >
          <ShoppingBag size={48} />
        </motion.div>
        <motion.h1
          className={styles.emptyTitle}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Корзина пуста
        </motion.h1>
        <motion.p
          className={styles.emptyDesc}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Кажется, вы ещё ничего не выбрали. Добавьте товары из каталога!
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link to="/catalog" className={styles.btn}>
            <ArrowLeft size={18} />
            Перейти в каталог
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Страница корзины (Shopping Cart Page)
 * Дизайн соответствует prototypes/cart.html
 */
export function CartPage(): ReactElement {
  const navigate = useNavigate();
  const {
    items,
    isEmpty,
    totalPrice,
    itemCount,
    discountedTotal,
    discountAmount,
    promoCode,
    discount,
    removeFromCart,
    changeQuantity,
    validateAndApplyPromo,
    clearPromoCode,
  } = useCart();

  const showToast = useToastStore((state) => state.showToast);
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState(false);
  const [totalFlash, setTotalFlash] = useState(false);
  const prevPromoRef = useRef<string | null>(null);

  useEffect(() => {
    if (promoCode && promoCode !== prevPromoRef.current) {
      prevPromoRef.current = promoCode;
      setTotalFlash(true);
      const t = window.setTimeout(() => setTotalFlash(false), 2000);
      return () => window.clearTimeout(t);
    }
    if (!promoCode) prevPromoRef.current = null;
  }, [promoCode]);

  const handleApplyPromo = async (): Promise<void> => {
    const result = await validateAndApplyPromo(promoInput);
    if (result.success) {
      setPromoError(false);
      setPromoInput('');
      showToast(result.message, 'success');
    } else {
      setPromoError(true);
      showToast(result.message, 'error');
    }
  };

  const handleRemovePromo = (): void => {
    clearPromoCode();
    setPromoError(false);
    showToast('Промокод удалён', 'info');
  };

  const handlePromoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleApplyPromo();
    }
  };

  const handleRemoveItem = (productId: string, name: string): void => {
    removeFromCart(productId);
    showToast(`${name} удалён из корзины`, 'info');
  };

  const handleCheckout = (): void => {
    navigate('/checkout');
  };

  if (isEmpty) {
    return <EmptyCart />;
  }

  return (
    <div className={styles.container} role="main" aria-label="Корзина GoldPC">
      {/* Header */}
      <header className={styles.header}>
        <Breadcrumbs
          items={[
            { label: 'Главная', to: '/' },
            { label: 'Каталог', to: '/catalog' },
            { label: 'Корзина' },
          ]}
        />
        <h1 className={styles.title}>Корзина</h1>
        <p className={styles.stats}>
          {itemCount > 0 
            ? `${itemCount} ${itemCount === 1 ? 'товар' : itemCount < 5 ? 'товара' : 'товаров'} · ${totalPrice.toLocaleString('ru-BY')} BYN`
            : 'Пока пуста'
          }
        </p>
      </header>

      <div className={styles.cartLayout}>
        {/* Left: Cart Items */}
        <main className={styles.cartItems}>
          <ul className={styles.cartItemsList} role="list">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <li key={item.productId}>
                  <motion.div
                    className={styles.cartItem}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0 }}
                    transition={{ duration: 0.2 }}
                    layout
                  >
                    {/* Image */}
                    <div className={styles.itemImage}>
                      {hasValidProductImage(item.imageUrl) ? (
                        <img src={item.imageUrl} alt={item.name} />
                      ) : (
                        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="15" y="15" width="70" height="70" rx="4" fill="#1a1a1e" stroke="#3a3a3e"/>
                          <text x="50" y="55" textAnchor="middle" fill="#d4a574" fontSize="10">Нет фото</text>
                        </svg>
                      )}
                    </div>

                    {/* Details */}
                    <div className={styles.itemDetails}>
                      <span className={styles.itemCategory}>{getCategoryLabel(item.category)}</span>
                      <Link to={`/product/${item.productSlug ?? item.productId}`} className={styles.itemName}>
                        {item.name}
                      </Link>
                    </div>

                    {/* Actions */}
                    <div className={styles.itemActions}>
                      <span className={styles.itemPrice}>
                        {(item.price * item.quantity).toLocaleString('ru-BY')} BYN
                      </span>
                      <div className={styles.quantityControls}>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => changeQuantity(item.productId, -1)}
                          disabled={item.quantity <= 1}
                          aria-label={`Уменьшить количество ${item.name}`}
                          type="button"
                        >
                          <Minus size={14} />
                        </button>
                        <span className={styles.qtyValue}>{item.quantity}</span>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => changeQuantity(item.productId, 1)}
                          aria-label={`Увеличить количество ${item.name}`}
                          type="button"
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          className={styles.removeBtn}
                          onClick={() => handleRemoveItem(item.productId, item.name)}
                          aria-label={`Удалить ${item.name}`}
                          type="button"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </li>
              ))}
            </AnimatePresence>
          </ul>
        </main>

        {/* Right: Summary */}
        <aside className={styles.cartSummary}>
          <h2 className={styles.summaryTitle}>Итого</h2>

          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Товары ({itemCount})</span>
            <span className={styles.summaryValue}>
              {totalPrice.toLocaleString('ru-BY')} BYN
            </span>
          </div>

          {discount > 0 && (
            <motion.div
              className={styles.summaryRow}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <span className={styles.summaryLabel}>Скидка</span>
              <span className={styles.summaryValue} style={{ color: '#ef4444' }}>
                −{discountAmount.toLocaleString('ru-BY')} BYN
              </span>
            </motion.div>
          )}

          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Доставка</span>
            <span className={styles.summaryValue} style={{ color: 'var(--accent, #d4a574)' }}>
              Бесплатно
            </span>
          </div>

          <div className={styles.summaryDivider} />

          <div className={styles.summaryTotal}>
            <span className={styles.totalLabel}>К оплате</span>
            <span
              className={`${styles.totalValue} ${totalFlash ? styles.totalValueFlash : ''}`}
            >
              {discountedTotal.toLocaleString('ru-BY')} BYN
            </span>
          </div>

          <div className={styles.summaryActions}>
            <Button
              variant="primary"
              size="md"
              onClick={handleCheckout}
              rightIcon={<Icon name="arrow-right" size="sm" />}
            >
              Оформить заказ
            </Button>

            <Link to="/catalog">
              <Button variant="ghost" size="md" fullWidth>
                Продолжить покупки
              </Button>
            </Link>
          </div>

          {/* Promo Code */}
          <div className={styles.promoSection}>
            {promoCode ? (
              <div className={styles.promoApplied}>
                <Tag size={14} />
                <span>{promoCode}</span>
                <button
                  className={styles.promoRemove}
                  onClick={handleRemovePromo}
                  aria-label="Удалить промокод"
                  type="button"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className={styles.promoInput}>
                <input
                  type="text"
                  placeholder="Промокод"
                  value={promoInput}
                  onChange={(e) => {
                    setPromoInput(e.target.value);
                    setPromoError(false);
                  }}
                  onKeyDown={handlePromoKeyDown}
                  className={promoError ? styles.promoInputError : ''}
                />
                <Button variant="outline" size="sm" onClick={handleApplyPromo} type="button">
                  Применить
                </Button>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Recommendations */}
      <RelatedProducts
        cartItems={items.map(item => ({ productId: item.productId, name: item.name }))}
      />
    </div>
  );
}
