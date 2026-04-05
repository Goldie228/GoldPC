/**
 * Compatibility Utilities — клиентская проверка совместимости компонентов ПК
 * 
 * Декларативный движок правил загружает правила из JSON-конфигурации.
 * @module utils/compatibilityUtils
 */

import type { Product, ProductSpecifications } from '../api/types';
import rulesConfig from '../config/compatibilityRules.json';
import type {
  CompatibilityRulesConfig,
  SocketGroup,
  BottleneckCategory,
} from '../config/compatibilityTypes';

// ──────────── Loaded config (typed) ────────────
const config: CompatibilityRulesConfig = rulesConfig as unknown as CompatibilityRulesConfig;

// ──────────── Types ────────────
export type ComponentCategory = 'cpu' | 'gpu' | 'motherboard' | 'ram' | 'storage' | 'psu' | 'case' | 'cooling';
export type CompatibilitySeverity = 'Error' | 'Warning' | 'Info';

export interface CompatibilityIssue {
  severity: CompatibilitySeverity;
  component1: string;
  component2: string;
  message: string;
  suggestion?: string;
}

export interface CompatibilityWarning {
  severity: 'Warning' | 'Info';
  component: string;
  message: string;
  suggestion?: string;
}

export interface CompatibilityCheckResult {
  isCompatible: boolean;
  issues: CompatibilityIssue[];
  warnings: CompatibilityWarning[];
  powerConsumption: number;
  recommendedPSU: number;
  bottleneckPercentage: number;
}

export type ComponentMap = Partial<Record<ComponentCategory, Product | null>>;

// ──────────── Validation constants ────────────
const VALID_MEMORY_TYPES = config.ramCompatibility.validTypes as readonly string[];
export type MemoryType = 'DDR4' | 'DDR5';
const VALID_FORM_FACTORS = config.formFactorCompatibility.hierarchy as readonly string[];
export type FormFactor = 'ATX' | 'MicroATX' | 'MiniITX' | 'EATX';

// ──────────── Socket groups from config ────────────
const SOCKET_GROUPS: SocketGroup[] = config.socketCompatibility.groups;

// ──────────── Bottleneck categories from config ────────────
const BOTTLENECK_CATEGORIES: Record<string, BottleneckCategory> = config.bottleneckDetection.categories;

// ──────────── Extractors ────────────
function getNumber(specs: ProductSpecifications | undefined, ...keys: string[]): number | null {
  if (!specs) return null;
  for (const key of keys) {
    const val = specs[key];
    if (typeof val === 'number' && !isNaN(val)) return val;
    if (typeof val === 'string') { const n = parseFloat(val); if (!isNaN(n)) return n; }
  }
  return null;
}

function getString(specs: ProductSpecifications | undefined, ...keys: string[]): string | null {
  if (!specs) return null;
  for (const key of keys) {
    const val = specs[key];
    if (typeof val === 'string' && val.length > 0) return val;
  }
  return null;
}

/** Set of known socket names from compatibility rules (source of truth, no hardcoding) */
const KNOWN_SOCKETS = new Set(
  SOCKET_GROUPS.flatMap(g => g.sockets.map(s => s.toUpperCase().trim()))
);

export function extractSocket(specs: ProductSpecifications | undefined): string | null {
  const raw = getString(specs, 'socket', 'cpuSocket', 'soket');
  if (!raw) return null;
  const upper = raw.toUpperCase().trim();
  return KNOWN_SOCKETS.has(upper) ? upper : null;
}

export function extractMemoryType(specs: ProductSpecifications | undefined): MemoryType | null {
  const raw = getString(specs, 'memoryType', 'memory_type', 'tip_pamyati', 'type');
  if (!raw) return null;
  const upper = raw.toUpperCase().trim();
  if (upper.startsWith('DDR5')) return 'DDR5';
  if (upper.startsWith('DDR4')) return 'DDR4';
  return null;
}

export function extractFormFactor(specs: ProductSpecifications | undefined): string | null {
  const raw = getString(specs, 'formFactor', 'form_factor', 'format');
  if (!raw) return null;
  const norm = normalizeFormFactor(raw);
  return norm;
}

