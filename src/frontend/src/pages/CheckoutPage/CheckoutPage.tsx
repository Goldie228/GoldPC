'use client';

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ordersApi } from '../../api/orders';
import './CheckoutPage.css';

/**
 * CheckoutPage - Checkout Page with 3-step process
 * 
 * Steps:
 * 1. Shipping - Address and contact information
 * 2. Payment - Payment method selection
 * 3. Confirm - Order review and confirmation
 */

interface CartItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  image: string;
}

interface ShippingData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  comment: string;
}

type PaymentMethod = 'card' | 'erip' | 'cash';
type DeliveryMethod = 'pickup' | 'delivery';
type Step = 'shipping' | 'payment' | 'confirm';

export function CheckoutPage() {
  const [currentStep, setCurrentStep] = useState<Step>('shipping');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('delivery');
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [orderPlaced, setOrderPlaced] = useState(false);
  
  const [shippingData, setShippingData] = useState<ShippingData>({
    firstName: 'Александр',
    lastName: 'Петров',
    phone: '+375 (29) 123-45-67',
    email: 'alex@goldpc.by',
    city: 'minsk',
    address: 'ул. Независимости, д. 50, кв. 123',
    comment: '',
  });

  const cartItems: CartItem[] = [
    { id: 1, name: 'NVIDIA RTX 4070 Ti Super 16GB', quantity: 1, price: 3200, image: 'gpu' },
    { id: 2, name: 'AMD Ryzen 7 7800X3D', quantity: 1, price: 1450, image: 'cpu' },
    { id: 3, name: 'G.Skill Trident Z5 RGB 32GB DDR5', quantity: 2, price: 650, image: 'ram' },
  ];

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + deliveryCost;

  useEffect(() => {
    const deliveryMethodApi = deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery';
    const city =
      shippingData.city === 'minsk'
        ? 'Минск'
        : shippingData.city === 'brest'
          ? 'Брест'
          : shippingData.city === 'grodno'
            ? 'Гродно'
            : shippingData.city === 'vitebsk'
              ? 'Витебск'
              : shippingData.city === 'gomel'
                ? 'Гомель'
                : shippingData.city === 'mogilev'
                  ? 'Могилёв'
                  : shippingData.city;

    void ordersApi
      .getDeliveryQuote({
        deliveryMethod: deliveryMethodApi,
        subtotal,
        city,
      })
      .then((quote) => {
        setDeliveryCost(quote.deliveryCost);
      })
      .catch(() => {
        setDeliveryCost(deliveryMethod === 'pickup' ? 0 : subtotal >= 1500 ? 0 : shippingData.city === 'minsk' ? 10 : 20);
      });
  }, [deliveryMethod, subtotal, shippingData.city]);

  const steps = [
    { id: 'shipping' as Step, label: 'Доставка', number: 1 },
    { id: 'payment' as Step, label: 'Оплата', number: 2 },
    { id: 'confirm' as Step, label: 'Подтверждение', number: 3 },
  ];

  const getStepStatus = (stepId: Step) => {
    const stepOrder = ['shipping', 'payment', 'confirm'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(stepId);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  const handleShippingChange = (field: keyof ShippingData, value: string) => {
    setShippingData(prev => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    const stepOrder: Step[] = ['shipping', 'payment', 'confirm'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handlePrevStep = () => {
    const stepOrder: Step[] = ['shipping', 'payment', 'confirm'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handlePlaceOrder = () => {
    setOrderPlaced(true);
  };

  const renderProductIcon = (type: string) => {
    switch (type) {
      case 'gpu':
        return (
          <svg viewBox="0 0 32 32" fill="none">
            <rect x="4" y="4" width="24" height="24" rx="2" stroke="#d4a574" strokeWidth="1.5"/>
            <circle cx="16" cy="16" r="6" stroke="#d4a574" strokeWidth="1"/>
          </svg>
        );
      case 'cpu':
        return (
          <svg viewBox="0 0 32 32" fill="none">
            <rect x="6" y="6" width="20" height="20" rx="2" stroke="#d4a574" strokeWidth="1.5"/>
            <text x="16" y="18" textAnchor="middle" fill="#d4a574" fontSize="8">CPU</text>
          </svg>
        );
      case 'ram':
        return (
          <svg viewBox="0 0 32 32" fill="none">
            <rect x="4" y="10" width="24" height="12" rx="1" stroke="#d4a574" strokeWidth="1.5"/>
            <rect x="8" y="13" width="4" height="6" rx="0.5" fill="#d4a574" opacity="0.5"/>
            <rect x="14" y="13" width="4" height="6" rx="0.5" fill="#d4a574" opacity="0.5"/>
          </svg>
        );
      default:
        return null;
    }
  };

  if (orderPlaced) {
    return (
      <div className="checkout-page">
        <div className="checkout-page__container">
          <div className="order-success">
            <div className="order-success__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h1 className="order-success__title">Заказ оформлен!</h1>
            <p className="order-success__text">
              Номер вашего заказа: <span className="order-success__number">#GP-2024-001234</span>
            </p>
            <p className="order-success__info">
              Мы отправили подтверждение на email: {shippingData.email}
            </p>
            <div className="order-success__actions">
              <Link to="/catalog" className="btn btn-primary">
                Продолжить покупки
              </Link>
              <Link to="/account" className="btn btn-ghost">
                Мои заказы
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-page__container">
        <h1 className="page-title">Оформление заказа</h1>

        {/* Steps Indicator */}
        <div className="steps-indicator">
          {steps.map((step, index) => (
            <div key={step.id} className="step-wrapper">
              <div className={`step ${getStepStatus(step.id)}`}>
                <span className="step-number">
                  {getStepStatus(step.id) === 'completed' ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    step.number
                  )}
                </span>
                <span className="step-label">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`step-connector ${getStepStatus(steps[index + 1].id) !== 'pending' ? 'completed' : ''}`} />
              )}
            </div>
          ))}
        </div>

        <div className="checkout-layout">
          {/* Form Section */}
          <div className="form-section">
            {/* Step 1: Shipping */}
            {currentStep === 'shipping' && (
              <div className="form-card">
                <h2 className="form-card-title">Доставка</h2>
                <div className="payment-methods" style={{ marginBottom: '16px' }}>
                  <label className={`payment-method ${deliveryMethod === 'delivery' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="delivery"
                      value="delivery"
                      checked={deliveryMethod === 'delivery'}
                      onChange={() => setDeliveryMethod('delivery')}
                    />
                    <span className="payment-radio"></span>
                    <div className="payment-info">
                      <div className="payment-name">Курьерская доставка</div>
                      <div className="payment-desc">По Минску и Беларуси</div>
                    </div>
                  </label>

                  <label className={`payment-method ${deliveryMethod === 'pickup' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="delivery"
                      value="pickup"
                      checked={deliveryMethod === 'pickup'}
                      onChange={() => setDeliveryMethod('pickup')}
                    />
                    <span className="payment-radio"></span>
                    <div className="payment-info">
                      <div className="payment-name">Самовывоз</div>
                      <div className="payment-desc">Бесплатно, в день подтверждения</div>
                    </div>
                  </label>
                </div>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="firstName">Имя</label>
                    <input 
                      type="text" 
                      id="firstName" 
                      className="form-input" 
                      placeholder="Иван"
                      value={shippingData.firstName}
                      onChange={(e) => handleShippingChange('firstName', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="lastName">Фамилия</label>
                    <input 
                      type="text" 
                      id="lastName" 
                      className="form-input" 
                      placeholder="Иванов"
                      value={shippingData.lastName}
                      onChange={(e) => handleShippingChange('lastName', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="phone">Телефон</label>
                    <input 
                      type="tel" 
                      id="phone" 
                      className="form-input" 
                      placeholder="+375 (29) 123-45-67"
                      value={shippingData.phone}
                      onChange={(e) => handleShippingChange('phone', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="email">Email</label>
                    <input 
                      type="email" 
                      id="email" 
                      className="form-input" 
                      placeholder="email@example.com"
                      value={shippingData.email}
                      onChange={(e) => handleShippingChange('email', e.target.value)}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label" htmlFor="city">Город</label>
                    <select 
                      id="city" 
                      className="form-input"
                      value={shippingData.city}
                      onChange={(e) => handleShippingChange('city', e.target.value)}
                    >
                      <option value="minsk">Минск</option>
                      <option value="brest">Брест</option>
                      <option value="grodno">Гродно</option>
                      <option value="vitebsk">Витебск</option>
                      <option value="gomel">Гомель</option>
                      <option value="mogilev">Могилёв</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label" htmlFor="address">Адрес доставки</label>
                    <input 
                      type="text" 
                      id="address" 
                      className="form-input" 
                      placeholder="ул. Примерная, д. 1, кв. 1"
                      value={shippingData.address}
                      onChange={(e) => handleShippingChange('address', e.target.value)}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label" htmlFor="comment">Комментарий к заказу</label>
                    <input 
                      type="text" 
                      id="comment" 
                      className="form-input" 
                      placeholder="Пожелания к доставке (необязательно)"
                      value={shippingData.comment}
                      onChange={(e) => handleShippingChange('comment', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <Link to="/cart" className="btn btn-ghost">← Вернуться в корзину</Link>
                  <button className="btn btn-primary" onClick={handleNextStep}>
                    Продолжить
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Payment */}
            {currentStep === 'payment' && (
              <div className="form-card">
                <h2 className="form-card-title">Способ оплаты</h2>
                
                <div className="payment-methods">
                  <label className={`payment-method ${paymentMethod === 'card' ? 'selected' : ''}`}>
                    <input 
                      type="radio" 
                      name="payment" 
                      value="card" 
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                    />
                    <span className="payment-radio"></span>
                    <div className="payment-info">
                      <div className="payment-name">Банковская карта</div>
                      <div className="payment-desc">Visa, Mastercard, МИР</div>
                    </div>
                    <div className="payment-icon">
                      <svg viewBox="0 0 32 20" fill="none">
                        <rect x="1" y="1" width="30" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                        <rect x="4" y="8" width="8" height="4" rx="1" fill="currentColor" opacity="0.3"/>
                      </svg>
                    </div>
                  </label>

                  <label className={`payment-method ${paymentMethod === 'erip' ? 'selected' : ''}`}>
                    <input 
                      type="radio" 
                      name="payment" 
                      value="erip"
                      checked={paymentMethod === 'erip'}
                      onChange={() => setPaymentMethod('erip')}
                    />
                    <span className="payment-radio"></span>
                    <div className="payment-info">
                      <div className="payment-name">ЕРИП</div>
                      <div className="payment-desc">Оплата через систему ЕРИП</div>
                    </div>
                    <div className="payment-icon">
                      <svg viewBox="0 0 32 20" fill="none">
                        <rect x="1" y="1" width="30" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                        <text x="16" y="13" textAnchor="middle" fill="currentColor" fontSize="7">ЕРИП</text>
                      </svg>
                    </div>
                  </label>

                  <label className={`payment-method ${paymentMethod === 'cash' ? 'selected' : ''}`}>
                    <input 
                      type="radio" 
                      name="payment" 
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={() => setPaymentMethod('cash')}
                    />
                    <span className="payment-radio"></span>
                    <div className="payment-info">
                      <div className="payment-name">Наличными при получении</div>
                      <div className="payment-desc">Оплата курьеру или в пункте выдачи</div>
                    </div>
                    <div className="payment-icon">
                      <svg viewBox="0 0 32 20" fill="none">
                        <rect x="1" y="1" width="30" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                        <circle cx="16" cy="10" r="4" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                    </div>
                  </label>
                </div>

                <div className="form-actions">
                  <button className="btn btn-ghost" onClick={handlePrevStep}>← Назад</button>
                  <button className="btn btn-primary" onClick={handleNextStep}>
                    Продолжить
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Confirm */}
            {currentStep === 'confirm' && (
              <div className="form-card">
                <h2 className="form-card-title">Подтверждение заказа</h2>
                
                <div className="confirm-section">
                  <h3 className="confirm-section__title">Данные доставки</h3>
                  <div className="confirm-data">
                    <p><strong>{shippingData.firstName} {shippingData.lastName}</strong></p>
                    <p>{shippingData.phone}</p>
                    <p>{shippingData.email}</p>
                    <p>{shippingData.city === 'minsk' ? 'Минск' : shippingData.city}, {shippingData.address}</p>
                    {shippingData.comment && <p className="confirm-data__comment">Комментарий: {shippingData.comment}</p>}
                  </div>
                </div>

                <div className="confirm-section">
                  <h3 className="confirm-section__title">Способ оплаты</h3>
                  <div className="confirm-data">
                    <p>
                      {paymentMethod === 'card' && 'Банковская карта (Visa, Mastercard, МИР)'}
                      {paymentMethod === 'erip' && 'ЕРИП'}
                      {paymentMethod === 'cash' && 'Наличными при получении'}
                    </p>
                  </div>
                </div>

                <div className="form-actions">
                  <button className="btn btn-ghost" onClick={handlePrevStep}>← Назад</button>
                  <button className="btn btn-primary" onClick={handlePlaceOrder}>
                    Подтвердить заказ
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <aside className="order-summary">
            <h2 className="summary-title">Ваш заказ</h2>

            <div className="summary-items">
              {cartItems.map((item) => (
                <div key={item.id} className="summary-item">
                  <div className="summary-item-image">
                    {renderProductIcon(item.image)}
                  </div>
                  <div className="summary-item-info">
                    <div className="summary-item-name">{item.name}</div>
                    <div className="summary-item-qty">{item.quantity} шт</div>
                  </div>
                  <span className="summary-item-price">
                    {(item.price * item.quantity).toLocaleString('ru-BY')} BYN
                  </span>
                </div>
              ))}
            </div>

            <div className="summary-divider"></div>

            <div className="summary-row">
              <span className="summary-label">Товары ({totalItems})</span>
              <span className="summary-value">{subtotal.toLocaleString('ru-BY')} BYN</span>
            </div>

            <div className="summary-row">
              <span className="summary-label">Доставка</span>
              <span className="summary-value summary-value--accent">
                {deliveryCost === 0 ? 'Бесплатно' : `${deliveryCost.toLocaleString('ru-BY')} BYN`}
              </span>
            </div>

            <div className="summary-total">
              <span className="total-label">К оплате</span>
              <span className="total-value">{total.toLocaleString('ru-BY')} BYN</span>
            </div>

            {currentStep === 'confirm' && (
              <button className="btn btn-primary btn-full" onClick={handlePlaceOrder}>
                Подтвердить заказ
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </button>
            )}

            <div className="secure-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Безопасная оплата по SSL
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}