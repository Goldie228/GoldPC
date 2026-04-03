import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model для страницы конструктора ПК
 */
export class PCBuilderPage {
  readonly page: Page;
  readonly container: Locator;
  readonly componentCategories: Locator;
  readonly componentList: Locator;
  readonly componentItems: Locator;
  readonly compatibilityStatus: Locator;
  readonly compatibilityError: Locator;
  readonly compatibilityWarning: Locator;
  readonly recommendedPSUPower: Locator;
  readonly totalPrice: Locator;
  readonly configNameInput: Locator;
  readonly saveConfigButton: Locator;
  readonly savedConfigurations: Locator;
  readonly toastMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.locator('.pc-builder-container');
    this.componentCategories = page.locator('[data-category]');
    this.componentList = page.locator('.component-list');
    this.componentItems = page.locator('.component-item');
    this.compatibilityStatus = page.locator('.compatibility-status');
    this.compatibilityError = page.locator('.compatibility-error');
    this.compatibilityWarning = page.locator('.compatibility-warning, .incompatibility-alert');
    this.recommendedPSUPower = page.locator('.recommended-psu-power');
    this.totalPrice = page.locator('.total-price');
    this.configNameInput = page.locator('input[name="configName"]');
    this.saveConfigButton = page.locator('button:has-text("Сохранить конфигурацию"), button:has-text("Сохранить")');
    this.savedConfigurations = page.locator('.saved-configuration');
    this.toastMessage = page.locator('.toast-message, .notification, [role="alert"]');
  }

  async goto() {
    await this.page.goto('/pc-builder');
    await expect(this.container).toBeVisible({ timeout: 10000 });
  }

  async selectComponent(category: string, productName: string) {
    // Открываем категорию компонентов
    const categorySelector = this.page.locator(`[data-category="${category}"]`);
    await categorySelector.click();
    
    // Ожидаем загрузки списка
    await expect(this.componentList).toBeVisible({ timeout: 5000 });
    
    // Ищем и выбираем нужный компонент
    const componentItem = this.componentItems.filter({ hasText: productName }).first();
    await expect(componentItem).toBeVisible({ timeout: 5000 });
    
    const selectBtn = componentItem.locator('button:has-text("Выбрать")');
    await selectBtn.click();
    
    // Ожидаем обновления конфигурации (небольшая пауза для UI)
    await this.page.waitForTimeout(500);
  }

  async expectCompatible() {
    await expect(this.compatibilityStatus).toContainText('Совместимо', { timeout: 5000 });
    const errorCount = await this.compatibilityError.count();
    expect(errorCount).toBe(0);
  }

  async expectIncompatible() {
    await expect(this.compatibilityWarning).toBeVisible({ timeout: 5000 });
    const warningText = await this.compatibilityWarning.textContent();
    expect(warningText?.toLowerCase()).toContain('несовместим');
  }

  async getRecommendedPower(): Promise<number> {
    const powerText = await this.recommendedPSUPower.textContent();
    const powerMatch = powerText?.match(/(\d+)/);
    return powerMatch ? parseInt(powerMatch[1], 10) : 0;
  }

  async saveConfiguration(name: string) {
    await this.saveConfigButton.click();
    await this.configNameInput.fill(name);
    await this.page.click('button:has-text("Подтвердить"), button:has-text("ОК"), button:has-text("Сохранить")');
  }

  async expectConfigSaved(name: string) {
    const savedConfig = this.savedConfigurations.filter({ hasText: name });
    await expect(savedConfig).toBeVisible({ timeout: 5000 });
  }

  async expectToastMessage(message: string) {
    await expect(this.toastMessage).toContainText(message, { timeout: 5000 });
  }

  async openSlotPicker(slotLabelText: string | RegExp) {
    const slot = this.page.locator('.component-slot').filter({ hasText: slotLabelText }).first();
    const btn = slot.locator('.component-slot__btn');
    await btn.click();
    const modal = this.page.locator('.modal').first();
    await expect(modal).toBeVisible({ timeout: 10000 });
  }

  async getModalProductNames(): Promise<string[]> {
    const modal = this.page.locator('.modal').first();
    const names = modal.locator('[class*="cardName"] button, [class*="compactName"] button');
    const count = await names.count();
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      const t = await names.nth(i).textContent();
      if (t) result.push(t);
    }
    return result;
  }

  async getFilterOptions(filterGroupText: string | RegExp): Promise<string[]> {
    const modal = this.page.locator('.modal').first();
    const group = modal.locator('[class*="filterGroup"]').filter({ hasText: filterGroupText }).first();
    if ((await group.count()) === 0) {
      return [];
    }
    const labels = group.locator('[class*="checkboxLabel"], label');
    const count = await labels.count();
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      const t = await labels.nth(i).textContent();
      if (t) result.push(t);
    }
    return result;
  }

  async selectModalProduct(index: number) {
    const modal = this.page.locator('.modal').first();
    const cards = modal.locator('[class*="card"], [class*="cardCompact"]');
    await cards.nth(index).click();
    await expect(modal).not.toBeVisible({ timeout: 8000 });
  }

  async closeModal() {
    await this.page.keyboard.press('Escape');
  }

  async getModalResultsCount(): Promise<string> {
    const modal = this.page.locator('.modal').first();
    const countEl = modal.locator('[class*="resultsCount"]').first();
    return (await countEl.textContent()) ?? '';
  }
}
