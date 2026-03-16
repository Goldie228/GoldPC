import { Page, Locator, expect } from '@playwright/test';

/**
 * Интерфейс для адреса доставки
 */
export interface DeliveryAddress {
  city: string;
  street: string;
  house: string;
  apartment?: string;
  postalCode?: string;
  entrance?: string;
  floor?: string;
  intercom?: string;
}

/**
 * Page Object Model для страницы оформления заказа
 */
export class CheckoutPage {
  readonly page: Page;
  readonly checkoutContainer: Locator;
  readonly deliverySection: Locator;
  readonly paymentSection: Locator;
  readonly summarySection: Locator;
  readonly orderSummary: Locator;
  
  // Способы доставки
  readonly pickupRadio: Locator;
  readonly deliveryRadio: Locator;
  readonly pickupOption: Locator;
  readonly deliveryOption: Locator;
  readonly deliveryAddressForm: Locator;
  
  // Способы оплаты
  readonly onlinePaymentRadio: Locator;
  readonly onReceiptPaymentRadio: Locator;
  readonly onlinePaymentOption: Locator;
  readonly onReceiptPaymentOption: Locator;
  
  // Кнопки
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  // Поля адреса доставки
  readonly cityInput: Locator;
  readonly streetInput: Locator;
  readonly houseInput: Locator;
  readonly apartmentInput: Locator;
  readonly postalCodeInput: Locator;
  readonly entranceInput: Locator;
  readonly floorInput: Locator;
  readonly intercomInput: Locator;

  // Информация о заказе
  readonly orderItems: Locator;
  readonly orderTotal: Locator;
  readonly deliveryPrice: Locator;
  readonly finalTotal: Locator;
  
  // Результат заказа
  readonly orderNumber: Locator;
  readonly orderStatus: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.checkoutContainer = page.locator('.checkout-container, .checkout-page');
    this.deliverySection = page.locator('.delivery-section, #delivery-method');
    this.paymentSection = page.locator('.payment-section, #payment-method');
    this.summarySection = page.locator('.order-summary, .summary-section');
    this.orderSummary = page.locator('.order-summary, .summary-section');
    
    // Способы доставки - радио кнопки
    this.pickupRadio = page.locator('input[value="pickup"], #pickup');
    this.deliveryRadio = page.locator('input[value="delivery"], #delivery');
    this.pickupOption = page.locator('input[value="pickup"], label:has-text("Самовывоз")');
    this.deliveryOption = page.locator('input[value="delivery"], label:has-text("Доставка")');
    this.deliveryAddressForm = page.locator('.delivery-address-form, #delivery-address');
    
    // Способы оплаты - радио кнопки
    this.onlinePaymentRadio = page.locator('input[value="online"], #payment-online');
    this.onReceiptPaymentRadio = page.locator('input[value="on-receipt"], #payment-on-receipt');
    this.onlinePaymentOption = page.locator('input[value="online"], label:has-text("Онлайн")');
    this.onReceiptPaymentOption = page.locator('input[value="on-receipt"], label:has-text("При получении")');
    
    // Кнопки
    this.confirmButton = page.locator('button:has-text("Подтвердить заказ"), button:has-text("Оформить")');
    this.cancelButton = page.locator('button:has-text("Отмена"), a:has-text("Вернуться в корзину")');
    
    // Поля адреса доставки
    this.cityInput = page.locator('#city, input[name="city"]');
    this.streetInput = page.locator('#street, input[name="street"]');
    this.houseInput = page.locator('#house, input[name="house"]');
    this.apartmentInput = page.locator('#apartment, input[name="apartment"]');
    this.postalCodeInput = page.locator('#postal-code, input[name="postalCode"]');
    this.entranceInput = page.locator('#entrance, input[name="entrance"]');
    this.floorInput = page.locator('#floor, input[name="floor"]');
    this.intercomInput = page.locator('#intercom, input[name="intercom"]');
    
    // Информация о заказе
    this.orderItems = page.locator('.order-item, .checkout-item');
    this.orderTotal = page.locator('.order-total, .subtotal');
    this.deliveryPrice = page.locator('.delivery-price, .delivery-cost');
    this.finalTotal = page.locator('.final-total, .total-sum');
    
