import { useState, useEffect } from 'react';
import { isAxiosError } from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { extractApiErrorMessage, ordersApi } from '../../api/orders';
import { addressesApi, type UserAddress } from '../../api/addresses';
import { useToastStore } from '../../store/toastStore';
import { parsePhone, isValidPhone } from '../../utils/phone';
import { AddressMap } from '../../components/checkout/AddressMap';
import { DeliveryTimeSlotPicker } from '../../components/checkout/DeliveryTimeSlotPicker';
import { PaymentForm, type PaymentData } from '../../components/checkout/PaymentForm';
import { QRCodePayment } from '../../components/checkout/QRCodePayment';
import { Icon } from '../../components/ui/Icon';
import { Button } from '../../components/ui/Button';
import { PhoneInput } from '../../components/ui/PhoneInput';
import styles from './CheckoutPage.module.css';

type Step = 'delivery' | 'contacts' | 'payment' | 'confirm';
type DeliveryMethod = 'Delivery' | 'Pickup';
type PaymentMethod = 'CardOnline' | 'SBP' | 'Cash' | 'CardOnDelivery';
type ContactField = keyof ContactData;

interface ContactData {
  firstName: string;
  phone: string;
  email: string;
}

interface DeliveryData {
  method: DeliveryMethod;
  city: string;
  address: string;
  addressId?: string;
  deliveryDate?: string;
  timeSlot?: string;
  saveAddress?: boolean;
  pickupPointId?: string;
  pickupPointName?: string;
}

const FREE_DELIVERY_THRESHOLD = 200;
const NAME_REGEX = /^[A-Za-zА-Яа-яЁё-]{2,50}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_FIELDS: ContactField[] = ['firstName', 'phone', 'email'];

function isOnlinePaymentMethod(method: PaymentMethod): boolean {
  return method === 'CardOnline' || method === 'SBP';
}

