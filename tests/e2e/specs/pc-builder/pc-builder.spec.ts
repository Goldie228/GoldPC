/**
 * E2E tests for PC Builder page.
 *
 * Актуальные BEM-селекторы:
 *   .component-slot, .component-slot--empty, .component-slot__btn
 *   .bsp__alerts--error, .bsp__alerts--warning, .bsp__alert-item
 *   .bsp__total-value, .bsp__btn--cart, .bsp__btn--checkout, .bsp__btn--save
 *   .bsp__progress, .modal[role="dialog"]
 */

import { test, expect, Page } from '@playwright/test';
import { PCBuilderPage } from '../../pages/PCBuilderPage';

// ---- Mock data helpers ----

async function mockAllProductRoutes(
  page: Page,
  catalog: Record<string, Record<string, unknown>[]>
) {
  for (const [category, products] of Object.entries(catalog)) {
    await page.route(
      (url) =>
        url.pathname.includes('/catalog/products') &&
        url.searchParams.get('category') === category,
      (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: products,
            meta: {
              page: 1,
              pageSize: 50,
              totalPages: 1,
              totalItems: products.length,
              hasNextPage: false,
              hasPrevPage: false,
            },
          }),
        })
    );
  }
}

// ---- Fixture products ----

const cpuAm5 = {
  id: 'cpu-1',
  name: 'AMD Ryzen 9 7950X',
  sku: 'RYZEN-7950X',
  category: 'cpu',
  price: 1899.0,
  stock: 10,
  isActive: true,
  specifications: { socket: 'AM5', cores: 16, threads: 32, baseClock: 4.5, tdp: 170, memoryType: 'DDR5' },
};

const mbAm5 = {
  id: 'mb-1',
  name: 'ASUS ROG Crosshair X670E Hero',
  sku: 'ROG-X670E',
  category: 'motherboard',
  price: 1199.0,
  stock: 5,
  isActive: true,
  specifications: { socket: 'AM5', memoryType: 'DDR5', formFactor: 'ATX' },
};

const cpuLga1700 = {
  id: 'cpu-2',
  name: 'Intel Core i9-13900K',
  sku: 'I9-13900K',
  category: 'cpu',
  price: 1699.0,
  stock: 8,
  isActive: true,
  specifications: { socket: 'LGA1700', cores: 24, threads: 32, baseClock: 3.0, tdp: 125, memoryType: 'DDR5' },
};

const gpuItem = {
  id: 'gpu-1',
  name: 'NVIDIA RTX 4090',
  sku: 'RTX4090',
  category: 'gpu',
  price: 4599.0,
  stock: 3,
  isActive: true,
  specifications: { memory: 24, memoryType: 'GDDR6X', tdp: 450 },
};

const ramDdr5 = {
  id: 'ram-1',
  name: 'G.Skill Trident Z5 DDR5-6000 32GB',
  sku: 'GSKILL-DDR5-32',
  category: 'ram',
  price: 399.0,
  stock: 12,
  isActive: true,
  specifications: { memoryType: 'DDR5', capacity: 32, speed: 6000 },
};

const storageNvme = {
  id: 'storage-1',
  name: 'Samsung 990 Pro 2TB NVMe',
  sku: '990PRO-2TB',
  category: 'storage',
  price: 549.0,
  stock: 20,
  isActive: true,
  specifications: { type: 'NVMe', capacity: 2000 },
};

const psuItem = {
  id: 'psu-1',
  name: 'Corsair RM1000x',
  sku: 'RM1000X',
  category: 'psu',
  price: 499.0,
  stock: 7,
  isActive: true,
  specifications: { wattage: 1000, efficiency: '80+ Gold' },
};

const caseItem = {
  id: 'case-1',
  name: 'NZXT H7 Flow',
  sku: 'H7-FLOW',
  category: 'case',
  price: 299.0,
  stock: 9,
  isActive: true,
  specifications: {},
};

const coolingItem = {
  id: 'cooling-1',
  name: 'NZXT Kraken X63 RGB',
  sku: 'KRAKEN-X63',
  category: 'cooling',
  price: 349.0,
  stock: 6,
  isActive: true,
  specifications: { supportedSockets: ['AM5', 'AM4', 'LGA1700'] },
};

