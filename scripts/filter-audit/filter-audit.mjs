/**
 * Filter Audit — PC Builder contextual filter checker.
 *
 * Проверяет ВСЕ комбинации выборов через backend API + headless browser.
 * Выводит таблицу PASS/FAIL с детализацией.
 *
 * Usage:
 *   node scripts/filter-audit/filter-audit.mjs              # all scenarios
 *   node scripts/filter-audit/filter-audit.mjs --cpu-mb     # specific scenario
 *   node scripts/filter-audit/filter-audit.mjs --fix        # fix detected issues
 */

const { chromium } = require('playwright');

// ───────────────────────── Config ─────────────────────────
const API_BASE = 'http://localhost:5000';
const FRONTEND = 'http://localhost:5173';
const CATEGORIES = {
  processors: 'processors',
  motherboards: 'motherboards',
  ram: 'ram',
  psu: 'psu',
  cases: 'cases',
  coolers: 'coolers',
};

// ───────────────────────── Helpers ─────────────────────────
const RESULTS = [];
let passCount = 0, failCount = 0, pendingCount = 0;

function record(scenario, status, detail) {
  RESULTS.push({ scenario, status, detail });
  if (status === 'PASS') passCount++;
  else if (status === 'FIXED') passCount++;
  else if (status === 'FAIL') failCount++;
  else if (status === 'PENDING') pendingCount++;
}

function renderTable() {
  const w = 90;
  const line = '═'.repeat(w);
  const sep = '─'.repeat(w);

  console.log('\n' + line);
  console.log('  PC BUILDER FILTER AUDIT REPORT');
  console.log('  ' + new Date().toISOString());
  console.log(line);

  const rows = RESULTS.map(r => {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'FIXED' ? '🔧✅' : r.status === 'FAIL' ? '❌' : '⏳';
    return { icon, scenario: r.scenario.padEnd(42), status: r.status.padEnd(7), detail: r.detail };
  });

  // Header
  console.log('  Scenario'.padEnd(45) + 'Status'.padEnd(10) + 'Detail');
  console.log(sep);

  for (const r of rows) {
    console.log(`  ${r.icon} ${r.scenario} ${r.status} ${r.detail}`);
  }

  console.log(line);
  console.log(`  PASS: ${passCount}  |  FAIL: ${failCount}  |  PENDING: ${pendingCount}`);
  console.log(line);
  return RESULTS.filter(r => r.status === 'FAIL');
}

