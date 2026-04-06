import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const reqs = [];
page.on('request', req => {
  const u = req.url();
  if (u.includes('catalog') && u.includes('manufacturer')) {
    const q = u.split('?')[1] || '';
    reqs.push(q);
  }
});

page.on('response', async resp => {
  const u = resp.url();
  if (u.includes('/catalog/products') && u.includes('manufacturer')) {
    try {
      const json = await resp.json();
      console.log('FILTERED_PRODUCTS:', json.meta?.totalItems ?? '?');
    } catch {}
  }
  if (u.includes('/catalog/manufacturers')) {
    try {
      const json = await resp.json();
      const arr = json.data || json;
      console.log('MFR_API_RETURNED:', Array.isArray(arr) ? arr.length : 0, 'manufacturers');
    } catch {}
  }
});

await page.goto('http://localhost:5173/pc-builder', { timeout: 30000 });
await page.waitForTimeout(2000);

// CPU slot open
const btn = page.locator('.component-slot__btn').first();
await btn.click();
await page.waitForTimeout(5000);

// Check dialog
const diaCount = await page.locator('[role="dialog"]').count();
console.log('DIALOGS_OPEN:', diaCount);

// Check manufacturer section
const mfrVisible = await page.getByText('Производители').isVisible().catch(() => false);
console.log('MFR_HEADER:', mfrVisible);

const noMfr = await page.getByText('Нет производителей').isVisible().catch(() => false);
console.log('NO_MFR_TEXT:', noMfr);

// Check if AMD/Intel are in the dialog
const amdVis = await page.getByText('AMD').evaluate(el => el.closest('[role="dialog"]') !== null ? 'in_dialog' : 'in_page').catch(() => 'not_found');
const intelVis = await page.getByText('Intel').evaluate(el => el.closest('[role="dialog"]') !== null ? 'in_dialog' : 'in_page').catch(() => 'not_found');
console.log('AMD_loc:', amdVis);
console.log('Intel_loc:', intelVis);

// Check "Найдено" count
const foundText = await page.locator('*').filter({ hasText: /Найдено:/ }).first().textContent().catch(() => 'NOT_FOUND');
console.log('FOUND:', foundText);

console.log('FILTER_REQUESTS:', reqs);

await browser.close();

// Second test: open modal, click AMD checkbox, check filtering
const browser2 = await chromium.launch({ headless: true });
const p2 = await browser2.newPage();

await p2.goto('http://localhost:5173/pc-builder', { timeout: 30000 });
await p2.waitForTimeout(2000);

// Open CPU modal
await p2.locator('.component-slot__btn').first().click();
await p2.waitForTimeout(4000);

// Find "Бренды" section and its checkboxes
// First check if brands section exists
const brandsText = await p2.getByText('Бренды').isVisible().catch(() => false);
console.log('BRANDS_VISIBLE:', brandsText);

// Try clicking the Бренды filter group to expand it  
await p2.getByText('Бренды').click().catch(async () => {
  // Try to find the filter group directly
  console.log('Бренды not visible, trying to expand filters...');
});

// Find all checkboxes inside the modal
const modalCheckboxes = await p2.locator('[role="dialog"] label input[type="checkbox"]').all();
console.log('Modal checkbox count:', modalCheckboxes.length);

// Get checkbox labels
for (let i = 0; i < Math.min(modalCheckboxes.length, 10); i++) {
  try {
    const label = await modalCheckboxes[i].evaluate(el => {
      const l = el.closest('label');
      return l ? l.textContent.trim() : 'no-label';
    });
    console.log('  CB', i, ':', label);
  } catch {}
}

await browser2.close();
