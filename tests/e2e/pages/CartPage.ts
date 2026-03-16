import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model для страницы корзины
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
  readonly clearCartButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartContainer = page.locator('.cart-container, .cart-page');
    this.cartItems = page.locator('.cart-item');
    this.cartItem = page.locator('.cart-item');
    this.emptyCartMessage = page.locator('.empty-cart, .cart-empty');
    this.totalSum = page.locator('.cart-total, .total-sum, #cart-total');
    this.checkoutButton = page.locator('button:has-text("Оформить заказ"), button:has-text("Checkout")');
    this.continueShoppingButton = page.locator('a:has-text("Продолжить покупки"), button:has-text("Продолжить покупки")');
    this.clearCartButton = page.locator('button:has-text("Очистить корзину"), button:has-text("Clear cart")');
  }

  /**
   * Переход на страницу корзины
   */
  async goto() {
    await this.page.goto('/cart');
    await expect(this.cartContainer).toBeVisible();
  }

  /**
   * Переход к оформлению заказа
   */
  async proceedToCheckout() {
    await expect(this.checkoutButton).toBeVisible();
    await this.checkoutButton.click();
    await expect(this.page).toHaveURL(/\/checkout/);
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
   * Удаление товара из корзины по названию
   * @param productName - название товара
   */
  async removeItem(productName: string): Promise<void>;
  
  /**
   * Удаление товара из корзины по индексу
   * @param index - индекс товара
   */
  async removeItem(index: number): Promise<void>;
  
  async removeItem(productNameOrIndex: string | number) {
    let item: Locator;
    
    if (typeof productNameOrIndex === 'string') {
      item = this.cartItems.filter({ hasText: productNameOrIndex }).first();
    } else {
      item = this.cartItems.nth(productNameOrIndex);
    }
    
    const removeButton = item.locator('button:has-text("Удалить"), button:has-text("×"), .remove-item');
    await expect(removeButton).toBeVisible();
    await removeButton.click();
    
    // Ждём обновления корзины
    await this.page.waitForResponse(resp => 
      resp.url().includes('/cart') || resp.url().includes('/api/')
    ).catch(() => {});
  }

  /**
   * Изменение количества товара
   * @param productName - название товара
   * @param quantity - новое количество
   */
  async setItemQuantity(productName: string, quantity: number) {
    const item = this.cartItems.filter({ hasText: productName }).first();
    const quantityInput = item.locator('input[type="number"], .quantity-input');
    await quantityInput.fill(quantity.toString());
    
    // Может потребоваться нажать Enter или кнопку обновления
    await this.page.keyboard.press('Enter');
  }

  /**
   * Увеличение количества товара по индексу
   * @param index - индекс товара
   */
  async increaseQuantity(index: number = 0) {
    const item = this.cartItems.nth(index);
    const increaseButton = item.locator('.quantity-increase, button:has-text("+")');
    await expect(increaseButton).toBeVisible();
    await increaseButton.click();
  }

  /**
   * Увеличение количества товара по названию
   * @param productName - название товара
   */
  async increaseItemQuantity(productName: string) {
    const item = this.cartItems.filter({ hasText: productName }).first();
    const increaseButton = item.locator('.quantity-increase, button:has-text("+")');
    await expect(increaseButton).toBeVisible();
    await increaseButton.click();
  }

  /**
   * Уменьшение количества товара по индексу
   * @param index - индекс товара
   */
  async decreaseQuantity(index: number = 0) {
    const item = this.cartItems.nth(index);
    const decreaseButton = item.locator('.quantity-decrease, button:has-text("-")');
    await expect(decreaseButton).toBeVisible();
    await decreaseButton.click();
  }

  /**
   * Уменьшение количества товара по названию
   * @param productName - название товара
   */
  async decreaseItemQuantity(productName: string) {
    const item = this.cartItems.filter({ hasText: productName }).first();
    const decreaseButton = item.locator('.quantity-decrease, button:has-text("-")');
    await expect(decreaseButton).toBeVisible();
    await decreaseButton.click();
  }

  /**
   * Проверка наличия товара в корзине
   * @param productName - название товара
   */
  async hasItem(productName: string): Promise<boolean> {
    const item = this.cartItems.filter({ hasText: productName });
    return await item.count() > 0;
  }

  /**
   * Проверка наличия товара в корзине (с ожиданием)
   * @param productName - название товара
   */
  async expectProductInCart(productName: string) {
    const item = this.cartItems.filter({ hasText: productName });
    await expect(item.first()).toBeVisible();
  }

  /**
   * Получение названия товара по индексу
   * @param index - индекс товара
   */
  async getItemName(index: number): Promise<string | null> {
    const item = this.cartItems.nth(index);
    const nameElement = item.locator('.item-name, .product-name, h3, h4').first();
    return await nameElement.textContent();
  }

  /**
   * Получение цены товара по индексу
   * @param index - индекс товара
   */
  async getItemPrice(index: number): Promise<string | null> {
    const item = this.cartItems.nth(index);
    const priceElement = item.locator('.item-price, .price').first();
    return await priceElement.textContent();
  }

  /**
   * Получение количества товара по индексу
   * @param index - индекс товара
   */
  async getItemQuantity(index: number): Promise<number> {
    const item = this.cartItems.nth(index);
    const quantityInput = item.locator('input[type="number"], .quantity-input');
    const value = await quantityInput.inputValue();
    return parseInt(value, 10) || 1;
  }

  /**
   * Ожидание обновления корзины
   */
  async waitForCartUpdate() {
    // Ждём исчезновения индикатора загрузки
    const loadingIndicator = this.page.locator('.loading, .spinner');
    await loadingIndicator.waitFor({ state: 'hidden' }).catch(() => {});
  }

  /**
   * Очистка корзины
   */
  async clearCart() {
    await expect(this.clearCartButton).toBeVisible();
    await this.clearCartButton.click();
    await this.expectEmpty();
  }

  /**
   * Продолжить покупки
   */
  async continueShopping() {
    await expect(this.continueShoppingButton).toBeVisible();
    await this.continueShoppingButton.click();
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
   * @param index - индекс товара
   */
  async getItemInfo(index: number): Promise<{ name: string | null; price: string | null; quantity: number }> {
    return {
      name: await this.getItemName(index),
      price: await this.getItemPrice(index),
      quantity: await this.getItemQuantity(index)
    };
  }
}