    // Результат заказа
    this.orderNumber = page.locator('.order-number, #order-number');
    this.orderStatus = page.locator('.order-status, #order-status');
    this.errorMessage = page.locator('.error-message, .alert-error');
  }

  /**
   * Переход на страницу оформления заказа
   */
  async goto() {
    await this.page.goto('/checkout');
    await expect(this.checkoutContainer).toBeVisible();
  }

  /**
   * Ожидание загрузки страницы
   */
  async waitForLoad() {
    await expect(this.orderSummary).toBeVisible();
  }

  /**
   * Выбор способа получения - самовывоз
   */
  async selectPickup() {
    await expect(this.pickupRadio).toBeVisible();
    await this.pickupRadio.click();
  }

  /**
   * Выбор способа получения - доставка
   */
  async selectDelivery() {
    await expect(this.deliveryRadio).toBeVisible();
    await this.deliveryRadio.click();
    await expect(this.deliveryAddressForm).toBeVisible();
  }

  /**
   * Заполнение адреса доставки
   */
  async fillDeliveryAddress(address: DeliveryAddress) {
    await this.cityInput.fill(address.city);
    await this.streetInput.fill(address.street);
    await this.houseInput.fill(address.house);
    if (address.apartment) {
      await this.apartmentInput.fill(address.apartment);
    }
    if (address.postalCode) {
      await this.postalCodeInput.fill(address.postalCode);
    }
    if (address.entrance) {
      await this.entranceInput.fill(address.entrance);
    }
    if (address.floor) {
      await this.floorInput.fill(address.floor);
    }
    if (address.intercom) {
      await this.intercomInput.fill(address.intercom);
    }
  }

  /**
   * Выбор способа оплаты - онлайн
   */
  async selectOnlinePayment() {
    await expect(this.onlinePaymentRadio).toBeVisible();
    await this.onlinePaymentRadio.click();
  }

  /**
   * Выбор способа оплаты - при получении
   */
  async selectOnReceiptPayment() {
    await expect(this.onReceiptPaymentRadio).toBeVisible();
    await this.onReceiptPaymentRadio.click();
  }

  /**
   * Подтверждение заказа
   */
  async confirmOrder() {
    await expect(this.confirmButton).toBeVisible();
    await this.confirmButton.click();
  }

  /**
   * Получение номера заказа
   */
  async getOrderNumber(): Promise<string> {
    await expect(this.orderNumber).toBeVisible();
    return await this.orderNumber.textContent() || '';
  }

  /**
   * Получение статуса заказа
   */
  async getOrderStatus(): Promise<string> {
    await expect(this.orderStatus).toBeVisible();
    return await this.orderStatus.textContent() || '';
  }

  /**
   * Проверка успешного оформления заказа
   */
  async expectOrderCreated() {
    await expect(this.page).toHaveURL(/\/orders\/\d+/);
    await expect(this.orderNumber).toBeVisible();
    await expect(this.orderStatus).toBeVisible();
  }

  /**
   * Проверка статуса заказа
   */
  async expectOrderStatus(status: string) {
    await expect(this.orderStatus).toContainText(status);
  }

  /**
   * Проверка ошибки
   */
  async expectError(message: string) {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(message);
  }

  /**
   * Полный процесс оформления заказа с самовывозом
   */
  async checkoutWithPickup(paymentMethod: 'online' | 'on-receipt' = 'online') {
    await this.selectPickup();
    if (paymentMethod === 'online') {
      await this.selectOnlinePayment();
    } else {
      await this.selectOnReceiptPayment();
    }
    await this.confirmOrder();
  }

  /**
   * Полный процесс оформления заказа с доставкой
   */
  async checkoutWithDelivery(address: DeliveryAddress, paymentMethod: 'online' | 'on-receipt' = 'on-receipt') {
    await this.selectDelivery();
    await this.fillDeliveryAddress(address);
    if (paymentMethod === 'online') {
      await this.selectOnlinePayment();
    } else {
      await this.selectOnReceiptPayment();
    }
    await this.confirmOrder();
  }
}