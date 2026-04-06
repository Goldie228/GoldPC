import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const requests = [];
const responses = [];
page.on('request', req => {
  const u = req.url();
  if (u.includes('/catalog/products') && u.includes('manufacturerIds')) {
    const q = u.split('?')[1] || '';
    requests.push(q);
  }
});
page.on('response', async resp => {
  const u = resp.url();
  if (u.includes('/catalog/products') && u.includes('manufacturerIds')) {
    try {
      const json = await resp.json();
      responses.push({ total: json.meta?.totalItems, items: json.data?.length });
    } catch {}
  }
});

await page.goto('http://localhost:5173/pc-builder', { timeout: 30000 });
await page.waitForTimeout(2000);

// Open CPU modal
await page.locator('.component-slot__btn').first().click();
await page.waitForTimeout(3000);

// Initial count
const initialCount = await page.getByText(/Найдено: \d+/).textContent().catch(() => 'N/A');
console.log('INITIAL:', initialCount);

// Expand Бренды group
const brandsBtn = page.locator('button:has-text("Бренды")').first();
await brandsBtn.click().catch(() => {});
await page.waitForTimeout(1000);

// Now find AMD checkbox and click via evaluate
const amdResult = await page.evaluate(() => {
  // Find the AMD checkbox label
  const labels = document.querySelectorAll('label');
  let amdCheckbox = null;
  for (const lbl of labels) {
    if (lbl.textContent.trim() === 'AMD' || lbl.textContent.includes('AMD')) {
      const cb = lbl.querySelector('input[type="checkbox"]');
      if (cb) { amdCheckbox = cb; break; }
    }
  }
  if (!amdCheckbox) return 'AMD_CHECKBOX_NOT_FOUND';
  
  // Check if we can find it by looking for all checkboxes and their associated text
  const allCbs = document.querySelectorAll('[role="dialog"] input[type="checkbox"]');
  const amdInDialog = Array.from(allCbs).find(cb => {
    const lbl = cb.closest('label');
    return lbl && lbl.textContent.includes('AMD');
  });
  
  if (!amdInDialog) return 'AMD_NOT_IN_DIALOG';
  
  // Click it programmatically
  const label = amdInDialog.closest('label');
  if (label) { 
    const alreadyChecked = amdInDialog.checked;
    amdInDialog.checked = !alreadyChecked;
    amdInDialog.dispatchEvent(new Event('change', { bubbles: true }));
    return `AMD ticked: ${!alreadyChecked}`;
  }
  return 'FOUND_BUT_NO_LABEL';
});

console.log('AMD_RESULT:', amdResult);
await page.waitForTimeout(3000);

// Check if products filtered
const filteredCount = await page.getByText(/Найдено: \d+/).textContent().catch(() => 'N/A');
console.log('FILTERED:', filteredCount);

// Check products
const names = await page.evaluate(() => {
  const cards = document.querySelectorAll('[role="dialog"] h4');
  return Array.from(cards).slice(0, 6).map(el => el.textContent.trim());
});
console.log('PRODUCTS:', JSON.stringify(names));

console.log('MANUFACTURER_REQUESTS:', JSON.stringify(requests));
console.log('MANUFACTURER_RESPONSES:', JSON.stringify(responses));

// Take screenshot for debugging
await page.screenshot({ path: '/data/C/1/2/3/4/5/6/7/kursovaya/mfr-test-result.png' });

await browser.close();
