/**
 * Check functions - extracted from compatibilityUtils.ts
 * Validation logic for component compatibility
 */

import type { Product, ProductSpecifications } from '@/api/types';
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
  extractSataPorts,
  extractStorageType,
  extractChipset,
  extractRequiredEPSConnectors,
  extractPSUEPSPcieCount,
  extractPSUPCIeCableCount,
  extractGPURequiredConnectors,
  extractGPUSlotWidth,
  extractExpansionSlots,
  extractVRMPhases,
  extractVRMMaxTDP,
  extractMaxRamSpeed,
  extractRAMSpeed,
  extractRAMHeight,
  extractCoolerRAMClearance,
  extractRGBHeaderType,
  extractComponentRGBType,
  extractFanHeaderCount,
  extractHasUSB3HeaderC,
  extractCaseHasUSBC,
  extractMBECCSupport,
  extractRAMECCSupport,
  extractM2Interface,
  extractM2SataSupport,
  extractM2Key,
  extractPCIeGeneration,
  extractMBPCIeVersion,
  extractATX3Support,
  extractPSUBrandSafety,
  extractPSUEPSLength,
  extractCaseDepth,
  extractFanCount,
  extractCPUOverclockable,
  extractCPUMaxRamSpeed,
  extractTPMSupport,
} from './extractors';

function checkCPUSocket(cpu: Product, mb: Product): CompatibilityIssue | null {
  const cs = extractSocket(cpu.specifications);
  const ms = extractSocket(mb.specifications);

  // Known mismatch
  if (cs && ms && cs !== ms) {
    return { severity: 'Error', component1: cpu.name, component2: mb.name, message: `CPU socket ${cs} incompatible with motherboard socket ${ms}`, suggestion: `Choose motherboard with socket ${cs}` };
  }

  // One or both unknown — report as error (fail-closed)
  if (!cs || !ms) {
    const unknown = !cs ? cpu.name : mb.name;
    return { severity: 'Error', component1: cpu.name, component2: mb.name, message: `Не удалось определить сокет: ${unknown}`, suggestion: 'Проверьте характеристики компонента' };
  }

  return null;
}

/**
 * Detect memory form factor from product name or SKU (fallback for ProductSummary without specs).
 * Pure function — same input, same output.
 * @param productName - Product name (always available)
 * @param sku - Product SKU/model number (optional, may contain form factor hints)
 */
function detectMemoryFormFactorFromName(productName: string, sku?: string): 'DIMM' | 'SO-DIMM' | null {
  const upper = productName.toUpperCase();

  // ── SO-DIMM indicators in product name ──
  if (
    upper.includes('SO-DIMM') ||
    upper.includes('SODIMM') ||
    upper.includes('НОУТБУК') ||
    upper.includes('LAPTOP') ||
    upper.includes('ULTRABOOK') ||
    upper.includes('ULTRA') ||
    upper.includes('LOW VOLTAGE') ||
    upper.includes('1.35V')
  ) return 'SO-DIMM';

  // ── Desktop DIMM indicators in product name ──
  if (
    upper.includes('DIMM') ||
    upper.includes('UDIMM') ||
    upper.includes('DESKTOP') ||
    upper.includes('НАСТОЛЬН')
  ) return 'DIMM';

  // ── Check SKU/model number for additional clues ──
  if (sku) {
    const skuUpper = sku.toUpperCase();
    if (skuUpper.includes('SO-DIMM') || skuUpper.includes('SODIMM')) return 'SO-DIMM';
    if (skuUpper.includes('DIMM') || skuUpper.includes('UDIMM')) return 'DIMM';

    // Common SO-DIMM module model prefixes: Samsung M471*, SK Hynix HMA* / HMC* / HMT*
    if (/^M47[0-9]/.test(skuUpper) || /^HM[ACT]/.test(skuUpper)) return 'SO-DIMM';
  }

  return null;
}

