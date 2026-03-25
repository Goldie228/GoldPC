'use client';

import { useState, useEffect, useRef, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  Trash2, 
  Minus, 
  Plus, 
  ChevronRight, 
  ArrowRight,
  ArrowLeft,
  Tag,
  Truck,
  ShieldCheck,
  RotateCcw,
  Package
} from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { hasValidProductImage } from '../../utils/image';
import { useToastStore } from '../../store/toastStore';
import { formatCountRu, RU_FORMS } from '../../utils/pluralizeRu';
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
  keyboard: 'Клавиатуры',
  mouse: 'Мыши',
  headphones: 'Наушники',
};

function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

/**
 * Анимации для списка и элементов
 */
const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24
    }
  },
  exit: { 
    opacity: 0, 
    x: 20, 
    height: 0,
    transition: {
      duration: 0.3
    }
  }
};

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
          Кажется, вы еще ничего не выбрали. Исправьте это в нашем каталоге!
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link to="/catalog" className={styles.checkoutBtn} style={{ width: 'auto', padding: '0 2.5rem' }}>
            <ArrowLeft size={18} />
            Вернуться в каталог
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Страница корзины (Shopping Cart Page)
 */
export function CartPage(): ReactElement {
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
    applyPromo,
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

  const handleApplyPromo = (): void => {
    if (applyPromo(promoInput)) {
      setPromoError(false);
      setPromoInput('');
      showToast('Промокод успешно применен!', 'success');
    } else {
      setPromoError(true);
      showToast('Неверный промокод', 'error');
    }
  };

  const handleRemovePromo = (): void => {
    clearPromoCode();
    setPromoError(false);
    showToast('Промокод удален', 'info');
  };

  const handlePromoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleApplyPromo();
    }
  };

  const handleRemoveItem = (productId: string, name: string): void => {
    removeFromCart(productId);
    showToast(`${name} удален из корзины`, 'info');
  };

  if (isEmpty) {
    return <EmptyCart />;
  }

  return (
    <div className={styles.container}>
      {/* Breadcrumbs */}
      <header className={styles.header}>
        <nav className={styles.breadcrumb}>
          <Link to="/">Главная</Link>
          <ChevronRight size={14} />
          <Link to="/catalog">Каталог</Link>
          <ChevronRight size={14} />
          <span>Корзина</span>
        </nav>
        <h1 className={styles.title}>Ваша корзина</h1>
        <p className={styles.stats}>
          {formatCountRu(itemCount, RU_FORMS.tovar)} на сумму {totalPrice.toLocaleString('ru-BY')} BYN
        </p>
      </header>

      <div className={styles.cartLayout}>
        {/* Left: Cart Items List */}
        <motion.div 
          className={styles.itemsList}
          variants={listVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div 
                key={item.productId} 
                className={styles.item}
                variants={itemVariants}
                exit="exit"
                layout
              >
                <div className={styles.imageWrapper}>
                  {hasValidProductImage(item.imageUrl) ? (
                    <img src={item.imageUrl} alt={item.name} className={styles.image} />
                  ) : (
                    <div className={styles.placeholder}>
                      <Package size={48} />
                    </div>
                  )}
                </div>
                
                <div className={styles.itemInfo}>
                  <span className={styles.itemCategory}>{getCategoryLabel(item.category)}</span>
                  <Link to={`/product/${item.productId}`} className={styles.itemName}>
                    {item.name}
                  </Link>
                  <div className={styles.controls}>
                    <div className={styles.quantityGroup}>
                      <button 
                        className={styles.qtyBtn}
                        onClick={() => changeQuantity(item.productId, -1)}
                        disabled={item.quantity <= 1}
                        aria-label="Уменьшить количество"
                        type="button"
                      >
                        <Minus size={16} />
                      </button>
                      <span className={styles.qtyValue}>{item.quantity}</span>
                      <button 
                        className={styles.qtyBtn}
                        onClick={() => changeQuantity(item.productId, 1)}
                        aria-label="Увеличить количество"
                        type="button"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className={styles.itemActions}>
                  <div className={styles.itemPrices}>
                    <span className={styles.totalPrice}>{(item.price * item.quantity).toLocaleString('ru-BY')} BYN</span>
                    {item.quantity > 1 && (
                      <span className={styles.pricePerItem}>{item.price.toLocaleString('ru-BY')} BYN / шт</span>
                    )}
                  </div>
                  <button 
                    className={styles.removeBtn}
                    onClick={() => handleRemoveItem(item.productId, item.name)}
                    aria-label="Удалить товар"
                    type="button"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Right: Order Summary Card */}
        <aside className={styles.summary}>
          <h2 className={styles.summaryTitle}>Детали заказа</h2>
          
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>
              <Package size={16} />
              Товары ({itemCount})
            </span>
            <span className={styles.summaryValue}>{totalPrice.toLocaleString('ru-BY')} BYN</span>
          </div>
          
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>
              <Truck size={16} />
              Доставка
            </span>
            <span className={`${styles.summaryValue} ${styles.summaryValueAccent}`}>Бесплатно</span>
          </div>

          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>
              <ShieldCheck size={16} />
              Гарантия
            </span>
            <span className={styles.summaryValue}>Включена</span>
          </div>

          {discount > 0 && (
            <motion.div 
              className={styles.summaryRow}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <span className={styles.summaryLabel}>
                <Tag size={16} />
                Скидка ({discount}%)
              </span>
              <span className={`${styles.summaryValue} ${styles.discountValue}`}>
                −{discountAmount.toLocaleString('ru-BY')} BYN
              </span>
            </motion.div>
          )}

          <div className={styles.divider}></div>

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Итого</span>
            <span
              className={`${styles.totalAmount} ${totalFlash ? styles.totalAmountFlash : ''}`}
            >
              {discountedTotal.toLocaleString('ru-BY')} BYN
            </span>
          </div>

          <Link to="/checkout" className={styles.checkoutBtn}>
            Перейти к оформлению
            <ArrowRight size={20} />
          </Link>

          <Link to="/catalog" className={styles.continueBtn}>
            <RotateCcw size={18} />
            Продолжить покупки
          </Link>

          <div className={styles.promoContainer}>
            {promoCode ? (
              <div className={styles.appliedPromo}>
                <div className={styles.promoBadge}>
                  <Tag size={14} />
                  <span>{promoCode} (−{discount}%)</span>
                </div>
                <button 
                  className={styles.removePromoBtn}
                  onClick={handleRemovePromo}
                  aria-label="Удалить промокод"
                  type="button"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <>
                <div className={styles.promoInputGroup}>
                  <input 
                    type="text" 
                    placeholder="Промокод"
                    value={promoInput}
                    onChange={(e) => {
                      setPromoInput(e.target.value);
                      setPromoError(false);
                    }}
                    onKeyDown={handlePromoKeyDown}
                    className={`${styles.promoInput} ${promoError ? styles.promoInputError : ''}`}
                  />
                  <button 
                    className={styles.promoBtn}
                    onClick={handleApplyPromo}
                    type="button"
                  >
                    Применить
                  </button>
                </div>
                {promoError && (
                  <span className={styles.promoErrorText}>Неверный промокод</span>
                )}
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
