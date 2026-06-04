/**
 * Tips — информационные подсказки для новичков
 * Чистые функции, возвращающие советы по сборке ПК
 */

import type { CompatibilityWarning } from './types';
import type { Product } from '../../../api/types';
import { extractMemoryType, extractRAMSpeed, extractBaseRAMSpeed, extractCPUOverclockable, extractTPMSupport, extractThermalPasteIncluded, extractRAMECCSupport, extractSocket, extractMBECCSupport, extractMemoryRank, extractM2Interface, extractPCIeGeneration, extractM2Key } from './extractors';
import { extractMemorySlots, extractRAMCapacity } from './extractors';

/**
 * Совет: подключение монитора к GPU, не к материнской плате
 */
export function tipMonitorToGPU(cpu: Product | undefined, gpu: Product | undefined): CompatibilityWarning | null {
  if (!cpu || !gpu) return null;
  const hasIG = hasIntegratedGraphics(cpu.specifications);
  if (!hasIG) return null;
  return {
    severity: 'Info' as const,
    component: 'Сборка',
    message: 'Подключайте монитор к дискретной видеокарте, а не к материнской плате.',
    suggestion: 'Кабель монитора должен идти в видеокарту (ниже на задней панели), а не в разъём материнской платы.'
  };
}

/**
 * Совет: DDR5 первый запуск — долгий DRAM training
 */
export function tipDDR5Training(ram: Product | undefined): CompatibilityWarning | null {
  if (!ram) return null;
  const memType = extractMemoryType(ram.specifications);
  if (memType !== 'DDR5') return null;
  return {
    severity: 'Info' as const,
    component: ram.name,
    message: 'DDR5: первый запуск может длиться 30-120 секунд (DRAM Training). Это нормально.',
    suggestion: 'После сборки включите ПК и подождите до 2 минут. Если нет изображения — проверьте установку RAM.'
  };
}

/**
 * Совет: XMP/EXTO профиль не включён — RAM работает медленнее
 */
export function tipXMPNeeded(ram: Product | undefined, mb: Product | undefined): CompatibilityWarning | null {
  if (!ram) return null;
  const speed = extractRAMSpeed(ram.specifications);
  const baseSpeed = extractBaseRAMSpeed(ram.specifications);
  if (!speed) return null;
  // Если базовая (JEDEC) скорость не указана, считаем что DDR5 = 4800, DDR4 = 2133
  const memType = extractMemoryType(ram.specifications);
  const jedecBase = baseSpeed ?? (memType === 'DDR5' ? 4800 : 2133);
  if (speed > jedecBase) {
    return {
      severity: 'Info' as const,
      component: ram.name,
      message: `RAM работает на ${jedecBase} МГц. Для скорости ${speed} МГц включите XMP/EXPO в BIOS.`,
      suggestion: 'Зайдите в BIOS/UEFI, найдите XMP (Intel) или EXPO (AMD) и включите профиль.'
    };
  }
  return null;
}

/**
 * Совет: правильная установка 2 модулей RAM (слоты A2/B2 для dual channel)
 */
export function tipDualChannel(ramCount: number, mb: Product | undefined): CompatibilityWarning | null {
  if (ramCount < 2 || !mb) return null;
  const slots = extractMemorySlots(mb.specifications);
  if (slots < 4) return null; // На 2-слотовых платах вопросов нет
  return {
    severity: 'Info' as const,
    component: 'ОЗУ',
    message: 'Для двухканального режима устанавливайте модули RAM в слоты 2 и 4 (считая от процессора) или A2/B2.',
    suggestion: 'Проверьте маркировку на материнской плате: обычно первый канал — слоты A1/A2, второй — B1/B2. Используйте A2 и B2.'
  };
}

/**
 * Совет: термопаста
 */
export function tipThermalPaste(cooler: Product | undefined): CompatibilityWarning | null {
  if (!cooler) return null;
  const hasPaste = extractThermalPasteIncluded(cooler.specifications);
  if (hasPaste === false) {
    return {
      severity: 'Info' as const,
      component: cooler.name,
      message: 'Кулер не включает термопасту. Приобретите её отдельно.',
      suggestion: 'Needed tube of thermal paste (Arctic MX-4/6, Thermal Grizzly Kryonaut, Noctua NT-H1/2).'
    };
  }
  // Если null — данных нет, тихо пропускаем
  return null;
}

/**
 * Совет: одна планка RAM без dual channel
 */
export function tipSingleChannel(ramCount: number): CompatibilityWarning | null {
  if (ramCount !== 1) return null;
  return {
    severity: 'Info' as const,
    component: 'ОЗУ',
    message: 'Одна планка RAM работает в одноканальном режиме. Добавьте вторую для +20-40% производительности в играх.',
    suggestion: 'Установите две одинаковые планки для двухканального режима.'
  };
}

/**
 * Совет: не забудьте снять плёнку с кулера
 */
export function tipRemoveCoolerFilm(): CompatibilityWarning {
  return {
    severity: 'Info' as const,
    component: 'Сборка',
    message: 'Перед установкой кулера снимите защитную плёнку с его подошвы!',
    suggestion: 'Иначе процессор перегреется и ПК будет выключаться.'
  };
}

/**
 * Совет: проверьте выключатель БП
 */
export function tipCheckPSUSwitch(): CompatibilityWarning {
  return {
    severity: 'Info' as const,
    component: 'Сборка',
    message: 'После сборки убедитесь, что выключатель на блоке питания в положении "I" (включено).',
    suggestion: 'БП имеет тумблер на задней панели — переведите его в положение включено (I), а не выключено (O).'
  };
}

/** Helper — дублируем hasIntegratedGraphics чтобы избежать циклических зависимостей */
function hasIntegratedGraphics(specs: Record<string, unknown> | undefined): boolean {
  if (!specs) return false;
  const ig = (specs as Record<string, unknown>).integratedGraphics ?? (specs as Record<string, unknown>).integrated_graphics;
  if (typeof ig === 'boolean') return ig;
  if (typeof ig === 'string') {
    const l = ig.trim().toLowerCase();
    if (l === 'true' || l === 'да' || l === 'yes') return true;
    if (l.length > 0 && l !== 'false' && l !== 'нет' && l !== 'no' && l !== 'none' && l !== 'отсутствует' && l !== 'нет встроенной' && l !== 'нет графического ядра') return true;
  }
  return false;
}
