/**
 * Orchestration functions - extracted from compatibilityUtils.ts
 * Coordinates compatibility checks for component groups
 */

import type { Product } from '@/api/types';
import type { CompatibilityIssue, CompatibilityWarning, CompatibilityCheckResult, ComponentMap } from './types';
import { 
  checkCPUSocket, checkRAM, checkMixedRAM, checkCooler, checkCoolerHeightCheck, checkPSU, 
  checkCaseFF, checkGPULen, checkIG, calculatePowerConsumption,
  checkEPSSupply, checkPCIeSupply, checkGPUSlotFit, checkVRMCapacity,
  checkRAMSpeed, checkRAMClearance, checkUSB3Header, checkM2Interface,
  checkM2PCIeGen, checkM2SataLaneConflict, checkFanHeaderCount, checkRGBType, checkEccSupport,
  checkPSUBrand, checkNoIGCPU, checkNoVideoOutput, checkCPUOverclock, checkPSUEPSLength,
  check12VHPWRBend, checkGPUWidthClearance, checkTPM,
} from './checks';
import { checkBiosWarning } from './bios';
import { 
  extractSocket, extractChipset, extractPerformanceScore, extractRAMCapacity, 
  extractM2Slots, extractSataPorts, extractStorageType 
} from './extractors';
import { calculateBottleneck, detectBottleneckWarnings } from './bottleneck';
import { 
  tipMonitorToGPU, tipDDR5Training, tipXMPNeeded, tipDualChannel,
  tipThermalPaste, tipSingleChannel, tipRemoveCoolerFilm, tipCheckPSUSwitch,
} from './tips';

export function runRAMCompatibilityCheck(
  ram: Product | undefined,
  motherboard: Product | undefined,
  issues: CompatibilityIssue[],
  warnings: CompatibilityWarning[]
): void {
  if (ram != null && motherboard != null) {
    const i = checkRAM(ram, motherboard);
    if (i != null) {
      if (i.severity === 'Error') issues.push(i);
      else warnings.push({ severity: i.severity, component: i.component1, message: i.message, suggestion: i.suggestion });
    }
  }
}

export function runMixedRAMCheck(
  ramSticks: Product[],
  warnings: CompatibilityWarning[]
): void {
  if (!ramSticks || ramSticks.length < 2) return;
  const mixedWarnings = checkMixedRAM(ramSticks);
  warnings.push(...mixedWarnings);
}

export function runCPUMotherboardCompatibilityCheck(
  cpu: Product | undefined,
  motherboard: Product | undefined,
  issues: CompatibilityIssue[],
  warnings: CompatibilityWarning[]
): void {
  if (cpu != null && motherboard != null) {
    const i = checkCPUSocket(cpu, motherboard);
    if (i != null) issues.push(i);
    const cpuSocket = extractSocket(cpu.specifications);
    const chipset = extractChipset(motherboard.specifications);
    const biosW = checkBiosWarning(cpuSocket, chipset);
    if (biosW != null) warnings.push(biosW);
  }
}

export function runCoolerCompatibilityCheck(
  cooling: Product | undefined,
  cpu: Product | undefined,
  chassis: Product | undefined,
  issues: CompatibilityIssue[],
  warnings: CompatibilityWarning[]
): void {
  if (cooling != null && cpu != null) { const w = checkCooler(cooling, cpu); if (w != null) warnings.push(w); }
  if (cooling != null && chassis != null) { const i = checkCoolerHeightCheck(cooling, chassis); if (i != null) issues.push(i); }
}

export function runPSUCompatibilityCheck(
  psu: Product | undefined,
  cpu: Product | undefined,
  gpu: Product | undefined,
  chassis: Product | undefined,
  _issues: CompatibilityIssue[],
  warnings: CompatibilityWarning[]
): void {
  if (psu != null) { const w = checkPSU(psu, cpu, gpu, chassis); if (w != null && w.severity !== 'Error') warnings.push(w as unknown as CompatibilityWarning); }
}

export function runCaseCompatibilityCheck(
  chassis: Product | undefined,
  motherboard: Product | undefined,
  issues: CompatibilityIssue[],
  _warnings: CompatibilityWarning[]
): void {
  if (chassis != null && motherboard != null) { const i = checkCaseFF(chassis, motherboard); if (i != null) issues.push(i); }
}

