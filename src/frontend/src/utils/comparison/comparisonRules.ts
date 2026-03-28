import type { ProductCategory } from '../../api/types';

export type ComparisonMode = 'min' | 'max' | 'compatibility' | 'none';
export type ComparisonValueType = 'number' | 'text' | 'boolean';

export interface ComparisonRule {
  mode: ComparisonMode;
  valueType: ComparisonValueType;
}

type RuleMap = Record<string, ComparisonRule>;

const rule = (mode: ComparisonMode, valueType: ComparisonValueType): ComparisonRule => ({ mode, valueType });

export const CATEGORY_ALIASES: Record<string, ProductCategory> = {
  processors: 'cpu',
  processor: 'cpu',
  cpu: 'cpu',
  gpu: 'gpu',
  videocard: 'gpu',
  videocards: 'gpu',
  motherboards: 'motherboard',
  motherboard: 'motherboard',
  ram: 'ram',
  storage: 'storage',
  psu: 'psu',
  cases: 'case',
  case: 'case',
  coolers: 'cooling',
  cooler: 'cooling',
  cooling: 'cooling',
  monitors: 'monitor',
  monitor: 'monitor',
  keyboards: 'keyboard',
  keyboard: 'keyboard',
  mice: 'mouse',
  mouse: 'mouse',
  headphones: 'headphones',
  headphone: 'headphones',
  процессор: 'cpu',
  процессоры: 'cpu',
  видеокарта: 'gpu',
  видеокарты: 'gpu',
  материнская_плата: 'motherboard',
  материнские_платы: 'motherboard',
  оперативная_память: 'ram',
  память: 'ram',
  накопитель: 'storage',
  накопители: 'storage',
  блок_питания: 'psu',
  блоки_питания: 'psu',
  корпус: 'case',
  корпуса: 'case',
  охлаждение: 'cooling',
  кулер: 'cooling',
  кулеры: 'cooling',
  монитор: 'monitor',
  мониторы: 'monitor',
  клавиатура: 'keyboard',
  клавиатуры: 'keyboard',
  мышь: 'mouse',
  мыши: 'mouse',
  наушник: 'headphones',
  наушники: 'headphones',
};

const FRONTEND_TO_BACKEND_SLUG: Record<ProductCategory, string> = {
  cpu: 'processors',
  gpu: 'gpu',
  motherboard: 'motherboards',
  ram: 'ram',
  storage: 'storage',
  psu: 'psu',
  case: 'cases',
  cooling: 'coolers',
  monitor: 'monitors',
  keyboard: 'keyboards',
  mouse: 'mice',
  headphones: 'headphones',
};

const COMMON_RULES: RuleMap = {
  rating: rule('max', 'number'),
  release_year: rule('max', 'number'),
  data_vykhoda_na_rynok: rule('max', 'number'),
  color: rule('none', 'text'),
  type: rule('none', 'text'),
  interface: rule('compatibility', 'text'),
  interfeys_1: rule('compatibility', 'text'),
  connection_type: rule('compatibility', 'text'),
  form_factor: rule('compatibility', 'text'),
  memory_type: rule('compatibility', 'text'),
  socket: rule('compatibility', 'text'),
  efficiency: rule('none', 'text'),
};

