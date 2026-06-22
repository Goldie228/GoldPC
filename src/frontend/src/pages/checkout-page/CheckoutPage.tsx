import { useState, useEffect } from 'react';
import { isAxiosError } from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { extractApiErrorMessage } from '@/api/orders';
import { useOrders } from '@/hooks/useOrders';
import { useAddresses } from '@/hooks/useAddresses';
import type { UserAddress } from '@/api/addresses';
import { useToast } from '@/hooks/useToast';
import { parsePhone, isValidPhone } from '@/utils/phone';
import { AddressMap } from '@/components/checkout/AddressMap';
import { DeliveryTimeSlotPicker } from '@/components/checkout/DeliveryTimeSlotPicker';
import { PaymentForm, type PaymentData } from '@/components/checkout/PaymentForm';
import { QRCodePayment } from '@/components/checkout/QRCodePayment';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { PhoneInput } from '@/components/ui/PhoneInput';

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

function getTovarForm(count: number): string {
  const abs = Math.abs(Math.trunc(count));
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'товаров';
  if (mod10 === 1) return 'товар';
  if (mod10 >= 2 && mod10 <= 4) return 'товара';
  return 'товаров';
}

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
  const safeItems = items ?? [];
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const { getDeliveryQuote, createOrder } = useOrders();
  const { getAddresses, createAddress } = useAddresses();

  const [currentStep, setCurrentStep] = useState<Step>('delivery');
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showQRPayment, setShowQRPayment] = useState(false);
  const [pendingOrderNumber, setPendingOrderNumber] = useState<string | null>(null);

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
    if (user != null) {
getAddresses()
         .then((addresses) => setSavedAddresses(addresses ?? []))
         .catch(() => {});
    }
  }, [user]);

  // Calculate delivery cost
  useEffect(() => {
    getDeliveryQuote({
      deliveryMethod: deliveryData.method,
      subtotal,
      city: deliveryData.city,
    }).then(quote => setDeliveryCost(quote?.deliveryCost ?? 0)).catch(() => {});
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

  const handleQRPaymentConfirm = () => {
    showToast('Заказ успешно оформлен!', 'success');
    void navigate(`/orders/${pendingOrderNumber ?? 'unknown'}/success`);
  };

  const handlePlaceOrder = async (): Promise<boolean> => {
    setIsProcessing(true);
    try {
      // Сохранить адрес если нужно
      if (deliveryData.saveAddress && user && deliveryData.method === 'Delivery') {
        try {
          await createAddress({
            name: 'Адрес доставки',
            city: deliveryData.city,
            address: deliveryData.address,
            isDefault: savedAddresses.length === 0,
          });
        } catch (error) {
          console.error('Failed to save address:', error);
        }
      }

        const order = await createOrder({
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
        items: safeItems.map(item => ({
          productId: item.productId,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
      });

      clearCart();

      // SBP: show QR with real order number after order creation
      if (paymentMethod === 'SBP') {
        setPendingOrderNumber(order?.orderNumber ?? null);
        setShowQRPayment(true);
        setIsProcessing(false);
        return true;
      }

      showToast('Заказ успешно оформлен!', 'success');
      void navigate(`/orders/${order?.orderNumber ?? 'unknown'}/success`);
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

  if (safeItems.length === 0) {
    return (
      <div className="min-h-[calc(100vh-200px)] bg-background text-foreground pt-8">
        <div className="w-full max-w-7xl mx-auto px-6">
          <div className="flex flex-col gap-7 text-center p-12 bg-card border border-border rounded-xl max-w-[620px] mx-auto shadow-lg relative overflow-hidden">
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
      <div className="min-h-[calc(100vh-200px)] bg-background text-foreground pt-8">
        <div className="w-full max-w-7xl mx-auto px-6">
          <h1 className="font-sans text-[clamp(1.5rem,4vw,2rem)] font-semibold tracking-tight text-foreground mb-2">Оплата картой</h1>
          <div className="max-w-[600px] mx-auto py-8">
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
      <div className="min-h-[calc(100vh-200px)] bg-background text-foreground pt-8">
        <div className="w-full max-w-7xl mx-auto px-6">
          <h1 className="font-sans text-[clamp(1.5rem,4vw,2rem)] font-semibold tracking-tight text-foreground mb-2">Оплата через СБП</h1>
          <div className="max-w-[600px] mx-auto py-8">
            <QRCodePayment
              amount={total}
              orderNumber={pendingOrderNumber ?? ''}
              onConfirm={handleQRPaymentConfirm}
              onCancel={() => { setShowQRPayment(false); setPendingOrderNumber(null); }}
              isProcessing={isProcessing}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)] bg-background text-foreground pt-8">
      <div className="w-full max-w-7xl mx-auto px-[var(--layout-page-pad-x)]">
        {/* Breadcrumb */}
        <nav aria-label="Хлебные крошки" className="flex items-center gap-2 text-[0.7rem] text-foreground-dim mb-2">
          <Link to="/" className="text-muted-foreground no-underline transition-colors hover:text-accent">Главная</Link>
          <span>/</span>
          <span>Оформление заказа</span>
        </nav>

        <h1 className="font-sans text-[clamp(1.5rem,4vw,2rem)] font-semibold tracking-tight text-foreground mb-2">Оформление заказа</h1>

        {/* Steps Indicator */}
        <nav aria-label="Шаги оформления заказа" className="flex flex-wrap items-center gap-0 mb-8 p-3.5 px-4.5 bg-card border border-border rounded-lg shadow">
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
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center gap-2.5 ${isCurrent ? '' : ''} ${isCompleted ? '' : ''}`}>
                  <span aria-current={isCurrent ? 'step' : undefined} className={`w-8 h-8 flex items-center justify-center border rounded-md font-mono text-sm transition-all
                    ${isCurrent ? 'bg-gold/10 border-gold text-gold font-medium' : ''}
                    ${isCompleted ? 'bg-border-muted border-border-muted text-accent' : ''}
                    ${!isCurrent && !isCompleted ? 'bg-elevated border-border text-muted-foreground' : ''}
                  `}>
                    {isCompleted ? <Icon name="check" size="sm" color="accent" /> : step.num}
                  </span>
                  <span className={`text-sm font-medium transition-colors ml-2.5
                    ${isCurrent || isCompleted ? 'text-foreground' : 'text-muted-foreground'}
                  `}>{step.label}</span>
                </div>
                {i < arr.length - 1 && (
                  <div className={`w-12 h-px mx-3 transition-colors ${isCompleted ? 'bg-accent' : 'bg-border'}`} />
                )}
              </div>
            );
          })}
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_400px] gap-8 items-start pb-8">
          <div className="flex flex-col gap-6">

            {/* Step 1: Delivery */}
            {currentStep === 'delivery' && (
              <div className="bg-card border border-border rounded-xl p-6 shadow">
                <h2 className="text-[0.95rem] font-semibold text-foreground mb-5 pb-3.5 border-b border-border relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-10 after:h-0.5 after:bg-gradient-to-r after:from-border-muted after:to-border-muted after:rounded-sm">Способ доставки</h2>
                <div className="flex flex-col gap-3">
                  <label className={`flex items-center gap-4 p-4 bg-elevated border rounded-lg cursor-pointer transition-all
                    ${deliveryData.method === 'Delivery' ? 'border-accent bg-border-muted shadow-sm shadow-accent/20' : 'border-border hover:border-border-muted'}
                  `}>
                    <input
                      type="radio"
                      checked={deliveryData.method === 'Delivery'}
                      onChange={() => setDeliveryData(prev => ({ ...prev, method: 'Delivery', pickupPointId: undefined }))}
                      className="filter-radio"
                    />
                    <span className="flex items-center gap-2.5 text-foreground">
                      <Icon name="package" size="sm" color="accent" /> Курьерская доставка
                    </span>
                  </label>
                  <label className={`flex items-center gap-4 p-4 bg-elevated border rounded-lg cursor-pointer transition-all
                    ${deliveryData.method === 'Pickup' ? 'border-accent bg-border-muted shadow-sm shadow-accent/20' : 'border-border hover:border-border-muted'}
                  `}>
                    <input
                      type="radio"
                      checked={deliveryData.method === 'Pickup'}
                      onChange={() => setDeliveryData(prev => ({...prev, method: 'Pickup' }))}
                      className="filter-radio"
                    />
                    <span className="flex items-center gap-2.5 text-foreground">
                      <Icon name="package" size="sm" color="accent" /> Самовывоз (бесплатно)
                    </span>
                  </label>
                </div>

                <div className="flex flex-col gap-2 mt-3">
                  <label htmlFor="checkout-city" className="text-[0.75rem] font-medium text-muted-foreground uppercase tracking-[0.05em]">Город</label>
                  <select
                    id="checkout-city"
                    value={deliveryData.city}
                    onChange={(e) => setDeliveryData(prev => ({...prev, city: e.target.value}))}
                    aria-required="true"
                    className="w-full p-3 bg-elevated border border-border rounded-lg text-foreground text-sm transition-all appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2371717a%27 stroke-width=%272%27%3E%3Cpolyline points=%276 9 12 15 18 9%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_12px_center] bg-[length:16px] pr-10 focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--border-muted))]"
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
                  <div className="flex flex-col gap-2">
                    <label htmlFor="checkout-saved-addresses" className="text-[0.75rem] font-medium text-muted-foreground uppercase tracking-[0.05em]">Сохранённые адреса</label>
                    <select
                      id="checkout-saved-addresses"
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
                      className="w-full p-3 bg-elevated border border-border rounded-lg text-foreground text-sm transition-all appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2371717a%27 stroke-width=%272%27%3E%3Cpolyline points=%276 9 12 15 18 9%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_12px_center] bg-[length:16px] pr-10 focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--border-muted))]"
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
                    <div className="flex flex-col gap-2">
                      <label htmlFor="checkout-address" className="text-[0.75rem] font-medium text-muted-foreground uppercase tracking-[0.05em]">Адрес доставки</label>
                      <input
                        id="checkout-address"
                        type="text"
                        placeholder="ул. Примерная, д. 1, кв. 1"
                        value={deliveryData.address}
                        onChange={(e) => setDeliveryData(prev => ({...prev, address: e.target.value}))}
                        aria-required="true"
                        className="w-full p-3 bg-elevated border border-border rounded-lg text-foreground text-sm transition-all focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--border-muted)]"
                      />
                    </div>

                    {user && (
                      <label htmlFor="checkout-save-address" className="flex items-center gap-3 p-3 cursor-pointer rounded-lg transition-all hover:bg-border-muted">
                        <input
                          id="checkout-save-address"
                          type="checkbox"
                          checked={deliveryData.saveAddress}
                          onChange={(e) => setDeliveryData(prev => ({...prev, saveAddress: e.target.checked}))}
                          className="filter-checkbox"
                        />
                        <span className="text-foreground text-sm">Сохранить адрес в профиль</span>
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
                  <div className="p-4 bg-border-muted border border-border-muted rounded-lg my-4">
                    <strong className="block mb-2 text-foreground text-sm">Выбранный пункт выдачи:</strong>
                    <p className="text-muted-foreground m-0 text-sm leading-relaxed">{deliveryData.pickupPointName}</p>
                  </div>
                )}

                <div className="flex justify-between items-center mt-6 pt-5 border-t border-border gap-4">
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
              <div className="bg-card border border-border rounded-xl p-6 shadow">
                <h2 className="text-[0.95rem] font-semibold text-foreground mb-5 pb-3.5 border-b border-border relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-10 after:h-0.5 after:bg-gradient-to-r after:from-border-muted after:to-border-muted after:rounded-sm">Контактные данные</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="checkout-first-name" className="text-[0.75rem] font-medium text-muted-foreground uppercase tracking-[0.05em]">Имя*</label>
                    <input
                      id="checkout-first-name"
                      value={contactData.firstName}
                      onChange={(e) => handleContactChange('firstName', e.target.value)}
                      onBlur={() => handleContactBlur('firstName')}
                      aria-required="true"
                      aria-invalid={contactTouched.firstName && contactErrors.firstName ? 'true' : undefined}
                      aria-describedby={contactTouched.firstName && contactErrors.firstName ? 'checkout-first-name-error' : undefined}
                      className={`w-full p-3 bg-elevated border text-foreground text-sm transition-all rounded-lg focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--border-muted)]
                        ${contactTouched.firstName && contactErrors.firstName ? 'border-error/65 shadow-[0_0_0_1px_rgba(239,68,68,0.25)]' : 'border-border'}
                      `}
                      placeholder="Иван"
                      autoComplete="given-name"
                    />
                    {contactTouched.firstName && contactErrors.firstName && (
                      <span id="checkout-first-name-error" className="text-[0.78rem] leading-relaxed text-red-300" role="alert">{contactErrors.firstName}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="checkout-phone" className="text-[0.75rem] font-medium text-muted-foreground uppercase tracking-[0.05em]">Телефон*</label>
                    <PhoneInput
                      id="checkout-phone"
                      value={contactData.phone}
                      onChange={(value) => handleContactChange('phone', value)}
                      onBlur={() => handleContactBlur('phone')}
                      aria-required="true"
                      aria-invalid={contactTouched.phone && contactErrors.phone ? 'true' : undefined}
                      aria-describedby={contactTouched.phone && contactErrors.phone ? 'checkout-phone-error' : undefined}
                      className={`${contactTouched.phone && contactErrors.phone ? 'border-error/65' : ''}`}
                      placeholder="+375 (29) 123-45-67"
                      autoComplete="tel"
                    />
                    {contactTouched.phone && contactErrors.phone && (
                      <span id="checkout-phone-error" className="text-[0.78rem] leading-relaxed text-red-300" role="alert">{contactErrors.phone}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="checkout-email" className="text-[0.75rem] font-medium text-muted-foreground uppercase tracking-[0.05em]">Email*</label>
                    <input
                      id="checkout-email"
                      type="email"
                      value={contactData.email}
                      onChange={(e) => handleContactChange('email', e.target.value)}
                      onBlur={() => handleContactBlur('email')}
                      aria-required="true"
                      aria-invalid={contactTouched.email && contactErrors.email ? 'true' : undefined}
                      aria-describedby={contactTouched.email && contactErrors.email ? 'checkout-email-error' : undefined}
                      className={`w-full p-3 bg-elevated border text-foreground text-sm transition-all rounded-lg focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--border-muted)]
                        ${contactTouched.email && contactErrors.email ? 'border-error/65 shadow-[0_0_0_1px_rgba(239,68,68,0.25)]' : 'border-border'}
                      `}
                      placeholder="example@mail.com"
                      autoComplete="email"
                    />
                    {contactTouched.email && contactErrors.email && (
                      <span id="checkout-email-error" className="text-[0.78rem] leading-relaxed text-red-300" role="alert">{contactErrors.email}</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center mt-6 pt-5 border-t border-border gap-4">
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
              <div className="bg-card border border-border rounded-xl p-6 shadow">
                <h2 className="text-[0.95rem] font-semibold text-foreground mb-5 pb-3.5 border-b border-border relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-10 after:h-0.5 after:bg-gradient-to-r after:from-border-muted after:to-border-muted after:rounded-sm">Способ оплаты</h2>
                <div className="flex flex-col gap-3">
                  <label className={`flex items-center gap-4 p-4 bg-elevated border rounded-lg cursor-pointer transition-all
                    ${paymentMethod === 'CardOnline' ? 'border-accent bg-border-muted shadow-[0_0_0_1px_accent]' : 'border-border hover:border-border-muted hover:bg-border-muted'}
                  `}>
                    <input
                      type="radio"
                      checked={paymentMethod === 'CardOnline'}
                      onChange={() => setPaymentMethod('CardOnline')}
                      className="filter-radio"
                    />
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-2.5 text-foreground"><Icon name="credit-card" size="sm" color="accent" /> Карта онлайн</span>
                      <small className="text-[0.75rem] text-muted-foreground font-normal">Visa, Mastercard, МИР</small>
                    </div>
                  </label>
                  <label className={`flex items-center gap-4 p-4 bg-elevated border rounded-lg cursor-pointer transition-all
                    ${paymentMethod === 'SBP' ? 'border-accent bg-border-muted shadow-[0_0_0_1px_accent]' : 'border-border hover:border-border-muted hover:bg-border-muted'}
                  `}>
                    <input
                      type="radio"
                      checked={paymentMethod === 'SBP'}
                      onChange={() => setPaymentMethod('SBP')}
                      className="filter-radio"
                    />
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-2.5 text-foreground"><Icon name="phone" size="sm" color="accent" /> СБП (Система быстрых платежей)</span>
                      <small className="text-[0.75rem] text-muted-foreground font-normal">Оплата через приложение банка</small>
                    </div>
                  </label>
                  <label className={`flex items-center gap-4 p-4 bg-elevated border rounded-lg cursor-pointer transition-all
                    ${paymentMethod === 'Cash' ? 'border-accent bg-border-muted shadow-[0_0_0_1px_accent]' : 'border-border hover:border-border-muted hover:bg-border-muted'}
                  `}>
                    <input
                      type="radio"
                      checked={paymentMethod === 'Cash'}
                      onChange={() => setPaymentMethod('Cash')}
                      className="filter-radio"
                    />
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-2.5 text-foreground"><Icon name="credit-card" size="sm" color="accent" /> Наличными при получении</span>
                      <small className="text-[0.75rem] text-muted-foreground font-normal">Оплата курьеру</small>
                    </div>
                  </label>
                  <label className={`flex items-center gap-4 p-4 bg-elevated border rounded-lg cursor-pointer transition-all
                    ${paymentMethod === 'CardOnDelivery' ? 'border-accent bg-border-muted shadow-[0_0_0_1px_accent]' : 'border-border hover:border-border-muted hover:bg-border-muted'}
                  `}>
                    <input
                      type="radio"
                      checked={paymentMethod === 'CardOnDelivery'}
                      onChange={() => setPaymentMethod('CardOnDelivery')}
                      className="filter-radio"
                    />
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-2.5 text-foreground"><Icon name="credit-card" size="sm" color="accent" /> Картой при получении</span>
                      <small className="text-[0.75rem] text-muted-foreground font-normal">Терминал у курьера</small>
                    </div>
                  </label>
                </div>
                <div className="flex justify-between items-center mt-6 pt-5 border-t border-border gap-4">
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
              <div className="bg-card border border-border rounded-xl p-6 shadow">
                <h2 className="text-[0.95rem] font-semibold text-foreground mb-5 pb-3.5 border-b border-border relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-10 after:h-0.5 after:bg-gradient-to-r after:from-border-muted after:to-border-muted after:rounded-sm">Подтверждение заказа</h2>

                <div className="mb-6 pb-5 border-b border-border">
                  <h3 className="flex items-center gap-2 text-[0.95rem] font-semibold text-foreground mb-3"><Icon name="package" size="sm" color="accent" /> Доставка</h3>
                  <div className="flex flex-col gap-1.5">
                    {deliveryData.method === 'Pickup' ? (
                      <p className="text-muted-foreground leading-relaxed m-0">{deliveryData.pickupPointName || 'Самовывоз'}</p>
                    ) : (
                      <>
                        <p className="text-muted-foreground leading-relaxed m-0"><strong className="text-foreground">Адрес:</strong> {deliveryData.city}, {deliveryData.address}</p>
                        {deliveryData.deliveryDate && (
                          <p className="text-muted-foreground leading-relaxed m-0"><strong className="text-foreground">Дата:</strong> {new Date(deliveryData.deliveryDate).toLocaleDateString('ru-RU')}</p>
                        )}
                        {deliveryData.timeSlot && (
                          <p className="text-muted-foreground leading-relaxed m-0"><strong className="text-foreground">Время:</strong> {deliveryData.timeSlot === 'morning' ? 'Утро (9:00-13:00)' :
                            deliveryData.timeSlot === 'afternoon' ? 'День (13:00-18:00)' :
                            deliveryData.timeSlot === 'evening' ? 'Вечер (18:00-21:00)' : 'Как можно скорее'}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="mb-6 pb-5 border-b border-border">
                  <h3 className="flex items-center gap-2 text-[0.95rem] font-semibold text-foreground mb-3"><Icon name="user" size="sm" color="accent" /> Контакты</h3>
                  <div className="flex flex-col gap-1.5">
                    <p className="text-muted-foreground leading-relaxed m-0">{contactData.firstName.trim()}</p>
                    <p className="text-muted-foreground leading-relaxed m-0">{contactData.phone.trim()}</p>
                    <p className="text-muted-foreground leading-relaxed m-0">{contactData.email.trim()}</p>
                  </div>
                </div>

                <div className="mb-6 pb-5 border-b border-border">
                  <h3 className="flex items-center gap-2 text-[0.95rem] font-semibold text-foreground mb-3"><Icon name="credit-card" size="sm" color="accent" /> Оплата</h3>
                  <p className="text-muted-foreground leading-relaxed m-0">{getPaymentMethodLabel(paymentMethod, paymentData)}</p>
                </div>

                <div className="mb-6 pb-5 border-b border-border last:border-b-0 last:mb-0 last:pb-0">
                  <h3 className="flex items-center gap-2 text-[0.95rem] font-semibold text-foreground mb-3"><Icon name="cart" size="sm" color="accent" /> Товары ({items?.length ?? 0})</h3>
                  <div className="flex flex-col gap-1.5">
                    {safeItems.slice(0, 3).map(item => (
                      <p key={item.id} className="text-muted-foreground leading-relaxed m-0">
                        {item.name} × {item.quantity} — {(item.price * item.quantity).toFixed(2)} BYN
                      </p>
                    ))}
                    {items?.length > 3 && (
                      <p className="italic text-foreground-dim mt-2 text-sm">... и ещё {items?.length - 3} {getTovarForm(items?.length - 3 ?? 0)}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center gap-4 max-sm:flex-col max-sm:gap-3 max-sm:w-full">
                  <Button variant="ghost" size="md" onClick={handlePrevStep} disabled={isProcessing} leftIcon={<Icon name="arrow-left" size="sm" />}>
                    Назад
                  </Button>
                  <Button variant="primary" size="lg" onClick={() => void handlePlaceOrder()} disabled={isProcessing}>
                    {isProcessing ? 'Обработка...' : `Подтвердить заказ (${total.toFixed(2)} BYN)`}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <aside className="sticky top-24 bg-card border border-border rounded-xl p-6 shadow-lg max-h-[calc(100vh-120px)] overflow-y-auto">
            <h2 className="text-[0.85rem] font-semibold uppercase tracking-[0.05em] text-foreground mb-5 pb-4 border-b border-border relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-10 after:h-0.5 after:bg-gradient-to-r after:from-border-muted after:to-border-muted after:rounded-sm">Ваш заказ</h2>

            <div className="flex flex-col gap-3 mb-4">
                    {safeItems.slice(0, 3).map(item => (
                <div key={item.id} className="flex justify-between items-start gap-3 pb-2.5 border-b border-border-muted last:border-b-0">
                  <span className="flex-1 text-sm text-muted-foreground leading-relaxed">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-mono text-sm font-semibold text-foreground whitespace-nowrap">
                    {(item.price * item.quantity).toFixed(2)} BYN
                  </span>
                </div>
              ))}
              {items?.length > 3 && (
                <div className="text-center text-sm italic text-foreground-dim">
                  ... и ещё {items?.length - 3} {getTovarForm(items?.length - 3 ?? 0)}
                </div>
              )}
            </div>

            <div className="h-px bg-border my-4"></div>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Товары ({items?.length ?? 0})</span>
                <span className="font-mono text-foreground">{subtotal.toFixed(2)} BYN</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Скидка ({promoCode})</span>
                  <span className="font-mono text-price-drop font-semibold">-{discountAmount.toFixed(2)} BYN</span>
                </div>
              )}

              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Доставка</span>
                <span className={`font-mono ${deliveryCost === 0 ? 'text-price-drop' : 'text-foreground'}`}>
                  {deliveryCost === 0 ? 'Бесплатно' : `${deliveryCost.toFixed(2)} BYN`}
                </span>
              </div>
            </div>

            {subtotal < FREE_DELIVERY_THRESHOLD && deliveryData.method === 'Delivery' && (
              <div className="my-4 p-3.5 bg-border-muted border border-border-muted rounded-lg">
                <p className="text-sm text-muted-foreground m-0 mb-2.5">
                  До бесплатной доставки: {(FREE_DELIVERY_THRESHOLD - subtotal).toFixed(2)} BYN
                </p>
                <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-gold to-yellow-300 rounded-full transition-all duration-400"
                    style={{ width: `${Math.min((subtotal / FREE_DELIVERY_THRESHOLD) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5 mt-4 pt-4 border-t border-border">
              <span className="text-[0.75rem] uppercase tracking-[0.05em] text-muted-foreground">Итого</span>
              <span className="font-mono text-2xl font-bold text-body-text">{total.toFixed(2)} BYN</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}