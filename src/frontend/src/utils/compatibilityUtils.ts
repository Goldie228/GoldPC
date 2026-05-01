/**
 * Compatibility Utilities — orchestration layer
 * 
 * Pure orchestrator for PC component compatibility checking.
 * All logic extracted to modular layers.
 * @module utils/compatibilityUtils
 */

import type { Product } from '../api/types';
import type { ComponentCategory, CompatibilitySeverity, CompatibilityIssue, CompatibilityWarning, CompatibilityCheckResult, ComponentMap } from '../shared/utils/compatibility/types';

import {
  runCPUMotherboardCompatibilityCheck,
  runRAMCompatibilityCheck,
  runCoolerCompatibilityCheck,
  runPSUCompatibilityCheck,
  runCaseCompatibilityCheck,
  runGPUCompatibilityCheck,
  runIntegratedGraphicsCheck,
  runBottleneckAnalysis,
  runRAMCapacityWarning,
} from '../shared/utils/compatibility/orchestration';

import {
  calculatePowerConsumption,
} from '../shared/utils/compatibility/checks';

import {
  extractM2Slots,
  extractSataPorts,
  extractStorageType,
} from '../shared/utils/compatibility/extractors';

export type { ComponentCategory, CompatibilitySeverity } from '../shared/utils/compatibility/types';
export { CompatibilityIssue, CompatibilityWarning, CompatibilityCheckResult, ComponentMap };

export function checkCompatibility(components: ComponentMap): CompatibilityCheckResult {
  const issues: CompatibilityIssue[] = [];
  const warnings: CompatibilityWarning[] = [];

  const { cpu, gpu, motherboard, ram, psu, case: chassis, cooling } = components;

  runCPUMotherboardCompatibilityCheck(cpu, motherboard, issues, warnings);
  runRAMCompatibilityCheck(ram, motherboard, issues, warnings);
  runCoolerCompatibilityCheck(cooling, cpu, chassis, issues, warnings);
  runPSUCompatibilityCheck(psu, cpu, gpu, chassis, issues, warnings);
  runCaseCompatibilityCheck(chassis, motherboard, issues, warnings);
  runGPUCompatibilityCheck(chassis, gpu, issues, warnings);
  runIntegratedGraphicsCheck(cpu, gpu, issues, warnings);

  const bottleneckPct = runBottleneckAnalysis(cpu, gpu, warnings);
  runRAMCapacityWarning(ram, motherboard, warnings);

  const storageProducts = Object.values(components).filter(c => c?.category === 'storage');
  if (motherboard) {
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

    if (usedM2 > mbM2Slots) {
      issues.push({
        severity: 'Error',
        component1: 'Накопители',
        component2: motherboard.name,
        message: `Выбрано ${usedM2} M.2 накопителей, но материнская плата поддерживает только ${mbM2Slots}`,
        suggestion: `Удалите ${usedM2 - mbM2Slots} M.2 накопителя или выберите другую материнскую плату`,
      });
    }

    if (usedSata > mbSataPorts) {
      issues.push({
        severity: 'Error',
        component1: 'Накопители',
        component2: motherboard.name,
        message: `Выбрано ${usedSata} SATA накопителей, но материнская плата поддерживает только ${mbSataPorts}`,
        suggestion: `Удалите ${usedSata - mbSataPorts} SATA накопителя или выберите другую материнскую плату`,
      });
    }
  }

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