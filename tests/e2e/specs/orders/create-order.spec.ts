import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { CatalogPage } from '../../pages/CatalogPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage, DeliveryAddress } from '../../pages/CheckoutPage';

/**
 * E2E тесты для создания заказа
 * @see development-plan/10-e2e-and-load-testing.md (Section 10.1)
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
    
    // Ждем редирект на каталог
    await expect(page).toHaveURL(/\/catalog/);
  });

  test('User can add product to cart and create order with pickup', async ({ page }) => {
    // Arrange - переходим в каталог
    await catalogPage.goto();
    
    // Act - добавляем товар в корзину
    await catalogPage.addToCart('AMD Ryzen 9 7950X');
    
    // Assert - проверяем уведомление о добавлении
    await expect(page.locator('.notification')).toBeVisible();
    await expect(page.locator('.notification')).toContainText('Добавлено в корзину');
    
    // Переход в корзину
    await cartPage.goto();
    
    // Проверяем наличие товара в корзине
    await expect(cartPage.cartItems).toBeVisible();
    await expect(cartPage.cartItem).toHaveCount(1);
    await cartPage.expectProductInCart('AMD Ryzen 9 7950X');
    
    // Оформление заказа
    await cartPage.proceedToCheckout();
    
    // Выбираем самовывоз и онлайн оплату
    await checkoutPage.waitForLoad();
    await checkoutPage.checkoutWithPickup('online');
    
    // Verify order status is "New"
    await checkoutPage.expectOrderCreated();
    await checkoutPage.expectOrderStatus('Новый');
    
    // Проверяем номер заказа
    const orderNumber = await checkoutPage.getOrderNumber();
    expect(orderNumber).toMatch(/^ORD-\d+$/);
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
    await expect(page.locator('.notification')).toBeVisible();
    
    // Переход в корзину
    await cartPage.goto();
    await expect(cartPage.cartItem).toHaveCount(1);
    
    // Оформление с доставкой
    await cartPage.proceedToCheckout();
    await checkoutPage.waitForLoad();
    await checkoutPage.checkoutWithDelivery(deliveryAddress, 'on-receipt');
    
    // Assert
    await checkoutPage.expectOrderCreated();
    await expect(page.locator('.delivery-info')).toContainText('Минск');
    await expect(page.locator('.payment-method')).toContainText('При получении');
  });

  test('Ошибка при недостаточном количестве товара', async ({ page }) => {
    // Arrange - переходим к товару с ограниченным количеством
    await catalogPage.goto();
    await catalogPage.search('DDR5-6000-32GB-limited');
    await catalogPage.waitForLoad();
    
    // Act - пытаемся добавить товар
    await catalogPage.clickProductByName('DDR5-6000-32GB-limited');
    
    // Устанавливаем количество больше, чем на складе
    const quantityInput = page.locator('#quantity');
    await quantityInput.fill('10');
    
    const addToCartBtn = page.locator('button:has-text("В корзину")');
    await expect(addToCartBtn).toBeVisible();
    await addToCartBtn.click();
    
    // Assert - ожидаем ошибку
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Недостаточно товара на складе');
  });

  test('Просмотр истории заказов', async ({ page }) => {
    // Act
    await page.goto('/orders');
    
    // Assert - проверяем список заказов
    await expect(page.locator('.orders-list')).toBeVisible();
    
    // Фильтрация по статусу
    await page.selectOption('#status-filter', 'completed');
    await page.waitForTimeout(500); // Ждем обновления списка
    
    const orderItems = page.locator('.order-item');
    const count = await orderItems.count();
    
    // Проверяем, что отображаются заказы
    if (count > 0) {
      await expect(orderItems.first()).toBeVisible();
    }
    
    // Переход к деталям заказа
    const detailsButton = page.locator('.order-item:first-child >> text=Подробнее');
    if (await detailsButton.isVisible()) {
      await detailsButton.click();
      await expect(page.locator('.order-details')).toBeVisible();
    }
  });

  test('Изменение количества товара в корзине', async ({ page }) => {
    // Arrange
    await catalogPage.goto();
    await catalogPage.addToCart('AMD Ryzen 9 7950X');
    await expect(page.locator('.notification')).toBeVisible();
    
    // Переход в корзину
    await cartPage.goto();
    await expect(cartPage.cartItem).toHaveCount(1);
    
    // Act - увеличиваем количество
    await cartPage.increaseQuantity(0);
    
    // Assert - количество изменилось
    await expect(page.locator('.quantity-value')).toContainText('2');
    
    // Уменьшаем количество
    await cartPage.decreaseQuantity(0);
    await expect(page.locator('.quantity-value')).toContainText('1');
  });

  test('Удаление товара из корзины', async ({ page }) => {
    // Arrange
    await catalogPage.goto();
    await catalogPage.addToCart('AMD Ryzen 9 7950X');
    await expect(page.locator('.notification')).toBeVisible();
    
    await cartPage.goto();
    await expect(cartPage.cartItem).toHaveCount(1);
    
    // Act
    await cartPage.removeItem(0);
    
    // Assert
    await cartPage.expectEmptyCart();
  });

  test('Валидация формы доставки', async ({ page }) => {
    // Arrange
    await catalogPage.goto();
    await catalogPage.addToCart('AMD Ryzen 9 7950X');
    await cartPage.goto();
    await cartPage.proceedToCheckout();
    
    // Выбираем доставку
    await checkoutPage.selectDelivery();
    
    // Не заполняем адрес
    await checkoutPage.selectOnlinePayment();
    await checkoutPage.confirmOrder();
    
    // Assert - ошибка валидации
    await expect(page.locator('.validation-error')).toBeVisible();
    await expect(page.locator('#city')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#street')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#house')).toHaveAttribute('aria-invalid', 'true');
  });
});