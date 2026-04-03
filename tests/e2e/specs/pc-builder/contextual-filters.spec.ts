/**
 * E2E tests for context-aware filter facets in PC Builder.
 *
 * Scenarios:
 *   1) API: motherboard facets without filters => has Intel & AMD chipsets
 *   2) API: motherboard facets with socket=AM4 => no Intel chipsets, AMD chipsets present
 *   3) API: motherboard facets with socket=AM4 => DDR3 count = 0 or absent
 *   4) UI: select AM4 CPU => open motherboard picker => chipset filter hides Intel chipsets
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

// Intel-only chipsets that should NOT appear when socket=AM4 is applied
const INTEL_CHIPSETS = ['Z790', 'Z690', 'B660', 'H610'];
// AMD chipsets that SHOULD appear when socket=AM4 is applied
const AMD_CHIPSETS = ['X570', 'B550', 'B450', 'A520'];

test.describe('Contextual filter facets — PC Builder', () => {
  // ------------------------------------------------------------------
  // API tests (direct requests to the backend)
  // ------------------------------------------------------------------
  test.describe('API: filter-facets endpoint', () => {
    test('motherboard facets without filters — chipset facet exists', async ({ request }) => {
      const response = await request.get(
        `${BASE_URL}/api/v1/catalog/categories/motherboards/filter-facets`
      );
      expect(response.ok()).toBe(true);

      const body = await response.json();
      // Response is { data: FilterFacetAttribute[] } or FilterFacetAttribute[]
      const facets: Array<{ key: string; options?: Array<{ value: string; count: number }> }> =
        Array.isArray(body) ? body : (body.data ?? body.data?.data ?? []);

      expect(facets.length).toBeGreaterThan(0);

      const chipsetFacet = facets.find((f) => f.key === 'chipset');
      expect(chipsetFacet, 'chipset facet should exist').toBeTruthy();
      expect(chipsetFacet!.options!.length, 'chipset should have options').toBeGreaterThan(0);

      // Collect all chipset values
      const chipsetValues = chipsetFacet!.options!.map((o) => o.value.toUpperCase());

      // Both Intel and AMD chipsets should be present in the unfiltered response
      const hasIntelChipset = INTEL_CHIPSETS.some((c) => chipsetValues.includes(c));
      const hasAmdChipset = AMD_CHIPSETS.some((c) => chipsetValues.includes(c));

      expect(hasIntelChipset, 'unfiltered should have Intel chipsets').toBe(true);
      expect(hasAmdChipset, 'unfiltered should have AMD chipsets').toBe(true);
    });

    test('motherboard facets with socket=AM4 — no Intel chipsets', async ({ request }) => {
      const response = await request.get(
        `${BASE_URL}/api/v1/catalog/categories/motherboards/filter-facets`,
        {
          params: { 'specifications[socket]': 'AM4' },
        }
      );
      expect(response.ok()).toBe(true);

      const body = await response.json();
      const facets: Array<{ key: string; options?: Array<{ value: string; count: number }> }> =
        Array.isArray(body) ? body : (body.data ?? body.data?.data ?? []);

      const chipsetFacet = facets.find((f) => f.key === 'chipset');
      expect(chipsetFacet, 'chipset facet should exist').toBeTruthy();

      // Option values (case-insensitive check) that appear in response
      const chipsetValues = chipsetFacet!.options!.map((o) => o.value.toUpperCase());

      // No Intel chipsets
      for (const chipset of INTEL_CHIPSETS) {
        expect(
          chipsetValues.includes(chipset),
          `chipset facet should NOT contain ${chipset} when socket=AM4`
        ).toBe(false);
      }

      // AMD chipsets present
      for (const chipset of AMD_CHIPSETS) {
        expect(
          chipsetValues.includes(chipset),
          `chipset facet SHOULD contain ${chipset} when socket=AM4`
        ).toBe(true);
      }
    });

    test('motherboard facets with socket=AM4 — DDR3 count = 0 or absent', async ({ request }) => {
      const response = await request.get(
        `${BASE_URL}/api/v1/catalog/categories/motherboards/filter-facets`,
        {
          params: { 'specifications[socket]': 'AM4' },
        }
      );
      expect(response.ok()).toBe(true);

      const body = await response.json();
      const facets: Array<{ key: string; options?: Array<{ value: string; count: number }> }> =
        Array.isArray(body) ? body : (body.data ?? body.data?.data ?? []);

      const memoryTypeFacet = facets.find((f) => f.key === 'memory_type');
      expect(memoryTypeFacet, 'memory_type facet should exist').toBeTruthy();

      const ddr3Option = memoryTypeFacet!.options!.find(
        (o) => o.value.toUpperCase() === 'DDR3'
      );

      // DDR3 should either be absent or have count === 0
      if (ddr3Option) {
        expect(ddr3Option.count, 'DDR3 count should be 0 when socket=AM4').toBe(0);
      }
      // If DDR3 is absent from the facet options, that's also acceptable
      // (backends typically omit options with 0 count)
    });
  });

  // ------------------------------------------------------------------
  // UI test
  // ------------------------------------------------------------------
  test.describe('UI: PC Builder contextual filters', () => {
    test('selecting AM4 CPU hides Intel chipsets in motherboard picker', async ({ page }) => {
      await page.goto(`${BASE_URL}/pc-builder`);

      // Wait for CPU slot to appear
      const cpuSlot = page
        .locator('.component-slot')
        .filter({ has: page.getByText(/CPU|Процессор|cpu|процессор/i) })
        .first();
      await expect(cpuSlot).toBeVisible({ timeout: 15000 });

      // Click "Выбрать" (Choose) on CPU slot
      const cpuSelectBtn = cpuSlot.locator('button:has-text("Выбрать")');
      await cpuSelectBtn.click();

      // Modal should appear
      const modal = page.locator('.modal, [role="dialog"]');
      await expect(modal).toBeVisible({ timeout: 10000 });

      // Wait for product list to load
      const firstProduct = modal.locator('.pc-builder__modal-product').first();
      await expect(firstProduct).toBeVisible({ timeout: 10000 });

      // Find an AM4 processor and select it
      const am4Products = modal.locator('.pc-builder__modal-product');
      let am4Selected = false;

      const count = await am4Products.count();
      for (let i = 0; i < count; i++) {
        const product = am4Products.nth(i);
        const text = (await product.textContent()) ?? '';
        // Look for AM4 in specs
        if (text.toUpperCase().includes('AM4') && !text.toUpperCase().includes('AM5')) {
          await product.click();
          am4Selected = true;
          break;
        }
      }

      if (!am4Selected) {
        // Fallback: select first available product, assume it's compatible
        await firstProduct.click();
      }

      // Modal should close
      await expect(modal).not.toBeVisible({ timeout: 8000 });

      // Now open motherboard picker
      const mbSlot = page
        .locator('.component-slot')
        .filter({
          has: page.getByText(
            /Мат\.?\s*плата|Материн|Mother|motherboard/i
          ),
        })
        .first();
      await expect(mbSlot).toBeVisible({ timeout: 10000 });

      const mbSelectBtn = mbSlot.locator('button:has-text("Выбрать")');
      await mbSelectBtn.click();

      // Motherboard modal opens
      const mbModal = page.locator('.modal, [role="dialog"]');
      await expect(mbModal).toBeVisible({ timeout: 10000 });

      // Find and open "Чипсет" (chipset) filter section
      // Look for filter toggles/sections by text
      const chipsetFilter = page
        .locator('.filter-section, .filter-group, [data-filter]')
        .filter({ has: page.getByText(/Чипсет|Chipset/i) })
        .first();

      // If explicit filter section found, click to expand
      if (await chipsetFilter.count() > 0) {
        await chipsetFilter.click();
      }

      // Look for any visible element with chipset values
      const chipsetContainer = page.locator(
        '.filter-section:has-text("Чипсет"), .filter-group:has-text("Чипсет"), .filter-content'
      );
      await expect(chipsetContainer.first()).toBeVisible({ timeout: 10000 });

      // Get full text content of the filter area
      const filterText = (await chipsetContainer.first().textContent()) ?? '';

      // Intel chipsets should NOT be present
      for (const chipset of INTEL_CHIPSETS) {
        expect(
          filterText.includes(chipset),
          `Filter should NOT contain ${chipset} after selecting AM4 CPU`
        ).toBe(false);
      }
    });
  });
});