function checkRAM(ram: Product, mb: Product, quantity: number = 1): CompatibilityIssue | null {
  const rt = extractMemoryType(ram.specifications);
  const mt = extractMemoryType(mb.specifications);

  // Known memory type mismatch
  if (rt && mt && rt !== mt) {
    return { severity: 'Error', component1: ram.name, component2: mb.name, message: `Тип памяти ${rt} не поддерживается материнской платой (${mt})`, suggestion: `Выберите память ${mt}` };
  }

  // One or both unknown — report as error (fail-closed)
  if (!rt || !mt) {
    const unknown = !rt ? ram.name : mb.name;
    return { severity: 'Error', component1: ram.name, component2: mb.name, message: `Не удалось определить тип памяти: ${unknown}`, suggestion: 'Проверьте характеристики компонента' };
  }

  // Try specifications first, fall back to name+sku based detection (for ProductSummary)
  const rff = extractMemoryFormFactor(ram.specifications) ?? detectMemoryFormFactorFromName(ram.name, ram.sku);
  const mff = extractMemoryFormFactor(mb.specifications) ?? 'DIMM';

  // Known form factor mismatch
  if (rff && mff && rff !== mff) {
    return { severity: 'Error', component1: ram.name, component2: mb.name, message: `Форм-фактор памяти ${rff} несовместим с материнской платой (${mff})`, suggestion: `Выберите модули памяти ${mff}` };
  }

  // RAM form factor unknown
  if (!rff) {
    return { severity: 'Error', component1: ram.name, component2: mb.name, message: `Не удалось определить форм-фактор памяти: ${ram.name}`, suggestion: 'Проверьте характеристики модуля памяти' };
  }

  const slots = extractMemorySlots(mb.specifications);
  if (quantity > slots) return { severity: 'Error', component1: ram.name, component2: mb.name, message: `Невозможно установить ${quantity} планок — материнская плата имеет только ${slots} слотов`, suggestion: `Максимум ${slots} модулей` };

  const rc = extractRAMCapacity(ram.specifications);
  const mm = extractMaxMemory(mb.specifications);
  const totalCapacity = rc * quantity;
  if (totalCapacity > mm) return { severity: 'Warning', component1: ram.name, component2: mb.name, message: `Общий объём памяти ${totalCapacity}ГБ превышает максимальный для материнской платы (${mm}ГБ)`, suggestion: `Выберите модули меньшего объёма или материнскую плату, поддерживающую ${totalCapacity}+ ГБ` };

  return null;
}

/**
 * Check for mixed RAM sticks — different manufacturers, speeds, capacities
 * Multiple unmatched sticks can cause instability or POST failure on AM5/etc.
 * Pure function, takes array of RAM products, returns warnings array.
 */
function checkMixedRAM(ramSticks: Product[]): CompatibilityWarning[] {
  const warnings: CompatibilityWarning[] = [];
  if (!ramSticks || ramSticks.length < 2) return warnings;

  // 1. Check manufacturer/brand uniformity
  const brands = new Set(ramSticks.map(s => s.brand?.toLowerCase()).filter(Boolean));
  if (brands.size > 1) {
    warnings.push({
      severity: 'Warning', component: 'Смешанные планки RAM',
      message: 'Обнаружены планки RAM разных производителей. Смешивание брендов может вызвать нестабильность или отказ POST.',
      suggestion: 'Используйте одинаковые планки RAM из одного набора (Kit)'
    });
  }

  // 2. Check speed uniformity
  const speeds = new Set(ramSticks.map(s => extractRAMSpeed(s.specifications)).filter((s): s is number => s !== null));
  if (speeds.size > 1) {
    const min = Math.min(...speeds);
    warnings.push({
      severity: 'Warning', component: 'Смешанные планки RAM',
      message: `Планки RAM имеют разную частоту (${[...speeds].join(', ')} МГц). Все планки будут работать на ${min} МГц.`,
      suggestion: 'Для максимальной производительности используйте планки RAM с одинаковой частотой'
    });
  }

  // 3. Check capacity uniformity
  const capacities = new Set(ramSticks.map(s => extractRAMCapacity(s.specifications)).filter(c => c > 0));
  if (capacities.size > 1) {
    warnings.push({
      severity: 'Warning', component: 'Смешанные планки RAM',
      message: `Планки RAM имеют разный объём (${[...capacities].join(', ')} ГБ). Двухканальный режим будет несимметричным.`,
      suggestion: 'Используйте планки RAM одинакового объёма для оптимальной производительности'
    });
  }

  // 4. Check timings (CAS latency) uniformity
  const timings = new Set(ramSticks.map(s => {
    const spec = s.specifications;
    return typeof spec?.timing === 'string' ? spec.timing :
           typeof spec?.casLatency === 'string' ? spec.casLatency :
           typeof spec?.latency === 'string' ? spec.latency : null;
  }).filter(Boolean));
  if (timings.size > 1) {
    warnings.push({
      severity: 'Warning', component: 'Смешанные планки RAM',
      message: `Планки RAM имеют разные тайминги (${[...timings].join(', ')}). Это может вызвать нестабильность или отказ загрузки системы.`,
      suggestion: 'Используйте планки RAM с одинаковыми таймингами (CL) для стабильной работы'
    });
  }

  return warnings;
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

  if (ff && sf.length > 0 && !sf.includes(ff)) {
    return { severity: 'Error', component1: chassis.name, component2: mb.name, message: `Case does not support ${ff} form factor`, suggestion: `Supported: ${sf.join(', ')}` };
  }

  // Form factor unknown
  if (!ff) {
    return { severity: 'Error', component1: chassis.name, component2: mb.name, message: `Не удалось определить форм-фактор материнской платы: ${mb.name}`, suggestion: 'Проверьте характеристики материнской платы' };
  }

  return null;
}

