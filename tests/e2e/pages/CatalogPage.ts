import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model для страницы каталога
 */
export class CatalogPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly categoryFilter: Locator;
  readonly priceFromInput: Locator;
  readonly priceToInput: Locator;
  readonly sortSelect: Locator;
  readonly productsGrid: Locator;
  readonly productCards: Locator;
  readonly pagination: Locator;
  readonly noResultsMessage: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.locator('#search-input');
    this.searchButton = page.locator('button[data-testid="search-btn"]');
    this.categoryFilter = page.locator('#category-filter');
    this.priceFromInput = page.locator('#price-from');
    this.priceToInput = page.locator('#price-to');
    this.sortSelect = page.locator('#sort-select');
    this.productsGrid = page.locator('.products-grid');
    this.productCards = page.locator('.product-card');
    this.pagination = page.locator('.pagination');
    this.noResultsMessage = page.locator('.no-results');
    this.loadingSpinner = page.locator('.loading-spinner');
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
}