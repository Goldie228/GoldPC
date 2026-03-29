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
  /** Имя категории с витрины API (`Category.Name`), напр. «Системы охлаждения» → `системы_охлаждения`. */
  системы_охлаждения: 'cooling',
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
  release_year: rule('none', 'text'),
  data_vykhoda_na_rynok: rule('none', 'text'),
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
    tdp: rule('none', 'number'),
    integrated_graphics: rule('none', 'text'),
    memory_support: rule('compatibility', 'text'),
    memory_channels: rule('max', 'number'),
    multithreading: rule('max', 'boolean'),
  },
  gpu: {
    videopamyat: rule('max', 'number'),
    vram: rule('max', 'number'),
    tdp: rule('none', 'number'),
    release_year: rule('none', 'text'),
    cuda_cores: rule('max', 'number'),
    memory_bandwidth: rule('max', 'number'),
    fan_count: rule('max', 'number'),
    ray_tracing: rule('max', 'boolean'),
    // Габариты — для совместимости с корпусом, не «чем больше/меньше, тем лучше»
    dlina_videokarty: rule('none', 'number'),
    vysota_videokarty: rule('none', 'number'),
    tip_videopamyati: rule('compatibility', 'text'),
    shirina_shiny_pamyati: rule('none', 'number'),
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
    sata_count: rule('max', 'number'),
    m2_slot_count: rule('max', 'number'),
    sound_channels: rule('max', 'number'),
    wifi: rule('max', 'number'),
    bluetooth: rule('max', 'number'),
  },
  ram: {
    capacity: rule('max', 'number'),
    capacity_per_module: rule('max', 'number'),
    frequency: rule('max', 'number'),
    cas_latency: rule('none', 'number'),
    latency: rule('none', 'number'),
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
    buffer_size: rule('max', 'number'),
    idle_power_w: rule('min', 'number'),
    idle_noise_db: rule('min', 'number'),
    rw_active_power_w: rule('min', 'number'),
    mtbf_millions: rule('max', 'number'),
    protocol: rule('compatibility', 'text'),
    form_factor: rule('compatibility', 'text'),
  },
  psu: {
    wattage: rule('max', 'number'),
    modular: rule('max', 'boolean'),
    fan_size: rule('none', 'number'),
    efficiency: rule('none', 'text'),
    form_factor: rule('compatibility', 'text'),
    sata_port_count: rule('max', 'number'),
    max_12v_amps: rule('max', 'number'),
    efficiency_percent: rule('max', 'number'),
    pfc_type: rule('max', 'number'),
  },
  case: {
    max_cooler_height: rule('max', 'number'),
    max_gpu_length: rule('max', 'number'),
    total_fan_mounts: rule('max', 'number'),
    noise_dampening: rule('max', 'boolean'),
    window: rule('none', 'boolean'),
    material: rule('none', 'text'),
    form_factor: rule('compatibility', 'text'),
  },
  cooling: {
    tdp: rule('max', 'number'),
    noise: rule('min', 'number'),
    max_airflow_cfm: rule('max', 'number'),
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
    resolution: rule('max', 'number'),
    pixel_density: rule('max', 'number'),
  },
  keyboard: {
    connection_type: rule('compatibility', 'text'),
    interface: rule('compatibility', 'text'),
    wireless_protocols: rule('compatibility', 'text'),
    type: rule('none', 'text'),
    // Не универсальный «лучше/хуже», а комплектация / вкус
    usb_aux: rule('none', 'text'),
    пыле_и_влагозащита: rule('none', 'text'),
    сенсорная_панель: rule('none', 'text'),
    сканер_отпечатка_пальца: rule('none', 'text'),
    ролик_управления_громкостью: rule('none', 'text'),
    распознавание_степеней_нажатия: rule('none', 'text'),
    аудиовход: rule('none', 'text'),
    аудиовыход: rule('none', 'text'),
    беспроводное_подключение: rule('none', 'text'),
    цифровой_блок: rule('none', 'text'),
    оплетка_кабеля: rule('none', 'text'),
  },
  mouse: {
    dpi: rule('max', 'number'),
    connection_type: rule('compatibility', 'text'),
    interface: rule('compatibility', 'text'),
    wireless_protocols: rule('compatibility', 'text'),
    sensor_type: rule('none', 'text'),
    грузы: rule('none', 'text'),
    зарядное_устройство_крэдл: rule('none', 'text'),
    тихий_клик: rule('none', 'text'),
    сменные_панели: rule('none', 'text'),
    коврик_в_комплекте: rule('none', 'text'),
    количество_колёс_прокрутки: rule('none', 'number'),
    количество_колес_прокрутки: rule('none', 'number'),
  },
  headphones: {
    // Канонические ключи; алиасы из описания — в HEADPHONE_SPEC_ALIASES
    bluetooth_version: rule('max', 'number'),
    active_noise_cancellation: rule('max', 'boolean'),
    multipoint: rule('max', 'boolean'),
    nfc: rule('max', 'boolean'),
    autopause: rule('max', 'boolean'),
    volume_control: rule('max', 'boolean'),
    sensitivity: rule('max', 'number'),
    driver_size: rule('max', 'number'),
    impedance: rule('none', 'number'),
    // Вес сильно зависит от форм-фактора (вкладыши г vs полноразмерные); без единого смысла «лучше»
    weight: rule('none', 'number'),
    battery_life: rule('max', 'number'),
    sample_rate: rule('max', 'number'),
    connection_type: rule('compatibility', 'text'),
    interface: rule('compatibility', 'text'),
    wireless_protocols: rule('compatibility', 'text'),
    frequency_range: rule('none', 'text'),
    type: rule('none', 'text'),
    ingress_protection: rule('max', 'number'),
    microphone_anc: rule('max', 'boolean'),
  },
};