function getPaymentMethodLabel(method: PaymentMethod, paymentData: PaymentData | null): string {
  if (method === 'CardOnline') {
    return `Карта онлайн${paymentData ? ` (**** ${paymentData.cardNumber.slice(-4)})` : ''}`;
  }

  if (method === 'SBP') {
    return 'СБП (Система быстрых платежей)';
  }

  if (method === 'Cash') {
    return 'Наличными при получении';
  }

  return 'Картой при получении';
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getTotal, getDiscountAmount, promoCode, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const showToast = useToastStore(state => state.showToast);

  const [currentStep, setCurrentStep] = useState<Step>('delivery');
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showQRPayment, setShowQRPayment] = useState(false);

  const [deliveryData, setDeliveryData] = useState<DeliveryData>({
    method: 'Delivery',
    city: 'Минск',
    address: '',
    saveAddress: false,
  });

  const [contactData, setContactData] = useState<ContactData>({
    firstName: user?.firstName || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });
  const [contactErrors, setContactErrors] = useState<Partial<Record<ContactField, string>>>({});
  const [contactTouched, setContactTouched] = useState<Partial<Record<ContactField, boolean>>>({});

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CardOnline');
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);

  const subtotal = getTotal();
  const discountAmount = getDiscountAmount();
  const total = subtotal - discountAmount + deliveryCost;

  // Load saved addresses
  useEffect(() => {
    if (user) {
      addressesApi.getAddresses()
        .then(setSavedAddresses)
        .catch(() => {});
    }
  }, [user]);

  // Calculate delivery cost
  useEffect(() => {
    ordersApi.getDeliveryQuote({
      deliveryMethod: deliveryData.method,
      subtotal,
      city: deliveryData.city,
    }).then(quote => setDeliveryCost(quote.deliveryCost)).catch(() => {});
  }, [deliveryData.method, deliveryData.city, subtotal]);

  const validateContactField = (field: ContactField, rawValue: string): boolean => {
    const value = rawValue.trim();
    let error = '';

    if (field === 'firstName') {
      if (!value) {
        error = 'Поле обязательно для заполнения';
      } else if (!NAME_REGEX.test(value)) {
        error = 'Используйте 2-50 букв кириллицы или латиницы, дефис допускается';
      }
    }

    if (field === 'phone') {
      if (!value) {
        error = 'Укажите номер телефона';
      } else if (!isValidPhone(value)) {
        error = 'Введите корректный номер телефона';
      }
    }

    if (field === 'email') {
      if (!value) {
        error = 'Укажите email';
      } else if (!EMAIL_REGEX.test(value)) {
        error = 'Введите корректный email';
      }
    }

    setContactErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  };

  const validateContacts = (): boolean => {
    setContactTouched({
      firstName: true,
      phone: true,
      email: true,
    });

    return CONTACT_FIELDS.every(field => validateContactField(field, contactData[field]));
  };

  const handleContactChange = (field: ContactField, value: string) => {
    setContactData(prev => ({ ...prev, [field]: value }));

    if (contactTouched[field]) {
      validateContactField(field, value);
    }
  };

  const handleContactBlur = (field: ContactField) => {
    setContactTouched(prev => ({ ...prev, [field]: true }));
    validateContactField(field, contactData[field]);
  };

  const handleNextStep = () => {
    if (currentStep === 'delivery') {
      if (deliveryData.method === 'Delivery' && !deliveryData.address) {
        showToast('Укажите адрес доставки', 'error');
        return;
      }
      if (deliveryData.method === 'Pickup' && !deliveryData.pickupPointId) {
        showToast('Выберите пункт выдачи', 'error');
        return;
      }
      setCurrentStep('contacts');
    } else if (currentStep === 'contacts') {
      if (!validateContacts()) {
        showToast('Проверьте корректность контактных данных', 'error');
        return;
      }
      setCurrentStep('payment');
    } else if (currentStep === 'payment') {
      if (paymentMethod === 'CardOnline') {
        setShowPaymentForm(true);
        return;
      }
      if (paymentMethod === 'SBP') {
        setShowQRPayment(true);
        return;
      }
      setCurrentStep('confirm');
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 'contacts') setCurrentStep('delivery');
    else if (currentStep === 'payment') setCurrentStep('contacts');
    else if (currentStep === 'confirm') setCurrentStep('payment');
  };

  const handlePaymentFormSubmit = async (data: PaymentData) => {
    setPaymentData(data);
    await handlePlaceOrder();
  };

  const handleQRPaymentConfirm = async () => {
    await handlePlaceOrder();
  };

  const handlePlaceOrder = async (): Promise<boolean> => {
    setIsProcessing(true);
    try {
      // Сохранить адрес если нужно
      if (deliveryData.saveAddress && user && deliveryData.method === 'Delivery') {
        try {
          await addressesApi.createAddress({
            name: 'Адрес доставки',
            city: deliveryData.city,
            address: deliveryData.address,
            isDefault: savedAddresses.length === 0,
          });
        } catch (error) {
          console.error('Failed to save address:', error);
        }
      }

        const order = await ordersApi.createOrder({
        firstName: contactData.firstName.trim(),
        lastName: '',
        phone: parsePhone(contactData.phone.trim()),
        email: contactData.email.trim(),
        deliveryMethod: deliveryData.method,
        paymentMethod: isOnlinePaymentMethod(paymentMethod) ? 'Online' : 'OnReceipt',
        address: deliveryData.method === 'Delivery' ? deliveryData.address : deliveryData.pickupPointName,
        city: deliveryData.city,
        promoCode: promoCode || undefined,
        discountAmount,
        deliveryDate: deliveryData.deliveryDate,
        deliveryTimeSlot: deliveryData.timeSlot,
        items: items.map(item => ({
          productId: item.productId,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
      });

      clearCart();
      showToast('Заказ успешно оформлен!', 'success');
      navigate(`/orders/${order.orderNumber}/success`);
      return true;
    } catch (error) {
      if (isAxiosError(error)) {
        const status = error.response?.status;
        const serverMessage = extractApiErrorMessage(error.response?.data);

        if (serverMessage) {
          showToast(serverMessage, 'error');
          return false;
        }

        if (status && status >= 500) {
          showToast('Сервис заказов временно недоступен. Попробуйте позже.', 'error');
          return false;
        }
      }

      showToast('Ошибка при оформлении заказа. Проверьте данные и попробуйте снова.', 'error');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className={styles.checkoutPage}>
        <div className={styles.checkoutPageContainer}>
          <div className={styles.orderSuccess}>
            <h1>Корзина пуста</h1>
            <Link to="/catalog">
              <Button variant="primary" size="lg" fullWidth>
                В каталог
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (showPaymentForm) {
    return (
      <div className={styles.checkoutPage}>
        <div className={styles.checkoutPageContainer}>
          <h1 className={styles.pageTitle}>Оплата картой</h1>
          <div className={styles.paymentFormContainer}>
            <PaymentForm
              onSubmit={handlePaymentFormSubmit}
              onCancel={() => setShowPaymentForm(false)}
            />
          </div>
        </div>
      </div>
    );
  }

  if (showQRPayment) {
    return (
      <div className={styles.checkoutPage}>
        <div className={styles.checkoutPageContainer}>
          <h1 className={styles.pageTitle}>Оплата через СБП</h1>
          <div className={styles.paymentFormContainer}>
            <QRCodePayment
              amount={total}
              orderNumber={`TEMP-${Date.now()}`}
              onConfirm={handleQRPaymentConfirm}
              onCancel={() => setShowQRPayment(false)}
              isProcessing={isProcessing}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.checkoutPage}>
      <div className={styles.checkoutPageContainer}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb}>
          <Link to="/">Главная</Link>
          <span>/</span>
          <span>Оформление заказа</span>
        </nav>

        <h1 className={styles.pageTitle}>Оформление заказа</h1>

        {/* Steps Indicator */}
        <nav className={styles.stepsIndicator}>
          {[
            { id: 'delivery', label: 'Доставка', num: 1 },
            { id: 'contacts', label: 'Контакты', num: 2 },
            { id: 'payment', label: 'Оплата', num: 3 },
            { id: 'confirm', label: 'Подтверждение', num: 4 },
          ].map((step, i, arr) => {
            const stepIndex = arr.findIndex(s => s.id === currentStep);
            const thisIndex = i;
            const isCompleted = thisIndex < stepIndex;
            const isCurrent = step.id === currentStep;

            return (
              <div key={step.id} className={styles.stepWrapper}>
                <div className={`${styles.stepBlock} ${isCurrent ? styles.stepBlockActive : ''} ${isCompleted ? styles.stepBlockCompleted : ''}`}>
                  <span className={styles.stepNumber}>
                    {isCompleted ? <Icon name="check" size="sm" color="accent" /> : step.num}
                  </span>
                  <span className={styles.stepLabel}>{step.label}</span>
                </div>
                {i < arr.length - 1 && (
                  <div className={`${styles.stepConnector} ${isCompleted ? styles.stepConnectorActive : ''}`} />
                )}
              </div>
            );
          })}
        </nav>

        <div className={styles.checkoutLayout}>
          <div className={styles.formSection}>
            
            {/* Step 1: Delivery */}
            {currentStep === 'delivery' && (
              <div className={styles.formCard}>
                <h2>Способ доставки</h2>
                <div className={styles.paymentMethods}>
                  <label className={`${styles.paymentMethod} ${deliveryData.method === 'Delivery' ? styles.paymentMethodSelected : ''}`}>
                    <input
                      type="radio"
                      checked={deliveryData.method === 'Delivery'}
                      onChange={() => setDeliveryData(prev => ({ ...prev, method: 'Delivery', pickupPointId: undefined }))}
                    />
                    <span>
                      <Icon name="package" size="sm" color="accent" /> Курьерская доставка
                    </span>
                  </label>
                  <label className={`${styles.paymentMethod} ${deliveryData.method === 'Pickup' ? styles.paymentMethodSelected : ''}`}>
                    <input
                      type="radio"
                      checked={deliveryData.method === 'Pickup'}
                      onChange={() => setDeliveryData(prev => ({ ...prev, method: 'Pickup' }))}
                    />
                    <span>
                      <Icon name="package" size="sm" color="accent" /> Самовывоз (бесплатно)
                    </span>
                  </label>
                </div>

                <div className={styles.formGroupWithTopMargin}>
                  <label>Город</label>
                  <select
                    value={deliveryData.city}
                    onChange={(e) => setDeliveryData(prev => ({...prev, city: e.target.value}))}
                    className={styles.select}
                  >
                    <option value="Минск">Минск</option>
                    <option value="Брест">Брест</option>
                    <option value="Гродно">Гродно</option>
                    <option value="Витебск">Витебск</option>
                    <option value="Гомель">Гомель</option>
                    <option value="Могилёв">Могилёв</option>
                  </select>
                </div>

                {deliveryData.method === 'Delivery' && user && savedAddresses.length > 0 && (
                  <div className={styles.formGroup}>
                    <label>Сохранённые адреса</label>
                    <select
                      onChange={(e) => {
                        const addr = savedAddresses.find(a => a.id === e.target.value);
                        if (addr) {
                          setDeliveryData(prev => ({
                            ...prev,
                            city: addr.city,
                            address: addr.apartment ? `${addr.address}, кв. ${addr.apartment}` : addr.address,
                            addressId: addr.id
                          }));
                        }
                      }}
                      className={styles.select}
                    >
                      <option value="">Выберите адрес или введите новый</option>
                      {savedAddresses.map(addr => (
                        <option key={addr.id} value={addr.id}>
                          {addr.name}: {addr.city}, {addr.address}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Карта */}
                <AddressMap
                  mode={deliveryData.method === 'Delivery' ? 'delivery' : 'pickup'}
                  city={deliveryData.city}
                  onAddressSelect={(address) => {
                    setDeliveryData(prev => ({ ...prev, address }));
                  }}
                  onPickupPointSelect={(point) => {
                    setDeliveryData(prev => ({
                      ...prev,
                      pickupPointId: point.id,
                      pickupPointName: `${point.name}, ${point.address}`,
                    }));
                  }}
                />

                {deliveryData.method === 'Delivery' && (
                  <>
                    <div className={styles.formGroup}>
                      <label>Адрес доставки</label>
                      <input
                        type="text"
                        placeholder="ул. Примерная, д. 1, кв. 1"
                        value={deliveryData.address}
                        onChange={(e) => setDeliveryData(prev => ({...prev, address: e.target.value}))}
                        className={styles.input}
                      />
                    </div>

                    {user && (
                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={deliveryData.saveAddress}
                          onChange={(e) => setDeliveryData(prev => ({...prev, saveAddress: e.target.checked}))}
                        />
                        <span>Сохранить адрес в профиль</span>
                      </label>
                    )}

                    {/* Временные слоты */}
                    <DeliveryTimeSlotPicker
                      selectedDate={deliveryData.deliveryDate}
                      selectedSlot={deliveryData.timeSlot}
                      onSelect={(date, slot) => {
                        setDeliveryData(prev => ({
                          ...prev,
                          deliveryDate: date,
                          timeSlot: slot,
                        }));
                      }}
                    />
                  </>
                )}

                {deliveryData.method === 'Pickup' && deliveryData.pickupPointName && (
                  <div className={styles.selectedPoint}>
                    <strong>Выбранный пункт выдачи:</strong>
                    <p>{deliveryData.pickupPointName}</p>
                  </div>
                )}

                <div className={styles.formActions}>
                  <Link to="/cart">
                    <Button variant="ghost" size="md" leftIcon={<Icon name="arrow-left" size="sm" />}>
                      Назад в корзину
                    </Button>
                  </Link>
                  <Button variant="primary" size="md" onClick={handleNextStep} rightIcon={<Icon name="arrow-right" size="sm" />}>
                    Продолжить
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Contacts */}
            {currentStep === 'contacts' && (
              <div className={styles.formCard}>
                <h2>Контактные данные</h2>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Имя*</label>
                    <input
                      value={contactData.firstName}
                      onChange={(e) => handleContactChange('firstName', e.target.value)}
                      onBlur={() => handleContactBlur('firstName')}
                      className={`${styles.input} ${contactTouched.firstName && contactErrors.firstName ? styles.inputError : ''}`}
                      placeholder="Иван"
                      autoComplete="given-name"
                    />
                    {contactTouched.firstName && contactErrors.firstName && (
                      <span className={styles.errorMessage}>{contactErrors.firstName}</span>
                    )}
                  </div>
                  <div className={styles.formGroup}>
                    <label>Телефон*</label>
                    <PhoneInput
                      value={contactData.phone}
                      onChange={(value) => handleContactChange('phone', value)}
                      onBlur={() => handleContactBlur('phone')}
                      className={contactTouched.phone && contactErrors.phone ? styles.inputError : ''}
                      placeholder="+375 (29) 123-45-67"
                      autoComplete="tel"
                    />
                    {contactTouched.phone && contactErrors.phone && (
                      <span className={styles.errorMessage}>{contactErrors.phone}</span>
                    )}
                  </div>
                  <div className={styles.formGroup}>
                    <label>Email*</label>
                    <input
                      type="email"
                      value={contactData.email}
                      onChange={(e) => handleContactChange('email', e.target.value)}
                      onBlur={() => handleContactBlur('email')}
                      className={`${styles.input} ${contactTouched.email && contactErrors.email ? styles.inputError : ''}`}
                      placeholder="example@mail.com"
                      autoComplete="email"
                    />
                    {contactTouched.email && contactErrors.email && (
                      <span className={styles.errorMessage}>{contactErrors.email}</span>
                    )}
                  </div>
                </div>
                <div className={styles.formActions}>
                  <Button variant="ghost" size="md" onClick={handlePrevStep} leftIcon={<Icon name="arrow-left" size="sm" />}>
                    Назад
                  </Button>
                  <Button variant="primary" size="md" onClick={handleNextStep} rightIcon={<Icon name="arrow-right" size="sm" />}>
                    Продолжить
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {currentStep === 'payment' && (
              <div className={styles.formCard}>
                <h2>Способ оплаты</h2>
                <div className={styles.paymentMethods}>
                  <label className={`${styles.paymentMethod} ${paymentMethod === 'CardOnline' ? styles.paymentMethodSelected : ''}`}>
                    <input
                      type="radio"
                      checked={paymentMethod === 'CardOnline'}
                      onChange={() => setPaymentMethod('CardOnline')}
                    />
                    <div className={styles.paymentMethodContent}>
                      <span><Icon name="credit-card" size="sm" color="accent" /> Карта онлайн</span>
                      <small>Visa, Mastercard, МИР</small>
                    </div>
                  </label>
                  <label className={`${styles.paymentMethod} ${paymentMethod === 'SBP' ? styles.paymentMethodSelected : ''}`}>
                    <input
                      type="radio"
                      checked={paymentMethod === 'SBP'}
                      onChange={() => setPaymentMethod('SBP')}
                    />
                    <div className={styles.paymentMethodContent}>
                      <span><Icon name="phone" size="sm" color="accent" /> СБП (Система быстрых платежей)</span>
                      <small>Оплата через приложение банка</small>
                    </div>
                  </label>
                  <label className={`${styles.paymentMethod} ${paymentMethod === 'Cash' ? styles.paymentMethodSelected : ''}`}>
                    <input
                      type="radio"
                      checked={paymentMethod === 'Cash'}
                      onChange={() => setPaymentMethod('Cash')}
                    />
                    <div className={styles.paymentMethodContent}>
                      <span><Icon name="credit-card" size="sm" color="accent" /> Наличными при получении</span>
                      <small>Оплата курьеру</small>
                    </div>
                  </label>
                  <label className={`${styles.paymentMethod} ${paymentMethod === 'CardOnDelivery' ? styles.paymentMethodSelected : ''}`}>
                    <input
                      type="radio"
                      checked={paymentMethod === 'CardOnDelivery'}
                      onChange={() => setPaymentMethod('CardOnDelivery')}
                    />
                    <div className={styles.paymentMethodContent}>
                      <span><Icon name="credit-card" size="sm" color="accent" /> Картой при получении</span>
                      <small>Терминал у курьера</small>
                    </div>
                  </label>
                </div>
                <div className={styles.formActions}>
                  <Button variant="ghost" size="md" onClick={handlePrevStep} leftIcon={<Icon name="arrow-left" size="sm" />}>
                    Назад
                  </Button>
                  <Button variant="primary" size="md" onClick={handleNextStep} rightIcon={<Icon name="arrow-right" size="sm" />}>
                    {isOnlinePaymentMethod(paymentMethod) ? 'Перейти к оплате' : 'Перейти к подтверждению'}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {currentStep === 'confirm' && (
              <div className={styles.formCard}>
                <h2>Подтверждение заказа</h2>
                
                <div className={styles.confirmSection}>
                  <h3><Icon name="package" size="sm" color="accent" /> Доставка</h3>
                  {deliveryData.method === 'Pickup' ? (
                    <p>{deliveryData.pickupPointName || 'Самовывоз'}</p>
                  ) : (
                    <>
                      <p><strong>Адрес:</strong> {deliveryData.city}, {deliveryData.address}</p>
                      {deliveryData.deliveryDate && (
                        <p><strong>Дата:</strong> {new Date(deliveryData.deliveryDate).toLocaleDateString('ru-RU')}</p>
                      )}
                      {deliveryData.timeSlot && (
                        <p><strong>Время:</strong> {deliveryData.timeSlot === 'morning' ? 'Утро (9:00-13:00)' :
                          deliveryData.timeSlot === 'afternoon' ? 'День (13:00-18:00)' :
                          deliveryData.timeSlot === 'evening' ? 'Вечер (18:00-21:00)' : 'Как можно скорее'}</p>
                      )}
                    </>
                  )}
                </div>

                <div className={styles.confirmSection}>
                  <h3><Icon name="user" size="sm" color="accent" /> Контакты</h3>
                  <p>{contactData.firstName.trim()}</p>
                  <p>{contactData.phone.trim()}</p>
                  <p>{contactData.email.trim()}</p>
                </div>

                <div className={styles.confirmSection}>
                  <h3><Icon name="credit-card" size="sm" color="accent" /> Оплата</h3>
                  <p>{getPaymentMethodLabel(paymentMethod, paymentData)}</p>
                </div>

                <div className={styles.confirmSection}>
                  <h3><Icon name="cart" size="sm" color="accent" /> Товары ({items.length})</h3>
                  {items.slice(0, 3).map(item => (
                    <p key={item.id}>
                      {item.name} × {item.quantity} — {(item.price * item.quantity).toFixed(2)} BYN
                    </p>
                  ))}
                  {items.length > 3 && (
                    <p className={styles.moreItems}>... и ещё {items.length - 3} товар(ов)</p>
                  )}
                </div>

                <div className={styles.formActions}>
                  <Button variant="ghost" size="md" onClick={handlePrevStep} disabled={isProcessing} leftIcon={<Icon name="arrow-left" size="sm" />}>
                    Назад
                  </Button>
                  <Button variant="primary" size="lg" onClick={handlePlaceOrder} disabled={isProcessing}>
                    {isProcessing ? 'Обработка...' : `Подтвердить заказ (${total.toFixed(2)} BYN)`}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <aside className={styles.orderSummary}>
            <h2>Ваш заказ</h2>
            
            <div className={styles.summaryItems}>
              {items.slice(0, 3).map(item => (
                <div key={item.id} className={styles.summaryItem}>
                  <span className={styles.summaryItemName}>
                    {item.name} × {item.quantity}
                  </span>
                  <span className={styles.summaryItemPrice}>
                    {(item.price * item.quantity).toFixed(2)} BYN
                  </span>
                </div>
              ))}
              {items.length > 3 && (
                <div className={styles.summaryMoreItems}>
                  ... и ещё {items.length - 3} товар(ов)
                </div>
              )}
            </div>

            <div className={styles.summaryDivider} />

            <div className={styles.summaryRow}>
              <span>Товары ({items.length})</span>
              <span>{subtotal.toFixed(2)} BYN</span>
            </div>
            
            {discountAmount > 0 && (
              <div className={styles.summaryRow}>
                <span>Скидка ({promoCode})</span>
                <span className={styles.discountValue}>-{discountAmount.toFixed(2)} BYN</span>
              </div>
            )}
            
            <div className={styles.summaryRow}>
              <span>Доставка</span>
              <span style={deliveryCost === 0 ? { color: 'var(--accent, #d4a574)' } : undefined}>
                {deliveryCost === 0 ? 'Бесплатно' : `${deliveryCost.toFixed(2)} BYN`}
              </span>
            </div>
            
            {subtotal < FREE_DELIVERY_THRESHOLD && deliveryData.method === 'Delivery' && (
              <div className={styles.freeDeliveryProgress}>
                <p className={styles.progressLabel}>
                  До бесплатной доставки: {(FREE_DELIVERY_THRESHOLD - subtotal).toFixed(2)} BYN
                </p>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${Math.min((subtotal / FREE_DELIVERY_THRESHOLD) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            <div className={styles.summaryTotal}>
              <span>Итого</span>
              <span>{total.toFixed(2)} BYN</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}