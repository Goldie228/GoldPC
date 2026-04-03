const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const results = [];
  function log(msg) {
    console.log(msg);
    results.push(msg);
  }

  log('═══════ PC Builder Filter Audit ═══════');

  // Navigate
  await page.goto('http://localhost:5173/pc-builder', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);

  // Count slots
  const slotCount = await page.evaluate(() => document.querySelectorAll('.component-slot').length);
  log(`Slots on page: ${slotCount}`);

  if (slotCount === 0) {
    log('FATAL: No slots found. Backend may be down or no data seeded.');
    await browser.close();
    process.exit(1);
  }

  // Get all button text in each slot
  for (let i = 0; i < slotCount; i++) {
    const text = await page.evaluate((idx) => {
      const slots = document.querySelectorAll('.component-slot');
      if (idx >= slots.length) return null;
      const btns = slots[idx].querySelectorAll('button');
      const btnTexts = Array.from(btns).map(b => b.textContent?.trim()).filter(Boolean);
      const slotName = slots[idx].querySelector('.component-slot__label, [class*="label"]')?.textContent?.trim();
      const selected = slots[idx].querySelector('.component-slot__name, [class*="name"]')?.textContent?.trim();
      const specs = Array.from(slots[idx].querySelectorAll('li')).map(li => li.textContent?.trim()).filter(Boolean);
      return { index: idx, slotName, selected, btnTexts, specs };
    }, i);
    if (text) {
      log(`  Slot ${i}: name="${text.slotName}" selected="${text.selected}" specs=${text.specs.join(' | ') || '(none)'}`);
    }
  }

  // Scenario A: Unfiltered — open motherboard picker and check filter options
  log('\n── Scenario A: Motherboard picker (no prior selection) ──');

  // Find motherboard slot by text
  const mbIndex = await page.evaluate(() => {
    const slots = document.querySelectorAll('.component-slot');
    for (let i = 0; i < slots.length; i++) {
      if (slots[i].textContent?.includes('Материн')) return i;
    }
    return -1;
  });

  if (mbIndex >= 0) {
    log(`  Found motherboard slot at index ${mbIndex}`);

    // Click the button in motherboard slot
    const mbSlot = page.locator('.component-slot').nth(mbIndex);
    const buttons = await mbSlot.locator('button').count();
    log(`  Buttons in MB slot: ${buttons}`);

    let productCount = -1;
    let chipsetCount = -1;
    let socketCount = -1;
    let chipsetValues = [];
    let socketValues = [];

    if (buttons > 0) {
      await mbSlot.locator('button').first().click();
      await page.waitForTimeout(1500);

      // Count products in modal
      productCount = await page.locator('.pc-builder__modal-product').count();

      // Get socket filter values
      await page.waitForTimeout(500);

      // All checkbox labels
      const allLabels = await page.locator('.checkbox-label, [class*="checkboxLabel"], [class*="filter-values"] label').all();
      for (const el of allLabels) {
        try {
          const text = await el.textContent();
          if (text) {
            if (/\bAM\d\b|\bLGA\d\b/i.test(text)) socketValues.push(text.trim());
            if (/\b[BXHZA]\d{2,3}\b/i.test(text)) chipsetValues.push(text.trim());
          }
        } catch {}
      }

      socketCount = socketValues.length;
      chipsetCount = chipsetValues.length;

      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    log(`  Products in modal: ${productCount}`);
    log(`  Socket filter values: ${socketCount}`);
    socketValues.forEach(v => log(`    Socket: ${v}`));
    log(`  Chipset filter values: ${chipsetCount}`);
    chipsetValues.slice(0, 20).forEach(v => log(`    Chipset: ${v}`));

    // Check: both Intel and AMD chipsets present (no filter)
    const hasIntelChipset = chipsetValues.some(v => /Z790|B660|H610|Z690/.test(v));
    const hasAmdChipset = chipsetValues.some(v => /X570|B550|B450|A520/.test(v));
    log(`  Has Intel chipsets: ${hasIntelChipset} ${hasIntelChipset ? '✅' : '❓'}`);
    log(`  Has AMD chipsets: ${hasAmdChipset} ${hasAmdChipset ? '✅' : '❓'}`);
  } else {
    log('  Motherboard slot NOT found!');
  }

  // Scenario B: CPU selected → MB picker → check restricted chipset
  log('\n── Scenario B: CPU selected → MB picker ──');

  const cpuIndex = await page.evaluate(() => {
    const slots = document.querySelectorAll('.component-slot');
    for (let i = 0; i < slots.length; i++) {
      if (slots[i].textContent?.includes('Процессор')) return i;
    }
    return -1;
  });

  if (cpuIndex >= 0 && mbIndex >= 0) {
    log(`  CPU slot: ${cpuIndex}, MB slot: ${mbIndex}`);

    // Open CPU picker and select first product
    const cpuSlot = page.locator('.component-slot').nth(cpuIndex);
    await cpuSlot.locator('button').first().click();
    await page.waitForTimeout(1500);

    const firstCPU = page.locator('.pc-builder__modal-product').first();
    const cpuVisible = await firstCPU.isVisible().catch(() => false);
    if (!cpuVisible) {
      log('  No CPU products available');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    } else {
      const cpuName = (await firstCPU.textContent())?.split('\n')?.[0]?.trim();
      log(`  Selecting CPU: ${cpuName}`);
      await firstCPU.click();
      await page.waitForTimeout(1000);

      // Get CPU socket from slot
      const cpuSocket = await page.evaluate((idx) => {
        const slots = document.querySelectorAll('.component-slot');
        const slot = slots[idx];
        if (!slot) return null;
        const specs = slot.querySelectorAll('li');
        for (const li of specs) {
          if (/AM\d|LGA\d/.test(li.textContent)) return li.textContent.trim();
        }
        return null;
      }, cpuIndex);
      log(`  CPU socket displayed: ${cpuSocket || '(not shown)'}`);

      // Open MB picker
      const mbSlot = page.locator('.component-slot').nth(mbIndex);
      await mbSlot.locator('button').first().click();
      await page.waitForTimeout(1500);

      const mbProductsAfter = await page.locator('.pc-builder__modal-product').count();
      log(`  MB products shown (after CPU selection): ${mbProductsAfter}`);

      // Get socket and chipset filter values
      const newSocketV = [];
      const newChipsetV = [];
      const labels = await page.locator('.checkbox-label, [class*="checkboxLabel"], [class*="filter-values"] label').all();
      for (const el of labels) {
        try {
          const text = await el.textContent();
          if (text) {
            if (/\bAM\d\b|\bLGA\d\b/i.test(text)) newSocketV.push(text.trim());
            if (/\b[BXHZA]\d{2,3}\b/i.test(text)) newChipsetV.push(text.trim());
          }
        } catch {}
      }

      log(`  Socket filter values: ${newSocketV.length}`);
      newSocketV.slice(0, 10).forEach(v => log(`    - ${v}`));
      log(`  Chipset filter values: ${newChipsetV.length}`);
      newChipsetV.forEach(v => log(`    - ${v}`));

      // Determine expected restriction
      if (cpuSocket?.includes('AM4')) {
        const intelIn = newChipsetV.filter(v => /Z790|B660|H610|Z690/i.test(v));
        log(`  AM4 CPU → Intel chipsets should be blocked: found ${intelIn.length} ${intelIn.length === 0 ? 'PASS ✅' : 'FAIL ❌'}`);
        const amdIn = newChipsetV.filter(v => /X570|B550|B450|A520|X470/i.test(v));
        log(`  AM4 CPU → AMD chipsets should appear: found ${amdIn.length} ${amdIn.length > 0 ? 'PASS ✅' : 'FAIL ❌'}`);
      } else if (cpuSocket?.includes('AM5')) {
        const intelIn = newChipsetV.filter(v => /Z790|B660|H610|Z690/i.test(v));
        log(`  AM5 CPU → Intel chipsets should be blocked: found ${intelIn.length} ${intelIn.length === 0 ? 'PASS ✅' : 'FAIL ❌'}`);
        const amdIn = newChipsetV.filter(v => /X670|B650|A620|X870/i.test(v));
        log(`  AM5 CPU → AMD chipsets should appear: found ${amdIn.length} ${amdIn.length > 0 ? 'PASS ✅' : 'FAIL ❌'}`);
      } else if (cpuSocket?.includes('LGA')) {
        const amdIn = newChipsetV.filter(v => /X570|B550|B450|A520/i.test(v));
        const socketVal = cpuSocket;
        if (socketVal?.includes('1700')) {
          log(`  LGA1700 CPU → AMD chipsets should be blocked: found ${amdIn.length} ${amdIn.length === 0 ? 'PASS ✅' : 'FAIL ❌'}`);
        } else {
          log(`  LGA socket → AMD chipsets should be blocked: found ${amdIn.length} ${amdIn.length === 0 ? 'PASS ✅' : 'FAIL ❌'}`);
        }
      } else {
        log(`  Socket: "${cpuSocket}" — unrecognized, cannot verify restriction`);
      }

      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      // Clear selection for next scenario
      await page.evaluate(() => localStorage.removeItem('goldpc-pc-builder'));
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
    }
  }

  // Scenario C: RAM first — check all products
  log('\n── Scenario C: Product counts by slot ──');
  const slotLabels = ['Процессор', 'Видеокарт', 'Материн', 'Оперативн', 'Накопит', 'Блок пит', 'Корпус', 'Охлажден', 'Вентилятор', 'Монитор', 'Клавиатур', 'Мышь', 'Наушник'];

  for (const label of slotLabels) {
    try {
      const slotIdx = await page.evaluate((lbl) => {
        const slots = document.querySelectorAll('.component-slot');
        for (let i = 0; i < slots.length; i++) {
          if (slots[i].textContent?.includes(lbl)) return i;
        }
        return -1;
      }, label);

      if (slotIdx >= 0) {
        const slot = page.locator('.component-slot').nth(slotIdx);
        await slot.locator('button').first().click();
        await page.waitForTimeout(1500);

        const count = await page.locator('.pc-builder__modal-product').count();
        log(`  ${label.trim()}: ${count} products`);

        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    } catch (e) {
      log(`  ${label.trim()}: Error`);
      try { await page.keyboard.press('Escape'); } catch {}
    }
  }

  log('\n═══════ AUDIT COMPLETE ═══════');

  // Write report
  const fs = require('fs');
  fs.writeFileSync('/tmp/filter-audit-report.txt', results.join('\n'));
  console.log('\nReport saved to /tmp/filter-audit-report.txt');

  await browser.close();
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