function checkGPULen(chassis: Product, gpu: Product): CompatibilityWarning | null {
  const ml = extractMaxGPULength(chassis.specifications);
  const gl = extractGPULength(gpu.specifications);

  if (ml && gl && gl > ml) {
    return { severity: 'Warning', component: gpu.name, message: `GPU length ${gl}mm may exceed case max ${ml}mm`, suggestion: `Choose shorter GPU or larger case` };
  }

  // Report if one dimension is known but the other isn't
  if (ml && !gl) {
    return { severity: 'Warning', component: gpu.name, message: 'Не удалось определить длину видеокарты. Проверьте совместимость с корпусом.', suggestion: 'Проверьте характеристики видеокарты' };
  }

  return null;
}

function checkCoolerHeightCheck(cooling: Product, chassis: Product): CompatibilityIssue | null {
  const coolerType = extractCoolerType(cooling.specifications);
  if (coolerType && coolerType.toLowerCase() !== 'air' && coolerType.toLowerCase() !== 'tower') return null;
  const ch = extractCoolerHeight(cooling.specifications);
  const mch = extractMaxCoolerHeight(chassis.specifications);

  if (ch > 0 && mch && ch > mch) {
    return { severity: 'Error', component1: cooling.name, component2: chassis.name, message: `Cooler height ${ch}mm exceeds case max ${mch}mm`, suggestion: `Choose cooler <= ${mch}mm, AIO, or larger case` };
  }

  // Height unknown
  if (ch > 0 && !mch) {
    return { severity: 'Warning', component1: cooling.name, component2: chassis.name, message: 'Не удалось определить максимальную высоту кулера для корпуса.', suggestion: 'Проверьте характеристики корпуса' };
  }

  return null;
}

function checkIG(cpu: Product, gpu: Product | null | undefined): CompatibilityWarning | null {
  if (gpu || hasIntegratedGraphics(cpu.specifications)) return null;
  return { severity: 'Warning', component: cpu.name, message: 'No GPU selected and CPU has no integrated graphics', suggestion: 'Add a discrete GPU or choose CPU with iGPU' };
}

/**
 * EPR supply check — достаточно ли EPS12V кабелей у БП для материнской платы
 */
function checkEPSSupply(psu: Product, mb: Product): CompatibilityIssue | null {
  const required = extractRequiredEPSConnectors(mb.specifications);
  const supplied = extractPSUEPSPcieCount(psu.specifications);
  if (required > 1 && supplied < required) {
    return {
      severity: 'Error',
      component1: psu.name,
      component2: mb.name,
      message: `Материнской плате требуется ${required}× EPS12V (8-pin CPU), у БП — только ${supplied}.`,
      suggestion: `Выберите БП с ${required}× CPU/ EPS12V кабелями`
    };
  }
  return null;
}

/**
 * PCIe power supply check — достаточно ли PCIe кабелей у БП для видеокарты
 */
