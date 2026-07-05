/**
 * Функции проверки — извлечены из compatibilityUtils.ts
 * Логика валидации совместимости компонентов
 */

import type { Product, ProductSpecifications } from '@/api/types';
import type { CompatibilityIssue, CompatibilityWarning, ComponentMap } from './types';
import {
  extractSocket,
  extractSocketWithFallback,
  extractMemoryType,
  extractMemoryTypeWithFallback,
  extractMemoryFormFactor,
  extractMemoryFormFactorWithFallback,
  KNOWN_SOCKETS,
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

/**
 * Определить сокет из строки чипсета (из характеристик или названия товара).
 */
function detectSocketFromChipset(chipset: string): string | null {
  const c = chipset.toUpperCase().trim();
  // Intel LGA1851 (800/900-серия)
  if (/\b(Z890|B860|H810)\b/.test(c)) return 'LGA1851';
  // Intel LGA1700 (600/700-серия десктопные)
  if (/\b(H610|B660|H670|Z690|B760|Z790|H770)\b/.test(c)) return 'LGA1700';
  // Intel LGA1200 (400/500-серия)
  if (/\b(B460|H470|H410|Z490|B560|H510|H570|Z590)\b/.test(c)) return 'LGA1200';
  // Intel LGA1151 (200/300-серия)
  if (/\b(B250|H270|Z270|B360|H310|H370|Z370|Z390|B365)\b/.test(c)) return 'LGA1151';
  // Intel LGA1155 (60/70-серия десктопные)
  if (/\b(H61|B75|H77|Z75|Z77)\b/.test(c)) return 'LGA1155';
  // Intel LGA1150 (80/90-серия десктопные)
  if (/\b(B85|H81|H87|Z87|Z97|H97)\b/.test(c)) return 'LGA1150';
  // Intel LGA2011-3 / LGA2066 (X99, X299)
  if (/\b(X99|X299)\b/.test(c)) return 'LGA2011-3';
  // Intel LGA4189 (серверные)
  if (/\b(C621|C622|C624|C625|C626)\b/.test(c)) return 'LGA4189';
  // Intel мобильные чипсеты → LGA1155 (Sandy/Ivy Bridge)
  if (/\b(HM[567]\d|QM[567]\d|QS[567]\d|UM[567]\d)\b/.test(c)) return 'LGA1155';
  // Intel мобильные 80/90-серия → LGA1150
  if (/\b(HM8\d|QM8\d|HM9\d|QM9\d)\b/.test(c)) return 'LGA1150';
  // AMD AM5 (600/800-серия)
  if (/\b(B650E?|X670E?|X870E?|B850|A620)\b/.test(c)) return 'AM5';
  // AMD AM4
  if (/\b(A320|B350|B450|A520|B550|X370|X470|X570)\b/.test(c)) return 'AM4';
  // AMD TRX40, WRX80, TRX50 (Threadripper)
  if (/\b(TRX40|WRX80|TRX50)\b/.test(c)) return 'sTRX4';
  return null;
}

function detectSocketFromName(productName: string): string | null {
  const upper = productName.toUpperCase();
  // Intel LGA1851: Z890, B860, H810
  if (/\b(Z890|B860|H810)\b/.test(upper)) return 'LGA1851';
  // Intel LGA1700 чипсеты
  if (/\b(H610|B660|H670|Z690|B760|Z790|H770)\b/.test(upper)) return 'LGA1700';
  // Intel LGA1200 чипсеты
  if (/\b(B460|H470|H410|Z490|B560|H510|H570|Z590)\b/.test(upper)) return 'LGA1200';
  // Intel LGA1151 чипсеты
  if (/\b(B250|H270|Z270|B360|H310|H370|Z370|Z390|B365)\b/.test(upper)) return 'LGA1151';
  // Intel LGA1150 чипсеты
  if (/\b(H81|B85|H87|Z87|Z97|H97|Q85|Q87|H97|C226|C232|C612)\b/.test(upper)) return 'LGA1150';
  // Intel десктопные LGA1155
  if (/\b(H61|B75|H77|Z77)\b/.test(upper)) return 'LGA1155';
  // AMD AM5 (600/800-серия)
  if (/\b(B650E?|X670E?|X870E?|B850|A620)\b/.test(upper)) return 'AM5';
  // AMD AM4
  if (/\b(A320|B350|B450|A520|B550|X370|X470|X570)\b/.test(upper)) return 'AM4';
  // Названия сокетов напрямую
  if (upper.includes('AM5')) return 'AM5';
  if (upper.includes('AM4')) return 'AM4';
  if (upper.includes('LGA1851')) return 'LGA1851';
  if (upper.includes('LGA1700')) return 'LGA1700';
  if (upper.includes('LGA1200')) return 'LGA1200';
  if (upper.includes('LGA1151')) return 'LGA1151';
  if (upper.includes('LGA1155')) return 'LGA1155';
  if (upper.includes('LGA1150')) return 'LGA1150';
  return null;
}

function checkCPUSocket(cpu: Product, mb: Product): CompatibilityIssue | null {
  const cs = extractSocketWithFallback(cpu, cpu.specifications);
  const ms = extractSocketWithFallback(mb, mb.specifications);

  // Известное несоответствие (нормализуем варианты LGA1151 — V1/V2 имеют один и тот же физический разъём)
  if (cs && ms) {
    const norm = (s: string) => s.replace(/\s*v2/i, '').toUpperCase();
    if (norm(cs) !== norm(ms)) {
      return { severity: 'Error', component1: cpu.name, component2: mb.name, message: `CPU socket ${cs} incompatible with motherboard socket ${ms}`, suggestion: `Choose motherboard with socket ${cs}` };
    }
  }

  // Один или оба неизвестны — пропускаем (не блокируем сборку из-за неопределяемых сокетов)
  // if (!cs || !ms) {
  //   const unknown = !cs ? cpu.name : mb.name;
  //   return { severity: 'Error', component1: cpu.name, component2: mb.name, message: `Не удалось определить сокет: ${unknown}`, suggestion: 'Проверьте характеристики компонента' };
  // }

  return null;
}

/**
 * Определить форм-фактор памяти из названия товара или SKU (запасной вариант для ProductSummary без характеристик).
 * Чистая функция — одинаковый вход, одинаковый выход.
 * @param productName - Название товара (всегда доступно)
 * @param sku - SKU/модельный номер товара (опционально, может содержать подсказки о форм-факторе)
 */
function detectMemoryFormFactorFromName(productName: string, sku?: string): 'DIMM' | 'SO-DIMM' | null {
  const upper = productName.toUpperCase();

  // ── Признаки SO-DIMM в названии товара ──
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

  // ── Признаки десктопных DIMM в названии товара ──
  if (
    upper.includes('DIMM') ||
    upper.includes('UDIMM') ||
    upper.includes('DESKTOP') ||
    upper.includes('НАСТОЛЬН')
  ) return 'DIMM';

  // ── Проверяем SKU/модельный номер для дополнительных подсказок ──
  if (sku) {
    const skuUpper = sku.toUpperCase();
    if (skuUpper.includes('SO-DIMM') || skuUpper.includes('SODIMM')) return 'SO-DIMM';
    if (skuUpper.includes('DIMM') || skuUpper.includes('UDIMM')) return 'DIMM';

    // Распространённые префиксы моделей SO-DIMM: Samsung M471*, SK Hynix HMA* / HMC* / HMT*
    if (/^M47[0-9]/.test(skuUpper) || /^HM[ACT]/.test(skuUpper)) return 'SO-DIMM';
  }

  return null;
}

function detectMemoryTypeFromName(productName: string): 'DDR5' | 'DDR4' | 'DDR3' | null {
  const upper = productName.toUpperCase();
  if (upper.includes('DDR5')) return 'DDR5';
  if (upper.includes('DDR4') || upper.includes('LPDDR4')) return 'DDR4';
  if (upper.includes('DDR3') || upper.includes('DDR3L')) return 'DDR3';
  return null;
}

function detectMBMemoryTypeFromName(productName: string, socket?: string | null, chipset?: string | null): 'DDR5' | 'DDR4' | 'DDR3' | null {
  const upper = productName.toUpperCase();
  const context = ((socket ?? '') + ' ' + (chipset ?? '') + ' ' + upper).toUpperCase();

  // Прямое определение по чипсету (наиболее надёжно)
  const chipU = (chipset ?? '').toUpperCase();
  if (/\b(Z890|B860|H810)\b/.test(chipU)) return 'DDR5';
  if (/\b(B650E?|X670E?|X870E?|B850|A620)\b/.test(chipU)) return 'DDR5';
  if (/\b(H610|B660|H670|Z690)\b/.test(chipU)) return 'DDR4';
  if (/\b(B760|Z790|H770)\b/.test(chipU)) return 'DDR5';
  if (/\b(B460|H470|H410|Z490|B560|H510|H570|Z590)\b/.test(chipU)) return 'DDR4';
  if (/\b(B250|H270|Z270|B360|H310|H370|H410|Z370|Z390|B365)\b/.test(chipU)) return 'DDR4';
  if (/\b(H61|B75|H77|Z77|Z75|B85|H81|H87|Z87|Z97|H97)\b/.test(chipU)) return 'DDR3';
  if (/\b(HM[567]\d|QM[567]\d)\b/.test(chipU)) return 'DDR3';
  if (/\b(HM8\d|QM8\d|HM9\d|QM9\d)\b/.test(chipU)) return 'DDR3';
  if (/\b(X99|X299)\b/.test(chipU)) return 'DDR4';
  if (/\b(TRX40|WRX80|TRX50)\b/.test(chipU)) return 'DDR4';

  // Определение по сокету
  if (context.includes('AM5') || context.includes('LGA1851')) return 'DDR5';
  if (/\bHM[5678]\d/.test(context)) return 'DDR3';
  // Сервер/рабочая станция
  if (context.includes('SP3') || context.includes('EPYC') || upper.includes('SUPERMICRO') || upper.includes('ASUS WS')) return 'DDR4';
  if (context.includes('LGA4677') || context.includes('LGA3647')) return 'DDR4';
  if (context.includes('STRX4') || context.includes('SWRX8') || context.includes('THREADRIPPER')) return 'DDR4';
  // Потребительские
  if (upper.includes('AM4') || upper.includes('LGA1151') || upper.includes('LGA1200')) return 'DDR4';
  if (upper.includes('LGA1700')) {
    if (upper.includes('DDR5')) return 'DDR5';
    return 'DDR4';
  }

  // Определение по названию чипсета (крайняя мера — название товара содержит чипсет)
  if (/\b(Z890|B860|H810|Z790|Z690)\b/.test(upper)) {
    if (upper.includes('DDR5')) return 'DDR5';
    return 'DDR4';
  }
  if (/\b(B850|X870E?|B650E?|X670E?|A620)\b/.test(upper)) return 'DDR5';
  if (/\b(H610|B660|H670)\b/.test(upper)) return 'DDR4';
  if (/\b(B760|H770)\b/.test(upper)) return 'DDR5';
  if (/\b(B560|H510|H570|Z590|B460|H470|H410|Z490)\b/.test(upper)) return 'DDR4';
  if (/\b(B360|H310|H370|H410|Z370|Z390|B365|B250|H270|Z270)\b/.test(upper)) return 'DDR4';
  if (/\b(H81|Z87|Z97|H97|B85|H77|Z77|H61|B75|Z75)\b/.test(upper)) return 'DDR3';
  if (/\b(X99|X299)\b/.test(upper)) return 'DDR4';
  if (/\b(TRX40|WRX80|TRX50)\b/.test(upper)) return 'DDR4';

  return null;
}

/**
 * Определить тип DDR по чипсету: сопоставляет семейство чипсета с поколением памяти.
 */
function detectMemoryTypeFromChipset(chipset: string): 'DDR5' | 'DDR4' | 'DDR3' | null {
  // Удаляем завершающую M (признак форм-фактора Micro-ATX, не вариант чипсета): H310M → H310, B450M → B450
  // Сохраняет реальные суффиксы чипсетов типа B650E, X670E
  const c = chipset.toUpperCase().trim().replace(/([A-Z]\d{3})M$/i, '$1');
  // Intel LGA1851 → DDR5
  if (/\b(Z890|B860|H810)\b/.test(c)) return 'DDR5';
  // Intel LGA1700 (600-серия) → DDR4
  if (/\b(H610|B660|H670|Z690)\b/.test(c)) return 'DDR4';
  // Intel LGA1700 (700-серия) → DDR5
  if (/\b(B760|Z790|H770)\b/.test(c)) return 'DDR5';
  // Intel LGA1200 (400/500-серия) → DDR4
  if (/\b(B460|H470|H410|Z490|B560|H510|H570|Z590)\b/.test(c)) return 'DDR4';
  // Intel LGA1151 (200/300-серия) → DDR4
  if (/\b(B250|H270|Z270|B360|H310|H370|H410|Z370|Z390|B365)\b/.test(c)) return 'DDR4';
  // Intel LGA1155/1150 → DDR3
  if (/\b(H61|B75|H77|Z77|Z75|B85|H81|H87|Z87|Z97|H97)\b/.test(c)) return 'DDR3';
  // Intel мобильные 50/60/70 серия → DDR3
  if (/\b(HM[567]\d|QM[567]\d)\b/.test(c)) return 'DDR3';
  // Intel мобильные 80/90 серия → DDR3L
  if (/\b(HM8\d|QM8\d|HM9\d|QM9\d)\b/.test(c)) return 'DDR3';
  // AMD AM5 → DDR5
  if (/\b(B650E?|X670E?|X870E?|B850|A620)\b/.test(c)) return 'DDR5';
  // AMD AM4 → DDR4
  if (/\b(A320|B350|B450|A520|B550|X370|X470|X570)\b/.test(c)) return 'DDR4';
  // Intel LGA2011-3, LGA2066 (X99, X299) → DDR4
  if (/\b(X99|X299)\b/.test(c)) return 'DDR4';
  // AMD TRX40, WRX80, TRX50 → DDR4
  if (/\b(TRX40|WRX80|TRX50)\b/.test(c)) return 'DDR4';
  return null;
}

function checkRAM(ram: Product, mb: Product, quantity: number = 1): CompatibilityIssue | null {
  let rt = extractMemoryTypeWithFallback(ram, ram.specifications);
  let mt = extractMemoryTypeWithFallback(mb, mb.specifications);

  // Запасной вариант: определяем тип памяти по чипсету или сокету (работает даже если характеристики пусты)
  if (!mt) {
    const chipset = (mb.specifications?.['chipset'] as string) ?? '';
    const chipsetType = detectMemoryTypeFromChipset(chipset);
    // Также пробуем извлечь чипсет из названия товара (например, "AFB250" → "B250")
    const nameChipsetMatch = mb.name.match(/([ABHZ]\d{3}[A-Z]?)\b/i);
    const nameChipsetType = nameChipsetMatch ? detectMemoryTypeFromChipset(nameChipsetMatch[1]) : null;
    // Пробуем определение по сокету
    const socket = extractSocket(mb, mb.specifications);
    const socketType = socket ? detectMemoryTypeFromChipset(socket) : null;
    mt = chipsetType ?? nameChipsetType ?? socketType ?? null;
  }
  if (!rt) {
    rt = extractMemoryType(ram.specifications) ?? detectMemoryTypeFromName(ram.name);
  }

  // Известное несоответствие типа памяти
  if (rt && mt && rt !== mt) {
    return { severity: 'Error', component1: ram.name, component2: mb.name, message: `Тип памяти ${rt} не поддерживается материнской платой (${mt})`, suggestion: `Выберите память ${mt}` };
  }

  // Один или оба неизвестны — пропускаем проверку (нельзя определить)
  if (!rt || !mt) {
    return null;
  }

  // Сначала пробуем характеристики, затем определение по названию+SKU (для ProductSummary)
  const rff = extractMemoryFormFactor(ram.specifications) ?? detectMemoryFormFactorFromName(ram.name, ram.sku);
  const mff = extractMemoryFormFactor(mb.specifications) ?? 'DIMM';

  // Известное несоответствие форм-фактора
  if (rff && mff && rff !== mff) {
    return { severity: 'Error', component1: ram.name, component2: mb.name, message: `Форм-фактор памяти ${rff} несовместим с материнской платой (${mff})`, suggestion: `Выберите модули памяти ${mff}` };
  }

  // Форм-фактор RAM неизвестен
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
 * Проверка на смешанные планки RAM — разные производители, частоты, объёмы
 * Несколько непарных планок могут вызвать нестабильность или отказ POST на AM5 и др.
 * Чистая функция, принимает массив продуктов RAM, возвращает массив предупреждений.
 */
function checkMixedRAM(ramSticks: Product[]): CompatibilityWarning[] {
  const warnings: CompatibilityWarning[] = [];
  if (!ramSticks || ramSticks.length < 2) return warnings;

  // 1. Проверка единообразия производителя/бренда
  const brands = new Set(ramSticks.map(s => s.brand?.toLowerCase()).filter(Boolean));
  if (brands.size > 1) {
    warnings.push({
      severity: 'Warning', component: 'Смешанные планки RAM',
      message: 'Обнаружены планки RAM разных производителей. Смешивание брендов может вызвать нестабильность или отказ POST.',
      suggestion: 'Используйте одинаковые планки RAM из одного набора (Kit)'
    });
  }

  // 2. Проверка единообразия частоты
  const speeds = new Set(ramSticks.map(s => extractRAMSpeed(s.specifications)).filter((s): s is number => s !== null));
  if (speeds.size > 1) {
    const min = Math.min(...speeds);
    warnings.push({
      severity: 'Warning', component: 'Смешанные планки RAM',
      message: `Планки RAM имеют разную частоту (${[...speeds].join(', ')} МГц). Все планки будут работать на ${min} МГц.`,
      suggestion: 'Для максимальной производительности используйте планки RAM с одинаковой частотой'
    });
  }

  // 3. Проверка единообразия объёма
  const capacities = new Set(ramSticks.map(s => extractRAMCapacity(s.specifications)).filter(c => c > 0));
  if (capacities.size > 1) {
    warnings.push({
      severity: 'Warning', component: 'Смешанные планки RAM',
      message: `Планки RAM имеют разный объём (${[...capacities].join(', ')} ГБ). Двухканальный режим будет несимметричным.`,
      suggestion: 'Используйте планки RAM одинакового объёма для оптимальной производительности'
    });
  }

  // 4. Проверка единообразия таймингов (CAS latency)
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
  if (cs && ss.length > 0 && !ss.includes(cs)) return { severity: 'Warning', component: cooling.name, message: `Кулер может не поддерживать сокет ${cs}`, suggestion: `Проверьте совместимость кулера с ${cs}` };
  const maxTdp = extractMaxCoolerTDP(cooling.specifications);
  const cpuTdp = extractTDP(cpu.specifications);
  if (maxTdp > 0 && cpuTdp > maxTdp) return { severity: 'Warning', component: cooling.name, message: `Кулер (макс. TDP ${maxTdp}Вт) может быть недостаточен для ${cpu.name} (${cpuTdp}Вт)`, suggestion: `Выберите кулер с TDP >= ${cpuTdp}Вт` };
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
    return { severity: 'Error', component1: chassis.name, component2: mb.name, message: `Корпус не поддерживает форм-фактор ${ff}`, suggestion: `Поддерживаемые: ${sf.join(', ')}` };
  }

  // Форм-фактор неизвестен
  if (!ff) {
    return { severity: 'Error', component1: chassis.name, component2: mb.name, message: `Не удалось определить форм-фактор материнской платы: ${mb.name}`, suggestion: 'Проверьте характеристики материнской платы' };
  }

  return null;
}

function checkGPULen(chassis: Product, gpu: Product): CompatibilityWarning | null {
  const ml = extractMaxGPULength(chassis.specifications);
  const gl = extractGPULength(gpu.specifications);

  if (ml && gl && gl > ml) {
    return { severity: 'Warning', component: gpu.name, message: `Длина GPU ${gl}мм может превышать макс. для корпуса ${ml}мм`, suggestion: `Выберите более короткую GPU или больший корпус` };
  }

  // Сообщаем, если один размер известен, а другой нет
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
    return { severity: 'Error', component1: cooling.name, component2: chassis.name, message: `Высота кулера ${ch}мм превышает макс. для корпуса ${mch}мм`, suggestion: `Выберите кулер <= ${mch}мм, СЖО или больший корпус` };
  }

  // Высота неизвестна
  if (ch > 0 && !mch) {
    return { severity: 'Warning', component1: cooling.name, component2: chassis.name, message: 'Не удалось определить максимальную высоту кулера для корпуса.', suggestion: 'Проверьте характеристики корпуса' };
  }

  return null;
}

