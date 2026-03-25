import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ordersApi } from '../../api/orders';
import { useCartStore } from '../../store/cartStore';
import { getProductImageUrl, hasValidProductImage } from '../../utils/image';
import styles from './CheckoutPage.module.css';

/**
 * CheckoutPage - Checkout Page with 3-step process
 */

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

const PHONE_RE = /^\+?[\d\s()\-]{9,}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function CheckoutPage() {
  const [currentStep, setCurrentStep] = useState<Step>('shipping');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('delivery');
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { items: cartItems, getTotal, getItemCount, getDiscountedTotal, discount, clearCart } = useCartStore();

  const [shippingData, setShippingData] = useState<ShippingData>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    city: 'minsk',
    address: '',
    comment: '',
  });

  const totalItems = getItemCount();
  const subtotal = getTotal();
  const total = (discount > 0 ? getDiscountedTotal() : subtotal) + deliveryCost;

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
    setShippingData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateShipping = useCallback((): boolean => {
    const err: Record<string, string> = {};
    if (!shippingData.firstName.trim()) err.firstName = 'Укажите имя';
    if (!shippingData.lastName.trim()) err.lastName = 'Укажите фамилию';
    if (!shippingData.phone.trim() || !PHONE_RE.test(shippingData.phone.trim())) {
      err.phone = 'Укажите корректный телефон';
    }
    if (!shippingData.email.trim() || !EMAIL_RE.test(shippingData.email.trim())) {
      err.email = 'Укажите корректный email';
    }
    if (deliveryMethod === 'delivery' && !shippingData.address.trim()) {
      err.address = 'Укажите адрес доставки';
    }
    setFieldErrors(err);
    return Object.keys(err).length === 0;
  }, [shippingData, deliveryMethod]);

  const handleNextStep = () => {
    if (currentStep === 'shipping' && !validateShipping()) return;
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
    clearCart();
    setOrderPlaced(true);
  };

  const renderProductIcon = (category: string) => {
    switch (category) {
      case 'gpu':
        return (
          <svg viewBox="0 0 32 32" fill="none">
            <rect x="4" y="4" width="24" height="24" rx="2" stroke="#d4a574" strokeWidth="1.5" />
            <circle cx="16" cy="16" r="6" stroke="#d4a574" strokeWidth="1" />
          </svg>
        );
      case 'cpu':
        return (
          <svg viewBox="0 0 32 32" fill="none">
            <rect x="6" y="6" width="20" height="20" rx="2" stroke="#d4a574" strokeWidth="1.5" />
            <text x="16" y="18" textAnchor="middle" fill="#d4a574" fontSize="8">
              CPU
            </text>
          </svg>
        );
      case 'ram':
        return (
          <svg viewBox="0 0 32 32" fill="none">
            <rect x="4" y="10" width="24" height="12" rx="1" stroke="#d4a574" strokeWidth="1.5" />
            <rect x="8" y="13" width="4" height="6" rx="0.5" fill="#d4a574" opacity="0.5" />
            <rect x="14" y="13" width="4" height="6" rx="0.5" fill="#d4a574" opacity="0.5" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 32 32" fill="none">
            <rect x="4" y="4" width="24" height="24" rx="2" stroke="#d4a574" strokeWidth="1.5" />
          </svg>
        );
    }
  };

  const stepBlockClass = (status: string) =>
    [
      styles.stepBlock,
      status === 'active' ? styles.stepBlockActive : '',
      status === 'completed' ? styles.stepBlockCompleted : '',
    ]
      .filter(Boolean)
      .join(' ');

  const checkoutBtn = (extra?: string) =>
    [styles.checkoutBtn, extra].filter(Boolean).join(' ');

  if (cartItems.length === 0 && !orderPlaced) {
    return (
      <div className={styles.checkoutPage}>
        <div className={styles.checkoutPageContainer}>
          <div className={styles.orderSuccess}>
            <h1 className={styles.orderSuccessTitle}>Корзина пуста</h1>
            <p className={styles.orderSuccessText}>Добавьте товары в корзину перед оформлением заказа.</p>
            <div className={styles.orderSuccessActions}>
              <Link to="/catalog" className={`${checkoutBtn()} ${styles.checkoutBtnPrimary}`}>
                В каталог
              </Link>
              <Link to="/cart" className={`${checkoutBtn()} ${styles.checkoutBtnGhost}`}>
                В корзину
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className={styles.checkoutPage}>
        <div className={styles.checkoutPageContainer}>
          <div className={styles.orderSuccess}>
            <div className={styles.orderSuccessIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className={styles.orderSuccessTitle}>Заказ оформлен!</h1>
            <p className={styles.orderSuccessText}>
              Номер вашего заказа: <span className={styles.orderSuccessNumber}>#GP-2024-001234</span>
            </p>
            <p className={styles.orderSuccessInfo}>Мы отправили подтверждение на email: {shippingData.email}</p>
            <div className={styles.orderSuccessActions}>
              <Link to="/catalog" className={`${checkoutBtn()} ${styles.checkoutBtnPrimary}`}>
                Продолжить покупки
              </Link>
              <Link to="/account" className={`${checkoutBtn()} ${styles.checkoutBtnGhost}`}>
                Мои заказы
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.checkoutPage}>
      <div className={styles.checkoutPageContainer}>
        <h1 className={styles.pageTitle}>Оформление заказа</h1>

        <nav className={styles.stepsIndicator} aria-label="Шаги оформления заказа">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            return (
              <div key={step.id} className={styles.stepWrapper}>
                <div className={stepBlockClass(status)} aria-current={status === 'active' ? 'step' : undefined}>
                  <span className={styles.stepNumber}>
                    {status === 'completed' ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      step.number
                    )}
                  </span>
                  <span className={styles.stepLabel}>{step.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`${styles.stepConnector} ${
                      getStepStatus(steps[index + 1].id) !== 'pending' ? styles.stepConnectorDone : ''
                    }`}
                    aria-hidden
                  />
                )}
              </div>
            );
          })}
        </nav>

        <div className={styles.checkoutLayout}>
          <div className={styles.formSection}>
            {currentStep === 'shipping' && (
              <div className={styles.formCard}>
                <h2 className={styles.formCardTitle}>Доставка</h2>
                <p className={styles.guestHint}>
                  Уже есть аккаунт? <Link to="/login">Войти</Link> — история заказов и гарантийные документы в личном
                  кабинете.
                </p>
                <div className={styles.paymentMethods} style={{ marginBottom: '16px' }}>
                  <label
                    className={`${styles.paymentMethod} ${
                      deliveryMethod === 'delivery' ? styles.paymentMethodSelected : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery"
                      value="delivery"
                      checked={deliveryMethod === 'delivery'}
                      onChange={() => setDeliveryMethod('delivery')}
                    />
                    <span className={styles.paymentRadio} />
                    <div className={styles.paymentInfo}>
                      <div className={styles.paymentName}>Курьерская доставка</div>
                      <div className={styles.paymentDesc}>По Минску и Беларуси</div>
                    </div>
                  </label>

                  <label
                    className={`${styles.paymentMethod} ${
                      deliveryMethod === 'pickup' ? styles.paymentMethodSelected : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery"
                      value="pickup"
                      checked={deliveryMethod === 'pickup'}
                      onChange={() => setDeliveryMethod('pickup')}
                    />
                    <span className={styles.paymentRadio} />
                    <div className={styles.paymentInfo}>
                      <div className={styles.paymentName}>Самовывоз</div>
                      <div className={styles.paymentDesc}>Бесплатно, в день подтверждения</div>
                    </div>
                  </label>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="firstName">
                      Имя
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      className={`${styles.formInput} ${fieldErrors.firstName ? styles.formInputError : ''}`}
                      placeholder="Иван"
                      value={shippingData.firstName}
                      onChange={(e) => handleShippingChange('firstName', e.target.value)}
                      aria-invalid={!!fieldErrors.firstName}
                      aria-describedby={fieldErrors.firstName ? 'err-firstName' : undefined}
                    />
                    {fieldErrors.firstName && (
                      <span id="err-firstName" className={styles.fieldError} role="alert">
                        {fieldErrors.firstName}
                      </span>
                    )}
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="lastName">
                      Фамилия
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      className={`${styles.formInput} ${fieldErrors.lastName ? styles.formInputError : ''}`}
                      placeholder="Иванов"
                      value={shippingData.lastName}
                      onChange={(e) => handleShippingChange('lastName', e.target.value)}
                      aria-invalid={!!fieldErrors.lastName}
                      aria-describedby={fieldErrors.lastName ? 'err-lastName' : undefined}
                    />
                    {fieldErrors.lastName && (
                      <span id="err-lastName" className={styles.fieldError} role="alert">
                        {fieldErrors.lastName}
                      </span>
                    )}
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="phone">
                      Телефон
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      className={`${styles.formInput} ${fieldErrors.phone ? styles.formInputError : ''}`}
                      placeholder="+375 (29) 123-45-67"
                      value={shippingData.phone}
                      onChange={(e) => handleShippingChange('phone', e.target.value)}
                      aria-invalid={!!fieldErrors.phone}
                      aria-describedby={fieldErrors.phone ? 'err-phone' : undefined}
                    />
                    {fieldErrors.phone && (
                      <span id="err-phone" className={styles.fieldError} role="alert">
                        {fieldErrors.phone}
                      </span>
                    )}
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="email">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      className={`${styles.formInput} ${fieldErrors.email ? styles.formInputError : ''}`}
                      placeholder="email@example.com"
                      value={shippingData.email}
                      onChange={(e) => handleShippingChange('email', e.target.value)}
                      aria-invalid={!!fieldErrors.email}
                      aria-describedby={fieldErrors.email ? 'err-email' : undefined}
                    />
                    {fieldErrors.email && (
                      <span id="err-email" className={styles.fieldError} role="alert">
                        {fieldErrors.email}
                      </span>
                    )}
                  </div>
                  <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                    <label className={styles.formLabel} htmlFor="city">
                      Город
                    </label>
                    <select
                      id="city"
                      className={styles.formInput}
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
                  <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                    <label className={styles.formLabel} htmlFor="address">
                      Адрес доставки
                    </label>
                    <input
                      type="text"
                      id="address"
                      className={`${styles.formInput} ${fieldErrors.address ? styles.formInputError : ''}`}
                      placeholder="ул. Примерная, д. 1, кв. 1"
                      value={shippingData.address}
                      onChange={(e) => handleShippingChange('address', e.target.value)}
                      aria-invalid={!!fieldErrors.address}
                      aria-describedby={fieldErrors.address ? 'err-address' : undefined}
                      disabled={deliveryMethod === 'pickup'}
                    />
                    {fieldErrors.address && (
                      <span id="err-address" className={styles.fieldError} role="alert">
                        {fieldErrors.address}
                      </span>
                    )}
                  </div>
                  <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                    <label className={styles.formLabel} htmlFor="comment">
                      Комментарий к заказу
                    </label>
                    <input
                      type="text"
                      id="comment"
                      className={styles.formInput}
                      placeholder="Пожелания к доставке (необязательно)"
                      value={shippingData.comment}
                      onChange={(e) => handleShippingChange('comment', e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.formActions}>
                  <Link to="/cart" className={`${checkoutBtn()} ${styles.checkoutBtnGhost}`}>
                    ← Вернуться в корзину
                  </Link>
                  <button type="button" className={`${checkoutBtn()} ${styles.checkoutBtnPrimary}`} onClick={handleNextStep}>
                    Продолжить
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'payment' && (
              <div className={styles.formCard}>
                <h2 className={styles.formCardTitle}>Способ оплаты</h2>

                <div className={styles.paymentMethods}>
                  <label className={`${styles.paymentMethod} ${paymentMethod === 'card' ? styles.paymentMethodSelected : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                    />
                    <span className={styles.paymentRadio} />
                    <div className={styles.paymentInfo}>
                      <div className={styles.paymentName}>Банковская карта</div>
                      <div className={styles.paymentDesc}>Visa, Mastercard, МИР</div>
                    </div>
                    <div className={styles.paymentIcon}>
                      <svg viewBox="0 0 32 20" fill="none">
                        <rect x="1" y="1" width="30" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
                        <rect x="4" y="8" width="8" height="4" rx="1" fill="currentColor" opacity="0.3" />
                      </svg>
                    </div>
                  </label>

                  <label className={`${styles.paymentMethod} ${paymentMethod === 'erip' ? styles.paymentMethodSelected : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="erip"
                      checked={paymentMethod === 'erip'}
                      onChange={() => setPaymentMethod('erip')}
                    />
                    <span className={styles.paymentRadio} />
                    <div className={styles.paymentInfo}>
                      <div className={styles.paymentName}>ЕРИП</div>
                      <div className={styles.paymentDesc}>Оплата через систему ЕРИП</div>
                    </div>
                    <div className={styles.paymentIcon}>
                      <svg viewBox="0 0 32 20" fill="none">
                        <rect x="1" y="1" width="30" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
                        <text x="16" y="13" textAnchor="middle" fill="currentColor" fontSize="7">
                          ЕРИП
                        </text>
                      </svg>
                    </div>
                  </label>

                  <label className={`${styles.paymentMethod} ${paymentMethod === 'cash' ? styles.paymentMethodSelected : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={() => setPaymentMethod('cash')}
                    />
                    <span className={styles.paymentRadio} />
                    <div className={styles.paymentInfo}>
                      <div className={styles.paymentName}>Наличными при получении</div>
                      <div className={styles.paymentDesc}>Оплата курьеру или в пункте выдачи</div>
                    </div>
                    <div className={styles.paymentIcon}>
                      <svg viewBox="0 0 32 20" fill="none">
                        <rect x="1" y="1" width="30" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="16" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </div>
                  </label>
                </div>

                <div className={styles.formActions}>
                  <button type="button" className={`${checkoutBtn()} ${styles.checkoutBtnGhost}`} onClick={handlePrevStep}>
                    ← Назад
                  </button>
                  <button type="button" className={`${checkoutBtn()} ${styles.checkoutBtnPrimary}`} onClick={handleNextStep}>
                    Продолжить
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'confirm' && (
              <div className={styles.formCard}>
                <h2 className={styles.formCardTitle}>Подтверждение заказа</h2>

                <div className={styles.confirmSection}>
                  <h3 className={styles.confirmSectionTitle}>Данные доставки</h3>
                  <div className={styles.confirmData}>
                    <p>
                      <strong>
                        {shippingData.firstName} {shippingData.lastName}
                      </strong>
                    </p>
                    <p>{shippingData.phone}</p>
                    <p>{shippingData.email}</p>
                    <p>
                      {shippingData.city === 'minsk' ? 'Минск' : shippingData.city}, {shippingData.address}
                    </p>
                    {shippingData.comment && (
                      <p className={styles.confirmDataComment}>Комментарий: {shippingData.comment}</p>
                    )}
                  </div>
                </div>

                <div className={styles.confirmSection}>
                  <h3 className={styles.confirmSectionTitle}>Способ оплаты</h3>
                  <div className={styles.confirmData}>
                    <p>
                      {paymentMethod === 'card' && 'Банковская карта (Visa, Mastercard, МИР)'}
                      {paymentMethod === 'erip' && 'ЕРИП'}
                      {paymentMethod === 'cash' && 'Наличными при получении'}
                    </p>
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button type="button" className={`${checkoutBtn()} ${styles.checkoutBtnGhost}`} onClick={handlePrevStep}>
                    ← Назад
                  </button>
                  <button type="button" className={`${checkoutBtn()} ${styles.checkoutBtnPrimary}`} onClick={handlePlaceOrder}>
                    Подтвердить заказ
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          <aside className={styles.orderSummary} aria-label="Сводка заказа">
            <h2 className={styles.summaryTitle}>Ваш заказ</h2>

            <div className={styles.summaryItems}>
              {cartItems.map((item) => (
                <div key={item.id} className={styles.summaryItem}>
                  <div className={styles.summaryItemImage}>
                    {hasValidProductImage(item.imageUrl) && getProductImageUrl(item.imageUrl) ? (
                      <img src={getProductImageUrl(item.imageUrl)!} alt={item.name} className={styles.summaryItemImg} />
                    ) : (
                      renderProductIcon(item.category)
                    )}
                  </div>
                  <div className={styles.summaryItemInfo}>
                    <div className={styles.summaryItemName}>{item.name}</div>
                    <div className={styles.summaryItemQty}>{item.quantity} шт</div>
                  </div>
                  <span className={styles.summaryItemPrice}>
                    {(item.price * item.quantity).toLocaleString('ru-BY')} BYN
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.summaryDivider} />

            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Товары ({totalItems})</span>
              <span className={styles.summaryValue}>{subtotal.toLocaleString('ru-BY')} BYN</span>
            </div>
            {discount > 0 && (
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Скидка ({discount}%)</span>
                <span className={`${styles.summaryValue} ${styles.summaryValueAccent}`}>
                  -{(subtotal - getDiscountedTotal()).toLocaleString('ru-BY')} BYN
                </span>
              </div>
            )}

            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Доставка</span>
              <span className={`${styles.summaryValue} ${styles.summaryValueAccent}`}>
                {deliveryCost === 0 ? 'Бесплатно' : `${deliveryCost.toLocaleString('ru-BY')} BYN`}
              </span>
            </div>

            <div className={styles.summaryTotal}>
              <span className={styles.totalLabel}>К оплате</span>
              <span className={styles.totalValue}>{total.toLocaleString('ru-BY')} BYN</span>
            </div>

            {currentStep === 'confirm' && (
              <button
                type="button"
                className={`${checkoutBtn()} ${styles.checkoutBtnPrimary} ${styles.checkoutBtnFull}`}
                onClick={handlePlaceOrder}
              >
                Подтвердить заказ
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
            )}

            <div className={styles.secureBadge}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Безопасная оплата по SSL
            </div>
          </aside>
        </div>

        <div className={styles.checkoutMobileBar} role="region" aria-label="Итого и следующий шаг">
          <div className={styles.checkoutMobileBarInner}>
            <div className={styles.checkoutMobileBarTotal}>
              <span className={styles.checkoutMobileBarLabel}>К оплате</span>
              <span className={`${styles.checkoutMobileBarPrice} tabular-nums`}>
                {total.toLocaleString('ru-BY')} BYN
              </span>
            </div>
            {currentStep === 'shipping' && (
              <button
                type="button"
                className={`${checkoutBtn()} ${styles.checkoutBtnPrimary} ${styles.checkoutMobileBarBtn}`}
                onClick={handleNextStep}
              >
                Продолжить
              </button>
            )}
            {currentStep === 'payment' && (
              <button
                type="button"
                className={`${checkoutBtn()} ${styles.checkoutBtnPrimary} ${styles.checkoutMobileBarBtn}`}
                onClick={handleNextStep}
              >
                Продолжить
              </button>
            )}
            {currentStep === 'confirm' && (
              <button
                type="button"
                className={`${checkoutBtn()} ${styles.checkoutBtnPrimary} ${styles.checkoutMobileBarBtn}`}
                onClick={handlePlaceOrder}
              >
                Подтвердить заказ
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
