import { type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../../hooks/useCart';
import { hasValidProductImage } from '../../../utils/image';
import styles from './MiniCart.module.css';

interface MiniCartProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * MiniCart - Dropdown корзины в хедере
 *
 * Features:
 * - Список товаров с миниатюрами, названием, количеством и ценой
 * - Кнопка удаления (X) для каждого товара
 * - Общая сумма заказа
 * - Кнопки "Продолжить покупки" и "Оформить заказ"
 * - Пустое состояние с ссылкой на каталог
 */
export function MiniCart({ isOpen, onClose }: MiniCartProps): ReactElement {
  const { items, totalPrice, isEmpty, removeFromCart, itemCount, changeQuantity } = useCart();

  return (
    <>
      {/* Overlay */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dropdown */}
      <div
        className={`${styles.miniCart} ${isOpen ? styles.miniCartOpen : ''}`}
        aria-hidden={!isOpen}
        role="dialog"
        aria-label="Корзина"
      >
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.title}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
            </svg>
            Корзина ({itemCount})
          </span>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Закрыть"
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        {isEmpty ? (
          <div className={styles.empty}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
            </svg>
            <p>Корзина пуста</p>
            <Link to="/catalog" className={styles.catalogLink} onClick={onClose}>
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <>
            {/* Items List */}
            <div className={styles.items}>
              {items.map((item) => (
                <div key={item.id} className={styles.item}>
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
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{item.name}</span>
                    <div className={styles.quantityControls}>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => changeQuantity(item.productId, -1)}
                        aria-label="Уменьшить количество"
                        type="button"
                      >
                        −
                      </button>
                      <span className={styles.qtyValue}>{item.quantity}</span>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => changeQuantity(item.productId, 1)}
                        aria-label="Увеличить количество"
                        type="button"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <span className={styles.itemTotalPrice}>
                    {(item.price * item.quantity).toLocaleString('ru-BY')} BYN
                  </span>
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeFromCart(item.productId)}
                    aria-label={`Удалить ${item.name}`}
                    type="button"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className={styles.footer}>
              <div className={styles.total}>
                <span>Итого:</span>
                <span className={styles.totalPrice}>
                  {totalPrice.toLocaleString('ru-BY')} BYN
                </span>
              </div>
              <div className={styles.actions}>
                <Link to="/catalog" className={styles.btnGhost} onClick={onClose}>
                  Продолжить покупки
                </Link>
                <Link to="/checkout" className={styles.btnPrimary} onClick={onClose}>
                  Оформить
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}