export function runGPUCompatibilityCheck(
  chassis: Product | undefined,
  gpu: Product | undefined,
  _issues: CompatibilityIssue[],
  warnings: CompatibilityWarning[]
): void {
  if (chassis != null && gpu != null) { const w = checkGPULen(chassis, gpu); if (w != null) warnings.push(w); }
}

export function runIntegratedGraphicsCheck(
  cpu: Product | undefined,
  gpu: Product | undefined,
  _issues: CompatibilityIssue[],
  warnings: CompatibilityWarning[]
): void {
  if (cpu != null) { const w = checkIG(cpu, gpu); if (w != null) warnings.push(w); }
}

export function runBottleneckAnalysis(
  cpu: Product | undefined,
  gpu: Product | undefined,
  warnings: CompatibilityWarning[]
): number {
  let bottleneckPct = 0;
  if (cpu != null && gpu != null) {
    const cpuScore = extractPerformanceScore(cpu.specifications);
    const gpuScore = extractPerformanceScore(gpu.specifications);
    bottleneckPct = calculateBottleneck(cpuScore, gpuScore);
    const bnWarnings = detectBottleneckWarnings(cpuScore, gpuScore, cpu.name, gpu.name);
    warnings.push(...bnWarnings);
  }
  return bottleneckPct;
}

export function runRAMCapacityWarning(
  ram: Product | undefined,
  _motherboard: Product | undefined,
  warnings: CompatibilityWarning[]
): void {
  if (ram != null && extractRAMCapacity(ram.specifications) > 0 && extractRAMCapacity(ram.specifications) < 16) {
    warnings.push({ severity: 'Info', component: ram.name, message: `${extractRAMCapacity(ram.specifications)} ГБ ОЗУ может быть недостаточно для современных задач`, suggestion: 'Рекомендуется 16 ГБ и более' });
  }
}

export function runEPSCompatibilityCheck(
  psu: Product | undefined,
  motherboard: Product | undefined,
  issues: CompatibilityIssue[],
  _warnings: CompatibilityWarning[]
): void {
  if (psu != null && motherboard != null) {
    const i = checkEPSSupply(psu, motherboard);
    if (i != null) issues.push(i);
  }
}

export function runPCIeSupplyCheck(
  psu: Product | undefined,
  gpu: Product | undefined,
  issues: CompatibilityIssue[],
  warnings: CompatibilityWarning[]
): void {
  if (psu != null && gpu != null) {
    const i = checkPCIeSupply(psu, gpu);
    if (i != null) {
      if (i.severity === 'Error') issues.push(i);
      else warnings.push({ severity: i.severity as 'Warning', component: i.component1, message: i.message, suggestion: i.suggestion });
    }
  }
}

export function runGPUSlotFitCheck(
  gpu: Product | undefined,
  chassis: Product | undefined,
  _issues: CompatibilityIssue[],
  warnings: CompatibilityWarning[]
): void {
  if (gpu != null && chassis != null) {
    const w1 = checkGPUSlotFit(gpu, chassis);
    if (w1 != null) warnings.push(w1);
    const w2 = check12VHPWRBend(gpu, chassis);
    if (w2 != null) warnings.push(w2);
    const w3 = checkGPUWidthClearance(gpu, chassis);
    if (w3 != null) warnings.push(w3);
  }
}

export function runVRMCheck(
  cpu: Product | undefined,
  motherboard: Product | undefined,
  _issues: CompatibilityIssue[],
  warnings: CompatibilityWarning[]
): void {
  if (cpu != null && motherboard != null) {
    const w = checkVRMCapacity(cpu, motherboard);
    if (w != null) warnings.push(w);
  }
}

export function runRAMSpeedCheck(
  ram: Product | undefined,
  motherboard: Product | undefined,
  cpu: Product | undefined,
  _issues: CompatibilityIssue[],
  warnings: CompatibilityWarning[]
): void {
  if (ram != null && motherboard != null) {
    const w = checkRAMSpeed(ram, motherboard, cpu);
    if (w != null) warnings.push(w);
  }
}

export function runRAMClearanceCheck(
  ram: Product | undefined,
  cooling: Product | undefined,
  _issues: CompatibilityIssue[],
  warnings: CompatibilityWarning[]
): void {
  if (ram != null && cooling != null) {
    const w = checkRAMClearance(ram, cooling);
    if (w != null) warnings.push(w);
  }
}