function checkPCIeSupply(psu: Product, gpu: Product): CompatibilityIssue | null {
  const gpuCon = extractGPURequiredConnectors(gpu.specifications);
  if (gpuCon.count === 0) return null;
  const supplied = extractPSUPCIeCableCount(psu.specifications);

  // 12VHPWR — особый случай
  if (gpuCon.has12VHPWR) {
    const hasATX3 = extractATX3Support(psu.specifications);
    if (hasATX3 === false) {
      return {
        severity: 'Warning',
        component1: psu.name,
        component2: gpu.name,
        message: 'GPU требует 12VHPWR (12+4-pin). БП без ATX 3.0 может не иметь родного кабеля 12VHPWR.',
        suggestion: 'Выберите БП с ATX 3.0 или используйте переходник из комплекта GPU'
      };
    }
    return null;
  }

  if (supplied < gpuCon.count) {
    return {
      severity: 'Error',
      component1: psu.name,
      component2: gpu.name,
      message: `GPU требует ${gpuCon.count}× PCIe 8-pin, у БП — ${supplied}.`,
      suggestion: `Выберите БП с ${gpuCon.count}× PCIe кабелями или используйте pigtail-разветвители`
    };
  }
  return null;
}

/**
 * GPU slot width vs case expansion slots
 */
function checkGPUSlotFit(gpu: Product, chassis: Product): CompatibilityWarning | null {
  const slotWidth = extractGPUSlotWidth(gpu.specifications);
  const expSlots = extractExpansionSlots(chassis.specifications);
  if (slotWidth === null || expSlots === null) return null;
  if (slotWidth > expSlots) {
    return {
      severity: 'Warning',
      component: gpu.name,
      message: `GPU толщиной ${slotWidth} слота может не поместиться в корпус (${expSlots} слотов).`,
      suggestion: `Выберите более тонкую GPU или корпус с большим числом слотов`
    };
  }
  return null;
}

/**
 * 12VHPWR bend radius check — хватает ли глубины корпуса для безопасного изгиба кабеля
 * 12VHPWR требует ~35 мм зазора от боковой панели до коннектора
 */
function check12VHPWRBend(gpu: Product, chassis: Product): CompatibilityWarning | null {
  const conn = extractGPURequiredConnectors(gpu.specifications);
  if (!conn.has12VHPWR) return null;
  const depth = extractCaseDepth(chassis.specifications);
  if (depth === null) return null;
  if (depth < 180) {
    return {
      severity: 'Warning',
      component: gpu.name,
      message: `GPU использует 12VHPWR, но глубина корпуса (${depth}мм) мала для безопасного изгиба кабеля. Рекомендуется зазор ~35 мм от коннектора.`,
      suggestion: 'Выберите корпус глубже 180 мм или используйте адаптер 12VHPWR под углом 90°'
    };
  }
  return null;
}

/**
 * GPU width clearance check — не упирается ли широкая видеокарта в стенку корпуса
 */
function checkGPUWidthClearance(gpu: Product, chassis: Product): CompatibilityWarning | null {
  const slotWidth = extractGPUSlotWidth(gpu.specifications);
  const expSlots = extractExpansionSlots(chassis.specifications);
  if (slotWidth === null || expSlots === null) return null;
  if (slotWidth > 2.5 && expSlots < 7) {
    return {
      severity: 'Warning',
      component: gpu.name,
      message: `GPU шириной ${slotWidth} слота может не поместиться в корпус с ${expSlots} слотами расширения — возможно упрётся в планку управления кабелями/боковую стенку.`,
      suggestion: 'Выберите более компактную GPU или корпус с 7+ слотами расширения'
    };
  }
  return null;
}

/**
 * VRM может не справиться с мощным CPU на бюджетной материнской плате
 */
