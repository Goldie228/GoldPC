import { test, expect, Page } from '@playwright/test';
import { PCBuilderPage } from '../../pages/PCBuilderPage';

const cpu_am4 = {
  id: 'cpu-1', name: 'AMD Ryzen 5 3600', sku: 'R5-3600',
  category: 'cpu', price: 200, stock: 10, isActive: true,
  specifications: { socket: 'AM4', cores: 6, threads: 12, tdp: 65 },
};
const cpu_am5 = {
  id: 'cpu-2', name: 'AMD Ryzen 5 7600X', sku: 'R5-7600X',
  category: 'cpu', price: 300, stock: 10, isActive: true,
  specifications: { socket: 'AM5', cores: 6, threads: 12, tdp: 105 },
};
const cpu_intel = {
  id: 'cpu-3', name: 'Intel Core i5-13600K', sku: 'i5-13600K',
  category: 'cpu', price: 280, stock: 10, isActive: true,
  specifications: { socket: 'LGA1700', cores: 14, threads: 20, tdp: 125 },
};
const mb_am4 = {
  id: 'mb-1', name: 'MSI B550-A PRO', sku: 'B550APRO',
  category: 'motherboard', price: 150, stock: 10, isActive: true,
  specifications: { socket: 'AM4', chipset: 'B550', formFactor: 'ATX', memoryType: 'DDR4' },
};
const mb_am5 = {
  id: 'mb-2', name: 'ASUS B650-PLUS', sku: 'B650PLUS',
  category: 'motherboard', price: 200, stock: 10, isActive: true,
  specifications: { socket: 'AM5', chipset: 'B650', formFactor: 'ATX', memoryType: 'DDR5' },
};
const mb_intel = {
  id: 'mb-3', name: 'ASUS Z790-P', sku: 'Z790P',
  category: 'motherboard', price: 220, stock: 10, isActive: true,
  specifications: { socket: 'LGA1700', chipset: 'Z790', formFactor: 'ATX', memoryType: 'DDR5' },
};
const ram_ddr4 = {
  id: 'ram-1', name: 'G.Skill 16GB DDR4-3200', sku: 'GS-16D4',
  category: 'ram', price: 60, stock: 10, isActive: true,
  specifications: { memoryType: 'DDR4', capacity: 16, speed: 3200 },
};
const ram_ddr5 = {
  id: 'ram-2', name: 'Corsair 16GB DDR5-5600', sku: 'COR-16D5',
  category: 'ram', price: 80, stock: 10, isActive: true,
  specifications: { memoryType: 'DDR5', capacity: 16, speed: 5600 },
};
const ram_ddr3 = {
  id: 'ram-3', name: 'Kingston 8GB DDR3-1600', sku: 'KNG-8D3',
  category: 'ram', price: 30, stock: 10, isActive: true,
  specifications: { memoryType: 'DDR3', capacity: 8, speed: 1600 },
};
const gpu_high = {
  id: 'gpu-1', name: 'RTX 4070 Ti', sku: '4070TI',
  category: 'gpu', price: 800, stock: 5, isActive: true,
  specifications: { memory: 12, memoryType: 'GDDR6X', tdp: 285 },
};
const psu_high = {
  id: 'psu-1', name: 'Corsair RM850x', sku: 'RM850X',
  category: 'psu', price: 150, stock: 10, isActive: true,
  specifications: { wattage: 850, efficiency: '80+ Gold' },
};
const psu_low = {
  id: 'psu-2', name: 'Generic 300W PSU', sku: '300W',
  category: 'psu', price: 40, stock: 10, isActive: true,
  specifications: { wattage: 300 },
};
const cooling_item = {
  id: 'cooling-1', name: 'Deepcool AK400', sku: 'AK400',
  category: 'cooling', price: 35, stock: 10, isActive: true,
  specifications: { supportedSockets: ['AM4', 'AM5', 'LGA1700'] },
};
const storage_item = {
  id: 'storage-1', name: 'Samsung 970 EVO 1TB', sku: '970EVO',
  category: 'storage', price: 100, stock: 10, isActive: true,
  specifications: { type: 'NVMe', capacity: 1000 },
};

async function mockProducts(page: Page, catalog: Record<string, Record<string, unknown>[]>) {
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
            meta: { page: 1, pageSize: 50, totalPages: 1, totalItems: products.length, hasNext: false, hasPrevious: false },
          }),
        }),
    );
  }
}