export function extractSupportedSockets(specs: ProductSpecifications | undefined): string[] {
  if (!specs) return [];
  const rec = specs as Record<string, unknown>;
  const sockets = rec.supportedSockets ?? rec.supported_sockets;
  if (Array.isArray(sockets)) return sockets.filter((s): s is string => typeof s === 'string').map(s => s.toUpperCase().trim());
  const single = getString(specs, 'socket');
  return single ? [single.toUpperCase().trim()] : [];
}

export function extractChipset(specs: ProductSpecifications | undefined): string | null {
  return getString(specs, 'chipset', 'chipsset');
}

export function extractTDP(specs: ProductSpecifications | undefined): number { return getNumber(specs, 'tdp', 'TDP', 'power_consumption') ?? 0; }
export function extractPSUWattage(specs: ProductSpecifications | undefined): number { return getNumber(specs, 'wattage', 'power', 'moshchnost') ?? 0; }

export function hasIntegratedGraphics(specs: ProductSpecifications | undefined): boolean {
  if (!specs) return false;
  const rec = specs as Record<string, unknown>;
  const ig = rec.integratedGraphics ?? rec.integrated_graphics;
  if (typeof ig === 'boolean') return ig;
  if (typeof ig === 'string') {
    const l = ig.trim().toLowerCase();
    if (l === 'true' || l === 'да' || l === 'yes') return true;
    // Any non-empty, non-boolean-looking value means a GPU is present (e.g. "Intel HD Graphics 510")
    if (l.length > 0 && l !== 'false' && l !== 'нет' && l !== 'no' && l !== 'none' && l !== 'отсутствует' && l !== 'нет встроенной' && l !== 'нет графического ядра') return true;
  }
  return false;
}

export function extractSupportedFormFactors(specs: ProductSpecifications | undefined): string[] {
  if (!specs) return [];
  const rec = specs as Record<string, unknown>;
  const raw = rec.supportedFormFactors ?? rec.supported_form_factors;
  if (Array.isArray(raw)) {
    return raw
      .filter((s): s is string => typeof s === 'string')
      .map(s => normalizeFormFactor(s))
      .filter((s): s is string => s !== null);
  }
  // If it's a single string value, try to extract
  const single = getString(specs, 'formFactor', 'form_factor', 'format');
  if (single) {
    const norm = normalizeFormFactor(single);
    if (norm) return [norm];
  }
  return [];
}

export function extractMaxGPULength(specs: ProductSpecifications | undefined): number | null { return getNumber(specs, 'maxGPULength', 'max_gpu_length', 'maxGpuLength', 'maxGpuLengthMm'); }
export function extractGPULength(specs: ProductSpecifications | undefined): number | null { return getNumber(specs, 'length', 'lengthMm', 'dlina', 'gpuLength'); }
export function extractRAMCapacity(specs: ProductSpecifications | undefined): number { return getNumber(specs, 'capacity', 'obem', 'size') ?? 0; }
export function extractMaxMemory(specs: ProductSpecifications | undefined): number { return getNumber(specs, 'maxMemory', 'max_memory', 'maxMemoryGb') ?? 128; }
export function extractPerformanceScore(specs: ProductSpecifications | undefined): number { return getNumber(specs, 'performanceScore', 'performance_score', 'score') ?? 0; }
export function extractCoolerHeight(specs: ProductSpecifications | undefined): number { return getNumber(specs, 'height', 'heightMm', 'vysota') ?? 0; }
export function extractMaxCoolerHeight(specs: ProductSpecifications | undefined): number | null { return getNumber(specs, 'maxCoolerHeight', 'max_cooler_height', 'maxCoolerHeightMm'); }
export function extractCoolerType(specs: ProductSpecifications | undefined): string | null { return getString(specs, 'type', 'coolerType'); }
export function extractMaxCoolerTDP(specs: ProductSpecifications | undefined): number { return getNumber(specs, 'maxTdp', 'max_tdp', 'coolingTdp') ?? 0; }

