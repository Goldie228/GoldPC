import { Given, When, Then, Before, After, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium, Browser, Page, BrowserContext } from '@playwright/test';
import { expect } from '@playwright/test';

// Устанавливаем таймаут для шагов (в миллисекундах)
setDefaultTimeout(60000);

// Интерфейс для хранения данных между шагами
interface PCBuilderWorld {
  page: Page;
  browser: Browser;
  context: BrowserContext;
}

// Инициализация браузера перед каждым сценарием
Before(async function (this: PCBuilderWorld) {
  this.browser = await chromium.launch({ headless: true });
  this.context = await this.browser.newContext();
  this.page = await this.context.newPage();
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
  await this.page.goto('/pc-builder');
  // Ожидание загрузки страницы конструктора
  await this.page.waitForSelector('.pc-builder-container', { timeout: 10000 });
});

Given('Я авторизован как {string}', async function (this: PCBuilderWorld, email: string) {
  // Переход на страницу логина
  await this.page.goto('/login');
  
  // Заполнение формы авторизации
  await this.page.locator('#email').fill(email);
  await this.page.locator('#password').fill('testpassword123');
  await this.page.locator('button[type="submit"]').click();
  
  // Ожидание успешной авторизации
  await this.page.waitForURL('**/profile', { timeout: 10000 });
});

Given('Я создал совместимую конфигурацию', async function (this: PCBuilderWorld) {
  // Переход на страницу конструктора
  await this.page.goto('/pc-builder');
  await this.page.waitForSelector('.pc-builder-container', { timeout: 10000 });
  
  // Выбор совместимых компонентов
  await selectComponent(this.page, 'cpu', 'AMD Ryzen 9 7950X');
  await selectComponent(this.page, 'motherboard', 'ASUS ROG Crosshair X670E');
  await selectComponent(this.page, 'ram', 'DDR5-6000 32GB');
  await selectComponent(this.page, 'gpu', 'RTX 4090');
  await selectComponent(this.page, 'psu', '850W');
});

// ========================================
// WHEN шаги
// ========================================

When('Я выбираю процессор {string}', async function (this: PCBuilderWorld, productName: string) {
  await selectComponent(this.page, 'cpu', productName);
});

When('Я выбираю процессор {string} с сокетом {string}', async function (this: PCBuilderWorld, productName: string, socket: string) {
  await selectComponent(this.page, 'cpu', productName);
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
  await selectComponent(this.page, 'ram', productName);
});

When('Я выбираю видеокарту {string}', async function (this: PCBuilderWorld, productName: string) {
  await selectComponent(this.page, 'gpu', productName);
});

When('Я выбираю блок питания {string}', async function (this: PCBuilderWorld, power: string) {
  await selectComponent(this.page, 'psu', power);
});

When('Я нажимаю {string}', async function (this: PCBuilderWorld, buttonText: string) {
  await this.page.click(`button:has-text("${buttonText}")`);
  await this.page.waitForTimeout(500);
});

When('Я ввожу название {string}', async function (this: PCBuilderWorld, name: string) {
  const nameInput = this.page.locator('input[name="configName"]');
  await nameInput.fill(name);
});

// ========================================
// THEN шаги
// ========================================

Then('Конфигурация должна быть совместимой', async function (this: PCBuilderWorld) {
  const compatibilityStatus = this.page.locator('.compatibility-status');
  await expect(compatibilityStatus).toContainText('Совместимо', { timeout: 5000 });
  
  // Проверяем отсутствие ошибок совместимости
  const errors = this.page.locator('.compatibility-error');
  const errorCount = await errors.count();
  expect(errorCount).toBe(0);
});

Then('Рекомендуемая мощность блока питания должна быть не менее {string}', async function (this: PCBuilderWorld, minPower: string) {
  const recommendedPower = this.page.locator('.recommended-psu-power');
  const powerText = await recommendedPower.textContent();
  
  // Извлекаем числовое значение мощности
  const powerMatch = powerText?.match(/(\d+)/);
  const power = powerMatch ? parseInt(powerMatch[1], 10) : 0;
  const requiredPower = parseInt(minPower.replace('W', ''), 10);
  
  expect(power).toBeGreaterThanOrEqual(requiredPower);
});

Then('Общая цена должна отображаться корректно', async function (this: PCBuilderWorld) {
  const totalPrice = this.page.locator('.total-price');
  await expect(totalPrice).toBeVisible();
  
  // Проверяем формат цены (число с валютой)
  const priceText = await totalPrice.textContent();
  expect(priceText).toMatch(/[\d\s]+₽/);
});

Then('Должно отобразиться предупреждение о несовместимости', async function (this: PCBuilderWorld) {
  const warning = this.page.locator('.compatibility-warning, .incompatibility-alert');
  await expect(warning).toBeVisible({ timeout: 5000 });
  
  // Проверяем текст предупреждения
  const warningText = await warning.textContent();
  expect(warningText?.toLowerCase()).toContain('несовместим');
});

Then('Кнопка {string} должна быть отключена', async function (this: PCBuilderWorld, buttonText: string) {
  const button = this.page.locator(`button:has-text("${buttonText}")`);
  await expect(button).toBeDisabled();
});

Then('Конфигурация должна сохраниться в моём профиле', async function (this: PCBuilderWorld) {
  // Проверяем редирект на страницу профиля или успех сохранения
  await this.page.waitForURL('**/profile**', { timeout: 10000 }).catch(() => {
    // Если редиректа нет, проверяем наличие конфигурации в списке
  });
  
  // Проверяем наличие сохранённой конфигурации
  const savedConfig = this.page.locator('.saved-configuration:has-text("Игровой ПК 2024")');
  await expect(savedConfig).toBeVisible({ timeout: 5000 });
});

Then('Я должен видеть сообщение {string}', async function (this: PCBuilderWorld, message: string) {
  const toast = this.page.locator('.toast-message, .notification, [role="alert"]');
  await expect(toast).toContainText(message, { timeout: 5000 });
});

// ========================================
// Вспомогательные функции
// ========================================

/**
 * Выбор компонента по категории и названию
 */
async function selectComponent(page: Page, category: string, productName: string): Promise<void> {
  // Открываем категорию компонентов
  await page.click(`[data-category="${category}"]`);
  
  // Ожидаем загрузки списка
  await page.waitForSelector('.component-list', { timeout: 5000 });
  
  // Ищем и выбираем нужный компонент
  const componentSelector = `.component-item:has-text("${productName}")`;
  await page.waitForSelector(componentSelector, { timeout: 5000 });
  await page.click(`${componentSelector} >> button:has-text("Выбрать")`);
  
  // Ожидаем обновления конфигурации
  await page.waitForTimeout(300);
}