import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on('request', req => {
  const u = req.url();
  if (u.includes('/catalog/products') && u.includes('manufacturerIds')) {
    const q = u.split('?')[1] || '';
    console.log('FILTER_REQ:', q);
  }
});

page.on('response', async resp => {
  const u = resp.url();
  if (u.includes('/catalog/products') && u.includes('manufacturerIds')) {
    try {
      const json = await resp.json();
      console.log('  -> TotalItems:', json.meta?.totalItems, 'Products:', json.data?.length);
    } catch {}
  }
});

await page.goto('http://localhost:5173/pc-builder', { timeout: 30000 });
await page.waitForTimeout(2000);

// Open CPU modal
await page.locator('.component-slot__btn').first().click();
await page.waitForTimeout(3000);

console.log('INITIAL:', await page.getByText(/Найдено: \d+/).textContent().catch(() => 'N/A'));

// Expand Бренды group first
await page.evaluate(() => {
  const brandsBtn = Array.from(document.querySelectorAll('button')).find(
    btn => btn.textContent.trim() === 'Бренды' && btn.getAttribute('aria-expanded') === 'false'
  );
  if (brandsBtn) {
    brandsBtn.click();
    return 'opened brands';
  }
  return 'not found';
});
await page.waitForTimeout(1000);

// Find and click AMD checkbox via React event
await page.evaluate(() => {
  const allCbs = document.querySelectorAll('[role="dialog"] input[type="checkbox"]');
  for (const cb of allCbs) {
    const label = cb.closest('label');
    if (label && label.textContent.includes('AMD') && !label.textContent.includes('Epyc') && 
        !label.textContent.includes('Ryzen') && !label.textContent.includes('Athlon')) {
      // Dispatch proper React events
      const native = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'checked').set;
      native.call(cb, !cb.checked);
      cb.dispatchEvent(new Event('change', { bubbles: true }));
      return `Ticked AMD: ${!cb.checked}`;
    }
  }
  return 'AMD checkbox not found';
});

await page.waitForTimeout(4000);

console.log('AFTER:', await page.getByText(/Найдено: \d+/).textContent().catch(() => 'N/A'));
const names = await page.evaluate(() => {
  const cards = document.querySelectorAll('[role="dialog"] h4');
  return Array.from(cards).slice(0, 5).map(el => el.textContent.trim());
});
console.log('PRODUCTS:', JSON.stringify(names));

await browser.close();