export function runUSB3HeaderCheck(
  motherboard: Product | undefined,
  chassis: Product | undefined,
  _issues: CompatibilityIssue[],
  warnings: CompatibilityWarning[]
): void {
  if (motherboard != null && chassis != null) {
    const w = checkUSB3Header(motherboard, chassis);
    if (w != null) warnings.push(w);
  }
}

export function runM2Checks(
  storageProducts: Product[],
  motherboard: Product | undefined,
  issues: CompatibilityIssue[],
  warnings: CompatibilityWarning[]
): void {
  if (motherboard == null) return;
  for (const storage of storageProducts) {
    if (!storage) continue;
    const m2Issue = checkM2Interface(storage, motherboard);
    if (m2Issue != null) issues.push(m2Issue);
    const m2Warn = checkM2PCIeGen(storage, motherboard);
    if (m2Warn != null) warnings.push(m2Warn);
  }
}

export function runM2SataLaneConflictCheck(
  storage: Product[],
  motherboard: Product | undefined,
  _issues: CompatibilityIssue[],
  warnings: CompatibilityWarning[]
): void {
  if (motherboard == null) return;
  const w = checkM2SataLaneConflict(storage, motherboard);
  if (w != null) warnings.push({
    severity: 'Warning' as const,
    component: w.component2,
    message: w.message,
    suggestion: w.suggestion,
  });
}

export function runFanHeaderCheck(
  motherboard: Product | undefined,
  cooling: Product | undefined,
  chassis: Product | undefined,
  selectedFanCount: number,
  _issues: CompatibilityIssue[],
  warnings: CompatibilityWarning[]
): void {
  if (motherboard != null) {
    const w = checkFanHeaderCount(motherboard, cooling, chassis, selectedFanCount);
    if (w != null) warnings.push(w);
  }
}

export function runRGBCheck(
  motherboard: Product | undefined,
  chassis: Product | undefined,
  _issues: CompatibilityIssue[],
  warnings: CompatibilityWarning[]
): void {
  if (motherboard != null) {
    const w = checkRGBType(motherboard, chassis, []);
    if (w != null) warnings.push(w);
  }
}

export function runECCCheck(
  ram: Product | undefined,
  motherboard: Product | undefined,
  _issues: CompatibilityIssue[],
  warnings: CompatibilityWarning[]
): void {
  if (ram != null && motherboard != null) {
    const w = checkEccSupport(ram, motherboard);
    if (w != null) warnings.push(w);
  }
}

export function runPSUBrandCheck(
  psu: Product | undefined,
  _issues: CompatibilityIssue[],
  warnings: CompatibilityWarning[]
): void {
  if (psu != null) {
    const w = checkPSUBrand(psu);
    if (w != null) warnings.push(w);
  }
}

export function runNoGPUCheck(
  cpu: Product | undefined,
  gpu: Product | undefined,
  issues: CompatibilityIssue[],
  _warnings: CompatibilityWarning[]
): void {
  if (cpu != null) {
    const i = checkNoIGCPU(cpu, gpu);
    if (i != null) issues.push(i);
  }
}

export function runNoVideoOutputCheck(
  cpu: Product | undefined,
  motherboard: Product | undefined,
  gpu: Product | undefined,
  issues: CompatibilityIssue[],
  _warnings: CompatibilityWarning[]
): void {
  if (cpu != null && motherboard != null) {
    const i = checkNoVideoOutput(cpu, motherboard, gpu);
    if (i != null) issues.push(i);
  }
}

export function runCPUOverclockCheck(
  motherboard: Product | undefined,
  cpu: Product | undefined,
  _issues: CompatibilityIssue[],
  warnings: CompatibilityWarning[]
): void {
  if (motherboard != null && cpu != null) {
    const w = checkCPUOverclock(motherboard, cpu);
    if (w != null) warnings.push(w);
  }
}

export function runPSUEPSLengthCheck(
  psu: Product | undefined,
  chassis: Product | undefined,
  _issues: CompatibilityIssue[],
  warnings: CompatibilityWarning[]
): void {
  if (psu != null && chassis != null) {
    const w = checkPSUEPSLength(psu, chassis);
    if (w != null) warnings.push(w);
  }
}

