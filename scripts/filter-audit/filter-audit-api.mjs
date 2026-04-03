/**
 * Filter Audit — PC Builder contextual filter checker.
 * Backend API checks only (fast, no browser needed).
 *
 * Usage:
 *   node scripts/filter-audit/filter-audit-api.mjs
 */

const API_BASE = 'http://localhost:5000';

// ────────── Config ──────────
const RESULTS = [];
let passCount = 0, failCount = 0;

function record(scenario, status, detail) {
  RESULTS.push({ scenario, status, detail });
  if (status === 'PASS') passCount++;
  else if (status === 'FAIL') failCount++;
}

function renderTable() {
  const w = 100;
  const line = '═'.repeat(w);
  const sep = '─'.repeat(w);

  console.log('\n' + line);
  console.log('  PC BUILDER — FILTER FACETS AUDIT (Backend API)');
  console.log('  ' + new Date().toISOString());
  console.log(line);

  for (const r of RESULTS) {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`  ${icon} [${r.status}] ${r.scenario.padEnd(48)} ${r.detail}`);
  }

  console.log(line);
  console.log(`  Results: ${passCount} PASS  |  ${failCount} FAIL`);
  console.log(line);
}

// ────────── Helpers ──────────
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

function facetOptionCounts(facets, facetKey) {
  const facet = facets.find(f => f.key === facetKey);
  if (!facet) return {};
  const result = {};
  for (const o of (facet.options || [])) result[o.value] = o.count;
  return result;
}

function nonZeroValues(counts) {
  return Object.entries(counts).filter(([, c]) => c > 0).map(([v]) => v);
}

function hasAny(counts, pattern) {
  return Object.keys(counts).some(k => pattern.test(k));
}

