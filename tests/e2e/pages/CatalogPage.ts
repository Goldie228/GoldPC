import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model для страницы каталога
 * Актуальные селекторы: aria-label для поиска, Tailwind-классы для сетки
 */
export class CatalogPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly productsGrid: Locator;
  readonly productCards: Locator;
  readonly loadingSpinner: Locator;
  readonly noResultsMessage: Locator;
  readonly addToCartButton: Locator;
  readonly viewGridButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Поиск: input с aria-label
    this.searchInput = page.locator('input[aria-label="Поиск в каталоге"]').first();
    this.searchButton = page.locator('button[aria-label="Найти"]').first();
    // Сетка товаров: Tailwind grid (нет CSS-класса .products-grid)
    this.productsGrid = page.locator('.grid.gap-4, .grid.gap-5').first();
    // Карточки товаров: контейнеры с bg-surface-card
    this.productCards = page.locator('[class*="bg-surface-card"][class*="rounded-xl"][class*="overflow-hidden"]');
    // Загрузка: скелетоны (ProductCardSkeleton)
    this.loadingSpinner = page.locator('[class*="skeleton"], [class*="animate-pulse"]').first();
    // Нет результатов: текст "Товары не найдены"
    this.noResultsMessage = page.locator('h3:has-text("Товары не найдены")');
    // Кнопка "В корзину"
    this.addToCartButton = page.locator('button:has-text("В корзину")');
    // Кнопка сетки (view toggle)
    this.viewGridButton = page.locator('button[aria-label="Сетка"]');
  }

  async goto() {
    await this.page.goto('/catalog');
    // Ждём загрузки — либо сетка товаров, либо сообщение о пустом каталоге
    await this.page.waitForLoadState('networkidle');
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.searchButton.click();
    await this.waitForLoad();
  }

  async selectCategory(_category: string) {
    // Категории в FilterSidebar — кликаем по тексту категории
    const categoryLink = this.page.locator(`text=${_category}`).first();
    if (await categoryLink.isVisible().catch(() => false)) {
      await categoryLink.click();
      await this.waitForLoad();
    }
  }

  async selectSort(_option: string) {
    // Сортировка — radio кнопки в FilterSidebar
    const sortOption = this.page.locator(`text=${_option}`).first();
    if (await sortOption.isVisible().catch(() => false)) {
      await sortOption.click();
      await this.waitForLoad();
    }
  }

  async waitForLoad() {
    // Ждём пока скелетоны исчезнут
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
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
    await expect(this.page).toHaveURL(/\/product\//);
  }

  /**
   * Добавление товара в корзину из каталога
   * @param name - название товара (опционально)
   */
  async addToCartFromCatalog(name?: string) {
    if (name) {
      const productCard = this.productCards.filter({ hasText: name }).first();
      const addToCartBtn = productCard.locator('button:has-text("В корзину")');
      await addToCartBtn.click();
    } else {
      await this.addToCartButton.first().click();
    }
    
    // Проверяем уведомление о добавлении (toast)
    const toast = this.page.locator('[role="alert"], .toast');
    await expect(toast.first()).toContainText(/Добавлен|корзину/i, { timeout: 5000 });
  }

  /**
   * Установка количества товара перед добавлением в корзину
   */
  async setQuantity(quantity: number) {
    const quantityInput = this.page.locator('input[type="number"], input[name="quantity"]');
    await quantityInput.fill(quantity.toString());
  }

  /**
   * Получение названия товара по индексу
   */
  async getProductName(index: number): Promise<string | null> {
    const card = this.productCards.nth(index);
    const nameElement = card.locator('h3, h4, [class*="font-medium"]').first();
    return await nameElement.textContent();
  }

  /**
   * Получение цены товара по индексу
   */
  async getProductPrice(index: number): Promise<string | null> {
    const card = this.productCards.nth(index);
    const priceElement = card.locator('[class*="font-semibold"][class*="text-gold"], [class*="font-mono"]').first();
    return await priceElement.textContent();
  }

  /**
   * Проверка, что товары отображаются
   */
  async expectProductsVisible() {
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