const CATEGORY_RULES: Record<ProductCategory, RuleMap> = {
  cpu: {
    process_nm: rule('min', 'number'),
    cores: rule('max', 'number'),
    threads: rule('max', 'number'),
    base_freq: rule('max', 'number'),
    max_freq: rule('max', 'number'),
    max_memory_freq: rule('max', 'number'),
    cache_l2: rule('max', 'number'),
    cache_l3: rule('max', 'number'),
    tdp: rule('min', 'number'),
    integrated_graphics: rule('none', 'text'),
    memory_support: rule('compatibility', 'text'),
    memory_channels: rule('max', 'number'),
    multithreading: rule('max', 'boolean'),
  },
  gpu: {
    videopamyat: rule('max', 'number'),
    vram: rule('max', 'number'),
    tdp: rule('min', 'number'),
    dlina_videokarty: rule('max', 'number'),
    vysota_videokarty: rule('max', 'number'),
    tip_videopamyati: rule('compatibility', 'text'),
    shirina_shiny_pamyati: rule('max', 'number'),
    rekomenduemyy_blok_pitaniya: rule('none', 'number'),
    graficheskiy_protsessor: rule('none', 'text'),
  },
  motherboard: {
    socket: rule('compatibility', 'text'),
    chipset: rule('none', 'text'),
    memory_slots: rule('max', 'number'),
    max_memory: rule('max', 'number'),
    max_memory_freq: rule('max', 'number'),
    memory_type: rule('compatibility', 'text'),
  },
  ram: {
    capacity: rule('max', 'number'),
    capacity_per_module: rule('max', 'number'),
    frequency: rule('max', 'number'),
    cas_latency: rule('min', 'number'),
    latency: rule('min', 'number'),
    voltage: rule('min', 'number'),
    ecc: rule('max', 'boolean'),
    xmp: rule('max', 'boolean'),
    expo: rule('max', 'boolean'),
    type: rule('compatibility', 'text'),
  },
  storage: {
    capacity: rule('max', 'number'),
    read_speed: rule('max', 'number'),
    write_speed: rule('max', 'number'),
    tbw: rule('max', 'number'),
    protocol: rule('compatibility', 'text'),
    form_factor: rule('compatibility', 'text'),
  },
  psu: {
    wattage: rule('max', 'number'),
    modular: rule('max', 'boolean'),
    fan_size: rule('none', 'number'),
    efficiency: rule('none', 'text'),
    form_factor: rule('compatibility', 'text'),
  },
  case: {
    max_cooler_height: rule('max', 'number'),
    max_gpu_length: rule('max', 'number'),
    window: rule('none', 'boolean'),
    material: rule('none', 'text'),
    form_factor: rule('compatibility', 'text'),
  },
  cooling: {
    tdp: rule('max', 'number'),
    noise: rule('min', 'number'),
    fan_size: rule('none', 'number'),
    fan_count: rule('none', 'number'),
    type: rule('none', 'text'),
  },
  monitor: {
    refresh_rate: rule('max', 'number'),
    response_time: rule('min', 'number'),
    brightness: rule('max', 'number'),
    diagonal: rule('none', 'number'),
    matrix: rule('compatibility', 'text'),
    resolution: rule('none', 'text'),
  },
  keyboard: {
    connection_type: rule('compatibility', 'text'),
    interface: rule('compatibility', 'text'),
    wireless_protocols: rule('compatibility', 'text'),
    type: rule('none', 'text'),
  },
  mouse: {
    dpi: rule('max', 'number'),
    connection_type: rule('compatibility', 'text'),
    interface: rule('compatibility', 'text'),
    wireless_protocols: rule('compatibility', 'text'),
    sensor_type: rule('none', 'text'),
  },
  headphones: {
    driver_size: rule('max', 'number'),
    impedance: rule('none', 'number'),
    connection_type: rule('compatibility', 'text'),
    interface: rule('compatibility', 'text'),
    frequency_range: rule('none', 'text'),
    type: rule('none', 'text'),
  },
};

export function normalizeSpecKey(key: string): string {
  return key.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
}

export function normalizeCategory(category: string | null | undefined): string {
  if (!category) return '';
  const normalized = category.trim().toLowerCase().replace(/\s+/g, '_');
  return CATEGORY_ALIASES[normalized] ?? normalized;
}

export function getBackendCategorySlug(category: string | null | undefined): string | null {
  const normalized = normalizeCategory(category);
  if (!normalized) return null;
  const typed = normalized as ProductCategory;
  return FRONTEND_TO_BACKEND_SLUG[typed] ?? null;
}

export function getComparisonRule(category: string, specKey: string): ComparisonRule {
  const normalizedCategory = normalizeCategory(category) as ProductCategory;
  const normalizedKey = normalizeSpecKey(specKey);
  const byCategory = CATEGORY_RULES[normalizedCategory]?.[normalizedKey];
  if (byCategory) return byCategory;
  return COMMON_RULES[normalizedKey] ?? rule('none', 'text');
}