const cpu2 = {
  ...cpuAm5,
  id: 'cpu-3',
  name: 'AMD Ryzen 7 7700X',
  price: 999.0,
  specifications: { socket: 'AM5', cores: 8, threads: 16, baseClock: 4.5, tdp: 105, memoryType: 'DDR5' },
};

const fullCatalog = {
  processors: [cpuAm5, cpuLga1700, cpu2],
  motherboards: [mbAm5],
  gpu: [gpuItem],
  ram: [ramDdr5],
  storage: [storageNvme],
  psu: [psuItem],
  cases: [caseItem],
  coolers: [coolingItem],
};

// ---- Utility: select a product in a builder slot via modal ----

async function selectSlotProduct(page: Page, slotIndex: number) {
  const slotBtn = page.locator('.component-slot').nth(slotIndex).locator('.component-slot__btn');
  await slotBtn.click();
  const modal = page.locator('.modal[role="dialog"]');
  await expect(modal).toBeVisible({ timeout: 8000 });
  // Кликаем по карточке товара — контейнер с border и bg-surface-card
  const productRow = modal.locator('[class*="bg-surface-card"][class*="rounded-lg"][class*="cursor-pointer"]').first();
  await expect(productRow).toBeVisible({ timeout: 8000 });
  await productRow.click();
  await expect(modal).not.toBeVisible({ timeout: 5000 });
}

// =====================================================================
// Тесты
// =====================================================================

