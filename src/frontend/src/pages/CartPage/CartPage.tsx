'use client';

import { useState, type ReactElement, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import './CartPage.css';

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
  peripherals: 'Периферия',
};

/**
 * Получить название категории на русском
 */
function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

/**
 * Иконка GPU
 */
function GpuIcon(): ReactElement {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="100" height="60" rx="4" fill="#1a1a1e" stroke="#3a3a3e"/>
      <rect x="20" y="20" width="35" height="35" rx="2" fill="#121214"/>
      <circle cx="37" cy="37" r="10" stroke="#d4a574" strokeWidth="1" fill="none"/>
    </svg>
  );
}

/**
 * Иконка CPU
 */
function CpuIcon(): ReactElement {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="15" y="15" width="70" height="70" rx="4" fill="#1a1a1e" stroke="#3a3a3e"/>
      <rect x="30" y="30" width="40" height="40" rx="2" fill="#121214"/>
      <text x="50" y="55" textAnchor="middle" fill="#d4a574" fontSize="12">CPU</text>
    </svg>
  );
}

/**
 * Иконка RAM
 */
function RamIcon(): ReactElement {
  return (
    <svg viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="100" height="40" rx="2" fill="#1a1a1e" stroke="#3a3a3e"/>
      <rect x="20" y="18" width="15" height="24" rx="1" fill="#121214"/>
      <rect x="40" y="18" width="15" height="24" rx="1" fill="#121214"/>
      <rect x="60" y="18" width="15" height="24" rx="1" fill="#121214"/>
      <rect x="80" y="18" width="15" height="24" rx="1" fill="#121214"/>
    </svg>
  );
}

/**
 * Иконка по умолчанию
 */
function DefaultIcon(): ReactElement {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="15" y="15" width="70" height="70" rx="4" fill="#1a1a1e" stroke="#3a3a3e"/>
      <text x="50" y="55" textAnchor="middle" fill="#d4a574" fontSize="10">PART</text>
    </svg>
  );
}

/**
 * Получить иконку для категории
 */
function renderProductIcon(category: string): ReactNode {
  switch (category) {
    case 'gpu':
      return <GpuIcon />;
    case 'cpu':
      return <CpuIcon />;
    case 'ram':
      return <RamIcon />;
    default:
      return <DefaultIcon />;
  }
}

/**
 * Пустая корзина
 */
function EmptyCart(): ReactElement {
  return (
    <div className="cart-page">
      <div className="cart-page__container">
        <h1 className="page-title">Корзина</h1>
        <div className="cart-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
          </svg>
          <h2>Корзина пуста</h2>
          <p>Добавьте товары из каталога</p>
          <Link to="/catalog" className="btn btn-primary">
            Перейти в каталог
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * CartPage - Shopping Cart Page
 * 
 * Features:
 * - Cart items list with quantity controls
 * - Order summary with promo code input
 * - Checkout button
 * - Price displayed in gold color
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

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState(false);

  const handleApplyPromo = (): void => {
    if (applyPromo(promoInput)) {
      setPromoError(false);
      setPromoInput('');
    } else {
      setPromoError(true);
    }
  };

  const handleRemovePromo = (): void => {
    clearPromoCode();
    setPromoError(false);
  };

  const handlePromoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleApplyPromo();
    }
  };

  if (isEmpty) {
    return <EmptyCart />;
  }

  return (
    <div className="cart-page">
      <div className="cart-page__container">
        <h1 className="page-title">Корзина</h1>

        <div className="cart-layout">
          {/* Cart Items */}
          <div className="cart-items">
            {items.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="item-image">
                  {item.imageUrl !== undefined ? (
                    <img src={item.imageUrl} alt={item.name} />
                  ) : (
                    renderProductIcon(item.category)
                  )}
                </div>
                <div className="item-details">
                  <span className="item-category">{getCategoryLabel(item.category)}</span>
                  <h3 className="item-name">{item.name}</h3>
                </div>
                <div className="item-actions">
                  <span className="item-price">{item.price.toLocaleString('ru-RU')} BYN</span>
                  <div className="quantity-controls">
                    <button 
                      className="icon-btn" 
                      aria-label="Уменьшить количество"
                      onClick={() => changeQuantity(item.productId, -1)}
                      disabled={item.quantity <= 1}
                      type="button"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </button>
                    <span className="quantity-value">{item.quantity}</span>
                    <button 
                      className="icon-btn" 
                      aria-label="Увеличить количество"
                      onClick={() => changeQuantity(item.productId, 1)}
                      type="button"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </button>
                    <button 
                      className="remove-btn" 
                      aria-label="Удалить"
                      onClick={() => removeFromCart(item.productId)}
                      type="button"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <aside className="cart-summary">
            <h2 className="summary-title">Итого</h2>

            <div className="summary-row">
              <span className="summary-label">Товары ({itemCount})</span>
              <span className="summary-value">{totalPrice.toLocaleString('ru-RU')} BYN</span>
            </div>

            <div className="summary-row">
              <span className="summary-label">Доставка</span>
              <span className="summary-value summary-value--accent">Бесплатно</span>
            </div>

            {discount > 0 && (
              <div className="summary-row summary-row--discount">
                <span className="summary-label">Скидка ({discount}%)</span>
                <span className="summary-value">−{discountAmount.toLocaleString('ru-RU')} BYN</span>
              </div>
            )}

            <div className="summary-divider"></div>

            <div className="summary-total">
              <span className="total-label">К оплате</span>
              <span className="total-value">{discountedTotal.toLocaleString('ru-RU')} BYN</span>
            </div>

            <Link to="/checkout" className="btn btn-primary">
              Оформить заказ
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>

            <Link to="/catalog" className="btn btn-ghost">
              Продолжить покупки
            </Link>

            <div className="promo-code">
              {promoCode !== null ? (
                <div className="promo-applied">
                  <span className="promo-badge">
                    {promoCode} (−{discount}%)
                  </span>
                  <button 
                    className="promo-remove" 
                    onClick={handleRemovePromo}
                    aria-label="Удалить промокод"
                    type="button"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="promo-input">
                  <input 
                    type="text" 
                    placeholder="Промокод"
                    value={promoInput}
                    onChange={(e) => {
                      setPromoInput(e.target.value);
                      setPromoError(false);
                    }}
                    onKeyDown={handlePromoKeyDown}
                    className={promoError ? 'promo-error' : ''}
                  />
                  <button onClick={handleApplyPromo} type="button">Применить</button>
                </div>
              )}
              {promoError && (
                <span className="promo-error-text">Неверный промокод</span>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}