function checkVRMCapacity(cpu: Product, mb: Product): CompatibilityWarning | null {
  const cpuTdp = extractTDP(cpu.specifications);
  if (cpuTdp < 125) return null; // Только мощные CPU

  const vrmPhases = extractVRMPhases(mb.specifications);
  const vrmMaxTdp = extractVRMMaxTDP(mb.specifications);

  if (vrmMaxTdp !== null && cpuTdp > vrmMaxTdp) {
    return {
      severity: 'Warning',
      component: mb.name,
      message: `VRM материнской платы может не выдержать CPU ${cpuTdp}Вт (максимум ${vrmMaxTdp}Вт).`,
      suggestion: 'Выберите материнскую плату с более мощным VRM или менее мощный CPU'
    };
  }

  // Heuristic: если vrmPhases < 8 для CPU > 125W
  if (vrmPhases !== null && vrmPhases < 8 && cpuTdp >= 125) {
    return {
      severity: 'Warning',
      component: mb.name,
      message: `Материнская плата (VRM: ${vrmPhases} фаз) может перегреваться с CPU ${cpuTdp}Вт под нагрузкой.`,
      suggestion: 'Рекомендуется материнская плата с 8+ фазами VRM для мощных процессоров'
    };
  }

  return null;
}

/**
 * RAM speed check — частота RAM превышает поддерживаемую материнской платой или лимит IMC процессора
 */
function checkRAMSpeed(ram: Product, mb: Product, cpu?: Product): CompatibilityWarning | null {
  const speed = extractRAMSpeed(ram.specifications);
  const mbMaxSpeed = extractMaxRamSpeed(mb.specifications);
  if (speed === null || mbMaxSpeed === null) return null;

  // CPU IMC limit based on socket group (e.g. AM5 maxRamSpeed: 8400)
  const cpuLimit = cpu != null ? extractCPUMaxRamSpeed(extractSocket(cpu.specifications)) : null;
  const effectiveMax = cpuLimit != null ? Math.min(mbMaxSpeed, cpuLimit) : mbMaxSpeed;

  if (speed > effectiveMax) {
    if (cpuLimit != null && speed > cpuLimit) {
      return {
        severity: 'Warning',
        component: ram.name,
        message: `RAM (${speed} МГц) быстрее лимита контроллера памяти процессора (${cpuLimit} МГц). Возможны проблемы с запуском или стабильностью.`,
        suggestion: `Выберите RAM не быстрее ${cpuLimit} МГц или процессор с более мощным IMC`
      };
    }
    return {
      severity: 'Warning',
      component: ram.name,
      message: `RAM (${speed} МГц) быстрее поддерживаемой материнской платой (${mbMaxSpeed} МГц). Без XMP может работать медленнее.`,
      suggestion: `Выберите RAM не быстрее ${mbMaxSpeed} МГц или учтите, что потребуется тонкая настройка XMP/EXPO`
    };
  }
  return null;
}

/**
 * RAM height vs CPU cooler clearance
 */
function checkRAMClearance(ram: Product, cooling: Product): CompatibilityWarning | null {
  const ramHeight = extractRAMHeight(ram.specifications);
  const coolerClearance = extractCoolerRAMClearance(cooling.specifications);
  if (ramHeight === null || coolerClearance === null) return null;
  if (ramHeight > coolerClearance) {
    return {
      severity: 'Warning',
      component: ram.name,
      message: `Высота RAM (${ramHeight}мм) может мешать башенному кулеру (зазор ${coolerClearance}мм).`,
      suggestion: 'Выберите RAM с меньшими радиаторами или убедитесь, что кулер не нависает над слотами RAM'
    };
  }
  return null;
}

/**
 * USB-C front panel header check
 */
function checkUSB3Header(mb: Product, chassis: Product): CompatibilityWarning | null {
  const hasCaseUSBC = extractCaseHasUSBC(chassis.specifications);
  const hasMbHeader = extractHasUSB3HeaderC(mb.specifications);

  if (hasCaseUSBC === null || hasMbHeader === null) return null;
  if (hasCaseUSBC && !hasMbHeader) {
    return {
      severity: 'Warning',
      component: mb.name,
      message: 'Корпус имеет USB-C на передней панели, но материнская плата не имеет разъёма USB 3.2 Type-E.',
      suggestion: 'USB-C порт на корпусе не будет работать. Выберите материнскую плату с USB-C header или используйте адаптер'
    };
  }
  return null;
}

/**
 * M.2 SATA SSD in NVMe-only slot + M.2 key mismatch check
 */
