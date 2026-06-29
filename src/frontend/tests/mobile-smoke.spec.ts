import { expect, test } from '@playwright/test';

const BASE_URL = 'http://localhost:5176';

test.describe('Mobile smoke', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('catalog opens mobile filters without crash', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalog`);
    await page.waitForLoadState('networkidle');

    const filterButton = page.getByRole('button', { name: /Фильтры/i }).first();
    await expect(filterButton).toBeVisible();
    await filterButton.click();

    await expect(page.getByText('Категории')).toBeVisible();
  });

  test('info pages are available on mobile', async ({ page }) => {
    for (const path of ['/delivery', '/payment', '/warranty', '/returns', '/faq']) {
      await page.goto(`${BASE_URL}${path}`);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h1')).toBeVisible();
    }
  });
});
