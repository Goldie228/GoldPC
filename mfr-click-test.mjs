import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const requests = [];
page.on('request', req => {
  const u = req.url();
  if (u.includes('/catalog/products') && u.includes('manufacturer')) {
    const q = u.split('?')[1] || '';
    requests.push(q);
    console.log('  --> PRODUCT FILTER REQUEST:', q);
  }
});

page.on('response', async resp => {
  const u = resp.url();
  if (u.includes('/catalog/products') && resp.status() === 200 && u.includes('manufacturer')) {
    try {
      const json = await resp.json();
      console.log('  --> TotalItems:', json.meta?.totalItems, 'Products:', json.data?.length);
    } catch {}
  }
});

await page.goto('http://localhost:5173/pc-builder', { timeout: 30000 });
await page.waitForTimeout(2000);

// Open CPU modal
await page.locator('.component-slot__btn').first().click();
await page.waitForTimeout(3000);

// Get initial product count (before filtering)
const initialText = await page.getByText(/Найдено: \d+/).textContent().catch(() => 'N/A');
console.log('INITIAL count text:', initialText);

// Find and click the AMD checkbox in the Бренды group
// The manufacturer checkboxes are after ALL the spec filter checkboxes
// Look for AMD text specifically
const amdLabel = await page.locator('label:has-text("AMD")').last();
const amdText = await amdLabel.textContent().catch(() => null);
console.log('AMD label text:', amdText);

// Click AMD
await amdLabel.click();
await page.waitForTimeout(3000);

// Check filtered count
const filteredText = await page.getByText(/Найдено: \d+/).textContent().catch(() => 'N/A');
console.log('AFTER AMD FILTER count text:', filteredText);

// Also check products shown
const products = await page.locator('[role="dialog"] h4').allTextContents().catch(() => []);
console.log('Products in modal:', products.length);
for (const name of products.slice(0, 5)) {
  console.log('  -', name.substring(0, 60));
}

console.log('FILTER_REQUESTS:', JSON.stringify(requests));

await browser.close();