export function runTPMCheck(
  motherboard: Product | undefined,
  _issues: CompatibilityIssue[],
  warnings: CompatibilityWarning[]
): void {
  if (motherboard != null) {
    const w = checkTPM(motherboard);
    if (w != null) warnings.push(w);
  }
}

// ===== TIPS (информационные советы для новичков) =====

export function runTips(
  cpu: Product | undefined,
  gpu: Product | undefined,
  ram: Product | undefined,
  ramCount: number,
  cooler: Product | undefined,
  _issues: CompatibilityIssue[],
  warnings: CompatibilityWarning[]
): void {
  if (cpu != null && gpu != null) {
    const tip = tipMonitorToGPU(cpu, gpu);
    if (tip != null) warnings.push(tip);
  }
  if (ram != null) {
    const tip1 = tipDDR5Training(ram);
    if (tip1 != null) warnings.push(tip1);
    const tip2 = tipXMPNeeded(ram, undefined);
    if (tip2 != null) warnings.push(tip2);
  }
  const tip3 = tipDualChannel(ramCount, undefined);
  if (tip3 != null) warnings.push(tip3);
  if (cooler != null) {
    const tip4 = tipThermalPaste(cooler);
    if (tip4 != null) warnings.push(tip4);
  }
  const tip5 = tipSingleChannel(ramCount);
  if (tip5 != null) warnings.push(tip5);
  const tip6 = tipRemoveCoolerFilm();
  warnings.push(tip6);
  const tip7 = tipCheckPSUSwitch();
  warnings.push(tip7);
}