function checkM2Interface(storage: Product, mb: Product): CompatibilityIssue | null {
  // M.2 Key mismatch: SSD key B+M physically won't fit in M-only slot
  const ssdKey = extractM2Key(storage.specifications);
  const mbKey = extractM2Key(mb.specifications);
  if (ssdKey && mbKey) {
    const ssdKeyUpper = ssdKey.toUpperCase().replace(/\s/g, '');
    const mbKeyUpper = mbKey.toUpperCase().replace(/\s/g, '');
    if (
      (ssdKeyUpper === 'B+M' || ssdKeyUpper === 'B') &&
      mbKeyUpper === 'M'
    ) {
      return {
        severity: 'Error',
        component1: storage.name,
        component2: mb.name,
        message: 'Ключ M.2 SSD (B+M) несовместим со слотом материнской платы (ключ M). SSD физически не подойдёт.',
        suggestion: 'Выберите SSD с ключом M или материнскую плату со слотом B+M (Key M)'
      };
    }
  }
  // M.2 SATA SSD in NVMe-only slot
  const m2Iface = extractM2Interface(storage.specifications);
  if (m2Iface !== 'sata') return null;
  const mbM2SupportsSata = extractM2SataSupport(mb.specifications);
  if (!mbM2SupportsSata) {
    return {
      severity: 'Error',
      component1: storage.name,
      component2: mb.name,
      message: 'M.2 SATA SSD несовместим со слотами материнской платы (только NVMe/PCIe).',
      suggestion: 'Выберите NVMe SSD или SATA SSD в форм-факторе 2.5"'
    };
  }
  return null;
}

/**
 * M.2 PCIe 5.0 in 4.0 slot (overheating warning)
 */
function checkM2PCIeGen(storage: Product, mb: Product): CompatibilityWarning | null {
  const ssdGen = extractPCIeGeneration(storage.specifications);
  const mbGen = extractMBPCIeVersion(mb.specifications);
  if (ssdGen === null || mbGen === null) return null;
  if (ssdGen > mbGen && ssdGen >= 5) {
    return {
      severity: 'Warning',
      component: storage.name,
      message: `PCIe ${ssdGen}.0 SSD в слоте PCIe ${mbGen}.0. Без радиатора возможен перегрев под нагрузкой.`,
      suggestion: 'Убедитесь, что материнская плата имеет радиатор для M.2 или приобретите отдельный'
    };
  }
  return null;
}

/**
 * M.2/SATA lane conflict — M.2 drives may disable SATA ports on budget chipsets (B660, B760, H610)
 */
function checkM2SataLaneConflict(storage: Product[], motherboard: Product): CompatibilityIssue | null {
  const m2Count = storage.filter(s => extractStorageType(s.specifications) === 'm2').length;
  if (m2Count === 0) return null;

  const sataUsed = storage.filter(s => extractStorageType(s.specifications) === 'sata').length;
  const totalSata = extractSataPorts(motherboard.specifications);
  if (totalSata === null || totalSata === 0) return null;

  const effectiveSata = Math.max(0, totalSata - m2Count);
  if (sataUsed > effectiveSata) {
    return {
      severity: 'Warning',
      component1: 'Накопители',
      component2: motherboard.name,
      message: `M.2 накопитель отключает часть SATA портов. Подключено ${sataUsed} SATA дисков, но с учётом M.2 доступно только ${effectiveSata}.`,
      suggestion: `Подключите часть SATA дисков через M.2→SATA адаптер или выберите материнскую плату с большим числом портов`,
    };
  }

  return null;
}

/**
 * Fan headers count check
 */
function checkFanHeaderCount(mb: Product, cooling: Product | undefined, _chassis: Product | undefined, selectedFans: number): CompatibilityWarning | null {
  const mbHeaders = extractFanHeaderCount(mb.specifications);
  if (mbHeaders === null) return null;

  // Сколько всего вентиляторов
  let fanCount = selectedFans;
  if (cooling) {
    const coolerFans = extractFanCount(cooling.specifications) ?? 1;
    fanCount += coolerFans;
  }

  if (fanCount <= mbHeaders) return null;

  return {
    severity: 'Warning',
    component: mb.name,
    message: `Всего ${fanCount} вентиляторов, но материнская плата имеет ${mbHeaders} разъёмов.`,
    suggestion: `Используйте разветвитель (хаб) для вентиляторов или подключите часть через molex`
  };
}