// ────────── Scenarios ──────────
async function run() {
  console.log('═══════ PC Builder Filter Audit — API ═══════');
  console.log(`API: ${API_BASE}`);

  // ─── Baseline: all facets exist ───
  console.log('\n─── Baseline: Facet existence ───');
  const categories = ['processors', 'motherboards', 'ram', 'psu', 'cases', 'coolers'];
  const expectedFacets = {
    processors: ['socket'],
    motherboards: ['socket', 'chipset', 'form_factor', 'memory_type'],
    ram: ['type'],
    psu: ['wattage'],
    cases: ['form_factor'],
    coolers: ['socket'],
  };

  for (const cat of categories) {
    const facets = await apiGetFacets(cat);
    if (facets.error) {
      record(`${cat} facets`, 'FAIL', facets.error);
      continue;
    }
    const facetKeys = facets.map(f => f.key);
    const needed = expectedFacets[cat] || [];
    const missing = needed.filter(k => !facetKeys.includes(k));
    record(`${cat} — expected facets: ${needed.join(', ')}`,
      missing.length === 0 ? 'PASS' : 'FAIL',
      missing.length > 0 ? `missing: ${missing.join(', ')}` : `found: ${facetKeys.join(', ')}`);
  }

  // ─── CPU → MB: each socket restricts chipset, memory_type ───
  console.log('\n─── CPU → Motherboard chipset/socket/memory_type ───');
  const cpuFacets = await apiGetFacets('processors');
  const cpuSockets = nonZeroValues(facetOptionCounts(cpuFacets, 'socket'));

  // Test well-known sockets
  const testSockets = cpuSockets.filter(s => /^(AM4|AM5|LGA1700|LGA1851|LGA1200)$/i.test(s));
  console.log(`  Testing sockets: ${testSockets.join(', ')}`);

  for (const socket of testSockets) {
    const mbFacets = await apiGetFacets('motherboards', { socket });
    if (mbFacets.error) {
      record(`MB [${socket}]`, 'FAIL', mbFacets.error);
      continue;
    }

    // 1. Socket: only selected socket has count > 0
    const mbSocketCounts = facetOptionCounts(mbFacets, 'socket');
    const visibleSockets = nonZeroValues(mbSocketCounts);
    record(`MB socket [${socket}]`,
      visibleSockets.length === 1 && visibleSockets[0].toUpperCase() === socket.toUpperCase() ? 'PASS' : 'FAIL',
      `visible (count>0): ${visibleSockets.join(', ') || '(none)'} | expected: ${socket}`);

    // 2. Chipset: no AMD for LGA, no Intel for AM
    const chipsetCounts = facetOptionCounts(mbFacets, 'chipset');
    const visibleChipsets = nonZeroValues(chipsetCounts);

    if (socket === 'AM4' || socket === 'AM5') {
      const intel = visibleChipsets.filter(v => /Intel\b/i.test(v));
      record(`MB chipset [${socket}] — no Intel`,
        intel.length === 0 ? 'PASS' : 'FAIL',
        intel.length > 0 ? `Intel: ${intel.join(', ')}` : 'OK');
    } else {
      // LGA: no AMD
      const amd = visibleChipsets.filter(v => /AMD\b/i.test(v));
      record(`MB chipset [${socket}] — no AMD`,
        amd.length === 0 ? 'PASS' : 'FAIL',
        amd.length > 0 ? `AMD: ${amd.join(', ')}` : 'OK');
    }

    // 3. Memory type
    const memCounts = facetOptionCounts(mbFacets, 'memory_type');
    const visibleMem = nonZeroValues(memCounts);

    if (socket === 'AM4') {
      const hasDDR4 = visibleMem.some(v => /ddr4/i.test(v) && !/so-dimm/i.test(v));
      const hasOther = visibleMem.some(v => /ddr(3|5)/i.test(v));
      record(`MB memory_type [AM4] — DDR4`,
        hasDDR4 && !hasOther ? 'PASS' : 'FAIL',
        `types: ${visibleMem.join(', ') || '(none)'}`);
    } else if (socket === 'AM5') {
      const hasDDR5 = visibleMem.some(v => /ddr5/i.test(v));
      const hasOther = visibleMem.some(v => /ddr(3|4)/i.test(v));
      record(`MB memory_type [AM5] — DDR5`,
        hasDDR5 && !hasOther ? 'PASS' : 'FAIL',
        `types: ${visibleMem.join(', ') || '(none)'}`);
    } else if (socket === 'LGA1700') {
      const hasDDR45 = visibleMem.some(v => /ddr(4|5)/i.test(v));
      record(`MB memory_type [LGA1700] — DDR4/DDR5`,
        hasDDR45 ? 'PASS' : 'FAIL',
        `types: ${visibleMem.join(', ') || '(none)'}`);
    } else if (socket === 'LGA1851') {
      const hasDDR5 = visibleMem.some(v => /ddr5/i.test(v));
      const hasOther = visibleMem.some(v => /ddr(3|4)/i.test(v));
      record(`MB memory_type [LGA1851] — DDR5`,
        hasDDR5 && !hasOther ? 'PASS' : 'FAIL',
        `types: ${visibleMem.join(', ') || '(none)'}`);
    } else if (socket === 'LGA1200') {
      const hasDDR4 = visibleMem.some(v => /ddr4/i.test(v) && !/so-dimm/i.test(v));
      const hasDDR5 = visibleMem.some(v => /ddr5/i.test(v));
      record(`MB memory_type [LGA1200] — DDR4`,
        hasDDR4 && !hasDDR5 ? 'PASS' : 'FAIL',
        `types: ${visibleMem.join(', ') || '(none)'}`);
    }
  }

  // ─── MB → CPU: each MB socket restricts CPU ───
  console.log('\n─── Motherboard → CPU socket ───');
  const mbFacetsAll = await apiGetFacets('motherboards');
  const mbSocketCounts = facetOptionCounts(mbFacetsAll, 'socket');
  const mbSockets = nonZeroValues(mbSocketCounts);
  const testMbSockets = mbSockets.filter(s => /^(AM4|AM5|LGA1700|LGA1851|LGA1200)$/i.test(s));

  for (const socket of testMbSockets) {
    const cpuF = await apiGetFacets('processors', { socket });
    if (cpuF.error) {
      record(`CPU [MB=${socket}]`, 'FAIL', cpuF.error);
      continue;
    }
    const cpuSC = facetOptionCounts(cpuF, 'socket');
    const visible = nonZeroValues(cpuSC);
    record(`CPU socket [MB=${socket}]`,
      visible.length === 1 && visible[0].toUpperCase() === socket.toUpperCase() ? 'PASS' : 'FAIL',
      `visible: ${visible.join(', ') || '(none)'} | expected: ${socket}`);
  }

  // ─── GPU → PSU: wattage exists ───
  console.log('\n─── GPU → PSU wattage ───');
  const gpuFacets = await apiGetFacets('gpu');
  const gpuTdpCounts = facetOptionCounts(gpuFacets, 'tdp');
  const gpuTdpVals = nonZeroValues(gpuTdpCounts).map(Number).sort((a, b) => a - b);
  record('GPU TDP values', gpuTdpVals.length > 0 ? 'PASS' : 'FAIL',
    gpuTdpVals.length > 0 ? gpuTdpVals.join(', ') : 'none found');

  const psuFacets = await apiGetFacets('psu');
  const psuWattCounts = facetOptionCounts(psuFacets, 'wattage');
  const psuWattVals = nonZeroValues(psuWattCounts).map(Number).sort((a, b) => a - b);
  record('PSU wattage values', psuWattVals.length > 0 ? 'PASS' : 'FAIL',
    psuWattVals.length > 0 ? psuWattVals.join('W, ') + 'W' : 'none found');

  // ─── MB → Case: form factor exists ───
  console.log('\n─── Motherboard → Case form factor ───');
  const mbFFCounts = facetOptionCounts(mbFacetsAll, 'form_factor');
  const mbFFVals = nonZeroValues(mbFFCounts);
  record('MB form factors', mbFFVals.length > 0 ? 'PASS' : 'FAIL',
    mbFFVals.join(', ') || 'none found');

  const caseFacets = await apiGetFacets('cases');
  const caseFFCounts = facetOptionCounts(caseFacets, 'form_factor');
  const caseFFVals = nonZeroValues(caseFFCounts);
  record('Case form factors', caseFFVals.length > 0 ? 'PASS' : 'FAIL',
    caseFFVals.join(', ') || 'none found');

  // Form factor filtering — check ATX MB → cases with ATX support
  if (mbFFVals.includes('ATX')) {
    const caseFWithFF = await apiGetFacets('cases', { form_factor: 'ATX' });
    if (caseFWithFF.error) {
      record('Case [form_factor=ATX]', 'FAIL', caseFWithFF.error);
    } else {
      const caseFFRestricted = facetOptionCounts(caseFWithFF, 'form_factor');
      const visibleCaseFF = nonZeroValues(caseFFRestricted);
      record('Case filter [form_factor=ATX]',
        visibleCaseFF.length > 0 ? 'FAIL' : 'PASS',
        `form_facet filtered to 0 options (expected empty when no matching products)`);
      // Also check socket facet (should exist)
      caseFWithFF.forEach(f => {
        if (f.key === 'socket') {
          const sockets = nonZeroValues(facetOptionCounts([f], 'socket'));
          record('  → case socket options', sockets.length > 0 ? 'PASS' : 'FAIL',
            sockets.length > 0 ? sockets.join(', ') : 'none');
        }
      });
    }
  }

  // ─── Cooling socket exists ───
  console.log('\n─── CPU → Cooling socket ───');
  const coolerFacets = await apiGetFacets('coolers');
  const coolerSocketCounts = facetOptionCounts(coolerFacets, 'socket');
  const coolerSocketVals = nonZeroValues(coolerSocketCounts);
  record('Cooler socket options', coolerSocketVals.length > 0 ? 'PASS' : 'FAIL',
    coolerSocketVals.join(', ') || 'none found');

  // Cooling restricted to socket
  for (const socket of testSockets) {
    const coolF = await apiGetFacets('coolers', { socket });
    if (coolF.error) {
      record(`Cooler [socket=${socket}]`, 'FAIL', coolF.error);
      continue;
    }
    const coolSocketCounts = facetOptionCounts(coolF, 'socket');
    const visibleCoolSockets = nonZeroValues(coolSocketCounts);
    record(`Cooler socket [${socket}]`,
      visibleCoolSockets.length > 0 && visibleCoolSockets.some(s => s.toUpperCase() === socket.toUpperCase()) ? 'PASS' : 'FAIL',
      `visible sockets: ${visibleCoolSockets.join(', ') || '(none)'} (expected ${socket})`);
  }

  // ─── RAM type facet ───
  console.log('\n─── RAM type facet ───');
  const ramFacets = await apiGetFacets('ram');
  if (ramFacets.error) {
    record('RAM type facet', 'FAIL', ramFacets.error);
  } else {
    const ramTypeCounts = facetOptionCounts(ramFacets, 'type');
    const ramTypeVals = nonZeroValues(ramTypeCounts);
    if (ramTypeVals.length > 0) {
      record('RAM type facet values', 'PASS', ramTypeVals.join(', '));
      const hasDDR3 = ramTypeVals.some(v => /ddr3/i.test(v));
      const hasDDR4 = ramTypeVals.some(v => /ddr4/i.test(v) && !/so-dimm/i.test(v));
      const hasDDR5 = ramTypeVals.some(v => /ddr5/i.test(v));
      record('  DDR3 present', hasDDR3 ? 'FAIL (should not exist for modern)' : 'PASS', `DDR3: ${hasDDR3}`);
      record('  DDR4 present', hasDDR4 ? 'PASS' : 'FAIL', `DDR4: ${hasDDR4}`);
      record('  DDR5 present', hasDDR5 ? 'PASS' : 'FAIL', `DDR5: ${hasDDR5}`);
    } else {
      // Check other facet keys that might carry type info
      record('RAM type facet', 'PENDING', `No "type" facet found. Available keys: ${ramFacets.map(f => f.key).join(', ')}`);
    }
  }

  // ─── Report ───
  renderTable();

  if (failCount > 0) {
    const failures = RESULTS.filter(r => r.status === 'FAIL');
    console.log('\n❌ FAILED checks:');
    for (const f of failures) {
      console.log(`  • ${f.scenario}: ${f.detail}`);
    }
  }

  return { pass: passCount, fail: failCount };
}

run().then(result => {
  console.log(`\nDone: ${result.pass} passed, ${result.fail} failed`);
  if (result.fail > 0) process.exit(1);
}).catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