test.describe('Contextual filters - PC Builder', () => {
  let pom: PCBuilderPage;

  test.beforeEach(({ page }) => {
    pom = new PCBuilderPage(page);
  });

  test('CPU AM4 hides Intel motherboards in picker', async ({ page }) => {
    await mockProducts(page, {
      processors: [cpu_am4, cpu_am5, cpu_intel],
      motherboards: [mb_am4, mb_am5, mb_intel],
      ram: [], storage: [], psu: [], gpu: [], cases: [], coolers: [],
    });
    await pom.goto();
    await pom.openSlotPicker('Процессор');
    await pom.selectModalProduct(0);
    await pom.openSlotPicker('Материнская плата');
    const names = await pom.getModalProductNames();
    expect(names).toContain('MSI B550-A PRO');
    expect(names).not.toContain('ASUS Z790-P');
  });

  test('CPU AM5 hides DDR3 and DDR4 in RAM picker', async ({ page }) => {
    await mockProducts(page, {
      processors: [cpu_am5, cpu_am4],
      motherboards: [],
      ram: [ram_ddr3, ram_ddr4, ram_ddr5],
      psu: [], gpu: [], cases: [], coolers: [], storage: [],
    });
    await pom.goto();
    await pom.openSlotPicker('Процессор');
    await pom.selectModalProduct(0);
    await pom.openSlotPicker('Оперативная память');
    const names = await pom.getModalProductNames();
    expect(names).toContain('Corsair 16GB DDR5-5600');
    expect(names).not.toContain('Kingston 8GB DDR3-1600');
    expect(names).not.toContain('G.Skill 16GB DDR4-3200');
  });

  test('MB DDR4 hides DDR3 in RAM picker', async ({ page }) => {
    await mockProducts(page, {
      processors: [cpu_am4],
      motherboards: [mb_am4],
      ram: [ram_ddr3, ram_ddr4],
      psu: [], gpu: [], cases: [], coolers: [], storage: [],
    });
    await pom.goto();
    await pom.openSlotPicker('Процессор');
    await pom.selectModalProduct(0);
    await pom.openSlotPicker('Материнская плата');
    await pom.selectModalProduct(0);
    await pom.openSlotPicker('Оперативная память');
    const names = await pom.getModalProductNames();
    expect(names).toContain('G.Skill 16GB DDR4-3200');
    expect(names).not.toContain('Kingston 8GB DDR3-1600');
  });

  test('RAM DDR4 hides AM5-only CPUs in CPU picker', async ({ page }) => {
    await mockProducts(page, {
      processors: [cpu_am4, cpu_am5, cpu_intel],
      motherboards: [],
      ram: [ram_ddr4, ram_ddr5],
      psu: [], gpu: [], cases: [], coolers: [], storage: [],
    });
    await pom.goto();
    await pom.openSlotPicker('Оперативная память');
    await pom.selectModalProduct(0);
    await pom.openSlotPicker('Процессор');
    const names = await pom.getModalProductNames();
    expect(names).toContain('AMD Ryzen 5 3600');
    expect(names).not.toContain('AMD Ryzen 5 7600X');
  });

  test('High TDP build hides low wattage PSU', async ({ page }) => {
    await mockProducts(page, {
      processors: [cpu_am4],
      motherboards: [mb_am4],
      ram: [ram_ddr4],
      psu: [psu_high, psu_low],
      gpu: [gpu_high],
      cases: [], coolers: [], storage: [],
    });
    await pom.goto();
    await pom.openSlotPicker('Процессор');
    await pom.selectModalProduct(0);
    await pom.openSlotPicker('Материнская плата');
    await pom.selectModalProduct(0);
    await pom.openSlotPicker('Оперативная память');
    await pom.selectModalProduct(0);
    await pom.openSlotPicker('Видеокарта');
    await pom.selectModalProduct(0);
    await pom.openSlotPicker('Блок питания');
    const names = await pom.getModalProductNames();
    expect(names).toContain('Corsair RM850x');
    expect(names).not.toContain('Generic 300W PSU');
  });

  test('Incompatible Intel MB hidden after AM4 CPU, hint shown', async ({ page }) => {
    await mockProducts(page, {
      processors: [cpu_am4],
      motherboards: [mb_am4, mb_intel],
      ram: [], storage: [], psu: [], gpu: [], cases: [], coolers: [],
    });
    await pom.goto();
    await pom.openSlotPicker('Процессор');
    await pom.selectModalProduct(0);
    await pom.openSlotPicker('Материнская плата');
    const names = await pom.getModalProductNames();
    expect(names.some((n) => n && n.includes('Z790'))).toBe(false);
    const hint = page.locator('[class*="compatibleHint"]');
    await expect(hint).toBeVisible();
    await expect(hint).toContainText(/несовместим/i);
  });

  test('CPU-first entry preserves compatibility through chain', async ({ page }) => {
    await mockProducts(page, {
      processors: [cpu_am4, cpu_am5, cpu_intel],
      motherboards: [mb_am4, mb_am5, mb_intel],
      ram: [ram_ddr3, ram_ddr4, ram_ddr5],
      psu: [], gpu: [], cases: [], coolers: [], storage: [],
    });
    await pom.goto();
    await pom.openSlotPicker('Процессор');
    await pom.selectModalProduct(0);
    await pom.openSlotPicker('Материнская плата');
    let names = await pom.getModalProductNames();
    expect(names).toContain('MSI B550-A PRO');
    expect(names).not.toContain('ASUS Z790-P');
    expect(names).not.toContain('ASUS B650-PLUS');
    await pom.selectModalProduct(0);
    await pom.openSlotPicker('Оперативная память');
    names = await pom.getModalProductNames();
    expect(names).toContain('G.Skill 16GB DDR4-3200');
    expect(names).not.toContain('Kingston 8GB DDR3-1600');
    expect(names).not.toContain('Corsair 16GB DDR5-5600');
  });

  test('MB-first entry preserves compatibility through chain', async ({ page }) => {
    await mockProducts(page, {
      processors: [cpu_am4, cpu_am5, cpu_intel],
      motherboards: [mb_am4, mb_am5, mb_intel],
      ram: [ram_ddr3, ram_ddr4, ram_ddr5],
      psu: [], gpu: [], cases: [], coolers: [], storage: [],
    });
    await pom.goto();
    await pom.openSlotPicker('Материнская плата');
    await pom.selectModalProduct(0);
    await pom.openSlotPicker('Процессор');
    let names = await pom.getModalProductNames();
    expect(names).toContain('AMD Ryzen 5 3600');
    expect(names).not.toContain('AMD Ryzen 5 7600X');
    expect(names).not.toContain('Intel Core i5-13600K');
    await pom.selectModalProduct(0);
    await pom.openSlotPicker('Оперативная память');
    names = await pom.getModalProductNames();
    expect(names).toContain('G.Skill 16GB DDR4-3200');
    expect(names).not.toContain('Kingston 8GB DDR3-1600');
  });

  test('RAM-first entry filters CPU and MB correctly', async ({ page }) => {
    await mockProducts(page, {
      processors: [cpu_am4, cpu_am5, cpu_intel],
      motherboards: [mb_am4, mb_am5, mb_intel],
      ram: [ram_ddr4, ram_ddr5],
      psu: [], gpu: [], cases: [], coolers: [], storage: [],
    });
    await pom.goto();
    await pom.openSlotPicker('Оперативная память');
    await pom.selectModalProduct(0);
    await pom.openSlotPicker('Процессор');
    let names = await pom.getModalProductNames();
    expect(names).not.toContain('AMD Ryzen 5 7600X');
    expect(names).toContain('AMD Ryzen 5 3600');
    expect(names).toContain('Intel Core i5-13600K');
    await pom.selectModalProduct(0);
    await pom.openSlotPicker('Материнская плата');
    names = await pom.getModalProductNames();
    expect(names).toContain('MSI B550-A PRO');
    expect(names).not.toContain('ASUS Z790-P');
    expect(names).not.toContain('ASUS B650-PLUS');
  });

  test('AM5 CPU shows only DDR5 in RAM picker', async ({ page }) => {
    await mockProducts(page, {
      processors: [cpu_am5],
      motherboards: [],
      ram: [ram_ddr3, ram_ddr4, ram_ddr5],
      psu: [], gpu: [], cases: [], coolers: [], storage: [],
    });
    await pom.goto();
    await pom.openSlotPicker('Процессор');
    await pom.selectModalProduct(0);
    await pom.openSlotPicker('Оперативная память');
    const names = await pom.getModalProductNames();
    expect(names).toContain('Corsair 16GB DDR5-5600');
    expect(names).not.toContain('Kingston 8GB DDR3-1600');
    expect(names).not.toContain('G.Skill 16GB DDR4-3200');
  });

  test('All incompatible shows no compatible products message', async ({ page }) => {
    await mockProducts(page, {
      processors: [cpu_am4],
      motherboards: [],
      ram: [ram_ddr5],
      psu: [], gpu: [], cases: [], coolers: [], storage: [],
    });
    await pom.goto();
    await pom.openSlotPicker('Процессор');
    await pom.selectModalProduct(0);
    await pom.openSlotPicker('Оперативная память');
    const names = await pom.getModalProductNames();
    expect(names.length).toBe(0);
    const emptyState = page.locator('[class*="emptyState"]');
    await expect(emptyState).toBeVisible();
  });

  test('Modal results count updates after component selection', async ({ page }) => {
    await mockProducts(page, {
      processors: [cpu_am4, cpu_am5, cpu_intel],
      motherboards: [mb_am4, mb_am5, mb_intel],
      ram: [], storage: [], psu: [], gpu: [], cases: [], coolers: [],
    });
    await pom.goto();
    await pom.openSlotPicker('Материнская плата');
    let results = await pom.getModalResultsCount();
    expect(results).toMatch(/Найдено: 3/);
    await pom.closeModal();
    await pom.openSlotPicker('Процессор');
    await pom.selectModalProduct(0);
    await pom.openSlotPicker('Материнская плата');
    results = await pom.getModalResultsCount();
    expect(results).toMatch(/Найдено: 1/);
  });
});
