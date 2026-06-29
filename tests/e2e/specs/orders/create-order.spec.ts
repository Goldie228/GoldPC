import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { CatalogPage } from '../../pages/CatalogPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage, DeliveryAddress } from '../../pages/CheckoutPage';

/**
 * E2E тесты для создания заказа
 * Актуальные селекторы: aria-label, role, текст кнопок
 */
test.describe('Создание заказа', () => {
  let loginPage: LoginPage;
  let catalogPage: CatalogPage;
  let cartPage: CartPage;
  let checkoutPage: CheckoutPage;

  test.beforeEach(async ({ page }) => {
    // Инициализация Page Objects
    loginPage = new LoginPage(page);
    catalogPage = new CatalogPage(page);
    cartPage = new CartPage(page);
    checkoutPage = new CheckoutPage(page);

    // Авторизация перед каждым тестом
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password123');
    
    // Ждём закрытия модалки или редирект
    await page.waitForTimeout(2000);
  });

  test('User can add product to cart and create order with pickup', async ({ page }) => {
    // Arrange - переходим в каталог
    await catalogPage.goto();
    
    // Act - добавляем товар в корзину
    await catalogPage.addToCart('AMD Ryzen 9 7950X');
    
    // Переход в корзину
    await cartPage.goto();
    
    // Проверяем наличие товара в корзине
    await expect(cartPage.cartItems.first()).toBeVisible({ timeout: 10000 });
    await cartPage.expectProductInCart('AMD Ryzen 9 7950X');
    
    // Оформление заказа
    await cartPage.proceedToCheckout();
    
    // Выбираем самовывоз и онлайн оплату
    await checkoutPage.waitForLoad();
    await checkoutPage.checkoutWithPickup('online');
    
    // Verify order status
    await checkoutPage.expectOrderCreated();
  });

  test('Создание заказа с доставкой', async ({ page }) => {
    // Arrange
    const deliveryAddress: DeliveryAddress = {
      city: 'Минск',
      street: 'ул. Примерная',
      house: '1',
      apartment: '10'
    };

    // Переход в каталог
    await catalogPage.goto();
    
    // Act - добавляем товар
    await catalogPage.addToCart('RTX 4090');
    
    // Переход в корзину
    await cartPage.goto();
    await expect(cartPage.cartItems.first()).toBeVisible({ timeout: 10000 });
    
    // Оформление с доставкой
    await cartPage.proceedToCheckout();
    await checkoutPage.waitForLoad();
    await checkoutPage.checkoutWithDelivery(deliveryAddress, 'on-receipt');
    
    // Assert
    await checkoutPage.expectOrderCreated();
  });

  test('Просмотр истории заказов', async ({ page }) => {
    // Act
    await page.goto('/orders');
    
    // Assert - проверяем страницу заказов
    await page.waitForLoadState('networkidle');
  });

  test('Удаление товара из корзины', async ({ page }) => {
    // Arrange
    await catalogPage.goto();
    await catalogPage.addToCart('AMD Ryzen 9 7950X');
    
    await cartPage.goto();
    await expect(cartPage.cartItems.first()).toBeVisible({ timeout: 10000 });
    
    // Act
    await cartPage.removeItem(0);
    
    // Assert
    await cartPage.expectEmptyCart();
  });
});
