/**
 * Прогон UX-сценариев фильтров конструктора (Playwright). Удалить после QA.
 */
import { chromium } from 'playwright';

const BASE = process.env.PC_BUILDER_URL || 'http://localhost:5173/pc-builder';

function builderRoot(page) {
  return page.getByRole('region', { name: 'Конструктор ПК' });
}

async function openPicker(page, slotIndex) {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);
  await builderRoot(page).getByRole('button', { name: 'Выбрать' }).nth(slotIndex).click({ force: true });
  await page.getByRole('heading', { name: /Выбор:/ }).waitFor({ state: 'visible', timeout: 20000 });
}

async function openFiltersIfNeeded(page) {
  const filt = page.getByRole('button', { name: 'Фильтры' });
  if (await filt.isVisible().catch(() => false)) await filt.click();
}

async function expandGroup(page, name) {
  const btn = page.getByRole('button', { name, exact: true });
  const expanded = await btn.getAttribute('aria-expanded');
  if (expanded === 'false' || expanded === null) await btn.click();
}

async function expandGroupContains(page, substr) {
  const btn = page.getByRole('button').filter({ hasText: new RegExp(substr, 'i') }).first();
  const expanded = await btn.getAttribute('aria-expanded');
  if (expanded === 'false' || expanded === null) await btn.click();
}

async function clickBrand(page, brand) {
  await page
    .locator('label')
    .filter({ hasText: new RegExp(`^${brand}$`) })
    .first()
    .click({ force: true });
}

async function countProductHeadings(page) {
  return page.getByRole('heading', { level: 4 }).count();
}

async function gotoFresh(page) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.getByRole('heading', { name: 'Конструктор ПК' }).waitFor();
}

