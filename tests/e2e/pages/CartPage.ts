import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model для страницы корзины
 * Актуальные селекторы: role="main", <li> для товаров, aria-label для кнопок
 */
export class CartPage {
  readonly page: Page;
  readonly cartContainer: Locator;
  readonly cartItems: Locator;
  readonly cartItem: Locator;
  readonly emptyCartMessage: Locator;
  readonly totalSum: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Корзина: role="main" с aria-label
    this.cartContainer = page.locator('[role="main"][aria-label*="Корзина"]');
    // Товары: <li> внутри <ul role="list">
    this.cartItems = page.locator('[role="list"] > li');
    this.cartItem = page.locator('[role="list"] > li');
    // Пустая корзина: заголовок "Корзина пуста"
    this.emptyCartMessage = page.locator('h1:has-text("Корзина пуста")');
    // Итоговая сумма: жирный текст с суммой
    this.totalSum = page.locator('[class*="font-mono"][class*="text-2xl"][class*="font-bold"]');
    // Кнопка оформления
    this.checkoutButton = page.locator('button:has-text("Оформить заказ")');
    // Продолжить покупки
    this.continueShoppingButton = page.locator('button:has-text("Продолжить покупки")');
  }

  /**
   * Переход на страницу корзины
   */
  async goto() {
    await this.page.goto('/cart');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Переход к оформлению заказа
   */
  async proceedToCheckout() {
    await expect(this.checkoutButton).toBeVisible();
    await this.checkoutButton.click();
  }

  /**
   * Получение количества товаров в корзине
   */
  async getItemCount(): Promise<number> {
    return await this.cartItems.count();
  }

  /**
   * Проверка, что корзина пуста
   */
  async expectEmpty() {
    await expect(this.emptyCartMessage).toBeVisible();
  }

  /**
   * Проверка, что корзина пуста (alias)
   */
  async expectEmptyCart() {
    await expect(this.emptyCartMessage).toBeVisible();
  }

  /**
   * Проверка, что корзина содержит товары
   */
  async expectNotEmpty() {
    await expect(this.cartItems.first()).toBeVisible();
  }

  /**
   * Получение общей суммы корзины
   */
  async getTotalSum(): Promise<string | null> {
    return await this.totalSum.textContent();
  }

  /**
   * Удаление товара из корзины по индексу
   * Кнопка удаления: button с aria-label="Удалить {name}"
   */
  async removeItem(index: number): Promise<void> {
    const item = this.cartItems.nth(index);
    // Кнопка удаления с иконкой Trash2 и aria-label
    const removeButton = item.locator('button[aria-label*="Удалить"]');
    await expect(removeButton).toBeVisible();
    await removeButton.click();
    // Ждём обновления корзины
    await this.page.waitForTimeout(500);
  }

  /**
   * Удаление товара из корзины по названию
   */
  async removeItemByName(productName: string): Promise<void> {
    const item = this.cartItems.filter({ hasText: productName }).first();
    const removeButton = item.locator('button[aria-label*="Удалить"]');
    await expect(removeButton).toBeVisible();
    await removeButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Увеличение количества товара по индексу
   * Кнопка: aria-label="Увеличить количество {name}"
   */
  async increaseQuantity(index: number = 0) {
    const item = this.cartItems.nth(index);
    const increaseButton = item.locator('button[aria-label*="Увеличить"]');
    await expect(increaseButton).toBeVisible();
    await increaseButton.click();
  }

  /**
   * Уменьшение количества товара по индексу
   * Кнопка: aria-label="Уменьшить количество {name}"
   */
  async decreaseQuantity(index: number = 0) {
    const item = this.cartItems.nth(index);
    const decreaseButton = item.locator('button[aria-label*="Уменьшить"]');
    await expect(decreaseButton).toBeVisible();
    await decreaseButton.click();
  }

  /**
   * Проверка наличия товара в корзине
   */
  async hasItem(productName: string): Promise<boolean> {
    const item = this.cartItems.filter({ hasText: productName });
    return await item.count() > 0;
  }

  /**
   * Проверка наличия товара в корзине (с ожиданием)
   */
  async expectProductInCart(productName: string) {
    const item = this.cartItems.filter({ hasText: productName });
    await expect(item.first()).toBeVisible({ timeout: 10000 });
  }

  /**
   * Получение названия товара по индексу
   */
  async getItemName(index: number): Promise<string | null> {
    const item = this.cartItems.nth(index);
    // Название — это ссылка <Link> с текстом товара
    const nameElement = item.locator('a[class*="font-medium"], a[class*="text-"]').first();
    return await nameElement.textContent();
  }

  /**
   * Получение цены товара по индексу
   */
  async getItemPrice(index: number): Promise<string | null> {
    const item = this.cartItems.nth(index);
    const priceElement = item.locator('[class*="font-mono"][class*="font-medium"]').first();
    return await priceElement.textContent();
  }

  /**
   * Ожидание обновления корзины
   */
  async waitForCartUpdate() {
    await this.page.waitForTimeout(300);
  }

  /**
   * Продолжить покупки
   */
  async continueShopping() {
    const continueBtn = this.page.locator('a:has-text("Перейти в каталог"), button:has-text("Перейти в каталог")');
    await expect(continueBtn).toBeVisible();
    await continueBtn.click();
    await expect(this.page).toHaveURL(/\/catalog/);
  }

  /**
   * Проверка отображения корзины
   */
  async expectVisible() {
    await expect(this.cartContainer).toBeVisible();
  }

  /**
   * Получение информации о товаре
   */
  async getItemInfo(index: number): Promise<{ name: string | null; price: string | null }> {
    return {
      name: await this.getItemName(index),
      price: await this.getItemPrice(index),
    };
  }
}