function checkIG(cpu: Product, gpu: Product | null | undefined): CompatibilityWarning | null {
  if (gpu || hasIntegratedGraphics(cpu.specifications, cpu.name)) return null;
  return { severity: 'Warning', component: cpu.name, message: 'Процессор не имеет встроенной графики', suggestion: 'Добавьте дискретную видеокарту или выберите процессор со встроенной графикой' };
}

/**
 * Проверка питания EPS — достаточно ли EPS12V кабелей у БП для материнской платы
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
 * Проверка питания PCIe — достаточно ли PCIe кабелей у БП для видеокарты
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
 * Ширина слота GPU против слотов расширения корпуса
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
 * Проверка радиуса изгиба 12VHPWR — хватает ли глубины корпуса для безопасного изгиба кабеля
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
 * Проверка зазора по ширине GPU — не упирается ли широкая видеокарта в стенку корпуса
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

  // Эвристика: если vrmPhases < 8 для CPU > 125W
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
 * Проверка скорости RAM — частота RAM превышает поддерживаемую материнской платой или лимит IMC процессора
 */
function checkRAMSpeed(ram: Product, mb: Product, cpu?: Product): CompatibilityWarning | null {
  const speed = extractRAMSpeed(ram.specifications);
  const mbMaxSpeed = extractMaxRamSpeed(mb.specifications);
  if (speed === null || mbMaxSpeed === null) return null;

  // Лимит IMC процессора на основе группы сокета (например, AM5 maxRamSpeed: 8400)
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
 * Высота RAM и зазор с кулером CPU
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
 * Проверка USB-C заголовка на передней панели
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
 * M.2 SATA SSD в слоте только для NVMe + проверка несоответствия ключа M.2
 */
function checkM2Interface(storage: Product, mb: Product): CompatibilityIssue | null {
  // Несоответствие ключа M.2: SSD с ключом B+M физически не подойдёт в слот только M
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
  // M.2 SATA SSD в слоте только для NVMe
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
 * M.2 PCIe 5.0 в слоте 4.0 (предупреждение о перегреве)
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
 * Конфликт линий M.2/SATA — M.2 накопители могут отключать порты SATA на бюджетных чипсетах (B660, B760, H610)
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
 * Проверка количества разъёмов для вентиляторов
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
 * Совместимость напряжения RGB (12V vs 5V)
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
 * Проверка совместимости ECC
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
 * Проверка безопасности бренда БП
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
 * CPU F-серии + нет GPU
 */
function checkNoIGCPU(cpu: Product, gpu: Product | null | undefined): CompatibilityIssue | null {
  if (gpu) return null;
  if (hasIntegratedGraphics(cpu.specifications, cpu.name)) return null;
  return {
    severity: 'Error',
    component1: cpu.name,
    component2: 'Система',
    message: 'Процессор не имеет встроенной видеографики, а дискретная видеокарта не выбрана.',
    suggestion: 'Выберите видеокарту или процессор со встроенной графикой'
  };
}

/**
 * Проверяет, имеет ли материнская плата порты видеовыхода, сканируя ключи характеристик
 * на наличие HDMI, DisplayPort, VGA, DVI или video подстрок
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
  if (hasIntegratedGraphics(cpu.specifications, cpu.name)) return null;
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
 * Разгон CPU на не-Z чипсете
 */
function checkCPUOverclock(mb: Product, cpu: Product): CompatibilityWarning | null {
  const unlocked = extractCPUOverclockable(cpu.specifications);
  if (!unlocked) return null;
  const chipset = extractChipset(mb.specifications);
  if (!chipset) return null;
  // Intel: не-Z чипсеты (B/H серии) не поддерживают разгон CPU
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
 * Длина кабеля EPS БП против глубины корпуса
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
 * Проверка TPM 2.0 — Windows 11 требует поддержки TPM 2.0
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
  return null; // TPM 2.0 поддерживается
}

/**
 * Нормализовать название сокета к канонической форме БД.
 * "LGA1151 V2" → "LGA1151", "sTRX4" → "sTRX4", и т.д.
 */
function normalizeSocket(socket: string): string {
  // LGA1151 V1 и V2 — один и тот же физический разъём — БД хранит как "LGA1151"
  if (/^LGA1151\b/i.test(socket)) return 'LGA1151';
  return socket;
}

/**
 * Максимально возможное определение сокета для любого товара.
 * Проверяет по порядку: продвинутое поле → характеристики → чипсет → название товара.
 * Принимает ProductSummary (с продвинутыми полями, без словаря характеристик) или Product (со словарём характеристик).
 */
export function resolveSocket(
  productOrSpecs: { socket?: string; specifications?: ProductSpecifications; name?: string; description?: string; descriptionShort?: string } | ProductSpecifications | null | undefined,
  productName?: string,
): string | null {
  // 1. Проверяем продвинутое поле (ProductSummary.socket)
  if (productOrSpecs && typeof productOrSpecs === 'object' && 'socket' in productOrSpecs) {
    const promoted = (productOrSpecs as { socket?: string }).socket;
    if (promoted) {
      const normalized = normalizeSocket(promoted.toUpperCase().trim());
      if (KNOWN_SOCKETS.has(normalized)) return normalized;
    }
  }

  // 2. Извлекаем из словаря характеристик
  const specs = (productOrSpecs && typeof productOrSpecs === 'object' && 'specifications' in productOrSpecs)
    ? (productOrSpecs as { specifications?: ProductSpecifications }).specifications
    : (productOrSpecs as ProductSpecifications | null | undefined);
  const fromSpecs = extractSocket(specs);
  if (fromSpecs) return normalizeSocket(fromSpecs);

  // 3. Определяем по чипсету
  const chipset = (specs as Record<string, unknown>)?.chipset;
  if (typeof chipset === 'string') {
    const fromChipset = detectSocketFromChipset(chipset);
    if (fromChipset) return normalizeSocket(fromChipset);
  }

  // 4. Определяем по описанию (запасной вариант для товаров с пустыми характеристиками)
  const desc = (productOrSpecs && typeof productOrSpecs === 'object' && 'description' in productOrSpecs)
    ? (productOrSpecs as { description?: string }).description
    : undefined;
  const descShort = (productOrSpecs && typeof productOrSpecs === 'object' && 'descriptionShort' in productOrSpecs)
    ? (productOrSpecs as { descriptionShort?: string }).descriptionShort
    : undefined;
  const descText = desc || descShort;
  if (descText) {
    // Парсим "Сокет: LGA1150" или "Socket: AM4" из текста описания
    const socketMatch = descText.match(/(?:Сокет|Socket|Сокет\s+процессора)[:\s]+([A-Za-z0-9\s\-]+)/i);
    if (socketMatch) {
      const socketCandidate = socketMatch[1].trim().split(/[\s\n]/)[0].toUpperCase();
      const normalized = normalizeSocket(socketCandidate);
      if (KNOWN_SOCKETS.has(normalized)) return normalized;
    }
  }

  // 5. Определяем по названию товара
  const name = productName ?? ((productOrSpecs && typeof productOrSpecs === 'object' && 'name' in productOrSpecs)
    ? (productOrSpecs as { name?: string }).name
    : undefined);
  if (name) {
    return normalizeSocket(detectSocketFromName(name));
  }
  return null;
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