export function extractStorageType(specs: ProductSpecifications | undefined): 'm2' | 'sata' | 'other' {
  if (!specs) return 'other';
  const type = getString(specs, 'type', 'storageType', 'storage_type');
  const iface = getString(specs, 'interface', 'form_factor');
  if (type && (type.toUpperCase() === 'NVME' || type.toUpperCase() === 'PCIe')) return 'm2';
  if (type && type.toUpperCase() === 'SATA') return 'sata';
  if (iface && (iface.toUpperCase() === 'M.2' || iface.toUpperCase() === 'NVME')) return 'm2';
  if (iface && iface.toUpperCase() === 'SATA') return 'sata';
  return 'other';
}

// ──────────── FormFactor helpers (from compatibilityRules.json) ────────────
const FF_RULES = config.formFactorCompatibility.rules;
const FF_ALIASES: Record<string, string> = config.formFactorCompatibility.aliases;

/** Normalize any raw form-factor string to canonical DB value (Mini-ITX, micro-ATX, ATX, eATX) */
export function normalizeFormFactor(raw: string): string | null {
  if (!raw) return null;
  // Check aliases table first (exact match, case-insensitive)
  const upper = raw.toUpperCase().trim();
  if (FF_ALIASES[upper]) return FF_ALIASES[upper];
  // Direct match with hierarchy (DB values)
  for (const h of config.formFactorCompatibility.hierarchy) {
    if (h === raw) return h;
  }
  // Fallback: match by known aliases not in table
  if (upper === 'ATX') return 'ATX';
  if (upper === 'EATX') return 'eATX';
  if (upper === 'MINIITX' || upper === 'MINI-ITX' || upper === 'MITX') return 'Mini-ITX';
  if (upper === 'MICROATX' || upper === 'MICRO-ATX' || upper === 'M-ATX' || upper === 'MATX') return 'micro-ATX';
  return null;
}

/** Given a motherboard canonical FF, return all case FF values that can hold it.
 *  e.g. MB=Mini-ITX → case can be Mini-ITX, micro-ATX, ATX, eATX (any case >= MB size). */
export function getCaseFormFactorsForMotherboard(mbCanonical: string): string[] {
  return FF_RULES
    .filter(rule => rule.supportedMotherboards.includes(mbCanonical))
    .map(rule => rule.caseFormFactor);
}

/** Given a case canonical FF, return all motherboard FF values it can hold. */
export function getMotherboardFormFactorsForCase(caseCanonical: string): string[] {
  const rule = FF_RULES.find(r => r.caseFormFactor === caseCanonical);
  return rule ? rule.supportedMotherboards : [];
}

/** Expand a single MB raw FF string into a list of case form-factor values (canonical DB names). */
export function caseFormFactorsForMB(raw: string): string[] {
  const canonical = normalizeFormFactor(raw);
  if (!canonical) return [];
  return getCaseFormFactorsForMotherboard(canonical);
}

export function mbFormFactorsForCase(raw: string): string[] {
  const canonical = normalizeFormFactor(raw);
  if (!canonical) return [];
  return getMotherboardFormFactorsForCase(canonical);
}

// ──────────── Socket group helpers ────────────
function findSocketGroup(socket: string): SocketGroup | null {
  return SOCKET_GROUPS.find(g => g.sockets.some(s => s.toUpperCase() === socket.toUpperCase())) ?? null;
}

export function getChipsetsForSocket(socket: string): string[] {
  const group = findSocketGroup(socket);
  return group ? group.chipsets : [];
}

export function getSocketsForRamType(ramType: 'DDR4' | 'DDR5'): string[] {
  return SOCKET_GROUPS
    .filter(g => g.ramType === ramType || g.ramTypeAlternate === ramType)
    .flatMap(g => g.sockets)
    .map(s => s.toUpperCase());
}

export function getRamTypesForSocket(socket: string): string[] {
  const group = findSocketGroup(socket);
  if (!group) return [];
  const types = [group.ramType];
  if (group.ramTypeAlternate) types.push(group.ramTypeAlternate);
  return types;
}

// ──────────── BIOS warning ────────────

/**
 * Проверка BIOS warning: вероятностное предупреждение «Возможно потребуется обновление BIOS»
 */
