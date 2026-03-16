import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model для страницы каталога
 */
export class CatalogPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly categoryFilter: Locator;
  readonly categoryLinks: Locator;
  readonly priceFromInput: Locator;
  readonly priceToInput: Locator;
  readonly sortSelect: Locator;
  readonly productsGrid: Locator;
  readonly productCards: Locator;
  readonly pagination: Locator;
  readonly noResultsMessage: Locator;
  readonly loadingSpinner: Locator;
  readonly addToCartButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.locator('#search-input');
    this.searchButton = page.locator('button[data-testid="search-btn"]');
    this.categoryFilter = page.locator('#category-filter');
    this.categoryLinks = page.locator('.category-link');
    this.priceFromInput = page.locator('#price-from');
    this.priceToInput = page.locator('#price-to');
    this.sortSelect = page.locator('#sort-select');
    this.productsGrid = page.locator('.products-grid');
    this.productCards = page.locator('.product-card');
    this.pagination = page.locator('.pagination');
    this.noResultsMessage = page.locator('.no-results');
    this.loadingSpinner = page.locator('.loading-spinner');
    this.addToCartButton = page.locator('button:has-text("В корзину")');
  }

  async goto() {
    await this.page.goto('/catalog');
    await expect(this.productsGrid).toBeVisible();
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.searchButton.click();
    await this.waitForLoad();
  }

  async selectCategory(category: string) {
    await this.categoryFilter.selectOption(category);
    await this.waitForLoad();
  }

  async setPriceRange(from: number, to: number) {
    await this.priceFromInput.fill(from.toString());
    await this.priceToInput.fill(to.toString());
    await this.page.keyboard.press('Enter');
    await this.waitForLoad();
  }

  async selectSort(option: string) {
    await this.sortSelect.selectOption(option);
    await this.waitForLoad();
  }

  async waitForLoad() {
    await this.loadingSpinner.waitFor({ state: 'hidden' });
  }

  async getProductCount(): Promise<number> {
    return await this.productCards.count();
  }

  async clickProduct(index: number) {
    const card = this.productCards.nth(index);
    await card.click();
  }

  async clickProductByName(name: string) {
    const card = this.productCards.filter({ hasText: name }).first();
    await card.click();
  }

  async addToCart(productName: string) {
    const card = this.productCards.filter({ hasText: productName }).first();
    const addToCartBtn = card.locator('button:has-text("В корзину")');
    await addToCartBtn.click();
  }

  async goToProduct(name: string) {
    await this.clickProductByName(name);
    await expect(this.page).toHaveURL(/\/products\//);
  }

  /**
   * Переход в категорию по названию или slug
   * @param category - название категории (например, 'cpu', 'gpu', 'ram')
   */
  async gotoCategory(category: string) {
    // Сначала проверяем, есть ли прямая ссылка на категорию
    const categoryLink = this.categoryLinks.filter({ hasText: new RegExp(category, 'i') }).first();
    const linkCount = await categoryLink.count();
    
    if (linkCount > 0) {
      await categoryLink.click();
    } else {
      // Если нет ссылки, переходим по URL
      await this.page.goto(`/catalog/${category}`);
    }
    
    await this.waitForLoad();
    await expect(this.productsGrid).toBeVisible();
  }

  /**
   * Выбор товара по названию (переход на страницу товара)
   * @param name - название товара
   */
  async selectProduct(name: string) {
    const productCard = this.productCards.filter({ hasText: name }).first();
    await expect(productCard).toBeVisible({ timeout: 10000 });
    
    // Кликаем по названию товара или по самой карточке
    const productLink = productCard.locator('.product-name, .product-title, a').first();
    const linkCount = await productLink.count();
    
    if (linkCount > 0) {
      await productLink.click();
    } else {
      await productCard.click();
    }
    
    // Ждём перехода на страницу товара
    await expect(this.page).toHaveURL(/\/products\//);
  }

  /**
   * Добавление товара в корзину из каталога
   * @param name - название товара (опционально, если не указан - добавляет выбранный товар)
   */
  async addToCartFromCatalog(name?: string) {
    if (name) {
      const productCard = this.productCards.filter({ hasText: name }).first();
      const addToCartBtn = productCard.locator('button:has-text("В корзину")');
      await addToCartBtn.click();
    } else {
      await this.addToCartButton.first().click();
    }
    
    // Проверяем уведомление о добавлении
    await expect(this.page.locator('.notification, .toast')).toContainText(/Добавлено в корзину|Добавлен в корзину/);
  }

  /**
   * Установка количества товара перед добавлением в корзину
   * @param quantity - количество
   */
  async setQuantity(quantity: number) {
    const quantityInput = this.page.locator('#quantity, .quantity-input');
    await quantityInput.fill(quantity.toString());
  }

  /**
   * Получение названия товара по индексу
   * @param index - индекс товара в списке
   */
  async getProductName(index: number): Promise<string | null> {
    const card = this.productCards.nth(index);
    const nameElement = card.locator('.product-name, .product-title, h3, h4').first();
    return await nameElement.textContent();
  }

  /**
   * Получение цены товара по индексу
   * @param index - индекс товара в списке
   */
  async getProductPrice(index: number): Promise<string | null> {
    const card = this.productCards.nth(index);
    const priceElement = card.locator('.product-price, .price').first();
    return await priceElement.textContent();
  }

  /**
   * Проверка, что товары отображаются
   */
  async expectProductsVisible() {
    await expect(this.productsGrid).toBeVisible();
    const count = await this.productCards.count();
    expect(count).toBeGreaterThan(0);
  }

  /**
   * Проверка отсутствия результатов
   */
  async expectNoResults() {
    await expect(this.noResultsMessage).toBeVisible();
  }
}
