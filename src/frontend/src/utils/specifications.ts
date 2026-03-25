import { SPEC_LABELS_GENERATED } from './specLabels.generated';

export type SpecValue = string | number | boolean | undefined | null;

/** Расширенный словарь русских названий характеристик (локализация) */
const SPEC_LABELS: Record<string, string> = {
  vram: 'Объём видеопамяти',
  videopamyat: 'Объём видеопамяти (ГБ)',
  gpu: 'Серия GPU',
  razyemy_pitaniya: 'Разъёмы питания',
  release_year: 'Год выхода на рынок',
  okhlazhdenie_1: 'Охлаждение',
  graficheskiy_protsessor: 'Графический процессор',
  shirina_shiny_pamyati: 'Ширина шины памяти',
  proizvoditel_graficheskogo_protsessora: 'Производитель графического процессора',
  vysota_videokarty: 'Высота видеокарты',
  dlina_videokarty: 'Длина видеокарты',
  directx: 'DirectX',
  chip: 'Чип',
  memory: 'Память',
  memoryType: 'Тип памяти',
  interface: 'Интерфейс',
  socket: 'Сокет',
  cores: 'Количество ядер',
  threads: 'Потоки',
  integrated_graphics: 'Встроенная графика',
  cooling_included: 'Охлаждение в комплекте',
  multithreading: 'Многопоточность',
  baseFrequency: 'Базовая частота',
  boostFrequency: 'Турбо частота',
  chipset: 'Чипсет',
  form_factor: 'Форм-фактор',
  formFactor: 'Форм-фактор',
  type: 'Тип',
  capacity: 'Объём',
  frequency: 'Частота',
  wattage: 'Мощность',
  power: 'Мощность',
  efficiency: 'Сертификат 80+',
  modular: 'Модульный',
  color: 'Цвет',
  tdp: 'TDP',
  diagonal: 'Диагональ',
  resolution: 'Разрешение',
  refresh_rate: 'Частота обновления',
  refreshRate: 'Частота обновления',
  connection: 'Подключение',
  cache: 'Кэш',
  ports: 'Разъёмы',
  memorySlots: 'Слотов памяти',
  maxMemory: 'Макс. память',
  pcieSlots: 'Слоты PCIe',
  latency: 'Задержка',
  voltage: 'Напряжение',
  modules: 'Модули',
  readSpeed: 'Скорость чтения',
  writeSpeed: 'Скорость записи',
  fanSize: 'Вентилятор',
  fan_size: 'Вентилятор',
  material: 'Материал',
  window: 'Прозрачное окно',
  max_cooler_height: 'Макс. высота кулера',
  max_gpu_length: 'Макс. длина видеокарты',
  gpuLength: 'Длина видеокарты',
  cpuCoolerHeight: 'Высота кулера',
  fans: 'Вентиляторы',
  noise: 'Уровень шума',
  height: 'Высота',
  panelType: 'Тип матрицы',
  matrix: 'Матрица',
  responseTime: 'Время отклика',
  dpi: 'DPI',
  sensor_type: 'Тип сенсора',
  connection_type: 'Тип подключения',
  ecc: 'ECC',
  xmp: 'Профили XMP',
  expo: 'AMD EXPO',
  data_vykhoda_na_rynok: 'Год выхода на рынок',
  driver_size: 'Размер драйвера, мм',
  impedance: 'Импеданс',
};

/** snake_case → человекочитаемое русское (частые исключения) */
const SNAKE_TO_RU: Record<string, string> = {
  release_year: 'Год выхода на рынок',
  data_vykhoda_na_rynok: 'Год выхода на рынок',
  driver_size: 'Размер драйвера',
  max_cooler_height: 'Макс. высота кулера',
  max_gpu_length: 'Макс. длина видеокарты',
  connection_type: 'Тип подключения',
  sensor_type: 'Тип сенсора',
  refresh_rate: 'Частота обновления',
  response_time: 'Время отклика',
  form_factor: 'Форм-фактор',
  fan_size: 'Размер вентилятора',
};

function normalizeSpecKey(rawKey: string): string {
  const trimmed = rawKey.trim();
  if (!trimmed) return '';

  // Convert "Okhlazhdenie 1" / "Release Year" / "some-key" to snake_case-like key.
  const spacedToUnderscore = trimmed
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .replace(/[^\w]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  return spacedToUnderscore.toLowerCase();
}

export function specLabel(key: string): string {
  const lower = key.toLowerCase();
  const normalized = key.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  const normalizedLoose = normalizeSpecKey(key);

  return (
    SPEC_LABELS_GENERATED[key] ??
    SPEC_LABELS_GENERATED[normalized] ??
    SPEC_LABELS_GENERATED[normalizedLoose] ??
    SPEC_LABELS_GENERATED[lower] ??
    SPEC_LABELS[key] ??
    SPEC_LABELS[normalized] ??
    SPEC_LABELS[normalizedLoose] ??
    SPEC_LABELS[lower] ??
    SNAKE_TO_RU[lower] ??
    SNAKE_TO_RU[normalized] ??
    SNAKE_TO_RU[normalizedLoose] ??
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