export function checkCompatibility(components: ComponentMap, ramSticks?: Product[]): CompatibilityCheckResult {
  const issues: CompatibilityIssue[] = [];
  const warnings: CompatibilityWarning[] = [];

  const { cpu, gpu, motherboard, ram, psu, case: chassis, cooling } = components;

  // ===== DATA COMPLETENESS VALIDATION =====
  // Verify critical components have specification data loaded.
  // Without this, all checks silently pass as compatible (fail-open bug).
  const criticalComponents: Array<{ name: string; product: Product | undefined | null }> = [
    { name: 'CPU', product: cpu },
    { name: 'Motherboard', product: motherboard },
    { name: 'RAM', product: ram },
    { name: 'PSU', product: psu },
  ];

  for (const { name, product } of criticalComponents) {
    if (product && (!product.specifications || Object.keys(product.specifications).length === 0)) {
      warnings.push({
        severity: 'Warning',
        component: product.name || name,
        message: `Не удалось загрузить характеристики для ${product.name || name}. Проверка совместимости может быть неполной.`,
        suggestion: 'Обновите страницу или выберите компонент заново'
      });
    }
  }

  runCPUMotherboardCompatibilityCheck(cpu ?? undefined, motherboard ?? undefined, issues, warnings);
  runRAMCompatibilityCheck(ram ?? undefined, motherboard ?? undefined, issues, warnings);
  runCoolerCompatibilityCheck(cooling ?? undefined, cpu ?? undefined, chassis ?? undefined, issues, warnings);
  runPSUCompatibilityCheck(psu ?? undefined, cpu ?? undefined, gpu ?? undefined, chassis ?? undefined, issues, warnings);
  runCaseCompatibilityCheck(chassis ?? undefined, motherboard ?? undefined, issues, warnings);
  runGPUCompatibilityCheck(chassis ?? undefined, gpu ?? undefined, issues, warnings);
  runIntegratedGraphicsCheck(cpu ?? undefined, gpu ?? undefined, issues, warnings);

  const bottleneckPct = runBottleneckAnalysis(cpu ?? undefined, gpu ?? undefined, warnings);
  runRAMCapacityWarning(ram ?? undefined, motherboard ?? undefined, warnings);

  const storageProducts = components.storage ?? [];
  if (motherboard != null) {
    const mbM2Slots = extractM2Slots(motherboard.specifications);
    const mbSataPorts = extractSataPorts(motherboard.specifications);

    let usedM2 = 0;
    let usedSata = 0;

    for (const storage of storageProducts) {
      if (!storage) continue;
      const type = extractStorageType(storage.specifications);
      if (type === 'm2') usedM2++;
      if (type === 'sata') usedSata++;
    }

    if (usedM2 > 0 && mbM2Slots !== null && usedM2 > mbM2Slots) {
      issues.push({
        severity: 'Error',
        component1: 'Накопители',
        component2: motherboard.name,
        message: `Выбрано ${usedM2} M.2 накопителей, но материнская плата поддерживает только ${mbM2Slots}`,
        suggestion: `Удалите ${usedM2 - mbM2Slots} M.2 накопителя или выберите другую материнскую плату`,
      });
    }

    if (usedM2 > 0 && mbM2Slots === null) {
      issues.push({
        severity: 'Error',
        component1: 'Накопители',
        component2: motherboard.name,
        message: `Выбрано ${usedM2} M.2 накопитель(ей), но не удалось определить количество M.2 слотов на материнской плате.`,
        suggestion: 'Проверьте наличие M.2 слотов в характеристиках материнской платы.',
      });
    }

    if (usedSata > 0 && mbSataPorts !== null && usedSata > mbSataPorts) {
      issues.push({
        severity: 'Error',
        component1: 'Накопители',
        component2: motherboard.name,
        message: `Выбрано ${usedSata} SATA накопителей, но материнская плата поддерживает только ${mbSataPorts}`,
        suggestion: `Удалите ${usedSata - mbSataPorts} SATA накопителя или выберите другую материнскую плату`,
      });
    }

    if (usedSata > 0 && mbSataPorts === null) {
      issues.push({
        severity: 'Error',
        component1: 'Накопители',
        component2: motherboard.name,
        message: `Выбрано ${usedSata} SATA накопитель(ей), но не удалось определить количество SATA портов на материнской плате.`,
        suggestion: 'Проверьте наличие SATA портов в характеристиках материнской платы.',
      });
    }
  }

  // ===== НОВЫЕ ПРОВЕРКИ =====
  runEPSCompatibilityCheck(psu ?? undefined, motherboard ?? undefined, issues, warnings);
  runPCIeSupplyCheck(psu ?? undefined, gpu ?? undefined, issues, warnings);
  runGPUSlotFitCheck(gpu ?? undefined, chassis ?? undefined, issues, warnings);
  runVRMCheck(cpu ?? undefined, motherboard ?? undefined, issues, warnings);
  runRAMSpeedCheck(ram ?? undefined, motherboard ?? undefined, cpu ?? undefined, issues, warnings);
  runRAMClearanceCheck(ram ?? undefined, cooling ?? undefined, issues, warnings);
  runUSB3HeaderCheck(motherboard ?? undefined, chassis ?? undefined, issues, warnings);
  runM2Checks(storageProducts, motherboard ?? undefined, issues, warnings);
  runM2SataLaneConflictCheck(storageProducts, motherboard ?? undefined, issues, warnings);
  runFanHeaderCheck(motherboard ?? undefined, cooling ?? undefined, chassis ?? undefined, 0, issues, warnings);
  runRGBCheck(motherboard ?? undefined, chassis ?? undefined, issues, warnings);
  runECCCheck(ram ?? undefined, motherboard ?? undefined, issues, warnings);
  runPSUBrandCheck(psu ?? undefined, issues, warnings);
  runNoGPUCheck(cpu ?? undefined, gpu ?? undefined, issues, warnings);
  runNoVideoOutputCheck(cpu ?? undefined, motherboard ?? undefined, gpu ?? undefined, issues, warnings);
  runCPUOverclockCheck(motherboard ?? undefined, cpu ?? undefined, issues, warnings);
  runPSUEPSLengthCheck(psu ?? undefined, chassis ?? undefined, issues, warnings);
  
  // ===== ПРОВЕРКА СМЕШАННОЙ RAM (несколько планок) =====
  runMixedRAMCheck(ramSticks ?? [], warnings);
  
  // ===== ПОДСКАЗКИ ДЛЯ НОВИЧКОВ =====
  const ramCount = ramSticks ? ramSticks.length : 1;
  runTips(cpu ?? undefined, gpu ?? undefined, ram ?? undefined, ramCount, cooling ?? undefined, issues, warnings);

  const pc = calculatePowerConsumption(components);
  const rp = Math.ceil(pc * 1.4 / 50) * 50;

  return {
    isCompatible: issues.length === 0,
    issues,
    warnings,
    powerConsumption: pc,
    recommendedPSU: rp,
    bottleneckPercentage: bottleneckPct,
  };
}