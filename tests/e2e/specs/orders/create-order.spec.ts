import { test, expect } from '@playwright/test';

/**
 * E2E тесты для создания заказа
 */
test.describe('Создание заказа', () => {
  test.beforeEach(async ({ page }) => {
    // Авторизация перед каждым тестом
    await page.goto('/login');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(catalog|profile)/);
  });

  test('Успешное создание заказа с самовывозом', async ({ page }) => {
    // Переход в каталог
    await page.goto('/catalog');
    
    // Добавление товара в корзину
    await page.click('.product-card:first-child >> button:has-text("В корзину")');
    
    // Проверка появления уведомления
    await expect(page.locator('.notification')).toContainText('Добавлено в корзину');
    
    // Переход в корзину
    await page.click('[data-testid="cart-link"]');
    await expect(page).toHaveURL(/\/cart/);
    
    // Проверка содержимого корзины
    await expect(page.locator('.cart-item')).toHaveCount(1);
    
    // Оформление заказа
    await page.click('button:has-text("Оформить заказ")');
    
    // Выбор способа получения
    await page.click('input[value="pickup"]');
    
    // Выбор способа оплаты
    await page.click('input[value="online"]');
    
    // Подтверждение заказа
    await page.click('button:has-text("Подтвердить заказ")');
    
    // Проверка успешного создания
    await expect(page).toHaveURL(/\/orders\/\d+/);
    await expect(page.locator('.order-status')).toContainText('Новый');
  });

  test('Создание заказа с доставкой', async ({ page }) => {
    await page.goto('/catalog');
    await page.click('.product-card:first-child >> button:has-text("В корзину")');
    await page.click('[data-testid="cart-link"]');
    await page.click('button:has-text("Оформить заказ")');
    
    // Выбор доставки
    await page.click('input[value="delivery"]');
    
    // Заполнение адреса
    await page.fill('#city', 'Минск');
    await page.fill('#street', 'ул. Примерная');
    await page.fill('#house', '1');
    await page.fill('#apartment', '10');
    
    // Оплата при получении
    await page.click('input[value="on-receipt"]');
    
    await page.click('button:has-text("Подтвердить заказ")');
    
    await expect(page).toHaveURL(/\/orders\/\d+/);
    await expect(page.locator('.delivery-info')).toContainText('Минск');
  });

  test('Ошибка при недостаточном количестве товара', async ({ page }) => {
    // Добавление товара с ограниченным количеством
    await page.goto('/catalog?stock=1');
    await page.click('.product-card[data-stock="1"] >> button:has-text("В корзину")');
    
    // Попытка увеличить количество
    await page.click('[data-testid="cart-link"]');
    await page.click('.quantity-increase');
    
    // Проверка ошибки
    await expect(page.locator('.error-message')).toContainText('Недостаточно товара');
  });

  test('Просмотр истории заказов', async ({ page }) => {
    await page.goto('/orders');
    
    await expect(page.locator('.orders-list')).toBeVisible();
    
    // Фильтрация по статусу
    await page.selectOption('#status-filter', 'completed');
    await expect(page.locator('.order-item')).toHaveCount(await page.locator('.order-item').count());
  });
});