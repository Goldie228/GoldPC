/**
 * Extractors - extracted from monolithic compatibilityUtils.ts
 * Pure functions for extracting and normalizing product specifications
 */

import type { Product, ProductSpecifications, ProductSummary } from '../../../api/types';
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
  if (upper.startsWith('DDR4') || upper.startsWith('LPDDR4') || upper.startsWith('LPDDR4X')) return 'DDR4';
  if (upper.startsWith('DDR3') || upper.startsWith('LPDDR3') || upper.startsWith('DDR3L')) return 'DDR3';
  if (upper.startsWith('LPDDR5')) return 'LPDDR5';
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

export function extractRAMSpeed(specs: ProductSpecifications | undefined): number | null {
  return getNumber(specs, 'speed', 'memorySpeed', 'memory_speed', 'frequency', 'chastota', 'ramSpeed', 'ramFrequency');
}
export function extractBaseRAMSpeed(specs: ProductSpecifications | undefined): number | null {
  return getNumber(specs, 'baseSpeed', 'base_speed', 'baseFrequency', 'jedecSpeed', 'jedec_speed', 'jedecFrequency');
}
export function extractThermalPasteIncluded(specs: ProductSpecifications | undefined): boolean | null {
  if (!specs) return null;
  const rec = specs as Record<string, unknown>;
  const val = rec.includesThermalPaste ?? rec.thermalPasteIncluded ?? rec.hasThermalPaste ?? rec.thermal_paste_included ?? rec.includes_thermal_paste;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const l = val.trim().toLowerCase();
    if (l === 'true' || l === 'да' || l === 'yes') return true;
    if (l === 'false' || l === 'нет' || l === 'no') return false;
  }
  return null;
}
export function extractCPUOverclockable(specs: ProductSpecifications | undefined): boolean | null {
  if (!specs) return null;
  const rec = specs as Record<string, unknown>;
  // Check by model series (e.g., Intel K-series, AMD X-series)
  const modelRaw = getString(specs, 'unlockedMultiplier', 'overclockable', 'model_series', 'modelSeries');
  if (modelRaw) {
    const upper = modelRaw.toUpperCase();
    if (upper.includes('K') || upper.includes('KF') || upper.includes('X') || upper.includes('UNLOCKED')) return true;
  }
  // Check by boolean field
  const val = rec.overclockable ?? rec.unlocked;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const l = val.trim().toLowerCase();
    if (l === 'true' || l === 'да' || l === 'yes') return true;
    if (l === 'false' || l === 'нет' || l === 'no') return false;
  }
  return null;
}
export function extractTPMSupport(specs: ProductSpecifications | undefined): boolean | null {
  if (!specs) return null;
  const rec = specs as Record<string, unknown>;
  const val = rec.tpmSupport ?? rec.tpm_support ?? rec.tpm ?? rec.firmwareTPM ?? rec.supportsWindows11;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const l = val.trim().toLowerCase();
    if (l === 'true' || l === 'да' || l === 'yes' || l === '2.0') return true;
    if (l === 'false' || l === 'нет' || l === 'no' || l === '0') return false;
  }
  return null;
}
export function extractRAMECCSupport(specs: ProductSpecifications | undefined): string | null {
  const raw = getString(specs, 'ecc', 'eccSupport', 'errorCorrection');
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (upper.includes('ECC') && !upper.includes('NON')) return 'ecc';
  if (upper.includes('NON-ECC') || upper.includes('NONECC') || upper.includes('NON ECC') || upper.includes('NO')) return 'non-ecc';
  return null;
}
export function extractMBECCSupport(specs: ProductSpecifications | undefined): boolean | null {
  const raw = getString(specs, 'eccSupport', 'ecc');
  if (raw === null) return null;
  const upper = raw.toUpperCase();
  if (upper.includes('YES') || upper.includes('TRUE') || upper.includes('ДА') || upper.includes('NON-ECC') || upper.includes('BOTH')) return true;
  if (upper.includes('NO') || upper.includes('FALSE') || upper.includes('НЕТ')) return false;
  return null;
}
export function extractMemoryRank(specs: ProductSpecifications | undefined): string | null {
  const raw = getString(specs, 'rank', 'ranks', 'rankCount', 'memoryRank', 'memory_rank');
  if (!raw) return null;
  const upper = raw.toUpperCase().replace(/\s+/g, '');
  if (upper.includes('2RX8') || upper.includes('2RX16') || upper.includes('DUAL') || upper.includes('2R')) return 'dual';
  if (upper.includes('1RX8') || upper.includes('1RX16') || upper.includes('SINGLE') || upper.includes('1R')) return 'single';
  const n = parseFloat(raw);
  if (n === 2) return 'dual';
  if (n === 1) return 'single';
  return null;
}
export function extractM2Interface(specs: ProductSpecifications | undefined): string | null {
  const raw = getString(specs, 'interface', 'protocol', 'm2Interface');
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (upper.includes('SATA')) return 'sata';
  if (upper.includes('NVME') || upper.includes('PCI') || upper.includes('M.2')) return 'nvme';
  // Если form_factor M.2, пытаемся определить по типу
  const ff = getString(specs, 'form_factor', 'formFactor');
  if (ff && ff.toUpperCase().includes('M.2')) {
    const type = getString(specs, 'type', 'storageType', 'storage_type');
    if (type && type.toUpperCase() === 'NVME') return 'nvme';
    if (type && type.toUpperCase() === 'SATA') return 'sata';
  }
  return null;
}
export function extractPCIeGeneration(specs: ProductSpecifications | undefined): number | null {
  const raw = getString(specs, 'pcieVersion', 'pcieGeneration', 'interface', 'protocol');
  if (!raw) return null;
  const match = raw.match(/(\d)\.?\d*\s*(?:x\d)?/);
  if (match) return parseInt(match[1], 10);
  return null;
}
export function extractM2Key(specs: ProductSpecifications | undefined): string | null {
  return getString(specs, 'm2Key', 'm2_key', 'key', 'mKey');
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

// ===== НОВЫЕ EXTRACTORS =====

/** Сколько EPS12V (8-pin CPU) разъёмов нужно материнской плате */
export function extractRequiredEPSConnectors(specs: ProductSpecifications | undefined): number {
  const raw = getString(specs, 'cpuPowerConnectors', 'epsConnectors', 'cpuPower', 'atx12vConnectors', 'cpuPowerPin');
  if (!raw) return 1; // Default: 1 EPS
  const upper = raw.toUpperCase();
  // "8+4-pin", "8+4 pin", "8+8", "8+8-pin" = 2 EPS
  if (upper.includes('8+4') || upper.includes('8+8') || upper.includes('8+4+4')) return 2;
  // "8-pin" = 1 EPS
  return 1;
}

/** Сколько EPS12V кабелей даёт БП */
export function extractPSUEPSPcieCount(specs: ProductSpecifications | undefined): number {
  const raw = getString(specs, 'cpuPowerCables', 'epsCables', 'cpuConnectors');
  if (!raw) return 1; // Default: 1
  const upper = raw.toUpperCase();
  if (upper.includes('2X') || upper.includes('2×') || upper.includes('2+')) return 2;
  if (upper.includes('1X') || upper.includes('1×') || upper.startsWith('1')) return 1;
  const n = parseFloat(raw);
  if (!isNaN(n)) return Math.max(1, Math.round(n));
  return 1;
}

/** Сколько PCIe (6+2-pin) кабелей даёт БП */
export function extractPSUPCIeCableCount(specs: ProductSpecifications | undefined): number {
  const raw = getString(specs, 'pcieCables', 'pcieConnectors', 'gpuPowerCables', 'pciePowerCables');
  if (!raw) return 2; // Default: 2
  const upper = raw.toUpperCase();
  if (upper.includes('3X') || upper.includes('3×') || upper.includes('3+')) return 3;
  if (upper.includes('4X') || upper.includes('4×') || upper.includes('4+')) return 4;
  if (upper.includes('2X') || upper.includes('2×') || upper.includes('2+') || upper.startsWith('2')) return 2;
  if (upper.includes('1X') || upper.includes('1×') || upper.startsWith('1')) return 1;
  const n = parseFloat(raw);
  if (!isNaN(n)) return Math.max(1, Math.round(n));
  return 2;
}

/** Сколько PCIe 8-pin коннекторов требует GPU */
export function extractGPURequiredConnectors(specs: ProductSpecifications | undefined): { count: number; has12VHPWR: boolean } {
  const raw = getString(specs, 'powerConnectors', 'pciePowerConnectors', 'powerConnector');
  if (!raw) return { count: 0, has12VHPWR: false };
  const upper = raw.toUpperCase();
  const has12VHPWR = upper.includes('12VHPWR') || upper.includes('12V-2X6') || upper.includes('12V 2X6');
  // Extract number of 8-pin connectors
  let count = 0;
  if (upper.includes('4X') || upper.includes('4×')) count = 4;
  else if (upper.includes('3X') || upper.includes('3×')) count = 3;
  else if (upper.includes('2X') || upper.includes('2×') || upper.includes('2+')) count = 2;
  else if (has12VHPWR) count = 1; // 12VHPWR counts as 1 special connector
  else if (upper.includes('1X') || upper.includes('1×') || !upper.includes('X') && !upper.includes('×')) count = 1;
  // Check for numeric prefix
  const match = raw.match(/(\d+)\s*[xх×]/i);
  if (match) count = parseInt(match[1], 10);
  return { count, has12VHPWR };
}

/** Толщина GPU в слотах (2, 2.5, 3, 3.5) */
export function extractGPUSlotWidth(specs: ProductSpecifications | undefined): number | null {
  return getNumber(specs, 'slotWidth', 'thickness', 'gpuSlots', 'occupiesSlots', 'slotSize');
}

/** Количество слотов расширения в корпусе */
export function extractExpansionSlots(specs: ProductSpecifications | undefined): number | null {
  return getNumber(specs, 'expansionSlots', 'pcieSlots', 'rearSlots', 'expansionSlotsCount');
}

/** Количество фаз VRM на материнской плате */
export function extractVRMPhases(specs: ProductSpecifications | undefined): number | null {
  return getNumber(specs, 'vrmPhases', 'vrm_phases', 'powerPhase', 'vrmPhaseCount', 'vrmPhasesTotal');
}

/** TDP, который VRM материнской платы может выдержать */
export function extractVRMMaxTDP(specs: ProductSpecifications | undefined): number | null {
  return getNumber(specs, 'vrmMaxTdp', 'vrm_max_tdp', 'vrmCapacity', 'vrmTdpLimit');
}

/** Максимальная поддерживаемая частота RAM на материнской плате */
export function extractMaxRamSpeed(specs: ProductSpecifications | undefined): number | null {
  return getNumber(specs, 'maxMemorySpeed', 'max_ram_speed', 'memorySpeedSupport', 'maxRamSpeed', 'ramSpeedSupport');
}

/** Максимальная скорость RAM, поддерживаемая контроллером памяти процессора (IMC) на основе группы сокета */
export function extractCPUMaxRamSpeed(socket: string | null): number | null {
  if (!socket) return null;
  const group = SOCKET_GROUPS.find(g => g.sockets.includes(socket));
  return group?.maxRamSpeed ?? null;
}

/** Высота радиатора RAM */
export function extractRAMHeight(specs: ProductSpecifications | undefined): number | null {
  return getNumber(specs, 'height', 'ramHeight', 'moduleHeight', 'radiatorHeight');
}

/** Максимальная высота RAM под башенным кулером (зазор) */
export function extractCoolerRAMClearance(specs: ProductSpecifications | undefined): number | null {
  return getNumber(specs, 'maxRamHeight', 'ramClearance', 'overhangWidth', 'ramClearanceHeight');
}

/** Тип RGB заголовков на MB: '5v-argb' | '12v-rgb' | 'both' | null */
export function extractRGBHeaderType(specs: ProductSpecifications | undefined): string | null {
  const raw = getString(specs, 'rgbHeaders', 'argbHeaders', 'rgbHeaderType', 'lightingHeaders');
  if (!raw) return null;
  const upper = raw.toUpperCase();
  const has5v = upper.includes('5V') || upper.includes('ARGB') || upper.includes('ADDRESSABLE');
  const has12v = upper.includes('12V') || upper.includes('RGB') || (upper.includes('RGB') && !has5v);
  if (has5v && has12v) return 'both';
  if (has5v) return '5v-argb';
  if (has12v) return '12v-rgb';
  return null;
}

/** Тип RGB у корпуса/вентиляторов: '5v-argb' | '12v-rgb' | null */
export function extractComponentRGBType(specs: ProductSpecifications | undefined): string | null {
  const raw = getString(specs, 'rgbType', 'argbType', 'lightingConnector', 'rgbConnection');
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (upper.includes('5V') || upper.includes('ARGB') || upper.includes('ADDRESSABLE')) return '5v-argb';
  if (upper.includes('12V') || upper.includes('RGB') || upper.includes('4-PIN')) return '12v-rgb';
  return null;
}

/** Количество системных fan headers на MB */
export function extractFanHeaderCount(specs: ProductSpecifications | undefined): number | null {
  return getNumber(specs, 'fanHeaders', 'fanHeaderCount', 'sysFanHeaders', 'chassisFanHeaders', 'systemFanHeaders');
}

/** Наличие USB 3.2 Gen 2 Type-E заголовка на MB */
export function extractHasUSB3HeaderC(specs: ProductSpecifications | undefined): boolean | null {
  const raw = getString(specs, 'usbCHeader', 'usbTypeEHeader', 'frontUsbCHeader', 'usb3Gen2Header', 'usbCGen2Header');
  if (raw === null) return null;
  const upper = raw.toUpperCase();
  return upper.includes('YES') || upper.includes('ДА') || upper.includes('TRUE') || upper.includes('1') || upper.includes('E') || upper.includes('TYPE-E') || upper.includes('USB-C');
}

/** Наличие USB-C на фронтальной панели корпуса */
export function extractCaseHasUSBC(specs: ProductSpecifications | undefined): boolean | null {
  const raw = getString(specs, 'frontUsbC', 'hasUsbc', 'usbCPort', 'frontPanelConnector');
  if (raw === null) return null;
  const upper = raw.toUpperCase();
  return upper.includes('YES') || upper.includes('ДА') || upper.includes('TRUE') || upper.includes('1') || (upper.includes('USB') && upper.includes('C'));
}

/** Версия PCIe слота на MB */
export function extractMBPCIeVersion(specs: ProductSpecifications | undefined): number | null {
  const raw = getString(specs, 'pcieVersion', 'pcieSlotsVersion', 'pcieX16Version', 'pcieInterface');
  if (!raw) return null;
  const match = raw.match(/(\d)\.?\d*/);
  if (match) return parseInt(match[1], 10);
  return null;
}

/** Поддержка ATX 3.0 у БП */
export function extractATX3Support(specs: ProductSpecifications | undefined): boolean | null {
  const raw = getString(specs, 'atx3', 'atx3Compatible', 'atxStandard', 'atxVersion');
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (upper.includes('ATX3') || upper.includes('ATX 3') || upper.includes('3.0')) return true;
  return null;
}

/** Длина кабеля CPU EPS от БП (в мм) */
export function extractPSUEPSLength(specs: ProductSpecifications | undefined): number | null {
  return getNumber(specs, 'epsLength', 'cpuCableLength', 'epsCableLength', 'cpuPowerCableLength');
}

/** Глубина корпуса (мм) */
export function extractCaseDepth(specs: ProductSpecifications | undefined): number | null {
  return getNumber(specs, 'depth', 'caseDepth');
}

/** Проверка бренда БП: 'trusted' | 'unknown' */
export function extractPSUBrandSafety(specs: ProductSpecifications | undefined): 'trusted' | 'unknown' | null {
  const brand = getString(specs, 'brand', 'manufacturer');
  if (!brand) return null;
  const TRUSTED_BRANDS = new Set([
    'SEASONIC', 'CORSAIR', 'EVGA', 'BE QUIET', 'BEQUIET', 'SUPER FLOWER', 'COOLER MASTER', 'COOLERMASTER',
    'FSP', 'CHIEFTEC', 'THERMALTAKE', 'ASUS', 'MSI', 'GIGABYTE', 'PHANTEKS', 'NZXT', 'FRACTAL', 'FRACTAL DESIGN',
    'SILVERSTONE', 'SILVER STONE', 'LEC', 'LIAN LI', 'LIAN LI', 'DEEPCOOL', 'ENHANCE', 'DELTA'
  ]);
  const upper = brand.toUpperCase().trim();
  for (const trusted of TRUSTED_BRANDS) {
    if (upper.includes(trusted)) return 'trusted';
  }
  return 'unknown';
}

/** Количество вентиляторов в корпусе/комплекте */
export function extractFanCount(specs: ProductSpecifications | undefined): number | null {
  return getNumber(specs, 'fanCount', 'fans', 'fan', 'includedFans', 'fanMounts');
}

/** Поддержка M.2 SATA протокола в указанном M.2 слоте MB */
export function extractM2SataSupport(specs: ProductSpecifications | undefined): boolean {
  const raw = getString(specs, 'm2SataSupport', 'm2Mode', 'm2ProtocolSupport');
  if (!raw) return false;
  return raw.toUpperCase().includes('SATA') || raw.toUpperCase().includes('BOTH');
}

/**
 * Helper: check if object has a specific property and is not null/undefined.
 */
function hasProp<K extends string>(obj: unknown, prop: K): obj is Record<K, unknown> {
  return obj != null && typeof obj === 'object' && prop in obj;
}

/**
 * Extract memory type with ProductSummary fallback.
 * Checks ProductSummary.memoryType first, then falls back to specs lookup.
 */
export function extractMemoryTypeWithFallback(
  product: ProductSummary | Product,
  specs: ProductSpecifications | undefined
): MemoryType | null {
  // First check ProductSummary direct field
  if (hasProp(product, 'memoryType') && typeof (product as Record<string, unknown>).memoryType === 'string') {
    const val = (product as Record<string, unknown>).memoryType as string;
    const upper = val.toUpperCase().trim();
    if (upper.startsWith('DDR5')) return 'DDR5';
    if (upper.startsWith('DDR4') || upper.startsWith('LPDDR4') || upper.startsWith('LPDDR4X')) return 'DDR4';
    if (upper.startsWith('DDR3') || upper.startsWith('LPDDR3') || upper.startsWith('DDR3L')) return 'DDR3';
    if (upper.startsWith('LPDDR5')) return 'LPDDR5';
  }
  // Fallback to specs
  return extractMemoryType(specs);
}

/**
 * Extract memory form factor with ProductSummary fallback.
 * Checks ProductSummary.memoryFormFactor first, then falls back to specs lookup.
 */
export function extractMemoryFormFactorWithFallback(
  product: ProductSummary | Product,
  specs: ProductSpecifications | undefined
): MemoryFormFactor | null {
  // First check ProductSummary direct field
  if (hasProp(product, 'memoryFormFactor') && typeof (product as Record<string, unknown>).memoryFormFactor === 'string') {
    const val = (product as Record<string, unknown>).memoryFormFactor as string;
    const upper = val.toUpperCase().trim();
    if (upper.includes('SO-DIMM') || upper.includes('SODIMM')) return 'SO-DIMM';
    if (upper.includes('DIMM')) return 'DIMM';
  }
  // Fallback to specs
  return extractMemoryFormFactor(specs);
}

/**
 * Extract socket with ProductSummary fallback.
 * Checks ProductSummary.socket first, then falls back to specs lookup.
 */
export function extractSocketWithFallback(
  product: ProductSummary | Product,
  specs: ProductSpecifications | undefined
): string | null {
  // First check ProductSummary direct field
  if (hasProp(product, 'socket') && typeof (product as Record<string, unknown>).socket === 'string') {
    const val = (product as Record<string, unknown>).socket as string;
    return KNOWN_SOCKETS.has(val.toUpperCase().trim()) ? val.toUpperCase().trim() : null;
  }
  // Fallback to specs
  return extractSocket(specs);
}

