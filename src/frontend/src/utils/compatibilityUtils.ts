/**
 * Compatibility Utilities - клиентская проверка совместимости компонентов ПК
 * 
 * Зеркало backend логики CompatibilityEngine.
 * @module utils/compatibilityUtils
 */

import type { Product, ProductSpecifications } from '../api/types';

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
}

export type ComponentMap = Partial<Record<ComponentCategory, Product | null>>;

const VALID_SOCKETS = ['AM4', 'AM5', 'LGA1200', 'LGA1700', 'LGA1851'] as const;
export type SocketType = typeof VALID_SOCKETS[number];
const VALID_MEMORY_TYPES = ['DDR4', 'DDR5'] as const;
export type MemoryType = typeof VALID_MEMORY_TYPES[number];
const VALID_FORM_FACTORS = ['ATX', 'MicroATX', 'MiniITX', 'EATX'] as const;
export type FormFactor = typeof VALID_FORM_FACTORS[number];

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

export function extractSocket(specs: ProductSpecifications | undefined): SocketType | null {
  const raw = getString(specs, 'socket', 'cpuSocket', 'soket');
  if (!raw) return null;
  const upper = raw.toUpperCase().trim();
  return (VALID_SOCKETS as readonly string[]).includes(upper) ? upper as SocketType : null;
}

export function extractMemoryType(specs: ProductSpecifications | undefined): MemoryType | null {
  const raw = getString(specs, 'memoryType', 'tip_pamyati', 'type');
  if (!raw) return null;
  const upper = raw.toUpperCase().trim();
  if (upper.startsWith('DDR5')) return 'DDR5';
  if (upper.startsWith('DDR4')) return 'DDR4';
  return null;
}

export function extractFormFactor(specs: ProductSpecifications | undefined): FormFactor | null {
  const raw = getString(specs, 'formFactor', 'form_factor', 'format');
  if (!raw) return null;
  const upper = raw.toUpperCase().trim();
  if (upper === 'ATX' || upper === 'STANDARD ATX') return 'ATX';
  if (upper === 'MICROATX' || upper === 'MICRO-ATX' || upper === 'M-ATX' || upper === 'MATX') return 'MicroATX';
  if (upper === 'MINIITX' || upper === 'MINI-ITX' || upper === 'MITX') return 'MiniITX';
  if (upper === 'EATX' || upper === 'E-ATX' || upper === 'EXTENDED ATX') return 'EATX';
  return null;
}

export function extractSupportedSockets(specs: ProductSpecifications | undefined): string[] {
  if (!specs) return [];
  const rec = specs as Record<string, unknown>;
  const sockets = rec.supportedSockets ?? rec.supported_sockets;
  if (Array.isArray(sockets)) {
    return sockets.filter((s): s is string => typeof s === 'string').map(s => s.toUpperCase().trim());
  }
  const single = getString(specs, 'socket');
  return single ? [single.toUpperCase().trim()] : [];
}

export function extractTDP(specs: ProductSpecifications | undefined): number { return getNumber(specs, 'tdp', 'TDP', 'power_consumption') ?? 0; }
export function extractPSUWattage(specs: ProductSpecifications | undefined): number { return getNumber(specs, 'wattage', 'power', 'moshchnost') ?? 0; }

export function hasIntegratedGraphics(specs: ProductSpecifications | undefined): boolean {
  if (!specs) return false;
  const rec = specs as Record<string, unknown>;
  const ig = rec.integratedGraphics ?? rec.integrated_graphics;
  if (typeof ig === 'boolean') return ig;
  if (typeof ig === 'string') { const l = ig.toLowerCase(); return l === 'true' || l === 'да' || l === 'yes'; }
  return false;
}

export function extractSupportedFormFactors(specs: ProductSpecifications | undefined): FormFactor[] {
  if (!specs) return [];
  const rec = specs as Record<string, unknown>;
  const raw = rec.supportedFormFactors ?? rec.supported_form_factors;
  if (Array.isArray(raw)) {
    return raw.filter((s): s is string => typeof s === 'string').map(s => {
      const u = s.toUpperCase().trim();
      if (u === 'ATX' || u === 'STANDARD ATX') return 'ATX' as FormFactor;
      if (u === 'MICROATX' || u === 'MICRO-ATX' || u === 'M-ATX' || u === 'MATX') return 'MicroATX' as FormFactor;
      if (u === 'MINIITX' || u === 'MINI-ITX' || u === 'MITX') return 'MiniITX' as FormFactor;
      if (u === 'EATX' || u === 'E-ATX') return 'EATX' as FormFactor;
      return null;
    }).filter((s): s is FormFactor => s !== null);
  }
  return [];
}

export function extractMaxGPULength(specs: ProductSpecifications | undefined): number | null { return getNumber(specs, 'maxGPULength', 'max_gpu_length', 'maxGpuLength', 'maxGpuLengthMm'); }
export function extractGPULength(specs: ProductSpecifications | undefined): number | null { return getNumber(specs, 'length', 'lengthMm', 'dlina', 'gpuLength'); }
export function extractRAMCapacity(specs: ProductSpecifications | undefined): number { return getNumber(specs, 'capacity', 'obem', 'size') ?? 0; }
export function extractMaxMemory(specs: ProductSpecifications | undefined): number { return getNumber(specs, 'maxMemory', 'max_memory', 'maxMemoryGb') ?? 128; }

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
  return null;
}

