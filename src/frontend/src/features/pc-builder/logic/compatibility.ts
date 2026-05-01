/**
 * Core Compatibility Logic
 * Pure functions for checking PC component compatibility
 * Extracted from usePCBuilder.ts for better organization
 */

import { hasIntegratedGraphics } from '@/shared/utils/compatibility/extractors';
import type { PCBuilderSelectedState, CompatibilityResult } from './types';
import { BASE_POWER_CONSUMPTION } from './constants';
import {
  extractSocket,
  extractRAMType,
  extractSupportedSockets,
  extractMbRamSlots,
  extractModulesCount,
  extractTDP,
} from './specExtractors';
import type { RAMType } from './constants';

export function checkBuildCompatibility(components: PCBuilderSelectedState): CompatibilityResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const cpu = components.cpu?.product;
  const motherboard = components.motherboard?.product;
  const rams = components.ram;
  const cooling = components.cooling?.product;
  const gpu = components.gpu?.product;
  const psu = components.psu?.product;

  if (cpu && motherboard) {
    const cpuSocket = extractSocket(cpu.specifications);
    const mbSocket = extractSocket(motherboard.specifications);

    if (cpuSocket && mbSocket && cpuSocket !== mbSocket) {
      errors.push(
        `Сокет процессора (${cpuSocket}) не соответствует сокету материнской платы (${mbSocket})`
      );
    }
  }

  if (motherboard && rams.length > 0) {
    const mbMemoryType = extractRAMType(motherboard.specifications);
    let refType: RAMType | null = null;
    for (const r of rams) {
      const ramType = extractRAMType(r.product.specifications);
      if (ramType && mbMemoryType && ramType !== mbMemoryType) {
        errors.push(
          `Тип памяти (${ramType}) не поддерживается материнской платой (${mbMemoryType})`
        );
        break;
      }
      if (ramType) {
        if (refType && ramType !== refType) {
          errors.push('Все модули ОЗУ должны быть одного типа (DDR4/DDR5 и т.д.)');
          break;
        }
        refType = ramType;
      }
    }

    if (rams.length > 0) {
      const mbRamSlots = extractMbRamSlots(motherboard.specifications);
      const modulesPerUnit = extractModulesCount(rams[0].product.specifications);
      const totalSticks = rams.length * modulesPerUnit;
      if (totalSticks > mbRamSlots) {
        errors.push(`Выбрано ${rams.length} комплект(ов) ОЗУ (×${modulesPerUnit} плашек), итого ${totalSticks} плашек, но материнская плата имеет только ${mbRamSlots} слотов`);
      }
    }
  }

  if (cooling && cpu) {
    const cpuSocket = extractSocket(cpu.specifications);
    const supportedSockets = extractSupportedSockets(cooling.specifications);

    if (cpuSocket && supportedSockets.length > 0 && !supportedSockets.includes(cpuSocket)) {
      warnings.push(`Система охлаждения может не поддерживать сокет ${cpuSocket}`);
    }
  }

  if (!gpu && cpu) {
    const igpu = hasIntegratedGraphics(cpu.specifications);
    if (!igpu) {
      warnings.push('Не выбрана видеокарта, а процессор не имеет встроенной графики');
    }
  }

  if (psu) {
    const psuWattage = psu.specifications?.wattage as number | undefined;

    if (psuWattage) {
      const totalTdp = calculatePowerConsumption(components);
      const recommendedPsu = totalTdp * 1.3;

      if (psuWattage < recommendedPsu) {
        warnings.push(
          `Мощности БП (${psuWattage} Вт) недостаточно (требуется ${Math.ceil(recommendedPsu)} Вт)`
        );
      }
    }
  }

  return {
    isCompatible: errors.length === 0,
    errors,
    warnings,
  };
}

export function calculatePowerConsumption(components: PCBuilderSelectedState): number {
  let total = BASE_POWER_CONSUMPTION;
  const cpu = components.cpu?.product;
  const gpu = components.gpu?.product;
  const cooling = components.cooling?.product;

  if (cpu) total += extractTDP(cpu.specifications);
  if (gpu) total += extractTDP(gpu.specifications);
  for (const r of components.ram) {
    total += extractTDP(r.product.specifications) || 3;
  }
  for (const s of components.storage) {
    total += extractTDP(s.product.specifications) || 5;
  }
  if (cooling) total += extractTDP(cooling.specifications) || 10;
  for (const f of components.fan) {
    total += extractTDP(f.product.specifications) || 3;
  }

  return Math.max(0, total);
}

export function isBuilderEmpty(c: PCBuilderSelectedState): boolean {
  return (
    !c.cpu &&
    !c.gpu &&
    !c.motherboard &&
    !c.psu &&
    !c.case &&
    !c.cooling &&
    c.ram.length === 0 &&
    c.storage.length === 0 &&
    c.fan.length === 0 &&
    !c.monitor &&
    !c.keyboard &&
    !c.mouse &&
    !c.headphones
  );
}