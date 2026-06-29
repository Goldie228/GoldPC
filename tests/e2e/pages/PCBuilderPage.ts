import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model для страницы конструктора ПК
 * Актуальные BEM-селекторы: .component-slot, .bsp, .modal
 */
export class PCBuilderPage {
  readonly page: Page;
  readonly container: Locator;
  readonly componentSlots: Locator;
  readonly compatibilityStatus: Locator;
  readonly compatibilityError: Locator;
  readonly compatibilityWarning: Locator;
  readonly totalPrice: Locator;
  readonly saveConfigButton: Locator;
  readonly addToCartButton: Locator;
  readonly checkoutButton: Locator;
  readonly toastMessage: Locator;
  readonly progress: Locator;

  constructor(page: Page) {
    this.page = page;
    // Корневой контейнер конструктора
    this.container = page.locator('.pc-builder').first();
    // Слоты компонентов
    this.componentSlots = page.locator('.component-slot');
    // Панель совместимости (bsp = Build Summary Panel)
    this.compatibilityStatus = page.locator('.bsp');
    this.compatibilityError = page.locator('.bsp__alerts--error');
    this.compatibilityWarning = page.locator('.bsp__alerts--warning');
    // Общая цена
    this.totalPrice = page.locator('.bsp__total-value');
    // Кнопки
    this.saveConfigButton = page.locator('.bsp__btn--save');
    this.addToCartButton = page.locator('.bsp__btn--cart');
    this.checkoutButton = page.locator('.bsp__btn--checkout');
    // Toast уведомления
    this.toastMessage = page.locator('[role="alert"], .toast');
    // Прогресс сборки
    this.progress = page.locator('.bsp__progress');
  }

  async goto() {
    await this.page.goto('/pc-builder');
    await expect(this.container).toBeVisible({ timeout: 10000 });
  }

  async selectComponent(category: string, productName: string) {
    // Ищем слот по типу компонента
    const slot = this.componentSlots.filter({ hasText: category }).first();
    const btn = slot.locator('.component-slot__btn');
    await btn.click();
    
    // Ждём появления модального окна
    const modal = this.page.locator('.modal[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Ищем нужный товар по названию
    const productCard = modal.locator(`button:has-text("${productName}")`).first();
    await expect(productCard).toBeVisible({ timeout: 5000 });
    await productCard.click();
    
    // Ждём закрытия модалки
    await expect(modal).not.toBeVisible({ timeout: 5000 });
  }

  async expectCompatible() {
    // Проверяем что нет ошибок совместимости
    const errorCount = await this.compatibilityError.locator('.bsp__alert-item').count();
    expect(errorCount).toBe(0);
  }

  async expectIncompatible() {
    await expect(this.compatibilityWarning).toBeVisible({ timeout: 5000 });
  }

  async getRecommendedPower(): Promise<number> {
    const powerText = await this.page.locator('.bsp__power-suggestion, .bsp__power-row--psu').textContent();
    const powerMatch = powerText?.match(/(\d+)/);
    return powerMatch ? parseInt(powerMatch[1], 10) : 0;
  }

  async saveConfiguration(name: string) {
    await this.saveConfigButton.click();
    const nameInput = this.page.locator('input[name="configName"], input[placeholder*="название"]');
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill(name);
    }
    // Подтверждаем сохранение
    const confirmBtn = this.page.locator('button:has-text("Подтвердить"), button:has-text("Сохранить")').last();
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
    }
  }

  async expectConfigSaved(name: string) {
    await expect(this.toastMessage).toContainText(/Сохранен|конфигурац/i, { timeout: 5000 });
  }

  async expectToastMessage(message: string) {
    await expect(this.toastMessage.first()).toContainText(message, { timeout: 5000 });
  }

  /**
   * Открытие модального окна выбора компонента по названию слота
   */
  async openSlotPicker(slotLabelText: string | RegExp) {
    const slot = this.componentSlots.filter({ hasText: slotLabelText }).first();
    const btn = slot.locator('.component-slot__btn');
    await btn.click();
    const modal = this.page.locator('.modal[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 10000 });
  }

  /**
   * Получение названий товаров в модальном окне
   */
  async getModalProductNames(): Promise<string[]> {
    const modal = this.page.locator('.modal[role="dialog"]').first();
    // Названия товаров — кнопки внутри h4
    const names = modal.locator('h4 button, [class*="font-medium"][class*="text-body-text"]');
    const count = await names.count();
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      const t = await names.nth(i).textContent();
      if (t) result.push(t.trim());
    }
    return result;
  }

  /**
   * Выбор товара в модальном окне по индексу
   */
  async selectModalProduct(index: number) {
    const modal = this.page.locator('.modal[role="dialog"]').first();
    // Карточки товаров — контейнеры с border и bg-surface-card
    const cards = modal.locator('[class*="border"][class*="bg-surface-card"][class*="rounded-lg"][class*="cursor-pointer"]');
    const count = await cards.count();
    if (index < count) {
      await cards.nth(index).click();
    } else {
      // Fallback: кликаем по кнопке "Выбрать"
      const selectBtn = modal.locator('button:has-text("Выбрать")').nth(index);
      await selectBtn.click();
    }
    await expect(modal).not.toBeVisible({ timeout: 8000 });
  }

  /**
   * Закрытие модального окна
   */
  async closeModal() {
    await this.page.keyboard.press('Escape');
  }

  /**
   * Получение количества найденных товаров в модальном окне
   */
  async getModalResultsCount(): Promise<string> {
    const modal = this.page.locator('.modal[role="dialog"]').first();
    const countEl = modal.locator('text=/Найдено:/').first();
    return (await countEl.textContent()) ?? '';
  }
}