export function checkBiosWarning(cpuSocket: string | null, chipset: string | null): CompatibilityWarning | null {
  if (!cpuSocket) return null;
  const group = findSocketGroup(cpuSocket);
  if (!group || !group.biosWarning.enabled) return null;
  // Если указан чипсет и есть affectedChipsets — проверяем вхождение
  if (chipset && group.biosWarning.affectedChipsets?.length) {
    const isAffected = group.biosWarning.affectedChipsets.some(
      c => c.toUpperCase() === chipset.toUpperCase()
    );
    if (!isAffected) return null;
  }
  return {
    severity: 'Warning',
    component: 'BIOS',
    message: group.biosWarning.message,
    suggestion: `Вероятность: ${group.biosWarning.probability}`,
  };
}

// ──────────── Bottleneck detection ────────────
/**
 * Детекция bottleneck с учётом категории назначения ПК.
 * @returns процент bottleneck: положительный = CPU-bound, отрицательный = GPU-bound, 0 = сбалансировано
 */
export function calculateBottleneck(cpuScore: number, gpuScore: number, purpose?: string): number {
  if (cpuScore <= 0 || gpuScore <= 0) return 0;
  const ratio = cpuScore / gpuScore;
  if (ratio > 1.0) return Math.min(100, ((ratio - 1.0) / ratio) * 100);
  if (ratio < 1.0) return Math.max(-100, -(1.0 - ratio) * 100);
  return 0;
}

/**
 * Генерация предупреждений bottleneck
 */
export function detectBottleneckWarnings(
  cpuScore: number,
  gpuScore: number,
  cpuName: string,
  gpuName: string,
  purpose?: string
): CompatibilityWarning[] {
  const warnings: CompatibilityWarning[] = [];
  if (cpuScore <= 0 || gpuScore <= 0) return warnings;

  const ratio = cpuScore / gpuScore;
  const catKey = (purpose ?? 'gaming').toLowerCase();
  const category = BOTTLENECK_CATEGORIES[catKey] ?? BOTTLENECK_CATEGORIES['gaming'];

  // CPU-bound: ratio слишком высокий
  const cpuBoundThreshold = Math.max(2.0, category.idealRatio.max);
  if (ratio > cpuBoundThreshold) {
    warnings.push({
      severity: 'Warning',
      component: cpuName,
      message: `CPU-bound bottleneck: ${cpuName} значительно мощнее ${gpuName} (ratio: ${ratio.toFixed(2)})`,
      suggestion: 'Рассмотрите более мощную видеокарту',
    });
  }

  // GPU-bound: ratio слишком низкий
  const gpuBoundThreshold = Math.min(0.5, category.idealRatio.min);
  if (ratio < gpuBoundThreshold) {
    warnings.push({
      severity: 'Warning',
      component: gpuName,
      message: `GPU-bound bottleneck: ${gpuName} значительно мощнее ${cpuName} (ratio: ${ratio.toFixed(2)})`,
      suggestion: 'Рассмотрите более мощный процессор',
    });
  }

  return warnings;
}

// ──────────── Check functions ────────────
function checkCPUSocket(cpu: Product, mb: Product): CompatibilityIssue | null {
  const cs = extractSocket(cpu.specifications);
  const ms = extractSocket(mb.specifications);
  if (cs && ms && cs !== ms) return { severity: 'Error', component1: cpu.name, component2: mb.name, message: `CPU socket ${cs} incompatible with motherboard socket ${ms}`, suggestion: `Choose motherboard with socket ${cs}` };
  return null;
}

function checkRAM(ram: Product, mb: Product): CompatibilityIssue | null {
  const rt = extractMemoryType(ram.specifications);
  const mt = extractMemoryType(mb.specifications);
  if (rt && mt && rt !== mt) return { severity: 'Error', component1: ram.name, component2: mb.name, message: `RAM type ${rt} not supported by motherboard (${mt})`, suggestion: `Choose ${mt} memory` };
  const rc = extractRAMCapacity(ram.specifications);
  const mm = extractMaxMemory(mb.specifications);
  if (rc > mm) return { severity: 'Warning', component1: ram.name, component2: mb.name, message: `RAM capacity ${rc}GB exceeds motherboard max ${mm}GB`, suggestion: `Choose motherboard supporting ${rc}+ GB` };
  return null;
}

