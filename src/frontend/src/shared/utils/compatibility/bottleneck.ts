/**
 * Bottleneck detection - extracted from compatibilityUtils.ts
 * Analytical logic layer for CPU/GPU bottleneck detection
 */

import type { CompatibilityWarning } from './types';
import type { BottleneckCategory } from '@/config/compatibilityTypes';
import rulesConfig from '@/config/compatibilityRules.json';

const BOTTLENECK_CATEGORIES: Record<string, BottleneckCategory> = rulesConfig.bottleneckDetection.categories;

/**
 * Детекция bottleneck с учётом категории назначения ПК.
 * @returns процент bottleneck: положительный = CPU-bound, отрицательный = GPU-bound, 0 = сбалансировано
 */
export function calculateBottleneck(cpuScore: number, gpuScore: number): number {
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