/**
 * RGB voltage compatibility (12V vs 5V)
 */
function checkRGBType(mb: Product, chassis: Product | undefined, _fans: Product[]): CompatibilityWarning | null {
  const mbRGB = extractRGBHeaderType(mb.specifications);
  if (!mbRGB || mbRGB === 'both') return null;

  // Проверяем все RGB компоненты
  const rgbComponents: string[] = [];
  if (chassis) {
    const caseRGB = extractComponentRGBType(chassis.specifications);
    if (caseRGB && caseRGB !== mbRGB) rgbComponents.push(chassis.name);
  }

  if (rgbComponents.length === 0) return null;

  return {
    severity: 'Warning',
    component: rgbComponents.join(', '),
    message: `RGB разъёмы на материнской плате (${mbRGB}) несовместимы с корпусом. 12V и 5V RGB нельзя подключать друг к другу.`,
    suggestion: 'Убедитесь, что все RGB компоненты используют одинаковое напряжение (12V или 5V/ARGB)'
  };
}

/**
 * ECC compatibility check
 */
function checkEccSupport(ram: Product, mb: Product): CompatibilityWarning | null {
  const ramEcc = extractRAMECCSupport(ram.specifications);
  const mbEcc = extractMBECCSupport(mb.specifications);

  if (ramEcc === 'ecc' && mbEcc === false) {
    return {
      severity: 'Warning',
      component: ram.name,
      message: 'ECC RAM не будет работать с этой материнской платой (не поддерживает ECC).',
      suggestion: 'Выберите Non-ECC память'
    };
  }
  return null;
}

/**
 * PSU brand safety check
 */
function checkPSUBrand(psu: Product): CompatibilityWarning | null {
  const safety = extractPSUBrandSafety(psu.specifications);
  if (safety === 'unknown') {
    return {
      severity: 'Warning',
      component: psu.name,
      message: 'Блок питания малоизвестного бренда. Реальная мощность может быть ниже заявленной.',
      suggestion: 'Выберите БП от проверенного производителя (Corsair, Seasonic, be quiet!, EVGA, Cooler Master и др.)'
    };
  }
  return null;
}

/**
 * CPU F-series + no GPU
 */
function checkNoIGCPU(cpu: Product, gpu: Product | null | undefined): CompatibilityIssue | null {
  if (gpu) return null;
  if (hasIntegratedGraphics(cpu.specifications)) return null;
  return {
    severity: 'Error',
    component1: cpu.name,
    component2: 'Система',
    message: 'Процессор не имеет встроенной видеографики, а дискретная видеокарта не выбрана.',
    suggestion: 'Выберите видеокарту или процессор со встроенной графикой'
  };
}

/**
 * Checks if motherboard has video output ports by scanning spec keys
 * for HDMI, DisplayPort, VGA, DVI, or video substrings
 */
function motherboardHasVideoOutput(specs: ProductSpecifications | undefined): boolean {
  if (!specs) return false;
  const VIDEO_KEY_SUBSTRINGS = ['hdmi', 'displayport', 'dp', 'vga', 'dvi', 'video'];
  for (const key of Object.keys(specs)) {
    const lowerKey = key.toLowerCase();
    if (VIDEO_KEY_SUBSTRINGS.some(sub => lowerKey.includes(sub))) {
      const val = specs[key];
      if (typeof val === 'number' && val > 0) return true;
      if (typeof val === 'boolean' && val) return true;
      if (typeof val === 'string' && val.length > 0 && !['none', '0', 'отсутствует', 'нет'].includes(val.toLowerCase())) return true;
    }
  }
  return false;
}

/**
 * CPU без iGPU + MB без видеовыходов + нет дискретной видеокарты
 */
function checkNoVideoOutput(cpu: Product, motherboard: Product, gpu: Product | null | undefined): CompatibilityIssue | null {
  if (gpu) return null;
  if (hasIntegratedGraphics(cpu.specifications)) return null;
  if (motherboardHasVideoOutput(motherboard.specifications)) return null;
  return {
    severity: 'Error',
    component1: cpu.name,
    component2: motherboard.name,
    message: 'Материнская плата не имеет видеовыходов, а процессор — без встроенной графики. Подключите дискретную видеокарту.',
    suggestion: 'Выберите видеокарту или материнскую плату с видеовыходами',
  };
}

