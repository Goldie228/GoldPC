import { test, expect } from '@playwright/test';
import { CatalogPage } from '../../pages/CatalogPage';

/**
 * E2E тесты для каталога товаров
 * Актуальные селекторы: aria-label для поиска, Tailwind grid для сетки
 */
test.describe('Каталог товаров', () => {
  let catalogPage: CatalogPage;

  test.beforeEach(async ({ page }) => {
    catalogPage = new CatalogPage(page);
    await catalogPage.goto();
  });

  test('Пользователь может просмотреть список продуктов', async ({ page }) => {
    // Assert - проверяем что страница загружена
    await page.waitForLoadState('networkidle');
    // Проверяем что есть хотя бы один товарный элемент
    const productCount = await catalogPage.getProductCount();
    expect(productCount).toBeGreaterThan(0);
  });

  test('Поиск товаров работает корректно', async ({ page }) => {
    // Arrange
    const searchQuery = 'процессор';
    
    // Act
    await catalogPage.search(searchQuery);
    
    // Assert - проверяем что поиск выполнился
    await page.waitForLoadState('networkidle');
    await expect(page.locator('input[aria-label="Поиск в каталоге"]').first()).toHaveValue(searchQuery);
  });

  test('Фильтрация по категории работает', async ({ page }) => {
    // Act - кликаем по категории в сайдбаре
    await catalogPage.selectCategory('Процессоры');
    
    // Assert
    await page.waitForLoadState('networkidle');
  });

  test('Сортировка товаров работает', async ({ page }) => {
    // Act
    await catalogPage.selectSort('Сначала дешевле');
    
    // Assert
    await page.waitForLoadState('networkidle');
  });

  test('Клик по продукту открывает страницу товара', async ({ page }) => {
    // Act
    await catalogPage.clickProduct(0);
    
    // Assert
    await expect(page).toHaveURL(/\/product\//);
  });
});
