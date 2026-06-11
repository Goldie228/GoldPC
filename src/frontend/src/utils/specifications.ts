import { SPEC_LABELS_GENERATED } from './specLabels.generated';
import { normalizeSpecKey } from './comparison/comparisonRules';

export type SpecValue = string | number | boolean | undefined | null;

/**
 * Локализация ключей, которых нет в specLabels.generated.ts.
 * Приоритет: SPEC_LABELS_GENERATED → SPEC_LABELS → fallback.
 */
const SPEC_LABELS: Record<string, string> = {
  directx: 'DirectX',
  chip: 'Чип',
  memory: 'Память',
  memoryType: 'Тип памяти',
  baseFrequency: 'Базовая частота',
  boostFrequency: 'Турбо частота',
  formFactor: 'Форм-фактор',
  power: 'Мощность',
  refreshRate: 'Частота обновления',
  cache: 'Кэш',
  ports: 'Разъёмы',
  memorySlots: 'Слотов памяти',
  maxMemory: 'Макс. память',
  pcieSlots: 'Слоты PCIe',
  latency: 'Задержка',
  modules: 'Модули',
  readSpeed: 'Скорость чтения',
  writeSpeed: 'Скорость записи',
  fanSize: 'Вентилятор',
  gpuLength: 'Длина видеокарты',
  cpuCoolerHeight: 'Высота кулера',
  fans: 'Вентиляторы',
  height: 'Высота',
  panelType: 'Тип матрицы',
  responseTime: 'Время отклика',
};

export function specLabel(key: string): string {
  const lower = key.toLowerCase();
  const normalized = normalizeSpecKey(key);

  return (
    SPEC_LABELS_GENERATED[key] ??
    SPEC_LABELS_GENERATED[normalized] ??
    SPEC_LABELS_GENERATED[lower] ??
    SPEC_LABELS[key] ??
    SPEC_LABELS[normalized] ??
    SPEC_LABELS[lower] ??
    key
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
  );
}

export function formatSpecValue(value: SpecValue): string {
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
  return String(value);
}

export function formatSpecValueForKey(key: string, value: SpecValue): string {
  const normKey = normalizeSpecKey(key);

  // Some imports store booleans as strings
  const isFalse =
    value === false ||
    (typeof value === 'string' && ['false', '0', 'нет', 'no'].includes(value.trim().toLowerCase()));
  const isTrue =
    value === true ||
    (typeof value === 'string' && ['true', '1', 'да', 'yes'].includes(value.trim().toLowerCase()));

  if (normKey === 'razyemy_pitaniya') {
    if (isFalse) return 'Не требуется';
    if (isTrue) return 'Требуется';
  }

  // Default formatting
  if (isTrue) return 'Да';
  if (isFalse) return 'Нет';
  return formatSpecValue(value);
}