function checkPSU(psu: Product, cpu: Product | null | undefined, gpu: Product | null | undefined): CompatibilityWarning | null {
  const pw = extractPSUWattage(psu.specifications);
  if (!pw) return null;
  const ct = cpu ? extractTDP(cpu.specifications) : 0;
  const gt = gpu ? extractTDP(gpu.specifications) : 0;
  const total = ct + gt + 50;
  const rec = Math.ceil(total * 1.3);
  if (pw < rec) return { severity: 'Warning', component: psu.name, message: `PSU ${pw}W may be insufficient. Recommended ${rec}W`, suggestion: `Choose PSU >= ${rec}W` };
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

function checkIG(cpu: Product, gpu: Product | null | undefined): CompatibilityWarning | null {
  if (gpu || hasIntegratedGraphics(cpu.specifications)) return null;
  return { severity: 'Warning', component: cpu.name, message: 'No GPU selected and CPU has no integrated graphics', suggestion: 'Add a discrete GPU or choose CPU with iGPU' };
}

export function calculatePowerConsumption(components: ComponentMap): number {
  let t = 0;
  if (components.cpu) t += extractTDP(components.cpu.specifications) || 65;
  if (components.gpu) t += extractTDP(components.gpu.specifications) || 150;
  if (components.ram) t += 10;
  if (components.storage) t += 10;
  if (components.cooling) t += 5;
  if (components.motherboard) t += 50;
  return t;
}

export function calculateRecommendedPSU(components: ComponentMap): number {
  return Math.ceil(calculatePowerConsumption(components) * 1.3);
}

export function checkCompatibility(components: ComponentMap): CompatibilityCheckResult {
  const issues: CompatibilityIssue[] = [];
  const warnings: CompatibilityWarning[] = [];
  const { cpu, gpu, motherboard, ram, psu, case: chassis, cooling } = components;
  if (cpu && motherboard) { const i = checkCPUSocket(cpu, motherboard); if (i) issues.push(i); }
  if (ram && motherboard) { const i = checkRAM(ram, motherboard); if (i) { if (i.severity === 'Error') issues.push(i); else warnings.push({ severity: i.severity as 'Warning'|'Info', component: i.component1, message: i.message, suggestion: i.suggestion }); } }
  if (cooling && cpu) { const w = checkCooler(cooling, cpu); if (w) warnings.push(w); }
  if (psu) { const w = checkPSU(psu, cpu, gpu); if (w) warnings.push(w); }
  if (chassis && motherboard) { const i = checkCaseFF(chassis, motherboard); if (i) issues.push(i); }
  if (chassis && gpu) { const w = checkGPULen(chassis, gpu); if (w) warnings.push(w); }
  if (cpu) { const w = checkIG(cpu, gpu); if (w) warnings.push(w); }
  const pc = calculatePowerConsumption(components);
  const rp = calculateRecommendedPSU(components);
  return { isCompatible: issues.length === 0, issues, warnings, powerConsumption: pc, recommendedPSU: rp };
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

export function isComponentCompatible(componentType: ComponentCategory, product: Product, current: ComponentMap): { compatible: boolean; issues: string[] } {
  const issues: string[] = [];
  const test: ComponentMap = { ...current, [componentType]: product };
  if (componentType === 'cpu' && test.motherboard) {
    const cs = extractSocket(product.specifications); const ms = extractSocket(test.motherboard!.specifications);
    if (cs && ms && cs !== ms) issues.push(`Socket ${cs} incompatible with motherboard (${ms})`);
  }
  if (componentType === 'motherboard' && test.cpu) {
    const cs = extractSocket(test.cpu!.specifications); const ms = extractSocket(product.specifications);
    if (cs && ms && cs !== ms) issues.push(`Motherboard socket ${ms} incompatible with CPU (${cs})`);
  }
  if (componentType === 'ram' && test.motherboard) {
    const rt = extractMemoryType(product.specifications); const mt = extractMemoryType(test.motherboard!.specifications);
    if (rt && mt && rt !== mt) issues.push(`RAM ${rt} not supported by motherboard (${mt})`);
  }
  if (componentType === 'motherboard' && test.ram) {
    const rt = extractMemoryType(test.ram!.specifications); const mt = extractMemoryType(product.specifications);
    if (rt && mt && rt !== mt) issues.push(`Motherboard supports ${mt}, RAM is ${rt}`);
  }
  if (componentType === 'case' && test.motherboard) {
    const ff = extractFormFactor(test.motherboard!.specifications); const sf = extractSupportedFormFactors(product.specifications);
    if (ff && sf.length > 0 && !sf.includes(ff)) issues.push(`Case does not support ${ff}`);
  }
  if (componentType === 'motherboard' && test.case) {
    const ff = extractFormFactor(product.specifications); const sf = extractSupportedFormFactors(test.case!.specifications);
    if (ff && sf.length > 0 && !sf.includes(ff)) issues.push(`Form factor ${ff} not supported by case`);
  }
  return { compatible: issues.length === 0, issues };
}
