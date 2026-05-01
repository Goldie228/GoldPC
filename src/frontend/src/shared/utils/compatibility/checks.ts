/**
 * Check functions - extracted from compatibilityUtils.ts
 * Validation logic for component compatibility
 */

import type { Product, ProductSpecifications } from '../../../../api/types';
import type { CompatibilityIssue, CompatibilityWarning, ComponentMap } from './types';
import {
  extractSocket,
  extractMemoryType,
  extractMemoryFormFactor,
  extractMemorySlots,
  extractRAMCapacity,
  extractMaxMemory,
  extractSupportedSockets,
  extractMaxCoolerTDP,
  extractTDP,
  extractPSUWattage,
  extractFormFactor,
  extractSupportedPSUFormFactors,
  extractSupportedFormFactors,
  extractMaxGPULength,
  extractGPULength,
  extractCoolerType,
  extractCoolerHeight,
  extractMaxCoolerHeight,
  hasIntegratedGraphics,
  extractStorageType,
} from './extractors';

function checkCPUSocket(cpu: Product, mb: Product): CompatibilityIssue | null {
  const cs = extractSocket(cpu.specifications);
  const ms = extractSocket(mb.specifications);
  if (cs && ms && cs !== ms) return { severity: 'Error', component1: cpu.name, component2: mb.name, message: `CPU socket ${cs} incompatible with motherboard socket ${ms}`, suggestion: `Choose motherboard with socket ${cs}` };
  return null;
}

function checkRAM(ram: Product, mb: Product, quantity: number = 1): CompatibilityIssue | null {
  const rt = extractMemoryType(ram.specifications);
  const mt = extractMemoryType(mb.specifications);
  if (rt && mt && rt !== mt) return { severity: 'Error', component1: ram.name, component2: mb.name, message: `RAM type ${rt} not supported by motherboard (${mt})`, suggestion: `Choose ${mt} memory` };

  const rff = extractMemoryFormFactor(ram.specifications);
  const mff = extractMemoryFormFactor(mb.specifications) ?? 'DIMM';
  if (rff && rff !== mff) return { severity: 'Error', component1: ram.name, component2: mb.name, message: `RAM form factor ${rff} incompatible with motherboard (${mff})`, suggestion: `Choose ${mff} memory modules` };

  const slots = extractMemorySlots(mb.specifications);
  if (quantity > slots) return { severity: 'Error', component1: ram.name, component2: mb.name, message: `Cannot select ${quantity} sticks — motherboard only has ${slots} memory slots`, suggestion: `Maximum ${slots} modules` };

  const rc = extractRAMCapacity(ram.specifications);
  const mm = extractMaxMemory(mb.specifications);
  const totalCapacity = rc * quantity;
  if (totalCapacity > mm) return { severity: 'Warning', component1: ram.name, component2: mb.name, message: `Total RAM capacity ${totalCapacity}GB exceeds motherboard max ${mm}GB`, suggestion: `Choose smaller modules or motherboard supporting ${totalCapacity}+ GB` };

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

function checkPSU(psu: Product, cpu: Product | null | undefined, gpu: Product | null | undefined, caseComponent: Product | null = null): CompatibilityIssue | null {
  const pw = extractPSUWattage(psu.specifications);
  if (!pw) return null;

  const components: ComponentMap = { cpu, gpu };
  const totalPowerConsumption = calculatePowerConsumption(components);

  const requiredPower = totalPowerConsumption * 1.2;
  const recommendedPSU = Math.ceil(requiredPower / 50) * 50;

  if (pw < requiredPower) {
    return {
      severity: 'Error',
      component1: psu.name,
      component2: 'Система',
      message: `Мощности БП (${pw} Вт) недостаточно (требуется ${Math.round(requiredPower)} Вт).`,
      suggestion: `Выберите БП мощностью не менее ${recommendedPSU} Вт`
    };
  }

  if (caseComponent) {
    const psuFormFactor = extractFormFactor(psu.specifications);
    const caseSupportedPSUFormFactors = extractSupportedPSUFormFactors(caseComponent.specifications);

    if (psuFormFactor && caseSupportedPSUFormFactors.length > 0 && !caseSupportedPSUFormFactors.includes(psuFormFactor)) {
      return {
        severity: 'Error',
        component1: psu.name,
        component2: caseComponent.name,
        message: `БП с форм-фактором ${psuFormFactor} не поддерживается корпусом ${caseComponent.name}.`,
        suggestion: `Поддерживаемые форм-факторы БП: ${caseSupportedPSUFormFactors.join(', ')}`
      };
    }
  }

  const tightMarginThreshold = totalPowerConsumption * 1.1;
  if (pw < tightMarginThreshold) {
    return {
      severity: 'Warning',
      component1: psu.name,
      component2: 'Система',
      message: `БП (${pw} Вт) имеет небольшой запас мощности. Рекомендуется БП мощностью не менее ${recommendedPSU} Вт`,
      suggestion: `Рассмотрите БП с большим запасом мощности для будущих апгрейдов`
    };
  }

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

export function calculatePowerConsumption(components: ComponentMap): number {
  let t = 50;

  if (components.cpu) {
    const cpuTDP = extractTDP(components.cpu.specifications);
    t += cpuTDP !== null ? cpuTDP : 65;
  }

  if (components.gpu) {
    const gpuTDP = extractTDP(components.gpu.specifications);
    t += gpuTDP !== null ? gpuTDP : 150;
  }

  if (components.ram) {
    const ramCapacity = extractRAMCapacity(components.ram.specifications);
    const ramSlots = extractMemorySlots(components.ram.specifications) || 1;
    const ramCount = Math.max(1, ramSlots);
    t += ramCapacity * ramCount * 0.005;
  }

  if (components.storage) {
    const storageType = extractStorageType(components.storage.specifications);
    t += storageType === 'm2' || storageType === 'sata' ? 10 : 3;
  }

  if (components.cooling) {
    const fanCount = extractNumberFromSpecs(components.cooling.specifications, 'fanCount', 'fans', 'fan') || 1;
    t += fanCount * 3;
  }

  return t;
}

function extractNumberFromSpecs(specs: ProductSpecifications | undefined, ...keys: string[]): number {
  if (!specs) return 0;
  for (const key of keys) {
    const val = specs[key];
    if (typeof val === 'number' && !isNaN(val)) return val;
    if (typeof val === 'string') {
      const n = parseFloat(val);
      if (!isNaN(n)) return n;
    }
  }
  return 0;
}

export {
  checkCPUSocket,
  checkRAM,
  checkCooler,
  checkPSU,
  checkCaseFF,
  checkGPULen,
  checkCoolerHeightCheck,
  checkIG,
};