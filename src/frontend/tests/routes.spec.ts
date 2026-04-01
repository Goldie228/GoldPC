import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5176';

const routes = [
  { path: '/', name: 'Home', expectedContent: 'GoldPC' },
  { path: '/catalog', name: 'Catalog', expectedContent: 'Каталог' },
  { path: '/login', name: 'Login', expectedContent: 'Войти' },
  { path: '/pc-builder', name: 'PC Builder', expectedContent: 'Конструктор ПК' },
  { path: '/delivery', name: 'Delivery', expectedContent: 'Доставка' },
  { path: '/payment', name: 'Payment', expectedContent: 'Оплата' },
  { path: '/warranty', name: 'Warranty', expectedContent: 'Гарантия' },
  { path: '/returns', name: 'Returns', expectedContent: 'Возврат' },
  { path: '/faq', name: 'FAQ', expectedContent: 'FAQ' },
  { path: '/account', name: 'Account', expectedContent: '' }, // Protected route, may redirect to login
];

test.describe('Route Tests', () => {
  for (const route of routes) {
    test(`${route.name} page (${route.path}) should render`, async ({ page }) => {
      await page.goto(BASE_URL + route.path);
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Check that page is not 404
      const body = await page.locator('body').innerHTML();
      const is404 = body.includes('404') || body.includes('Не найдено');
      
      // Check for blank page
      const rootContent = await page.locator('#root').innerHTML();
      const isBlank = rootContent.trim() === '';
      
      // Take screenshot for debugging
      await page.screenshot({ path: `test-results/${route.name.toLowerCase().replace(' ', '-')}.png` });
      
      if (route.path === '/account') {
        // Account page should redirect to login or show auth required
        const url = page.url();
        const hasLoginContent = body.includes('Войти') || body.includes('login');
        expect(hasLoginContent || url.includes('login')).toBeTruthy();
      } else {
        expect(is404).toBeFalsy();
        expect(isBlank).toBeFalsy();
        
        if (route.expectedContent) {
          expect(body.toLowerCase()).toContain(route.expectedContent.toLowerCase());
        }
      }
    });
  }
});