function checkCooler(cooling: Product, cpu: Product): CompatibilityWarning | null {
  const cs = extractSocket(cpu.specifications);
  const ss = extractSupportedSockets(cooling.specifications);
  if (cs && ss.length > 0 && !ss.includes(cs)) return { severity: 'Warning', component: cooling.name, message: `Cooler may not support socket ${cs}`, suggestion: `Verify cooler compatibility with ${cs}` };
  const maxTdp = extractMaxCoolerTDP(cooling.specifications);
  const cpuTdp = extractTDP(cpu.specifications);
  if (maxTdp > 0 && cpuTdp > maxTdp) return { severity: 'Warning', component: cooling.name, message: `Cooler (max TDP ${maxTdp}W) may be insufficient for ${cpu.name} (${cpuTdp}W)`, suggestion: `Choose cooler with TDP >= ${cpuTdp}W` };
  return null;
}

function checkPSU(psu: Product, cpu: Product | null | undefined, gpu: Product | null | undefined): CompatibilityWarning | null {
  const pw = extractPSUWattage(psu.specifications);
  if (!pw) return null;
  const ct = cpu ? extractTDP(cpu.specifications) : 0;
  const gt = gpu ? extractTDP(gpu.specifications) : 0;
  const total = ct + gt + 50;
  const rec = Math.ceil(total * 1.3 / 50) * 50;
  if (pw < total) return { severity: 'Warning', component: psu.name, message: `PSU ${pw}W insufficient (need ${total}W). Recommended ${rec}W`, suggestion: `Choose PSU >= ${rec}W` };
  if (pw < rec) return { severity: 'Warning', component: psu.name, message: `PSU ${pw}W meets minimum but recommended ${rec}W`, suggestion: `Consider PSU >= ${rec}W` };
  return null;
}

function checkCaseFF(chassis: Product, mb: Product): CompatibilityIssue | null {
  const ff = extractFormFactor(mb.specifications);
  const sf = extractSupportedFormFactors(chassis.specifications);
  if (ff && sf.length > 0 && !sf.includes(ff)) return { severity: 'Error', component1: chassis.name, component2: mb.name, message: `Case does not support ${ff} form factor`, suggestion: `Supported: ${sf.join(', ')}` };
  return null;
}

function checkGPULen(chassis: Product, gpu: Product): CompatibilityWarning | null {
  const ml = extractMaxGPULength(chassis.specifications);
  const gl = extractGPULength(gpu.specifications);
  if (ml && gl && gl > ml) return { severity: 'Warning', component: gpu.name, message: `GPU length ${gl}mm may exceed case max ${ml}mm`, suggestion: `Choose shorter GPU or larger case` };
  return null;
}

function checkCoolerHeightCheck(cooling: Product, chassis: Product): CompatibilityIssue | null {
  const coolerType = extractCoolerType(cooling.specifications);
  if (coolerType && coolerType.toLowerCase() !== 'air' && coolerType.toLowerCase() !== 'tower') return null;
  const ch = extractCoolerHeight(cooling.specifications);
  const mch = extractMaxCoolerHeight(chassis.specifications);
  if (ch > 0 && mch && ch > mch) return { severity: 'Error', component1: cooling.name, component2: chassis.name, message: `Cooler height ${ch}mm exceeds case max ${mch}mm`, suggestion: `Choose cooler <= ${mch}mm, AIO, or larger case` };
  return null;
}

function checkIG(cpu: Product, gpu: Product | null | undefined): CompatibilityWarning | null {
  if (gpu || hasIntegratedGraphics(cpu.specifications)) return null;
  return { severity: 'Warning', component: cpu.name, message: 'No GPU selected and CPU has no integrated graphics', suggestion: 'Add a discrete GPU or choose CPU with iGPU' };
}

// ──────────── Power calculation ────────────
export function calculatePowerConsumption(components: ComponentMap): number {
  let t = 50;
  if (components.cpu) t += extractTDP(components.cpu.specifications) || 65;
  if (components.gpu) t += extractTDP(components.gpu.specifications) || 150;
  if (components.storage) t += 5;
  if (components.cooling) t += 10;
  return t;
}

