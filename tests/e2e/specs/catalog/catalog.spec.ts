import { test, expect } from '@playwright/test';
import { CatalogPage } from '../../pages/CatalogPage';

/**
 * E2E тесты для каталога товаров
 */
test.describe('Каталог товаров', () => {
  let catalogPage: CatalogPage;

  test.beforeEach(async ({ page }) => {
    catalogPage = new CatalogPage(page);
    await catalogPage.goto();
  });

  test('Пользователь может просмотреть список продуктов', async ({ page }) => {
    // Assert - проверяем что сетка продуктов отображается
    await expect(catalogPage.productsGrid).toBeVisible();
    
    // Проверяем что есть хотя бы один продукт
    const productCount = await catalogPage.getProductCount();
    expect(productCount).toBeGreaterThan(0);
  });

  test('Поиск товаров работает корректно', async ({ page }) => {
    // Arrange
    const searchQuery = 'процессор';
    
    // Act
    await catalogPage.search(searchQuery);
    
    // Assert - проверяем что поиск выполнился
    await expect(catalogPage.loadingSpinner).not.toBeVisible();
    await expect(catalogPage.productsGrid).toBeVisible();
  });

  test('Фильтрация по категории работает', async ({ page }) => {
    // Act
    await catalogPage.selectCategory('Процессоры');
    
    // Assert
    await expect(catalogPage.loadingSpinner).not.toBeVisible();
    await expect(catalogPage.productsGrid).toBeVisible();
  });

  test('Сортировка товаров работает', async ({ page }) => {
    // Act
    await catalogPage.selectSort('price-asc');
    
    // Assert
    await expect(catalogPage.loadingSpinner).not.toBeVisible();
    await expect(catalogPage.productsGrid).toBeVisible();
  });

  test('Клик по продукту открывает страницу товара', async ({ page }) => {
    // Act
    await catalogPage.clickProduct(0);
    
    // Assert
    await expect(page).toHaveURL(/\/products\//);
  });
});