/**
 * CPU overclocking on non-Z chipset
 */
function checkCPUOverclock(mb: Product, cpu: Product): CompatibilityWarning | null {
  const unlocked = extractCPUOverclockable(cpu.specifications);
  if (!unlocked) return null;
  const chipset = extractChipset(mb.specifications);
  if (!chipset) return null;
  // Intel: non-Z chipsets (B/H series) не поддерживают разгон CPU
  const upper = chipset.toUpperCase();
  if (upper.startsWith('B') || upper.startsWith('H') || upper.startsWith('Q')) {
    return {
      severity: 'Warning',
      component: cpu.name,
      message: `CPU с разблокированным множителем (K-series) на чипсете ${chipset} — разгон CPU недоступен.`,
      suggestion: 'Выберите материнскую плату на Z-чипсете для разгона процессора'
    };
  }
  return null;
}

/**
 * PSY EPS cable length vs case depth
 */
function checkPSUEPSLength(psu: Product, chassis: Product): CompatibilityWarning | null {
  const epsLen = extractPSUEPSLength(psu.specifications);
  const depth = extractCaseDepth(chassis.specifications);
  if (epsLen === null || depth === null) return null;
  if (epsLen < depth * 0.8) {
    return {
      severity: 'Warning',
      component: psu.name,
      message: `Кабель CPU EPS (${epsLen}мм) может не дотянуться до разъёма в корпусе глубиной ${depth}мм.`,
      suggestion: 'Убедитесь, что кабель БП достаточно длинный, или используйте удлинитель'
    };
  }
  return null;
}

/**
 * TPM 2.0 check — Windows 11 requires TPM 2.0 support
 */
function checkTPM(motherboard: Product): CompatibilityWarning | null {
  const tpm = extractTPMSupport(motherboard.specifications);
  if (tpm === null) {
    return {
      severity: 'Info',
      component: motherboard.name,
      message: 'Неизвестно, поддерживает ли материнская плата TPM 2.0, необходимый для Windows 11.',
      suggestion: 'Проверьте в BIOS/UEFI наличие опции TPM 2.0 (Intel PTT / AMD fTPM)',
    };
  }
  if (tpm === false) {
    return {
      severity: 'Warning',
      component: motherboard.name,
      message: 'Материнская плата не поддерживает TPM 2.0 — установка Windows 11 невозможна.',
      suggestion: 'Выберите материнскую плату с поддержкой TPM 2.0 (Intel PTT / AMD fTPM)',
    };
  }
  return null; // TPM 2.0 supported
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

  if (components.storage && components.storage.length > 0) {
    for (const s of components.storage) {
      if (!s) continue;
      const storageType = extractStorageType(s.specifications);
      t += storageType === 'm2' || storageType === 'sata' ? 10 : 3;
    }
  }

  if (components.cooling) {
    const fanCount = extractNumberFromSpecs(components.cooling.specifications, 'fanCount', 'fans', 'fan') || 1;
    t += fanCount * 3;
  }

  return t;
}

export function calculateRecommendedPSU(components: ComponentMap): number {
  const pc = calculatePowerConsumption(components);
  return Math.ceil(pc * 1.4 / 50) * 50;
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
  checkMixedRAM,
  checkCooler,
  checkPSU,
  checkCaseFF,
  checkGPULen,
  checkCoolerHeightCheck,
  checkIG,
  checkEPSSupply,
  checkPCIeSupply,
  checkGPUSlotFit,
  checkVRMCapacity,
  checkRAMSpeed,
  checkRAMClearance,
  checkUSB3Header,
  checkM2Interface,
  checkM2PCIeGen,
  checkM2SataLaneConflict,
  checkFanHeaderCount,
  checkRGBType,
  checkEccSupport,
  checkPSUBrand,
  checkNoIGCPU,
  checkNoVideoOutput,
  checkCPUOverclock,
  checkPSUEPSLength,
  check12VHPWRBend,
  checkGPUWidthClearance,
  checkTPM,
  detectMemoryFormFactorFromName,
};