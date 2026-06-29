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
 * Актуальные селекторы: #checkout-city (select), #checkout-address, radio без value
 */
export class CheckoutPage {
  readonly page: Page;
  
  // Способы доставки — radio кнопки
  readonly deliveryRadio: Locator;
  readonly pickupRadio: Locator;
  readonly deliveryAddressForm: Locator;
  
  // Поля адреса (актуальная структура: select для города, input для адреса)
  readonly citySelect: Locator;
  readonly addressInput: Locator;
  
  // Способы оплаты — 4 варианта
  readonly cardOnlineRadio: Locator;
  readonly sbpRadio: Locator;
  readonly cashRadio: Locator;
  readonly cardOnDeliveryRadio: Locator;
  
  // Кнопки
  readonly confirmButton: Locator;
  readonly backButton: Locator;
  readonly continueButton: Locator;

  // Информация о заказе
  readonly orderSummary: Locator;
  
  // Результат заказа
  readonly orderNumber: Locator;
  readonly orderStatus: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Способы доставки — radio кнопки с классом filter-radio
    this.pickupRadio = page.locator('input[type="radio"]').filter({ hasText: /Самовывоз/ }).or(
      page.locator('label:has-text("Самовывоз") input[type="radio"]')
    ).or(
      page.locator('label:has-text("Самовывоз")').first()
    );
    this.deliveryRadio = page.locator('input[type="radio"]').filter({ hasText: /Доставка|Курьер/ }).or(
      page.locator('label:has-text("Доставка") input[type="radio"]')
    ).or(
      page.locator('label:has-text("Курьер")').first()
    );
    this.deliveryAddressForm = page.locator('#checkout-address').locator('..');
    
    // Поля адреса
    this.citySelect = page.locator('#checkout-city');
    this.addressInput = page.locator('#checkout-address');
    
    // Способы оплаты
    this.cardOnlineRadio = page.locator('label:has-text("Карта онлайн")').first();
    this.sbpRadio = page.locator('label:has-text("СБП")').first();
    this.cashRadio = page.locator('label:has-text("Наличными")').first();
    this.cardOnDeliveryRadio = page.locator('label:has-text("Картой при получении")').first();
    
    // Кнопки
    this.confirmButton = page.locator('button:has-text("Подтвердить заказ")');
    this.backButton = page.locator('button:has-text("Назад")');
    this.continueButton = page.locator('button:has-text("Продолжить")');
    
    // Информация о заказе
    this.orderSummary = page.locator('aside').first();
    
    // Результат заказа
    this.orderNumber = page.locator('[class*="order-number"], text=/ORD-/').first();
    this.orderStatus = page.locator('[class*="order-status"]').first();
    this.errorMessage = page.locator('[role="alert"]').first();
  }

  /**
   * Переход на страницу оформления заказа
   */
  async goto() {
    await this.page.goto('/checkout');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Ожидание загрузки страницы
   */
  async waitForLoad() {
    await expect(this.orderSummary).toBeVisible({ timeout: 10000 });
  }

  /**
   * Выбор способа получения — самовывоз
   */
  async selectPickup() {
    const pickupLabel = this.page.locator('label:has-text("Самовывоз")').first();
    await expect(pickupLabel).toBeVisible();
    await pickupLabel.click();
  }

  /**
   * Выбор способа получения — доставка
   */
  async selectDelivery() {
    const deliveryLabel = this.page.locator('label:has-text("Курьерская доставка"), label:has-text("Доставка")').first();
    await expect(deliveryLabel).toBeVisible();
    await deliveryLabel.click();
  }

  /**
   * Заполнение адреса доставки
   */
  async fillDeliveryAddress(address: DeliveryAddress) {
    // Выбор города из <select>
    if (await this.citySelect.isVisible().catch(() => false)) {
      await this.citySelect.selectOption({ label: address.city }).catch(async () => {
        // Если нет option с таким label, пробуем по value
        await this.citySelect.selectOption(address.city).catch(() => {});
      });
    }
    // Заполнение адреса (единое поле)
    if (await this.addressInput.isVisible().catch(() => false)) {
      const fullAddress = `${address.street}, д. ${address.house}${address.apartment ? `, кв. ${address.apartment}` : ''}`;
      await this.addressInput.fill(fullAddress);
    }
  }

  /**
   * Выбор способа оплаты — онлайн (карта)
   */
  async selectOnlinePayment() {
    await expect(this.cardOnlineRadio).toBeVisible();
    await this.cardOnlineRadio.click();
  }

  /**
   * Выбор способа оплаты — при получении (наличные)
   */
  async selectOnReceiptPayment() {
    await expect(this.cashRadio).toBeVisible();
    await this.cashRadio.click();
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
    await expect(this.orderNumber).toBeVisible({ timeout: 10000 });
    return await this.orderNumber.textContent() || '';
  }

  /**
   * Получение статуса заказа
   */
  async getOrderStatus(): Promise<string> {
    await expect(this.orderStatus).toBeVisible({ timeout: 10000 });
    return await this.orderStatus.textContent() || '';
  }

  /**
   * Проверка успешного оформления заказа
   */
  async expectOrderCreated() {
    // После создания заказа — редирект на страницу заказа
    await expect(this.page).toHaveURL(/\/orders\/|\/order\//, { timeout: 15000 });
  }

  /**
   * Проверка статуса заказа
   */
  async expectOrderStatus(status: string) {
    const statusEl = this.page.locator(`text=${status}`).first();
    await expect(statusEl).toBeVisible({ timeout: 10000 });
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
