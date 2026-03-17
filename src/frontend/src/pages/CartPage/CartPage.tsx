import './CartPage.css';

/**
 * CartPage - Shopping Cart Page
 * 
 * Features:
 * - Cart items list with quantity controls
 * - Order summary with promo code input
 * - Checkout button
 */
export function CartPage() {
  const cartItems = [
    {
      id: 1,
      name: 'NVIDIA GeForce RTX 4070 Super',
      price: 58990,
      quantity: 1,
      image: '🎮',
    },
    {
      id: 2,
      name: 'AMD Ryzen 7 7800X3D',
      price: 38990,
      quantity: 1,
      image: '🔲',
    },
    {
      id: 3,
      name: 'G.Skill Trident Z5 32GB DDR5-6000',
      price: 12990,
      quantity: 2,
      image: '💾',
    },
  ];

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = 5000;
  const total = subtotal - discount;

  return (
    <div className="cart-page">
      <div className="cart-page__container">
        <h1 className="cart-page__title">🛒 Корзина</h1>

        {cartItems.length === 0 ? (
          <div className="cart-page__empty">
            <p>Ваша корзина пуста</p>
            <a href="/catalog" className="cart-page__continue-link">
              Перейти к покупкам
            </a>
          </div>
        ) : (
          <div className="cart-page__content">
            {/* Cart Items */}
            <div className="cart-page__items">
              {cartItems.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item__image">
                    {item.image}
                  </div>
                  <div className="cart-item__info">
                    <h3 className="cart-item__name">{item.name}</h3>
                    <p className="cart-item__price">
                      {item.price.toLocaleString('ru-RU')} ₽
                    </p>
                  </div>
                  <div className="cart-item__quantity">
                    <button className="cart-item__qty-btn">−</button>
                    <span className="cart-item__qty-value">{item.quantity}</span>
                    <button className="cart-item__qty-btn">+</button>
                  </div>
                  <div className="cart-item__total">
                    {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
                  </div>
                  <button className="cart-item__remove">✕</button>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="cart-page__summary">
              <div className="order-summary">
                <h3 className="order-summary__title">Ваш заказ</h3>
                
                <div className="order-summary__row">
                  <span>Товары ({cartItems.length})</span>
                  <span>{subtotal.toLocaleString('ru-RU')} ₽</span>
                </div>

                {discount > 0 && (
                  <div className="order-summary__row order-summary__row--discount">
                    <span>Скидка</span>
                    <span>−{discount.toLocaleString('ru-RU')} ₽</span>
                  </div>
                )}

                <div className="order-summary__divider" />

                <div className="order-summary__total">
                  <span>Итого:</span>
                  <span className="order-summary__total-price">
                    {total.toLocaleString('ru-RU')} ₽
                  </span>
                </div>

                {/* Promo Code */}
                <div className="order-summary__promo">
                  <input
                    type="text"
                    placeholder="Промокод"
                    className="order-summary__promo-input"
                  />
                  <button className="order-summary__promo-btn">Применить</button>
                </div>

                <button className="btn-gold-shimmer">
                  Оформить заказ
                </button>

                <p className="order-summary__note">
                  Доставка рассчитается на следующем шаге
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}