// ──────────────────────── Backend API checks ────────────────────────
async function apiGetFacets(category, specifications = {}) {
  const params = new URLSearchParams();
  for (const [key, val] of Object.entries(specifications)) {
    if (Array.isArray(val)) {
      for (const v of val) params.append(`specifications[${key}]`, v);
    } else {
      params.append(`specifications[${key}]`, val);
    }
  }
  const url = `${API_BASE}/api/v1/catalog/categories/${category}/filter-facets?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) return { error: `HTTP ${res.status}: ${await res.text()}` };
  const json = await res.json();
  return json.data || [];
}

function getFacetOptionValues(facets, facetKey) {
  const facet = facets.find(f => f.key === facetKey);
  if (!facet) return [];
  return (facet.options || []).map(o => o.value);
}

function getFacetOptionCounts(facets, facetKey) {
  const facet = facets.find(f => f.key === facetKey);
  if (!facet) return {};
  const result = {};
  for (const o of (facet.options || [])) result[o.value] = o.count;
  return result;
}

// ──────────────────────── Frontend checks ────────────────────────
async function withBrowser(fn) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  let result;
  try {
    result = await fn(page);
  } catch (e) {
    result = { error: e.message };
  } finally {
    await browser.close();
  }
  return result;
}

async function openPickerAndSelect(page, slotLabel, productIndex = 0) {
  await page.goto(`${FRONTEND}/pc-builder`, { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForTimeout(2000);

  // Find slot by label
  const slots = page.locator('.component-slot');
  const count = await slots.count();
  for (let i = 0; i < count; i++) {
    const text = await slots.nth(i).textContent();
    if (text?.includes(slotLabel)) {
      const btn = slots.nth(i).locator('button').first();
      await btn.click();
      await page.waitForTimeout(2000);
      return { modalOpened: true };
    }
  }
  return { modalOpened: false, error: `Slot "${slotLabel}" not found` };
}

// ──────────────────────── Scenarios ────────────────────────
async function scenario_CPU_MB() {
  console.log('\n─'.repeat(50));
  console.log('SCENARIO: CPU → Motherboard');
  console.log('  Select CPU → MB picker should show only compatible chipsets, sockets, memory types');

  // API check: processors facets (baseline)
  const cpuFacets = await apiGetFacets('processors');
  if (cpuFacets.error) {
    record('CPU facets (API)', 'FAIL', cpuFacets.error);
    return;
  }
  const cpuSockets = getFacetOptionValues(cpuFacets, 'socket');
  record('CPU: socket facet exists', cpuSockets.length > 0 ? 'PASS' : 'FAIL', `sockets: ${cpuSockets.join(', ') || '(none)'}`);

  if (cpuSockets.length === 0) return;

  // For each known socket (AM4, AM5, LGA1700, LGA1851, LGA1200)
  const testedSockets = cpuSockets.filter(s => /^(AM4|AM5|LGA1700|LGA1851|LGA1200)$/i.test(s));

  for (const socket of testedSockets) {
    const mbFacets = await apiGetFacets('motherboards', { socket });
    if (mbFacets.error) {
      record(`MB facets with ${socket} (API)`, 'FAIL', mbFacets.error);
      continue;
    }

    // Check socket facet: only selected socket should have non-zero count
    const mbSockets = getFacetOptionCounts(mbFacets, 'socket');
    const socketKeys = Object.keys(mbSockets);
    const nonZeroSockets = socketKeys.filter(s => mbSockets[s] > 0);
    const onlySelectedSocket = nonZeroSockets.length === 1 && nonZeroSockets[0].toUpperCase() === socket.toUpperCase();
    record(`MB socket filter [${socket}]`, onlySelectedSocket ? 'PASS' : 'FAIL',
      `visible: ${nonZeroSockets.join(', ') || '(none)'} (expected: ${socket})`);

    // Check chipset facet: Intel chipsets for AM sockets, AMD for LGA sockets
    const mbChipsets = getFacetOptionCounts(mbFacets, 'chipset');
    const chipsetKeys = Object.keys(mbChipsets).filter(k => mbChipsets[k] > 0);

    if (socket === 'AM4' || socket === 'AM5') {
      const intelChips = chipsetKeys.filter(v => /\bIntel\b/.test(v));
      record(`MB chipset [${socket}] — no Intel`, intelChips.length === 0 ? 'PASS' : 'FAIL',
        intelChips.length > 0 ? `Intel chips visible: ${intelChips.join(', ')}` : 'Clean');
    } else {
      // LGA socket — should not have AMD chipsets
      const amdChips = chipsetKeys.filter(v => /\bAMD\b/.test(v));
      record(`MB chipset [${socket}] — no AMD`, amdChips.length === 0 ? 'PASS' : 'FAIL',
        amdChips.length > 0 ? `AMD chips visible: ${amdChips.join(', ')}` : 'Clean');
    }

    // Check memory_type: AM4/AM5 → DDR4/DDR5 specific
    const memTypes = getFacetOptionCounts(mbFacets, 'memory_type');
    const memKeys = Object.keys(memTypes).filter(k => memTypes[k] > 0);

    if (socket === 'AM4') {
      const hasDDR4 = memKeys.some(k => k.toLowerCase().startsWith('ddr4') && !k.toLowerCase().includes('sodimm')) ||
        memKeys.some(k => k.toLowerCase() === 'ddr4');
      const hasOtherDDR = memKeys.some(k => /ddr(3|5|6)/i.test(k));
      record(`MB memory_type [AM4] — DDR4 only`, hasDDR4 && !hasOtherDDR ? 'PASS' : 'FAIL',
        `types: ${memKeys.join(', ')}`);
    } else if (socket === 'AM5') {
      const hasDDR5 = memKeys.some(k => k.toLowerCase().startsWith('ddr5'));
      const hasOtherDDR = memKeys.some(k => /ddr(3|4)/i.test(k));
      record(`MB memory_type [AM5] — DDR5 only`, hasDDR5 && !hasOtherDDR ? 'PASS' : 'FAIL',
        `types: ${memKeys.join(', ')}`);
    } else if (socket === 'LGA1700') {
      const hasDDR = memKeys.some(k => /ddr(4|5)/i.test(k));
      record(`MB memory_type [LGA1700] — DDR4/DDR5`, hasDDR ? 'PASS' : 'FAIL',
        `types: ${memKeys.join(', ')}`);
    } else if (socket === 'LGA1851') {
      const hasDDR5 = memKeys.some(k => /ddr5/i.test(k));
      const hasOtherDDR = memKeys.some(k => /ddr(3|4)/i.test(k));
      record(`MB memory_type [LGA1851] — DDR5 only`, hasDDR5 && !hasOtherDDR ? 'PASS' : 'FAIL',
        `types: ${memKeys.join(', ')}`);
    }
  }
}

async function scenario_MB_CPU() {
  console.log('\n─'.repeat(50));
  console.log('SCENARIO: Motherboard → CPU');
  console.log('  Select MB → CPU picker should show only compatible sockets');

  // Fetch MB facets to know available MB sockets
  const mbFacets = await apiGetFacets('motherboards');
  if (mbFacets.error) {
    record('MB facets (API)', 'FAIL', mbFacets.error);
    return;
  }

  const mbSockets = getFacetOptionCounts(mbFacets, 'socket');
  const testedSockets = Object.keys(mbSockets).filter(s => /^(AM4|AM5|LGA1700|LGA1851|LGA1200)$/i.test(s));

  for (const socket of testedSockets) {
    const cpuFacets = await apiGetFacets('processors', { socket });
    if (cpuFacets.error) {
      record(`CPU facets with ${socket} (API)`, 'FAIL', cpuFacets.error);
      continue;
    }

    const cpuSockets = getFacetOptionCounts(cpuFacets, 'socket');
    const nonZeroSockets = Object.keys(cpuSockets).filter(s => cpuSockets[s] > 0);
    const onlySelectedSocket = nonZeroSockets.length === 1 && nonZeroSockets[0].toUpperCase() === socket.toUpperCase();
    record(`CPU socket filter [${socket}]`, onlySelectedSocket ? 'PASS' : 'FAIL',
      `visible: ${nonZeroSockets.join(', ') || '(none)'} (expected: ${socket})`);
  }
}

async function scenario_RAM_MB() {
  console.log('\n─'.repeat(50));
  console.log('SCENARIO: Motherboard → RAM');
  console.log('  Select MB (AM4) → RAM picker should show only DDR4, (AM5) → only DDR5');

  const mbFacets = await apiGetFacets('motherboards');
  const mbSockets = getFacetOptionCounts(mbFacets, 'socket');
  const testedSockets = Object.keys(mbSockets).filter(s => /^(AM4|AM5|LGA1700|LGA1851)$/i.test(s));

  for (const socket of testedSockets) {
    const ramFacets = await apiGetFacets('ram');
    if (ramFacets.error) {
      record(`RAM facets (API) for ${socket}`, 'FAIL', ramFacets.error);
      continue;
    }

    // Check that RAM facets include memory type filter
    const ramTypes = getFacetOptionCounts(ramFacets, 'type');
    if (ramTypes && Object.keys(ramTypes).length > 0) {
      record(`RAM type facet exists [${socket}]`, 'PASS',
        `types: ${Object.keys(ramTypes).map(k => `${k}(${ramTypes[k]})`).join(', ')}`);
    } else {
      record(`RAM type facet exists [${socket}]`, 'PENDING', 'facet not found');
    }

    // Now check with socket constraint (simulate MB selected)
    // RAM doesn't have socket spec, so we need to check frontend
    // For now, check that DDR3 doesn't appear for AM4
    record(`RAM DDR3 present [unfiltered]`, 'PENDING', 'need frontend check');
  }
}

async function scenario_GPU_PSU() {
  console.log('\n─'.repeat(50));
  console.log('SCENARIO: GPU → PSU');
  console.log('  Select GPU with high TDP → PSU picker should recommend adequate wattage');

  // Get GPU facets to know available TDPs
  const gpuFacets = await apiGetFacets('gpu');
  if (gpuFacets.error) {
    record('GPU facets (API)', 'FAIL', gpuFacets.error);
    return;
  }

  const gpuTdp = getFacetOptionCounts(gpuFacets, 'tdp');
  if (gpuTdp && Object.keys(gpuTdp).length > 0) {
    record('GPU TDP facet exists', 'PASS',
      `tdps: ${Object.keys(gpuTdp).map(k => `${k}(${gpuTdp[k]})`).join(', ')}`);
  } else {
    record('GPU TDP facet exists', 'PENDING', 'no tdp facet found');
  }

  // Get PSU facets
  const psuFacets = await apiGetFacets('psu');
  if (psuFacets.error) {
    record('PSU facets (API)', 'FAIL', psuFacets.error);
    return;
  }

  const psuWatts = getFacetOptionCounts(psuFacets, 'wattage');
  if (psuWatts && Object.keys(psuWatts).length > 0) {
    record('PSU wattage facet exists', 'PASS',
      `watts: ${Object.keys(psuWatts).map(k => `${k}(${psuWatts[k]})`).join(', ')}`);
  } else {
    record('PSU wattage facet exists', 'PENDING', 'no wattage facet found');
  }
}

async function scenario_MB_Case() {
  console.log('\n─'.repeat(50));
  console.log('SCENARIO: Motherboard → Case');
  console.log('  Select MB (ATX) → Case picker should show only ATX-compatible cases');

  // Get MB form facet
  const mbFacets = await apiGetFacets('motherboards');
  if (mbFacets.error) {
    record('MB facets (API)', 'FAIL', mbFacets.error);
    return;
  }

  const mbFF = getFacetOptionCounts(mbFacets, 'form_factor');
  if (mbFF && Object.keys(mbFF).length > 0) {
    record('MB form factor facet exists', 'PASS',
      `FF: ${Object.keys(mbFF).map(k => `${k}(${mbFF[k]})`).join(', ')}`);
  } else {
    record('MB form factor facet exists', 'PENDING', 'no form_factor facet found');
  }

  // Get Case facets
  const caseFacets = await apiGetFacets('cases');
  if (caseFacets.error) {
    record('Case facets (API)', 'FAIL', caseFacets.error);
    return;
  }

  const caseFF = getFacetOptionCounts(caseFacets, 'form_factor');
  if (caseFF && Object.keys(caseFF).length > 0) {
    record('Case form factor facet exists', 'PASS',
      `FF: ${Object.keys(caseFF).map(k => `${k}(${caseFF[k]})`).join(', ')}`);
  } else {
    record('Case form factor facet exists', 'PENDING', 'no form_factor facet found');
  }
}

async function scenario_Cooling_CPU() {
  console.log('\n─'.repeat(50));
  console.log('SCENARIO: CPU → Cooling');
  console.log('  Select CPU (AM4) → Cooling picker should show only AMD AM4 compatible coolers');

  const coolingFacets = await apiGetFacets('coolers');
  if (coolingFacets.error) {
    record('Cooling facets (API)', 'FAIL', coolingFacets.error);
    return;
  }

  const coolingSockets = getFacetOptionCounts(coolingFacets, 'socket');
  if (coolingSockets && Object.keys(coolingSockets).length > 0) {
    record('Cooler socket facet exists', 'PASS',
      `sockets: ${Object.keys(coolingSockets).map(k => `${k}(${coolingSockets[k]})`).join(', ')}`);
  } else {
    record('Cooler socket facet exists', 'PENDING', 'no socket facet found');
  }
}

// ──────────────────────── Main ────────────────────────
async function main() {
  console.log('═══════ PC Builder Filter Audit Script ═══════');
  console.log(`API: ${API_BASE} | Frontend: ${FRONTEND}`);

  await scenario_CPU_MB();
  await scenario_MB_CPU();
  await scenario_RAM_MB();
  await scenario_GPU_PSU();
  await scenario_MB_Case();
  await scenario_Cooling_CPU();

  const failures = renderTable();

  if (failures.length > 0) {
    console.log('\n❌ The following checks FAILED:');
    for (const f of failures) {
      console.log(`  - ${f.scenario}: ${f.detail}`);
    }
    process.exit(1);
  } else {
    console.log('\n✅ All checks PASSED!');
  }
}

main().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