test.describe('PC Builder — Конструктор ПК', () => {
  let pcBuilderPage: PCBuilderPage;

  test.beforeEach(async ({ page }) => {
    pcBuilderPage = new PCBuilderPage(page);
  });

  // ---------------------------------------------------------------
  // 1) Несовместимый CPU + материнская плата => ошибка + кнопка корзины недоступна
  // ---------------------------------------------------------------
  test('1 - Несовместимый CPU + материнская плата: ошибка + кнопка корзины недоступна', async ({ page }) => {
    await mockAllProductRoutes(page, {
      processors: [cpuLga1700],
      motherboards: [mbAm5],
      gpu: [], ram: [], storage: [], psu: [], cases: [], coolers: [],
    });
    await pcBuilderPage.goto();

    await selectSlotProduct(page, 0); // CPU (LGA1700)
    await selectSlotProduct(page, 2); // MB (AM5)

    // Появляется ошибка совместимости
    const errorBlock = page.locator('.bsp__alerts--error .bsp__alert-item');
    await expect(errorBlock.first()).toBeVisible({ timeout: 5000 });

    // Кнопка "В корзину" недоступна
    await expect(page.locator('.bsp__btn--cart')).toBeDisabled();

    // Кнопка "Оформить" недоступна
    await expect(page.locator('.bsp__btn--checkout')).toBeDisabled();
  });

  // ---------------------------------------------------------------
  // 2) Корректный расчёт общей стоимости
  // ---------------------------------------------------------------
  test('2 - Корректный расчёт общей стоимости', async ({ page }) => {
    await mockAllProductRoutes(page, fullCatalog);
    await pcBuilderPage.goto();

    await selectSlotProduct(page, 0); // CPU 1899
    await selectSlotProduct(page, 2); // MB  1199
    await selectSlotProduct(page, 3); // RAM 399

    const expectedTotal = 1899 + 1199 + 399; // 3497

    const sidebarTotal = page.locator('.bsp__total-value');
    await expect(sidebarTotal).toBeVisible();

    const totalText = await sidebarTotal.textContent();
    const totalParsed = parseFloat(totalText?.replace(/[^\d.,]/g, '').replace(',', '.') ?? '0');
    expect(totalParsed).toBe(expectedTotal);
  });

  // ---------------------------------------------------------------
  // 3) Сохранение конфигурации для авторизованного пользователя
  // ---------------------------------------------------------------
  test('3 - Сохранение конфигурации для авторизованного пользователя', async ({ page }) => {
    // Мок API сохранения
    await page.route('**/pcbuilder/configurations', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'cfg-123', name: 'Test build', components: [], createdAt: new Date().toISOString() }),
        });
      }
      return route.continue();
    });

    // Внедрение аутентифицированного пользователя
    await page.addInitScript(() => {
      localStorage.setItem('accessToken', 'mock-token');
      localStorage.setItem('auth-storage', JSON.stringify({
        state: { user: { id: 'u1', email: 'test@test.com', firstName: 'T', lastName: 'U', role: 'Client', isActive: true, createdAt: '2024-01-01' }, isAuthenticated: true },
        version: 0,
      }));
    });

    await mockAllProductRoutes(page, fullCatalog);
    await pcBuilderPage.goto();

    await selectSlotProduct(page, 0);
    await selectSlotProduct(page, 2);

    // Кнопка сохранения
    const saveBtn = page.locator('.bsp__btn--save');
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click();
      const nameInput = page.locator('input[name="configName"], input[placeholder*="название"]');
      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nameInput.fill('Test build');
        await page.locator('button:has-text("Подтвердить"), button:has-text("Сохранить")').last().click();
      }
      const toast = page.locator('[role="alert"], .toast');
      await expect(toast.first()).toBeVisible({ timeout: 5000 });
    } else {
      // Проверяем авто-сохранение в LocalStorage
      const savedData = await page.evaluate(() => localStorage.getItem('goldpc-pc-builder'));
      expect(savedData).toBeTruthy();
    }
  });

  // ---------------------------------------------------------------
  // 4) Добавление полной сборки в корзину (8 компонентов)
  // ---------------------------------------------------------------
  test('4 - Добавление полной сборки в корзину (8 компонентов)', async ({ page }) => {
    await mockAllProductRoutes(page, fullCatalog);
    await page.addInitScript(() => {
      localStorage.setItem('goldpc-cart', JSON.stringify({ items: [], promoCode: null, discount: 0, discountAmount: 0 }));
    });
    await pcBuilderPage.goto();

    for (let i = 0; i < 8; i++) {
      await selectSlotProduct(page, i);
    }

    const counter = page.locator('.bsp__progress');
    await expect(counter).toContainText('8');

    const addToCartBtn = page.locator('.bsp__btn--cart');
    await expect(addToCartBtn).toBeEnabled();
    await addToCartBtn.click();

    const cartData = await page.evaluate(() => {
      const raw = localStorage.getItem('goldpc-cart');
      return raw ? JSON.parse(raw) : null;
    });
    expect(cartData).toBeTruthy();
    expect(cartData.items.length).toBe(8);
  });

  // ---------------------------------------------------------------
  // 5) Пустая конфигурация: кнопки недоступны, 0 из 8
  // ---------------------------------------------------------------
  test('5 - Пустая конфигурация: кнопки недоступны, 0 из 8', async ({ page }) => {
    await mockAllProductRoutes(page, fullCatalog);
    await pcBuilderPage.goto();

    const counter = page.locator('.bsp__progress');
    await expect(counter).toContainText('0');

    const slots = page.locator('.component-slot--empty');
    expect(await slots.count()).toBe(8);

    const toolbarTotal = page.locator('.bsp__total-value');
    await expect(toolbarTotal).toContainText('0');

    await expect(page.locator('.bsp__btn--cart')).toBeDisabled();
    await expect(page.locator('.bsp__btn--checkout')).toBeDisabled();
  });

  // ---------------------------------------------------------------
  // 6) Обработка сетевой ошибки при загрузке компонентов
  // ---------------------------------------------------------------
  test('6 - Обработка сетевой ошибки при загрузке компонентов', async ({ page }) => {
    await page.route('**/catalog/products**', (route) => route.abort('failed'));
    await pcBuilderPage.goto();

    const firstSlotBtn = page.locator('.component-slot').first().locator('.component-slot__btn');
    await firstSlotBtn.click();

    const modal = page.locator('.modal[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 8000 });

    // Ошибка загрузки — ApiErrorBanner или текст ошибки
    const errorBanner = page.locator('[role="alert"], .api-error-banner, text=/не удалось|ошибк/i');
    await expect(errorBanner.first()).toBeVisible({ timeout: 8000 });
  });

  // ---------------------------------------------------------------
  // 7) Товары без спецификаций: отображаются без ошибок
  // ---------------------------------------------------------------
  test('7 - Товары без спецификаций: отображаются без ошибок', async ({ page }) => {
    const cpuNoSpecs = {
      id: 'cpu-nospec', name: 'Generic CPU Without Specs', sku: 'CPU-NOSPEC',
      category: 'cpu', price: 499.0, stock: 5, isActive: true,
    };
    const mbNoSpecs = {
      id: 'mb-nospec', name: 'Generic Motherboard Without Specs', sku: 'MB-NOSPEC',
      category: 'motherboard', price: 299.0, stock: 3, isActive: true,
    };

    await mockAllProductRoutes(page, {
      processors: [cpuNoSpecs],
      motherboards: [mbNoSpecs],
      gpu: [], ram: [], storage: [], psu: [], cases: [], coolers: [],
    });
    await pcBuilderPage.goto();

    await selectSlotProduct(page, 0);

    const cpuSlot = page.locator('.component-slot').first();
    await expect(cpuSlot).toContainText('Generic CPU Without Specs');

    const priceEl = cpuSlot.locator('.component-slot__price-value');
    await expect(priceEl).toContainText('499');
  });

  // ---------------------------------------------------------------
  // 8) Предотвращение повторного выбора: повторный клик заменяет компонент
  // ---------------------------------------------------------------
  test('8 - Предотвращение повторного выбора: повторный клик заменяет компонент', async ({ page }) => {
    await mockAllProductRoutes(page, {
      processors: [cpuAm5, cpu2],
      motherboards: [], gpu: [], ram: [], storage: [], psu: [], cases: [], coolers: [],
    });
    await pcBuilderPage.goto();

    // Выбираем первый CPU
    const firstSlotBtn = page.locator('.component-slot').first().locator('.component-slot__btn');
    await firstSlotBtn.click();
    const modal = page.locator('.modal[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 8000 });
    const firstProduct = modal.locator('[class*="bg-surface-card"][class*="rounded-lg"][class*="cursor-pointer"]').first();
    await expect(firstProduct).toBeVisible({ timeout: 8000 });
    await firstProduct.click();
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    const cpuSlot = page.locator('.component-slot').first();
    await expect(cpuSlot).toContainText('AMD Ryzen 9 7950X');

    // Кликаем "Изменить" чтобы открыть модалку снова
    await cpuSlot.locator('.component-slot__btn').click();
    await expect(modal).toBeVisible({ timeout: 8000 });

    // Выбираем второй CPU
    const secondProduct = modal.locator('[class*="bg-surface-card"][class*="rounded-lg"][class*="cursor-pointer"]').nth(1);
    if (await secondProduct.isVisible().catch(() => false)) {
      await secondProduct.click();
      await expect(modal).not.toBeVisible({ timeout: 5000 });
      await expect(cpuSlot).toContainText('AMD Ryzen 7 7700X');
      const priceEl2 = cpuSlot.locator('.component-slot__price-value');
      await expect(priceEl2).toContainText('999');
    }
  });

  // ---------------------------------------------------------------
  // 9) EPS power connector mismatch — Ошибка
  // ---------------------------------------------------------------
  test('9 - EPS power connector mismatch: ошибка', async ({ page }) => {
    const cpuWithEps = {
      id: 'cpu-eps', name: 'Intel Core i9-14900K', sku: 'I9-14900K',
      category: 'cpu', price: 1899, stock: 5, isActive: true,
      specifications: { socket: 'LGA1700', cores: 24, threads: 32, tdp: 125, memoryType: 'DDR5' },
    };
    const mbWithEps = {
      id: 'mb-eps', name: 'MSI Z790 ACE', sku: 'Z790-ACE',
      category: 'motherboard', price: 1199, stock: 5, isActive: true,
      specifications: { socket: 'LGA1700', memoryType: 'DDR5', formFactor: 'ATX', cpuPowerConnectors: '8+4' },
    };
    const psuOneEps = {
      id: 'psu-eps', name: 'Corsair RM750x', sku: 'RM750x',
      category: 'psu', price: 499, stock: 7, isActive: true,
      specifications: { wattage: 750, epsCables: 1, pcieCables: 2 },
    };

    await mockAllProductRoutes(page, {
      processors: [cpuWithEps],
      motherboards: [mbWithEps],
      psu: [psuOneEps],
      gpu: [], ram: [], storage: [], cases: [], coolers: [],
    });

    await pcBuilderPage.goto();
    await selectSlotProduct(page, 0); // CPU (LGA1700)
    await selectSlotProduct(page, 1); // MB (8+4 CPU power)
    await selectSlotProduct(page, 6); // PSU (1 EPS cable)

    const errors = page.locator('.bsp__alerts--error .bsp__alert-item');
    await expect(errors.first()).toBeVisible({ timeout: 5000 });
    await expect(errors).toContainText(/EPS|CPU.*пита|8-pin|power/i);
  });

  // ---------------------------------------------------------------
  // 10) M.2 SATA SSD в NVMe слоте — Ошибка
  // ---------------------------------------------------------------
  test('10 - M.2 SATA SSD в NVMe слоте: ошибка', async ({ page }) => {
    const cpuAm5NoSata = {
      id: 'cpu-m2', name: 'AMD Ryzen 9 7950X', sku: 'RYZEN-7950X',
      category: 'cpu', price: 1899, stock: 10, isActive: true,
      specifications: { socket: 'AM5', cores: 16, threads: 32, tdp: 170, memoryType: 'DDR5' },
    };
    const mbNoSataM2 = {
      id: 'mb-nosata', name: 'ASUS ROG Crosshair X670E Hero', sku: 'ROG-X670E',
      category: 'motherboard', price: 1199, stock: 5, isActive: true,
      specifications: { socket: 'AM5', memoryType: 'DDR5', formFactor: 'ATX', m2SataSupport: false },
    };
    const storageSataM2 = {
      id: 'storage-sata', name: 'Samsung 870 Evo M.2 SATA', sku: '870EVO-M2',
      category: 'storage', price: 249, stock: 10, isActive: true,
      specifications: { type: 'SATA', interface: 'M.2', capacity: 500 },
    };

    await mockAllProductRoutes(page, {
      processors: [cpuAm5NoSata],
      motherboards: [mbNoSataM2],
      storage: [storageSataM2],
      gpu: [], ram: [], psu: [], cases: [], coolers: [],
    });

    await pcBuilderPage.goto();
    await selectSlotProduct(page, 0); // CPU (AM5)
    await selectSlotProduct(page, 1); // MB (no M.2 SATA support)
    await selectSlotProduct(page, 3); // Storage (M.2 SATA)

    const errors = page.locator('.bsp__alerts--error .bsp__alert-item');
    await expect(errors.first()).toBeVisible({ timeout: 5000 });
    await expect(errors).toContainText(/M\.2|SATA.*NVMe|NVMe.*SATA|несовмест/i);
  });

  // ---------------------------------------------------------------
  // 11) CPU без встроенного видео + нет видеокарты — Ошибка
  // ---------------------------------------------------------------
  test('11 - CPU без встроенного видео + нет видеокарты: ошибка', async ({ page }) => {
    const cpuNoIgpu = {
      id: 'cpu-noigpu', name: 'AMD Ryzen 7 7700X', sku: 'RYZEN-7700X',
      category: 'cpu', price: 1299, stock: 8, isActive: true,
      specifications: { socket: 'AM5', cores: 8, threads: 16, tdp: 105, memoryType: 'DDR5', integratedGraphics: false },
    };

    await mockAllProductRoutes(page, {
      processors: [cpuNoIgpu],
      gpu: [], motherboards: [], ram: [], storage: [], psu: [], cases: [], coolers: [],
    });

    await pcBuilderPage.goto();
    await selectSlotProduct(page, 0); // CPU (no iGPU)
    // Нет выбранной видеокарты — ожидаем ошибку

    const errors = page.locator('.bsp__alerts--error .bsp__alert-item');
    await expect(errors.first()).toBeVisible({ timeout: 5000 });
    await expect(errors).toContainText(/видеокарт|GPU|без.*видео|нет.*видеокарт/i);
  });

  // ---------------------------------------------------------------
  // 12) USB-C передней панели без разъёма на MB — Предупреждение
  // ---------------------------------------------------------------
  test('12 - USB-C передней панели без разъёма на MB: предупреждение', async ({ page }) => {
    const cpuUsbC = {
      id: 'cpu-usbc', name: 'AMD Ryzen 9 7950X', sku: 'RYZEN-7950X',
      category: 'cpu', price: 1899, stock: 10, isActive: true,
      specifications: { socket: 'AM5', cores: 16, threads: 32, tdp: 170, memoryType: 'DDR5' },
    };
    const mbNoUsbC = {
      id: 'mb-nousbc', name: 'ASUS Prime B650M-A', sku: 'PRIME-B650M',
      category: 'motherboard', price: 599, stock: 8, isActive: true,
      specifications: { socket: 'AM5', memoryType: 'DDR5', formFactor: 'mATX', usbCHeader: false },
    };
    const caseWithUsbC = {
      id: 'case-usbc', name: 'NZXT H7 Flow USB-C', sku: 'H7-FLOW-USBC',
      category: 'case', price: 349, stock: 6, isActive: true,
      specifications: { hasUsbc: true, formFactor: 'ATX' },
    };

    await mockAllProductRoutes(page, {
      processors: [cpuUsbC],
      motherboards: [mbNoUsbC],
      cases: [caseWithUsbC],
      gpu: [], ram: [], storage: [], psu: [], coolers: [],
    });

    await pcBuilderPage.goto();
    await selectSlotProduct(page, 0); // CPU
    await selectSlotProduct(page, 1); // MB (no USB-C header)
    await selectSlotProduct(page, 7); // Case (has USB-C front panel)

    const warnings = page.locator('.bsp__alerts--warning .bsp__alert-item');
    await expect(warnings.first()).toBeVisible({ timeout: 5000 });
    await expect(warnings).toContainText(/USB-C|USB.*панел|передн.*usb/i);
  });

  // ---------------------------------------------------------------
  // 13) Noname PSU бренд: предупреждение
  // ---------------------------------------------------------------
  test('13 - Noname PSU бренд: предупреждение', async ({ page }) => {
    const cpuPsuWarning = {
      id: 'cpu-psuwarn', name: 'AMD Ryzen 5 7600', sku: 'RYZEN-7600',
      category: 'cpu', price: 799, stock: 10, isActive: true,
      specifications: { socket: 'AM5', cores: 6, threads: 12, tdp: 65, memoryType: 'DDR5' },
    };
    const mbPsuWarning = {
      id: 'mb-psuwarn', name: 'Gigabyte B650 GAMING X AX', sku: 'B650-GAMING',
      category: 'motherboard', price: 699, stock: 5, isActive: true,
      specifications: { socket: 'AM5', memoryType: 'DDR5', formFactor: 'ATX' },
    };
    const psuNoname = {
      id: 'psu-noname', name: 'Noname Power 750W', sku: 'NONAME-750',
      category: 'psu', price: 149, stock: 10, isActive: true,
      specifications: { wattage: 750, brand: 'Noname Power', efficiency: '80+ White' },
    };

    await mockAllProductRoutes(page, {
      processors: [cpuPsuWarning],
      motherboards: [mbPsuWarning],
      psu: [psuNoname],
      gpu: [], ram: [], storage: [], cases: [], coolers: [],
    });

    await pcBuilderPage.goto();
    await selectSlotProduct(page, 0); // CPU
    await selectSlotProduct(page, 1); // MB
    await selectSlotProduct(page, 6); // PSU (Noname brand)

    const warnings = page.locator('.bsp__alerts--warning .bsp__alert-item');
    await expect(warnings.first()).toBeVisible({ timeout: 5000 });
    await expect(warnings).toContainText(/бренд|Noname|неизвестн.*производ|brand/i);
  });
});