/** Нормализованные ключи из merge/description → каноническое имя правила для категории headphones. */
const HEADPHONE_SPEC_ALIASES: Record<string, string> = {
  bluetooth: 'bluetooth_version',
  версия_bluetooth: 'bluetooth_version',
  активное_шумоподавление: 'active_noise_cancellation',
  шумоподавление: 'active_noise_cancellation',
  anc: 'active_noise_cancellation',
  multipoint: 'multipoint',
  nfc: 'nfc',
  n_f_c: 'nfc',
  автопауза: 'autopause',
  регулировка_громкости: 'volume_control',
  регулятор_громкости: 'volume_control',
  чувствительность: 'sensitivity',
  диаметр_излучателя: 'driver_size',
  диаметр_мембраны: 'driver_size',
  импеданс: 'impedance',
  сопротивление: 'impedance',
  вес: 'weight',
  время_работы: 'battery_life',
  время_автономной_работы: 'battery_life',
  емкость_аккумулятора: 'battery_life',
  частота_дискретизации: 'sample_rate',
  макс_время_работы_от_одного_заряда: 'battery_life',
  пыле_влаго_ударопрочность: 'ingress_protection',
  шумоподавление_микрофона: 'microphone_anc',
};

/** Клавиатура: опечатки/варианты имён → канонический ключ правила. */
const KEYBOARD_SPEC_ALIASES: Record<string, string> = {
  usbпорт: 'usb_aux',
  usbпорт_для_периферии: 'usb_aux',
};

/** Кириллические/описательные ключи → каноническое имя для категории ram. */
const RAM_SPEC_ALIASES: Record<string, string> = {
  частота: 'frequency',
  общий_объем: 'capacity',
  объем_одного_модуля: 'capacity_per_module',
  напряжение_питания: 'voltage',
};

const MONITOR_SPEC_ALIASES: Record<string, string> = {
  частота_обновления_экрана: 'refresh_rate',
  время_отклика: 'response_time',
  яркость: 'brightness',
  разрешение: 'resolution',
  плотность_пикселей: 'pixel_density',
};

const PSU_SPEC_ALIASES: Record<string, string> = {
  s_a_t_a: 'sata_port_count',
  макс_ток_по_линии_12v: 'max_12v_amps',
  кпд: 'efficiency_percent',
  коррекция_фактора_мощности_pfc: 'pfc_type',
};

