import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  
  test('Home Page Visual Match', async ({ page }) => {
    await page.goto('/');
    
    // Ждем полной загрузки и появления основного контента
    await page.waitForLoadState('networkidle');
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
    
    // Снимаем скриншот всей страницы
    await expect(page).toHaveScreenshot('home-page.png', {
      fullPage: true,
      mask: [
        // Маскируем динамические элементы, если они есть
        page.locator('.promo-banner'),
        page.locator('.latest-news')
      ]
    });
  });

  test('Catalog Page Visual Match', async ({ page }) => {
    await page.goto('/catalog');
    
    // Ждем появления сетки товаров
    await page.waitForLoadState('networkidle');
    const productsGrid = page.locator('.products-grid, .catalog-content');
    await expect(productsGrid).toBeVisible({ timeout: 10000 });
    
    // Снимаем скриншот страницы каталога
    await expect(page).toHaveScreenshot('catalog-page.png', {
      fullPage: true,
      mask: [
        // Маскируем цены и изображения, так как они могут меняться
        page.locator('.product-price'),
        page.locator('.product-image')
      ]
    });
  });

  test('PC Builder Interface Visual Match', async ({ page }) => {
    await page.goto('/pc-builder');
    
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.pc-builder-container')).toBeVisible();
    
    // Снимаем скриншот конструктора
    await expect(page).toHaveScreenshot('pc-builder.png', {
      fullPage: false // Для конструктора достаточно видимой части
    });
  });
});
