import { test, expect } from '@playwright/test';

/**
 * Визуальные регрессионные тесты
 * Актуальные селекторы: header, footer, Tailwind grid классы
 */
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
        // Маскируем динамические элементы
        page.locator('[class*="promo"]'),
        page.locator('[class*="news"]'),
      ]
    });
  });

  test('Catalog Page Visual Match', async ({ page }) => {
    await page.goto('/catalog');
    
    // Ждем загрузки страницы каталога
    await page.waitForLoadState('networkidle');
    
    // Снимаем скриншот страницы каталога
    await expect(page).toHaveScreenshot('catalog-page.png', {
      fullPage: true,
      mask: [
        // Маскируем цены и изображения
        page.locator('[class*="font-semibold"][class*="text-gold"]'),
        page.locator('img[alt]'),
      ]
    });
  });

  test('PC Builder Interface Visual Match', async ({ page }) => {
    await page.goto('/pc-builder');
    
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.pc-builder').first()).toBeVisible({ timeout: 10000 });
    
    // Снимаем скриншот конструктора
    await expect(page).toHaveScreenshot('pc-builder.png', {
      fullPage: false // Для конструктора достаточно видимой части
    });
  });
});