const GPU_SPEC_ALIASES: Record<string, string> = {
  ширина_шины_памяти: 'shirina_shiny_pamyati',
  количество_потоковых_процессоров: 'cuda_cores',
  пропускная_способность_памяти: 'memory_bandwidth',
  количество_вентиляторов: 'fan_count',
  трассировка_лучей: 'ray_tracing',
};

const MOTHERBOARD_SPEC_ALIASES: Record<string, string> = {
  sata_30: 'sata_count',
  m2: 'm2_slot_count',
  максимальная_частота_памяти: 'max_memory_freq',
  звуковая_схема: 'sound_channels',
  wi_fi: 'wifi',
  wifi: 'wifi',
  bluetooth: 'bluetooth',
};

const CASE_SPEC_ALIASES: Record<string, string> = {
  общее_количество_мест_для_вентиляторов: 'total_fan_mounts',
  макс_длина_видеокарты: 'max_gpu_length',
  макс_высота_процессорного_кулера: 'max_cooler_height',
  шумоизоляция: 'noise_dampening',
};

const STORAGE_SPEC_ALIASES: Record<string, string> = {
  буфер: 'buffer_size',
  энергопотребление_ожидание: 'idle_power_w',
  уровень_шума_в_режиме_ожидания: 'idle_noise_db',
  энергопотребление_чтениезапись: 'rw_active_power_w',
  время_наработки_на_отказ_мтbf: 'mtbf_millions',
};

const COOLING_SPEC_ALIASES: Record<string, string> = {
  максимальный_воздушный_поток: 'max_airflow_cfm',
  максимальный_уровень_шума: 'noise',
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

const SPEC_ALIASES_BY_CATEGORY: Partial<Record<ProductCategory, Record<string, string>>> = {
  headphones: HEADPHONE_SPEC_ALIASES,
  keyboard: KEYBOARD_SPEC_ALIASES,
  ram: RAM_SPEC_ALIASES,
  monitor: MONITOR_SPEC_ALIASES,
  psu: PSU_SPEC_ALIASES,
  gpu: GPU_SPEC_ALIASES,
  motherboard: MOTHERBOARD_SPEC_ALIASES,
  case: CASE_SPEC_ALIASES,
  storage: STORAGE_SPEC_ALIASES,
  cooling: COOLING_SPEC_ALIASES,
};

function resolveCanonicalSpecKey(category: ProductCategory, normalizedKey: string): string {
  const map = SPEC_ALIASES_BY_CATEGORY[category];
  if (map && map[normalizedKey]) {
    return map[normalizedKey];
  }
  return normalizedKey;
}

/** Канонический ключ правила после алиасов (аудит сравнения, отладка). */
export function getCanonicalSpecKeyForComparison(category: string, specKey: string): string {
  const normalizedCategory = normalizeCategory(category) as ProductCategory;
  const normalizedKey = normalizeSpecKey(specKey);
  return resolveCanonicalSpecKey(normalizedCategory, normalizedKey);
}

/** Есть ли явное правило в CATEGORY_RULES для канонического ключа (после алиасов). */
export function hasExplicitCategoryRuleForCanonicalKey(category: string, canonicalKey: string): boolean {
  const normalizedCategory = normalizeCategory(category) as ProductCategory;
  const map = CATEGORY_RULES[normalizedCategory];
  return map != null && map[canonicalKey] !== undefined;
}

export function getComparisonRule(category: string, specKey: string): ComparisonRule {
  const normalizedCategory = normalizeCategory(category) as ProductCategory;
  const normalizedKey = normalizeSpecKey(specKey);
  const canonical = resolveCanonicalSpecKey(normalizedCategory, normalizedKey);
  const byCategory =
    CATEGORY_RULES[normalizedCategory]?.[canonical] ?? CATEGORY_RULES[normalizedCategory]?.[normalizedKey];
  if (byCategory) return byCategory;
  return COMMON_RULES[canonical] ?? COMMON_RULES[normalizedKey] ?? rule('none', 'text');
}