export function calculateRecommendedPSU(components: ComponentMap): number {
  return Math.ceil(calculatePowerConsumption(components) * 1.4 / 50) * 50;
}

// ──────────── Main compatibility check ────────────
export function checkCompatibility(components: ComponentMap): CompatibilityCheckResult {
  const issues: CompatibilityIssue[] = [];
  const warnings: CompatibilityWarning[] = [];
  const { cpu, gpu, motherboard, ram, psu, case: chassis, cooling } = components;

  // Socket CPU ↔ MB + BIOS warning
  if (cpu && motherboard) {
    const i = checkCPUSocket(cpu, motherboard);
    if (i) issues.push(i);
    // BIOS warning
    const cpuSocket = extractSocket(cpu.specifications);
    const chipset = extractChipset(motherboard.specifications);
    const biosW = checkBiosWarning(cpuSocket, chipset);
    if (biosW) warnings.push(biosW);
  }

  // RAM compatibility
  if (ram && motherboard) {
    const i = checkRAM(ram, motherboard);
    if (i) {
      if (i.severity === 'Error') issues.push(i);
      else warnings.push({ severity: i.severity as 'Warning'|'Info', component: i.component1, message: i.message, suggestion: i.suggestion });
    }
  }

  // Cooler
  if (cooling && cpu) { const w = checkCooler(cooling, cpu); if (w) warnings.push(w); }
  if (cooling && chassis) { const i = checkCoolerHeightCheck(cooling, chassis); if (i) issues.push(i); }

  // PSU
  if (psu) { const w = checkPSU(psu, cpu, gpu); if (w) warnings.push(w); }

  // Case form factor
  if (chassis && motherboard) { const i = checkCaseFF(chassis, motherboard); if (i) issues.push(i); }
  if (chassis && gpu) { const w = checkGPULen(chassis, gpu); if (w) warnings.push(w); }

  // No iGPU
  if (cpu) { const w = checkIG(cpu, gpu); if (w) warnings.push(w); }

  // Bottleneck detection
  let bottleneckPct = 0;
  if (cpu && gpu) {
    const cpuScore = extractPerformanceScore(cpu.specifications);
    const gpuScore = extractPerformanceScore(gpu.specifications);
    bottleneckPct = calculateBottleneck(cpuScore, gpuScore);
    const bnWarnings = detectBottleneckWarnings(cpuScore, gpuScore, cpu.name, gpu.name);
    warnings.push(...bnWarnings);
  }

  // RAM capacity warning
  if (ram && extractRAMCapacity(ram.specifications) > 0 && extractRAMCapacity(ram.specifications) < 16) {
    warnings.push({ severity: 'Info', component: ram.name, message: `${extractRAMCapacity(ram.specifications)}GB RAM may be insufficient for modern tasks`, suggestion: 'Consider 16GB+' });
  }

  // Storage slot compatibility
  const storageProduct = components.storage;
  if (storageProduct && motherboard) {
    const storageType = extractStorageType(storageProduct.specifications);
    const mbM2Slots = config.storageDefaults?.mbDefaultM2Slots ?? 2;
    const mbSataPorts = config.storageDefaults?.mbDefaultSataPorts ?? 4;
    if (storageType === 'm2' && mbM2Slots < 1) {
      issues.push({
        severity: 'Error',
        component1: storageProduct.name,
        component2: motherboard.name,
        message: `Накопитель ${storageProduct.name} требует M.2 слот, на материнской плате нет доступных слотов`,
        suggestion: 'Выберите материнскую плату с поддержкой M.2 или SATA-накопитель',
      });
    }
    if (storageType === 'sata' && mbSataPorts < 1) {
      issues.push({
        severity: 'Error',
        component1: storageProduct.name,
        component2: motherboard.name,
        message: `Накопитель ${storageProduct.name} требует SATA-порт, на материнской плате нет доступных портов`,
        suggestion: 'Выберите материнскую плату с достаточным количеством SATA-портов или M.2-накопитель',
      });
    }
  }

  const pc = calculatePowerConsumption(components);
  const rp = calculateRecommendedPSU(components);
  return { isCompatible: issues.length === 0, issues, warnings, powerConsumption: pc, recommendedPSU: rp, bottleneckPercentage: bottleneckPct };
}