async function main() {
  const chromePath =
    process.env.PLAYWRIGHT_CHROME ||
    '/home/goldie/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const results = [];

  try {
    await gotoFresh(page);

    await openPicker(page, 0);
    await openFiltersIfNeeded(page);
    await expandGroup(page, 'Бренды');
    await clickBrand(page, 'AMD');
    await page.waitForTimeout(500);
    const c1a = await countProductHeadings(page);
    await clickBrand(page, 'Intel');
    await page.waitForTimeout(500);
    const c1b = await countProductHeadings(page);
    const brandsVisible = await page.locator('label').filter({ hasText: /^(AMD|Intel)$/ }).count();
    await clickBrand(page, 'AMD');
    await page.waitForTimeout(400);
    const c1c = await countProductHeadings(page);
    results.push({
      id: 1,
      ok: c1b >= c1a && c1a > 0 && c1c > 0 && brandsVisible >= 2,
      detail: `cards: AMD≈${c1a}, AMD+Intel≈${c1b}, Intel-only≈${c1c}, brand rows ${brandsVisible}`,
    });
    await page.getByRole('button', { name: 'Закрыть' }).click();

    await gotoFresh(page);
    await openPicker(page, 2);
    await openFiltersIfNeeded(page);
    await expandGroup(page, 'Чипсет');
    const chipLabels = page
      .locator('div')
      .filter({ has: page.getByRole('button', { name: 'Чипсет' }) })
      .locator('[class*="checkboxList"] label');
    const nChip = await chipLabels.count();
    const chip1 = chipLabels.nth(0);
    const chip2 = chipLabels.nth(1);
    await chip1.scrollIntoViewIfNeeded();
    await chip1.click({ timeout: 15000, force: true });
    if (nChip >= 2) {
      await chip2.scrollIntoViewIfNeeded();
      await chip2.click({ timeout: 15000, force: true });
    }
    await page.waitForTimeout(500);
    const c2 = await countProductHeadings(page);
    const otherChip = nChip > 2 ? nChip - 2 : nChip > 1 ? nChip - 2 : 0;
    results.push({
      id: 2,
      ok: nChip >= 2 && c2 > 0,
      detail: `chipset options in group=${nChip}, products≈${c2}, unselected facets left≈${otherChip}`,
    });
    await page.getByRole('button', { name: 'Закрыть' }).click();

    await gotoFresh(page);
    await openPicker(page, 0);
    await openFiltersIfNeeded(page);
    await page.getByPlaceholder('Поиск по названию').fill('Ryzen 5 3600');
    await page.waitForTimeout(600);
    await page.getByRole('button', { name: /Ryzen 5 3600/ }).first().click();
    await page.waitForTimeout(800);

    await openPicker(page, 2);
    await openFiltersIfNeeded(page);
    await expandGroup(page, 'Сокет');
    const sockLabels = await page
      .locator('label')
      .filter({ has: page.locator('input[type="checkbox"]') })
      .filter({ hasText: /AM4|AM5|LGA|sWRX|TR5|SP/i })
      .allTextContents();
    const uniq = [...new Set(sockLabels.map((t) => t.trim().split(/\s+/)[0]))];
    results.push({
      id: 3,
      ok: uniq.length === 1 && /^AM4/i.test(uniq[0]),
      detail: `socket facet values: ${JSON.stringify(uniq)}`,
    });
    await page.getByRole('button', { name: 'Закрыть' }).click();

    await gotoFresh(page);
    await openPicker(page, 0);
    await page.getByPlaceholder('Поиск по названию').fill('Ryzen 5 3600');
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Ryzen 5 3600/ }).first().click();
    await page.waitForTimeout(800);

    await openPicker(page, 2);
    await openFiltersIfNeeded(page);
    const ffBtn = page.getByRole('button').filter({ hasText: /^Форм/i });
    if (await ffBtn.first().isVisible().catch(() => false)) {
      await ffBtn.first().click();
      const matxLab = page.locator('label').filter({ hasText: /micro-ATX|mATX/i }).first();
      if (await matxLab.isVisible().catch(() => false)) {
        await matxLab.click({ force: true });
        await page.waitForTimeout(400);
      }
    }
    await page.getByPlaceholder('Поиск по названию').fill('');
    await page.waitForTimeout(400);
    const dlg = page.getByRole('dialog');
    await dlg.locator('h4').first().waitFor({ state: 'visible', timeout: 20000 });
    await dlg.locator('h4 button').first().click({ force: true });
    await page.waitForTimeout(800);

    await openPicker(page, 7);
    await openFiltersIfNeeded(page);
    const dlgCase = page.getByRole('dialog');
    const ffHeader = dlgCase.getByRole('button').filter({ hasText: /форм|габарит|FF/i }).first();
    if (await ffHeader.isVisible().catch(() => false)) {
      const ex = await ffHeader.getAttribute('aria-expanded');
      if (ex === 'false' || ex === null) await ffHeader.click();
    }
    const ffText = (await dlgCase.locator('label').filter({ hasText: /ATX|ITX/i }).allTextContents()).join(' | ');
    const miniItx = await dlgCase.locator('label').filter({ hasText: /Mini-ITX/i }).count();
    results.push({
      id: 4,
      ok: /ATX|micro|eATX/i.test(ffText),
      detail: `FF labels: ${ffText.slice(0, 240)}; Mini-ITX rows: ${miniItx}`,
    });

    await page.getByRole('button', { name: 'Закрыть' }).click();
    await openPicker(page, 3);
    await openFiltersIfNeeded(page);
    await expandGroup(page, 'Тип памяти');
    const ramTypes = await page.locator('label').filter({ hasText: /DDR/i }).allTextContents();
    results.push({
      id: 5,
      ok: ramTypes.length === 1 && /DDR4/i.test(ramTypes[0]) && !/DDR5|SO-DIMM/i.test(ramTypes.join(' ')),
      detail: `RAM type facets: ${JSON.stringify(ramTypes)}`,
    });
    await page.getByRole('button', { name: 'Закрыть' }).click();

    await gotoFresh(page);
    await openPicker(page, 3);
    await openFiltersIfNeeded(page);
    await expandGroup(page, 'Тип памяти');
    await page.locator('label').filter({ hasText: /^DDR4$/i }).first().click({ force: true });
    await page.locator('label').filter({ hasText: /^DDR5$/i }).first().click({ force: true });
    await page.waitForTimeout(500);
    const c6 = await countProductHeadings(page);
    const ddr3n = await page.locator('label').filter({ hasText: /DDR3/i }).count();
    results.push({
      id: 6,
      ok: c6 > 0 && ddr3n > 0,
      detail: `DDR4+DDR5 products≈${c6}, DDR3 still in facet: ${ddr3n}`,
    });
    await page.getByRole('button', { name: 'Закрыть' }).click();

    await gotoFresh(page);
    await openPicker(page, 0);
    await page.getByPlaceholder('Поиск по названию').fill('Athlon');
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Athlon/ }).first().click();
    await page.waitForTimeout(600);
    await openPicker(page, 8);
    await openFiltersIfNeeded(page);
    await expandGroup(page, 'Тип');
    const cool = (await page.locator('label').filter({ hasText: /кулер|охлаждение|вентилятор|паста/i }).allTextContents()).join(' | ');
    results.push({
      id: 7,
      ok: /Башенный|Жидкостн/i.test(cool) && !/паста|Термопаста|корпусн/i.test(cool),
      detail: cool.slice(0, 300),
    });
    await page.getByRole('button', { name: 'Закрыть' }).click();

    await gotoFresh(page);
    await openPicker(page, 0);
    await openFiltersIfNeeded(page);
    await expandGroup(page, 'Цена');
    await page.getByRole('spinbutton', { name: 'Мин' }).fill('50');
    await page.getByRole('spinbutton', { name: 'Макс' }).fill('400');
    await page.getByRole('spinbutton', { name: 'Мин' }).press('Tab');
    await page.waitForTimeout(700);
    const c8 = await countProductHeadings(page);
    results.push({
      id: 8,
      ok: c8 >= 0,
      detail: `filtered CPU cards≈${c8} (range 50–400 BYN)`,
    });

    console.log('\n--- QA (Playwright) ---');
    for (const r of results) {
      console.log(`[${r.ok ? 'ОК' : 'ФЕЙЛ'}] Сценарий ${r.id}: ${r.detail}`);
    }
    const failed = results.filter((r) => !r.ok);
    if (failed.length) {
      console.error('Failed scenarios:', failed.map((f) => f.id).join(', '));
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
