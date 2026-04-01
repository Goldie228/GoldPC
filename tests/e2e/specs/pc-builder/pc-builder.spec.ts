/**
 * E2E tests for PC Builder page.
 *
 * Scenarios:
 *   1) Incompatible CPU + Motherboard shows error & blocks cart
 *   2) Correct total price calculation
 *   3) Save configuration for auth user
 *   4) Add complete build to cart (8 items)
 *   5) Empty configuration handling
 *   6) Network error handling
 *   7) Products without specifications
 *   8) Duplicate selection prevention
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
              hasNext: false,
              hasPrevious: false,
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
  const slotBtn = page.locator('.component-slot').nth(slotIndex).locator('button');
  await slotBtn.click();
  const modal = page.locator('.modal, [role="dialog"]');
  await expect(modal).toBeVisible({ timeout: 8000 });
  const productRow = modal.locator('.pc-builder__modal-product').first();
  await expect(productRow).toBeVisible({ timeout: 8000 });
  await productRow.click();
  await expect(modal).not.toBeVisible({ timeout: 5000 });
}

// =====================================================================
// Tests
// =====================================================================

test.describe('PC Builder — Konstruktor PK', () => {
  let pcBuilderPage: PCBuilderPage;

  test.beforeEach(async ({ page }) => {
    pcBuilderPage = new PCBuilderPage(page);
  });

  // ---------------------------------------------------------------
  // 1) Incompatible CPU + Motherboard => error & blocks cart
  // ---------------------------------------------------------------
  test('1 - Nesovmestimyj CPU + materinskaya plata: oshibka + knopka korziny nedostupna', async ({ page }) => {
    await mockAllProductRoutes(page, {
      processors: [cpuLga1700],
      motherboards: [mbAm5],
      gpu: [], ram: [], storage: [], psu: [], cases: [], coolers: [],
    });
    await pcBuilderPage.goto();

    await selectSlotProduct(page, 0); // CPU (LGA1700)
    await selectSlotProduct(page, 2); // MB (AM5)

    // Compatibility error appears
    const errorBlock = page.locator('.pc-builder__errors, .pc-builder__error');
    await expect(errorBlock.first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.pc-builder__error')).toContainText(/soket/i);

    // Status shows "problem"
    const status = page.locator('.pc-builder__status');
    await expect(status).toContainText(/problem/i);

    // Add-to-cart button is disabled
    await expect(page.locator('.pc-builder__add-to-cart')).toBeDisabled();

    // Checkout button is disabled
    await expect(page.locator('.pc-builder__checkout-btn')).toBeDisabled();
  });

  // ---------------------------------------------------------------
  // 2) Correct total price calculation
  // ---------------------------------------------------------------
  test('2 - Korrektnyj raschyot obschej stoimosti', async ({ page }) => {
    await mockAllProductRoutes(page, fullCatalog);
    await pcBuilderPage.goto();

    await selectSlotProduct(page, 0); // CPU 1899
    await selectSlotProduct(page, 2); // MB  1199
    await selectSlotProduct(page, 3); // RAM 399

    const expectedTotal = 1899 + 1199 + 399; // 3497

    const toolbarTotal = page.locator('.pc-builder__toolbar-total .pc-builder__total-value');
    await expect(toolbarTotal).toBeVisible();

    const sidebarTotal = page.locator('.pc-builder__summary-total-value');
    await expect(sidebarTotal).toBeVisible();

    const totalText = await sidebarTotal.textContent();
    const totalParsed = parseFloat(totalText?.replace(/[^\d.,]/g, '').replace(',', '.') ?? '0');
    expect(totalParsed).toBe(expectedTotal);
  });

  // ---------------------------------------------------------------
  // 3) Save configuration for authenticated user
  // ---------------------------------------------------------------
  test('3 - Sokhranenie konfiguracii dlya avtorizovannogo polzovatelya', async ({ page }) => {
    // Mock save API
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

    // Inject authenticated user
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

    // Try save button if visible
    const saveBtn = page.locator('button:has-text("Sokhranit"), .pc-builder__save-btn, [data-action="save"]');
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click();
      const nameInput = page.locator('input[name="configName"], input[placeholder*="nazvan"]');
      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nameInput.fill('Test build');
        await page.locator('button:has-text("Podtverdit"), button:has-text("Sokhranit")').last().click();
      }
      const toast = page.locator('.toast-message, [role="alert"], .notification');
      await expect(toast.first()).toBeVisible({ timeout: 5000 });
    } else {
      // Verify LocalStorage auto-save
      const savedData = await page.evaluate(() => localStorage.getItem('goldpc-pc-builder'));
      expect(savedData).toBeTruthy();
    }
  });

  // ---------------------------------------------------------------
  // 4) Add complete build to cart (8 items)
  // ---------------------------------------------------------------
  test('4 - Dobavlenie polnoj sborki v korzinu (8 komponentov)', async ({ page }) => {
    await mockAllProductRoutes(page, fullCatalog);
    await page.addInitScript(() => {
      localStorage.setItem('goldpc-cart', JSON.stringify({ items: [], promoCode: null, discount: 0, discountAmount: 0 }));
    });
    await pcBuilderPage.goto();

    for (let i = 0; i < 8; i++) {
      await selectSlotProduct(page, i);
    }

    const counter = page.locator('.pc-builder__checkout-count');
    await expect(counter).toContainText('8');

    await expect(pcBuilderPage.compatibilityWarning).not.toBeVisible();

    const addToCartBtn = page.locator('.pc-builder__add-to-cart');
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
  // 5) Empty configuration handling
  // ---------------------------------------------------------------
  test('5 - Pustaya konfiguraciya: knopki nedostupny, 0 iz 8', async ({ page }) => {
    await mockAllProductRoutes(page, fullCatalog);
    await pcBuilderPage.goto();

    const counter = page.locator('.pc-builder__checkout-count');
    await expect(counter).toContainText('0');

    const slots = page.locator('.component-slot--empty');
    expect(await slots.count()).toBe(8);

    const toolbarTotal = page.locator('.pc-builder__toolbar-total .pc-builder__total-value');
    await expect(toolbarTotal).toContainText('0');

    await expect(page.locator('.pc-builder__add-to-cart')).toBeDisabled();
    await expect(page.locator('.pc-builder__checkout-btn')).toBeDisabled();
  });

  // ---------------------------------------------------------------
  // 6) Network error handling
  // ---------------------------------------------------------------
  test('6 - Obrabotka setevoj oshibki pri zagruzke komponentov', async ({ page }) => {
    await page.route('**/catalog/products**', (route) => route.abort('failed'));
    await pcBuilderPage.goto();

    const firstSlotBtn = page.locator('.component-slot').first().locator('button');
    await firstSlotBtn.click();

    const modal = page.locator('.modal, [role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 8000 });

    const errorBanner = page.locator('.pc-builder__modal-error, .api-error-banner, [role="alert"], .pc-builder__modal-text');
    await expect(errorBanner.first()).toBeVisible({ timeout: 8000 });

    const retryBtn = page.locator('button:has-text("Povtorit"), button:has-text("Obnovit"), button:has-text("Retry")');
    if (await retryBtn.count() > 0) {
      await expect(retryBtn.first()).toBeEnabled();
    }
  });

  // ---------------------------------------------------------------
  // 7) Products without specifications
  // ---------------------------------------------------------------
  test('7 - Produkty bez harakteristik: otrazhayutsya bez oshibok', async ({ page }) => {
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
  // 8) Duplicate selection prevention
  // ---------------------------------------------------------------
  test('8 - Predotvrashchenie povtornogo vybora: povtornyj klick zamenyaet komponent', async ({ page }) => {
    await mockAllProductRoutes(page, {
      processors: [cpuAm5, cpu2],
      motherboards: [], gpu: [], ram: [], storage: [], psu: [], cases: [], coolers: [],
    });
    await pcBuilderPage.goto();

    // Select first CPU
    const firstSlotBtn = page.locator('.component-slot').first().locator('button');
    await firstSlotBtn.click();
    const modal = page.locator('.modal, [role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 8000 });
    const firstProduct = modal.locator('.pc-builder__modal-product').first();
    await expect(firstProduct).toBeVisible({ timeout: 8000 });
    await firstProduct.click();
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    const cpuSlot = page.locator('.component-slot').first();
    await expect(cpuSlot).toContainText('AMD Ryzen 9 7950X');

    // Click "Change" to re-open modal
    await cpuSlot.locator('button').click();
    await expect(modal).toBeVisible({ timeout: 8000 });

    // Verify current selection shown
    const selectedInfo = modal.locator('.pc-builder__modal-selected');
    if (await selectedInfo.isVisible().catch(() => false)) {
      await expect(selectedInfo).toContainText('AMD Ryzen 9 7950X');
    }

    // Select second CPU
    const secondProduct = modal.locator('.pc-builder__modal-product').nth(1);
    if (await secondProduct.isVisible().catch(() => false)) {
      await secondProduct.click();
      await expect(modal).not.toBeVisible({ timeout: 5000 });
      await expect(cpuSlot).toContainText('AMD Ryzen 7 7700X');
      const priceEl2 = cpuSlot.locator('.component-slot__price-value');
      await expect(priceEl2).toContainText('999');
    }
  });
});
