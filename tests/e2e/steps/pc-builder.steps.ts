import { Given, When, Then, Before, After, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium, Browser, Page, BrowserContext } from '@playwright/test';
import { expect } from '@playwright/test';
import { PCBuilderPage } from '../pages/PCBuilderPage';
import { LoginPage } from '../pages/LoginPage';

// Устанавливаем таймаут для шагов (в миллисекундах)
setDefaultTimeout(60000);

// Интерфейс для хранения данных между шагами
interface PCBuilderWorld {
  page: Page;
  browser: Browser;
  context: BrowserContext;
  pcBuilderPage: PCBuilderPage;
  loginPage: LoginPage;
}

// Инициализация браузера перед каждым сценарием
Before(async function (this: PCBuilderWorld) {
  this.browser = await chromium.launch({ headless: true });
  this.context = await this.browser.newContext();
  this.page = await this.context.newPage();
  this.pcBuilderPage = new PCBuilderPage(this.page);
  this.loginPage = new LoginPage(this.page);
});

// Закрытие браузера после каждого сценария
After(async function (this: PCBuilderWorld) {
  await this.page?.close();
  await this.context?.close();
  await this.browser?.close();
});

// ========================================
// GIVEN шаги
// ========================================

Given('Я на странице конструктора', async function (this: PCBuilderWorld) {
  await this.pcBuilderPage.goto();
});

Given('Я авторизован как {string}', async function (this: PCBuilderWorld, email: string) {
  await this.loginPage.goto();
  await this.loginPage.login(email, 'testpassword123');
  
  // Ожидание успешной авторизации
  await expect(this.page).toHaveURL(/profile|catalog/, { timeout: 10000 });
});

Given('Я создал совместимую конфигурацию', async function (this: PCBuilderWorld) {
  await this.pcBuilderPage.goto();
  
  // Выбор совместимых компонентов
  await this.pcBuilderPage.selectComponent('cpu', 'AMD Ryzen 9 7950X');
  await this.pcBuilderPage.selectComponent('motherboard', 'ASUS ROG Crosshair X670E');
  await this.pcBuilderPage.selectComponent('ram', 'DDR5-6000 32GB');
  await this.pcBuilderPage.selectComponent('gpu', 'RTX 4090');
  await this.pcBuilderPage.selectComponent('psu', '850W');
});

// ========================================
// WHEN шаги
// ========================================

When('Я выбираю процессор {string}', async function (this: PCBuilderWorld, productName: string) {
  await this.pcBuilderPage.selectComponent('cpu', productName);
});

When('Я выбираю процессор {string} с сокетом {string}', async function (this: PCBuilderWorld, productName: string, socket: string) {
  await this.pcBuilderPage.selectComponent('cpu', productName);
  // Сохраняем информацию о сокете для проверки совместимости
  await this.page.evaluate((s) => {
    (globalThis as any).selectedSocket = s;
  }, socket);
});

When('Я выбираю материнскую плату с сокетом {string}', async function (this: PCBuilderWorld, socket: string) {
  // Выбор материнской платы по сокету
  await this.page.click('[data-category="motherboard"]');
  await this.page.click(`[data-socket="${socket}"] >> text=Выбрать`);
  await this.page.waitForTimeout(500); // Ожидание обновления UI
});

When('Я выбираю оперативную память {string}', async function (this: PCBuilderWorld, productName: string) {
  await this.pcBuilderPage.selectComponent('ram', productName);
});

When('Я выбираю видеокарту {string}', async function (this: PCBuilderWorld, productName: string) {
  await this.pcBuilderPage.selectComponent('gpu', productName);
});

When('Я выбираю блок питания {string}', async function (this: PCBuilderWorld, power: string) {
  await this.pcBuilderPage.selectComponent('psu', power);
});

When('Я нажимаю {string}', async function (this: PCBuilderWorld, buttonText: string) {
  if (buttonText === 'Сохранить конфигурацию') {
    await this.pcBuilderPage.saveConfigButton.click();
  } else {
    await this.page.click(`button:has-text("${buttonText}")`);
  }
  await this.page.waitForTimeout(500);
});

When('Я ввожу название {string}', async function (this: PCBuilderWorld, name: string) {
  await this.pcBuilderPage.configNameInput.fill(name);
});

// ========================================
// THEN шаги
// ========================================

Then('Конфигурация должна быть совместимой', async function (this: PCBuilderWorld) {
  await this.pcBuilderPage.expectCompatible();
});

Then('Рекомендуемая мощность блока питания должна быть не менее {string}', async function (this: PCBuilderWorld, minPower: string) {
  const power = await this.pcBuilderPage.getRecommendedPower();
  const requiredPower = parseInt(minPower.replace('W', ''), 10);
  
  expect(power).toBeGreaterThanOrEqual(requiredPower);
});

Then('Общая цена должна отображаться корректно', async function (this: PCBuilderWorld) {
  await expect(this.pcBuilderPage.totalPrice).toBeVisible();
  
  // Проверяем формат цены (число с валютой)
  const priceText = await this.pcBuilderPage.totalPrice.textContent();
  expect(priceText).toMatch(/[\d\s]+₽/);
});

Then('Должно отобразиться предупреждение о несовместимости', async function (this: PCBuilderWorld) {
  await this.pcBuilderPage.expectIncompatible();
});

Then('Кнопка {string} должна быть отключена', async function (this: PCBuilderWorld, buttonText: string) {
  let button;
  if (buttonText === 'Сохранить') {
    button = this.pcBuilderPage.saveConfigButton;
  } else {
    button = this.page.locator(`button:has-text("${buttonText}")`);
  }
  await expect(button).toBeDisabled();
});

Then('Конфигурация должна сохраниться в моём профиле', async function (this: PCBuilderWorld) {
  // Проверяем редирект на страницу профиля или успех сохранения
  await this.page.waitForURL('**/profile**', { timeout: 10000 }).catch(() => {
    // Если редиректа нет, проверяем наличие конфигурации в списке
  });
  
  await this.pcBuilderPage.expectConfigSaved('Игровой ПК 2024');
});

Then('Я должен видеть сообщение {string}', async function (this: PCBuilderWorld, message: string) {
  await this.pcBuilderPage.expectToastMessage(message);
});
