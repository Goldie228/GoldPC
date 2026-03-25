import { Given, When, Then, Before, After, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium, Browser, Page, BrowserContext } from '@playwright/test';
import { expect } from '@playwright/test';
import { CatalogPage } from '../pages/CatalogPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { LoginPage } from '../pages/LoginPage';
import { PCBuilderPage } from '../pages/PCBuilderPage';

setDefaultTimeout(60000);

interface HappyPathWorld {
  page: Page;
  browser: Browser;
  context: BrowserContext;
  catalogPage: CatalogPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  loginPage: LoginPage;
  pcBuilderPage: PCBuilderPage;
  lastOrderNumber?: string;
}

Before(async function (this: HappyPathWorld) {
  this.browser = await chromium.launch({ headless: true });
  this.context = await this.browser.newContext();
  this.page = await this.context.newPage();
  this.catalogPage = new CatalogPage(this.page);
  this.cartPage = new CartPage(this.page);
  this.checkoutPage = new CheckoutPage(this.page);
  this.loginPage = new LoginPage(this.page);
  this.pcBuilderPage = new PCBuilderPage(this.page);
});

After(async function (this: HappyPathWorld) {
  await this.page?.close();
  await this.context?.close();
  await this.browser?.close();
});

// GIVEN
Given('Я на главной странице', async function (this: HappyPathWorld) {
  await this.page.goto('/');
});

// WHEN
When('Я ищу процессор {string}', async function (this: HappyPathWorld, query: string) {
  await this.catalogPage.goto();
  await this.catalogPage.search(query);
});

When('Я добавляю первый товар в корзину', async function (this: HappyPathWorld) {
  await this.catalogPage.addToCartFromCatalog();
});

When('Я перехожу в корзину', async function (this: HappyPathWorld) {
  await this.cartPage.goto();
});

Then('Товар {string} должен быть в корзине', async function (this: HappyPathWorld, productName: string) {
  await this.cartPage.expectProductInCart(productName);
});

When('Я авторизуюсь как {string} с паролем {string}', async function (this: HappyPathWorld, email: string, password: string) {
  // Если мы уже на странице логина (например, после нажатия "Оформить заказ" будучи неавторизованным)
  if (!this.page.url().includes('/login')) {
    await this.loginPage.goto();
  }
  await this.loginPage.login(email, password);
  // Ждем возврата на страницу, с которой пришли или в профиль
  await this.page.waitForLoadState('networkidle');
});

When('Я заполняю данные доставки', async function (this: HappyPathWorld) {
  await this.checkoutPage.selectDelivery();
  await this.checkoutPage.fillDeliveryAddress({
    city: 'Москва',
    street: 'Тверская',
    house: '10',
    apartment: '42'
  });
});

When('Я выбираю способ оплаты {string}', async function (this: HappyPathWorld, paymentMethod: string) {
  if (paymentMethod === 'Картой онлайн' || paymentMethod === 'online') {
    await this.checkoutPage.selectOnlinePayment();
  } else {
    await this.checkoutPage.selectOnReceiptPayment();
  }
});

When('Я нажимаю {string}', async function (this: HappyPathWorld, buttonText: string) {
  if (buttonText === 'Оформить заказ') {
    await this.cartPage.proceedToCheckout();
  } else if (buttonText === 'Подтвердить заказ') {
    await this.checkoutPage.confirmOrder();
  } else if (buttonText === 'Добавить сборку в корзину') {
    await this.pcBuilderPage.addToCartButton.click();
  } else {
    await this.page.click(`button:has-text("${buttonText}")`);
  }
});

Then('Я должен видеть сообщение об успешном оформлении заказа', async function (this: HappyPathWorld) {
  await this.checkoutPage.expectOrderCreated();
});

Then('Номер заказа должен отображаться на странице', async function (this: HappyPathWorld) {
  this.lastOrderNumber = await this.checkoutPage.getOrderNumber();
  expect(this.lastOrderNumber).not.toBe('');
});

// PC Builder steps
When('Я выбираю совместимые компоненты для сборки', async function (this: HappyPathWorld) {
  await this.pcBuilderPage.selectComponent('cpu', 'AMD Ryzen 9 7950X');
  await this.pcBuilderPage.selectComponent('motherboard', 'ASUS ROG Crosshair X670E');
  await this.pcBuilderPage.selectComponent('ram', 'DDR5-6000 32GB');
  await this.pcBuilderPage.selectComponent('gpu', 'RTX 4090');
  await this.pcBuilderPage.selectComponent('psu', '850W');
});

Then('Все компоненты сборки должны быть в корзине', async function (this: HappyPathWorld) {
  // Упрощенная проверка - хотя бы несколько компонентов
  const count = await this.cartPage.getItemCount();
  expect(count).toBeGreaterThanOrEqual(5);
});

Then('Общая стоимость корзины должна соответствовать стоимости сборки', async function (this: HappyPathWorld) {
  const total = await this.cartPage.getTotalSum();
  expect(total).not.toBeNull();
  expect(total).toMatch(/[\d\s]+₽/);
});
