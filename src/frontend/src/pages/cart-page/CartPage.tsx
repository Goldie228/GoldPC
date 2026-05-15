'use client';

import { useState, type ReactElement } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  ArrowLeft,
} from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { hasValidProductImage } from '../../utils/image';
import { useToastStore } from '../../store/toastStore';
import { RelatedProducts } from '../../components/cart/RelatedProducts';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';

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
  const navigate = useNavigate();
  return (
    <div className="w-full max-w-[var(--layout-page-wide)] mx-auto px-[var(--layout-page-pad-x)] py-5 min-h-[calc(100vh-200px)] bg-background">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <motion.div
          className="w-20 h-20 flex items-center justify-center bg-card border border-border rounded-full mb-6 text-foreground-dim"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', duration: 0.6 }}
        >
          <ShoppingBag size={48} />
        </motion.div>
        <motion.h1
          className="text-xl font-semibold text-foreground mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Корзина пуста
        </motion.h1>
        <motion.p
          className="text-muted-foreground mb-6 max-w-[300px]"
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
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={() => navigate('/catalog')}
            leftIcon={<ArrowLeft size={18} />}
          >
            Перейти в каталог
          </Button>
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
    discount,
    removeFromCart,
    changeQuantity,
  } = useCart();

  const showToast = useToastStore((state) => state.showToast);
  const [totalFlash, setTotalFlash] = useState(false);

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
    <div className="w-full max-w-[var(--layout-page-wide)] mx-auto px-[var(--layout-page-pad-x)] py-5 min-h-[calc(100vh-200px)] bg-background" role="main" aria-label="Корзина GoldPC">
      {/* Header */}
      <header className="mb-4">
        <Breadcrumbs
          items={[
            { label: 'Главная', to: '/' },
            { label: 'Каталог', to: '/catalog' },
            { label: 'Корзина' },
          ]}
        />
        <h1 className="font-sans text-2xl font-semibold tracking-tight text-foreground mb-1">Корзина</h1>
        <p className="text-sm text-muted-foreground">
          {itemCount > 0
            ? `${itemCount} ${itemCount === 1 ? 'товар' : itemCount < 5 ? 'товара' : 'товаров'} · ${totalPrice.toLocaleString('ru-BY')} BYN`
            : 'Пока пуста'
          }
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-10 items-start">
        {/* Left: Cart Items */}
        <main className="min-w-0">
          <ul className="list-none m-0 p-0 flex flex-col gap-3" role="list">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <li key={item.productId}>
                  <motion.div
                    className="grid grid-cols-[64px_1fr_auto] md:grid-cols-[80px_1fr_auto] gap-3 md:gap-5 p-3 md:p-6 bg-card border border-border rounded-lg transition-all hover:border-gold/30 hover:-translate-y-0.5 hover:shadow-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0 }}
                    transition={{ duration: 0.2 }}
                    layout
                  >
                    {/* Image */}
                    <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-white rounded-xl flex-shrink-0 p-2 md:p-3 overflow-hidden">
                      {hasValidProductImage(item.imageUrl) ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain block" />
                      ) : (
                        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="max-w-[80%] max-h-[80%]">
                          <rect x="15" y="15" width="70" height="70" rx="4" fill="#1a1a1e" stroke="#3a3a3e"/>
                          <text x="50" y="55" textAnchor="middle" fill="#d4a574" fontSize="10">Нет фото</text>
                        </svg>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex flex-col justify-center gap-2 min-w-0">
                      <span className="text-[0.65rem] text-foreground-dim uppercase tracking-[0.1em] font-medium">{getCategoryLabel(item.category)}</span>
                      <Link to={`/product/${item.productSlug ?? item.productId}`} className="text-[0.95rem] font-medium text-foreground leading-1.4 no-underline transition-colors hover:text-gold line-clamp-2">
                        {item.name}
                      </Link>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end justify-between gap-3">
                      <span className="font-mono text-base font-medium text-body-text">
                        {(item.price * item.quantity).toLocaleString('ru-BY')} BYN
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          className="w-8 h-8 flex items-center justify-center bg-transparent border border-border text-muted-foreground cursor-pointer transition-all hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed rounded-md"
                          onClick={() => changeQuantity(item.productId, -1)}
                          disabled={item.quantity <= 1}
                          aria-label={`Уменьшить количество ${item.name}`}
                          type="button"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="font-mono text-sm min-w-[32px] text-center text-foreground">{item.quantity}</span>
                        <button
                          className="w-8 h-8 flex items-center justify-center bg-transparent border border-border text-muted-foreground cursor-pointer transition-all hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed rounded-md"
                          onClick={() => changeQuantity(item.productId, 1)}
                          aria-label={`Увеличить количество ${item.name}`}
                          type="button"
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          className="bg-transparent border-none text-foreground-dim cursor-pointer p-1 transition-colors hover:text-error ml-1"
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
        <aside className="mt-6 md:mt-0 md:sticky md:top-[100px] bg-card border border-border rounded-xl p-6 shadow-lg max-h-[calc(100vh-120px)] overflow-y-auto">
          <h2 className="text-sm font-semibold uppercase tracking-[0.05em] text-foreground mb-6 pb-4 border-b border-border relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-10 after:h-0.5 after:bg-gradient-to-r after:from-border-muted after:to-border-muted after:rounded-sm">Итого</h2>

          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-muted-foreground">Товары ({itemCount})</span>
            <span className="font-mono text-sm text-foreground">
              {totalPrice.toLocaleString('ru-BY')} BYN
            </span>
          </div>

          {discount > 0 && (
            <motion.div
              className="flex justify-between items-center mb-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <span className="text-sm text-muted-foreground">Скидка</span>
              <span className="font-mono text-sm text-price-drop font-semibold">
                −{discountAmount.toLocaleString('ru-BY')} BYN
              </span>
            </motion.div>
          )}

          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-muted-foreground">Доставка</span>
            <span className="font-mono text-sm text-price-drop">
              Бесплатно
            </span>
          </div>

          <div className="h-px bg-border my-5"></div>

          <div className="flex flex-col gap-2 mb-6">
            <span className="text-xs uppercase tracking-[0.05em] text-muted-foreground">К оплате</span>
            <span
              className={`font-mono text-2xl font-bold text-body-text transition-transform duration-250 ease ${totalFlash ? 'animate-pulse text-shadow-glow' : ''}`}
            >
              {discountedTotal.toLocaleString('ru-BY')} BYN
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={handleCheckout}
              rightIcon={<Icon name="arrow-right" size="sm" />}
            >
              Оформить заказ
            </Button>

            <Link to="/catalog" className="block mt-3">
              <Button variant="ghost" size="md" fullWidth>
                Продолжить покупки
              </Button>
            </Link>
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