export function getCompatibilityStatus(result: CompatibilityCheckResult): 'ok' | 'warning' | 'error' {
  if (result.issues.length > 0) return 'error';
  if (result.warnings.length > 0) return 'warning';
  return 'ok';
}

export function getAllMessages(result: CompatibilityCheckResult): Array<{ severity: CompatibilitySeverity; message: string; suggestion?: string }> {
  const msgs: Array<{ severity: CompatibilitySeverity; message: string; suggestion?: string }> = [];
  for (const i of result.issues) msgs.push({ severity: i.severity, message: `[${i.component1} ↔ ${i.component2}] ${i.message}`, suggestion: i.suggestion });
  for (const w of result.warnings) msgs.push({ severity: w.severity, message: `[${w.component}] ${w.message}`, suggestion: w.suggestion });
  const order: Record<CompatibilitySeverity, number> = { Error: 0, Warning: 1, Info: 2 };
  return msgs.sort((a, b) => order[a.severity] - order[b.severity]);
}

export function isComponentCompatible(componentType: ComponentCategory, product: Product, current: ComponentMap): { compatible: boolean; issues: string[]; warnings: string[] } {
  const issues: string[] = [];
  const warnings: string[] = [];
  const test: ComponentMap = { ...current, [componentType]: product };

  // CPU ↔ MB socket
  if (componentType === 'cpu' && test.motherboard) {
    const cs = extractSocket(product.specifications); const ms = extractSocket(test.motherboard!.specifications);
    if (cs && ms && cs !== ms) issues.push(`Socket ${cs} incompatible with motherboard (${ms})`);
  }
  if (componentType === 'motherboard' && test.cpu) {
    const cs = extractSocket(test.cpu!.specifications); const ms = extractSocket(product.specifications);
    if (cs && ms && cs !== ms) issues.push(`Motherboard socket ${ms} incompatible with CPU (${cs})`);
  }

  // RAM ↔ MB memory type
  if (componentType === 'ram' && test.motherboard) {
    const rt = extractMemoryType(product.specifications); const mt = extractMemoryType(test.motherboard!.specifications);
    if (rt && mt && rt !== mt) issues.push(`RAM ${rt} not supported by motherboard (${mt})`);
  }
  if (componentType === 'motherboard' && test.ram) {
    const rt = extractMemoryType(test.ram!.specifications); const mt = extractMemoryType(product.specifications);
    if (rt && mt && rt !== mt) issues.push(`Motherboard supports ${mt}, RAM is ${rt}`);
  }

  // CPU socket → RAM type (AM4→DDR4, AM5→DDR5 via socket groups)
  if (componentType === 'ram' && test.cpu && !test.motherboard) {
    const cpuSocket = extractSocket(test.cpu.specifications);
    const group = cpuSocket ? findSocketGroup(cpuSocket) : null;
    if (group && group.ramType) {
      const ramType = extractMemoryType(product.specifications);
      if (ramType && ramType !== group.ramType && ramType !== (group.ramTypeAlternate ?? '')) {
        issues.push(`RAM ${ramType} несовместима с процессором ${cpuSocket} (требуется ${group.ramType})`);
      }
    }
  }

  // RAM type consistency — all selected RAM should match each other
  if (componentType === 'ram' && test.ram) {
    const newRt = extractMemoryType(product.specifications);
    if (newRt) {
      const existingType = extractMemoryType(test.ram.specifications);
      if (existingType && existingType !== newRt) {
        issues.push(`Несовместимый тип памяти: выбрана ${newRt}, но уже есть ${existingType}`);
      }
    }
  }

  // Case ↔ MB form factor
  if (componentType === 'case' && test.motherboard) {
    const ff = extractFormFactor(test.motherboard!.specifications); const sf = extractSupportedFormFactors(product.specifications);
    if (ff && sf.length > 0 && !sf.includes(ff)) issues.push(`Case does not support ${ff}`);
  }
  if (componentType === 'motherboard' && test.case) {
    const ff = extractFormFactor(product.specifications); const sf = extractSupportedFormFactors(test.case!.specifications);
    if (ff && sf.length > 0 && !sf.includes(ff)) issues.push(`Form factor ${ff} not supported by case`);
  }

  // GPU length vs case max GPU length
  if (componentType === 'gpu' && test.case) {
    const gpuLen = extractGPULength(product.specifications);
    const maxLen = extractMaxGPULength(test.case.specifications);
    if (gpuLen && maxLen && gpuLen > maxLen) {
      issues.push(`Видеокарта ${gpuLen}мм не поместится в корпус (макс. ${maxLen}мм)`);
    }
  }
  if (componentType === 'case' && test.gpu) {
    const gpuLen = extractGPULength(test.gpu.specifications);
    const maxLen = extractMaxGPULength(product.specifications);
    if (gpuLen && maxLen && gpuLen > maxLen) {
      issues.push(`Видеокарта ${gpuLen}мм не поместится в этот корпус (макс. ${maxLen}мм)`);
    }
  }

  // Cooler socket vs CPU socket
  if (componentType === 'cooling' && test.cpu) {
    const cpuSocket = extractSocket(test.cpu.specifications);
    const supported = extractSupportedSockets(product.specifications);
    if (cpuSocket && supported.length > 0 && !supported.includes(cpuSocket)) {
      issues.push(`Кулер не поддерживает сокет ${cpuSocket}`);
    }
  }
  if (componentType === 'cpu' && test.cooling) {
    const cpuSocket = extractSocket(product.specifications);
    const supported = extractSupportedSockets(test.cooling.specifications);
    if (cpuSocket && supported.length > 0 && !supported.includes(cpuSocket)) {
      issues.push(`Кулер не поддерживает сокет процессора ${cpuSocket}`);
    }
  }

  // Cooler height vs case max height
  if (componentType === 'cooling' && test.case) {
    const coolerType = extractCoolerType(product.specifications)?.toLowerCase();
    const isAir = !coolerType || coolerType === 'air' || coolerType === 'tower';
    if (isAir) {
      const ch = extractCoolerHeight(product.specifications);
      const mch = extractMaxCoolerHeight(test.case.specifications);
      if (ch > 0 && mch && ch > mch) {
        issues.push(`Кулер ${ch}мм не поместится в корпус (макс. ${mch}мм)`);
      }
    }
  }

  // Cooler TDP vs CPU TDP (warning-level)
  if (componentType === 'cooling' && test.cpu) {
    const maxTdp = extractMaxCoolerTDP(product.specifications);
    const cpuTdp = extractTDP(test.cpu.specifications);
    if (maxTdp > 0 && cpuTdp > 0 && cpuTdp > maxTdp) {
      warnings.push(`Кулер может не справиться с TDP процессора (TDP ${cpuTdp}W > макс. ${maxTdp}W)`);
    }
  }

  // GPU ↔ PSU wattage — GPU selected, PSU candidate
  if (componentType === 'psu' && (test.gpu?.product || test.cpu?.product)) {
    const gpuTdp = test.gpu?.product ? extractTDP(test.gpu.product.specifications) : 0;
    const cpuTdp = test.cpu?.product ? extractTDP(test.cpu.product.specifications) : 0;
    const minWattage = gpuTdp + cpuTdp + 50;
    const psuWattage = extractPSUWattage(product.specifications);
    if (minWattage > 0 && psuWattage > 0 && psuWattage < minWattage) {
      issues.push(`БП ${psuWattage}Вт недостаточен для сборки (нужно минимум ~${minWattage}Вт)`);
    }
  }

  // GPU ↔ PSU wattage — PSU selected, GPU candidate
  if (componentType === 'gpu' && test.psu?.product) {
    const psuWattage = extractPSUWattage(test.psu.product.specifications);
    const cpuTdp = test.cpu?.product ? extractTDP(test.cpu.product.specifications) : 0;
    const gpuTdp = extractTDP(product.specifications);
    const needed = gpuTdp + cpuTdp + 50;
    if (needed > psuWattage) {
      issues.push(`GPU TDP ${gpuTdp}Вт превышает бюджет БП ${psuWattage}Вт (нужно ~${needed}Вт)`);
    }
  }

  return { compatible: issues.length === 0, issues, warnings };
}
