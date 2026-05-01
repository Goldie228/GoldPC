/**
 * Orchestration functions - extracted from compatibilityUtils.ts
 * Coordinates compatibility checks for component groups
 */

import type { Product } from '../../../../api/types';
import type { CompatibilityIssue, CompatibilityWarning } from './types';
import { checkCPUSocket, checkRAM, checkCooler, checkCoolerHeightCheck, checkPSU, checkCaseFF, checkGPULen, checkIG } from './checks';
import { checkBiosWarning } from './bios';
import { extractSocket, extractChipset, extractPerformanceScore, extractRAMCapacity } from './extractors';
import { calculateBottleneck, detectBottleneckWarnings } from './bottleneck';

export function runRAMCompatibilityCheck(
  ram: Product | undefined,
  motherboard: Product | undefined,
  issues: CompatibilityIssue[],
  warnings: CompatibilityWarning[]
): void {
  if (ram && motherboard) {
    const i = checkRAM(ram, motherboard);
    if (i) {
      if (i.severity === 'Error') issues.push(i);
      else warnings.push({ severity: i.severity as 'Warning'|'Info', component: i.component1, message: i.message, suggestion: i.suggestion });
    }
  }
}

export function runCPUMotherboardCompatibilityCheck(
  cpu: Product | undefined,
  motherboard: Product | undefined,
  issues: CompatibilityIssue[],
  warnings: CompatibilityWarning[]
): void {
  if (cpu && motherboard) {
    const i = checkCPUSocket(cpu, motherboard);
    if (i) issues.push(i);
    const cpuSocket = extractSocket(cpu.specifications);
    const chipset = extractChipset(motherboard.specifications);
    const biosW = checkBiosWarning(cpuSocket, chipset);
    if (biosW) warnings.push(biosW);
  }
}

export function runCoolerCompatibilityCheck(
  cooling: Product | undefined,
  cpu: Product | undefined,
  chassis: Product | undefined,
  issues: CompatibilityIssue[],
  warnings: CompatibilityWarning[]
): void {
  if (cooling && cpu) { const w = checkCooler(cooling, cpu); if (w) warnings.push(w); }
  if (cooling && chassis) { const i = checkCoolerHeightCheck(cooling, chassis); if (i) issues.push(i); }
}

export function runPSUCompatibilityCheck(
  psu: Product | undefined,
  cpu: Product | undefined,
  gpu: Product | undefined,
  chassis: Product | undefined,
  issues: CompatibilityIssue[],
  warnings: CompatibilityWarning[]
): void {
  if (psu) { const w = checkPSU(psu, cpu, gpu, chassis); if (w && w.severity !== 'Error') warnings.push(w as unknown as CompatibilityWarning); }
}

export function runCaseCompatibilityCheck(
  chassis: Product | undefined,
  motherboard: Product | undefined,
  issues: CompatibilityIssue[],
  warnings: CompatibilityWarning[]
): void {
  if (chassis && motherboard) { const i = checkCaseFF(chassis, motherboard); if (i) issues.push(i); }
}

export function runGPUCompatibilityCheck(
  chassis: Product | undefined,
  gpu: Product | undefined,
  issues: CompatibilityIssue[],
  warnings: CompatibilityWarning[]
): void {
  if (chassis && gpu) { const w = checkGPULen(chassis, gpu); if (w) warnings.push(w); }
}

export function runIntegratedGraphicsCheck(
  cpu: Product | undefined,
  gpu: Product | undefined,
  issues: CompatibilityIssue[],
  warnings: CompatibilityWarning[]
): void {
  if (cpu) { const w = checkIG(cpu, gpu); if (w) warnings.push(w); }
}

export function runBottleneckAnalysis(
  cpu: Product | undefined,
  gpu: Product | undefined,
  warnings: CompatibilityWarning[]
): number {
  let bottleneckPct = 0;
  if (cpu && gpu) {
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
  motherboard: Product | undefined,
  warnings: CompatibilityWarning[]
): void {
  if (ram && extractRAMCapacity(ram.specifications) > 0 && extractRAMCapacity(ram.specifications) < 16) {
    warnings.push({ severity: 'Info', component: ram.name, message: `${extractRAMCapacity(ram.specifications)}GB RAM may be insufficient for modern tasks`, suggestion: 'Consider 16GB+' });
  }
}