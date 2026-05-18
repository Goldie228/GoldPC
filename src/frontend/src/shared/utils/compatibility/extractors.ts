/**
 * Extractors - extracted from monolithic compatibilityUtils.ts
 * Pure functions for extracting and normalizing product specifications
 */

import type { ProductSpecifications } from '../../../api/types';
import type { CompatibilityRulesConfig, SocketGroup, MemoryType, MemoryFormFactor } from './types';
import rulesConfig from '../../../config/compatibilityRules.json';

const config: CompatibilityRulesConfig = rulesConfig as unknown as CompatibilityRulesConfig;
const SOCKET_GROUPS: SocketGroup[] = config.socketCompatibility.groups;

const KNOWN_SOCKETS = new Set(
  SOCKET_GROUPS.flatMap(g => g.sockets.map(s => s.toUpperCase().trim()))
);

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
  return getString(specs, 'chipset');
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
  const single = getString(specs, 'formFactor', 'form_factor', 'format');
  if (single) {
    const norm = normalizeFormFactor(single);
    if (norm) return [norm];
  }
  return [];
}

export function extractSupportedPSUFormFactors(specs: ProductSpecifications | undefined): string[] {
  if (!specs) return [];
  const rec = specs as Record<string, unknown>;
  const raw = rec.supportedPSUFormFactors ?? rec.supported_psu_form_factors ?? rec.psuFormFactorSupport ?? rec.psu_form_factor_support;
  if (Array.isArray(raw)) {
    return raw
      .filter((s): s is string => typeof s === 'string')
      .map(s => normalizeFormFactor(s))
      .filter((s): s is string => s !== null);
  }
  const single = getString(specs, 'supportedPSUFormFactors', 'supported_psu_form_factors', 'psuFormFactorSupport', 'psu_form_factor_support', 'formFactor', 'form_factor', 'format');
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
export function extractMemorySlots(specs: ProductSpecifications | undefined): number { return getNumber(specs, 'memorySlots', 'memory_slots', 'slots', 'numberOfSlots') ?? 2; }
export function extractMemoryFormFactor(specs: ProductSpecifications | undefined): MemoryFormFactor | null {
  const raw = getString(specs, 'memoryFormFactor', 'formFactor', 'form_factor', 'type');
  if (!raw) return null;
  const upper = raw.toUpperCase().trim();
  if (upper.includes('SO-DIMM') || upper.includes('SODIMM')) return 'SO-DIMM';
  if (upper.includes('DIMM')) return 'DIMM';
  return null;
}

export function extractSataPorts(specs: ProductSpecifications | undefined): number {
  return getNumber(specs, 'sataPorts', 'sata_ports', 'sata', 'sata3', 'sata 3.0', 'sata ports') ?? 0;
}

export function extractM2Slots(specs: ProductSpecifications | undefined): number {
  return getNumber(specs, 'm2Slots', 'm2_slots', 'm.2', 'm2', 'nvme slots', 'nvme') ?? 0;
}

export function extractStorageType(specs: ProductSpecifications | undefined): 'm2' | 'sata' | 'other' {
  if (!specs) return 'other';
  const type = getString(specs, 'type', 'storageType', 'storage_type');
  const iface = getString(specs, 'interface', 'form_factor');
  if (type && (type.toUpperCase() === 'NVME' || type.toUpperCase() === 'PCIe')) return 'm2';
  if (type?.toUpperCase() === 'SATA') return 'sata';
  if (iface && (iface.toUpperCase() === 'M.2' || iface.toUpperCase() === 'NVME')) return 'm2';
  if (iface?.toUpperCase() === 'SATA') return 'sata';
  return 'other';
}

const FF_ALIASES: Record<string, string> = config.formFactorCompatibility.aliases;

function normalizeFormFactor(raw: string): string | null {
  if (!raw) return null;
  const upper = raw.toUpperCase().trim();
  if (FF_ALIASES[upper]) return FF_ALIASES[upper];
  for (const h of config.formFactorCompatibility.hierarchy) {
    if (h === raw) return h;
  }
  if (upper === 'ATX') return 'ATX';
  if (upper === 'EATX') return 'eATX';
  if (upper === 'MINIITX' || upper === 'MINI-ITX' || upper === 'MITX') return 'Mini-ITX';
  if (upper === 'MICROATX' || upper === 'MICRO-ATX' || upper === 'M-ATX' || upper === 'MATX') return 'micro-ATX';
  return null;
}

export function caseFormFactorsForMB(mbFormFactor: string): string[] {
  const normalized = normalizeFormFactor(mbFormFactor);
  if (!normalized) return [];
  return config.formFactorCompatibility.rules
    .filter(rule => rule.supportedMotherboards.includes(normalized))
    .map(rule => rule.caseFormFactor);
}

export function mbFormFactorsForCase(caseFormFactor: string): string[] {
  const normalized = normalizeFormFactor(caseFormFactor);
  if (!normalized) return [];
  const rule = config.formFactorCompatibility.rules.find(r => r.caseFormFactor === normalized);
  return rule ? rule.supportedMotherboards : [];
}

export { normalizeFormFactor };