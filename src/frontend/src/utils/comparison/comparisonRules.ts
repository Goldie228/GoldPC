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
  fan: 'fan',
  fans: 'fan',
  вентилятор: 'fan',
  вентиляторы: 'fan',
  корпусный_вентилятор: 'fan',
  корпусные_вентиляторы: 'fan',
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
  fan: 'fans',
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
    memory_bus_width: rule('max', 'number'),
    gpu_boost_clock: rule('max', 'number'),
    effective_memory_freq: rule('max', 'number'),
    rt_cores: rule('max', 'number'),
    // Подсветка — субъективно: многие геймеры ищут стелс-карты без RGB
    подсветка: rule('none', 'boolean'),
    // Габариты — для совместимости с корпусом, не «чем больше/меньше, тем лучше»
    dlina_videokarty: rule('none', 'number'),
    vysota_videokarty: rule('none', 'number'),
    tip_videopamyati: rule('compatibility', 'text'),
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
    usb4_40g: rule('max', 'number'),
    thunderbolt4: rule('max', 'number'),
    case_fan_headers: rule('max', 'number'),
    power_phases: rule('max', 'number'),
    argb_headers: rule('max', 'number'),
    watercooling_headers: rule('max', 'number'),
    подсветка: rule('max', 'boolean'),
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
    heatsink: rule('max', 'boolean'),
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
    spindle_speed: rule('max', 'number'),
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
    fan_stop: rule('max', 'boolean'),
    cert_80plus: rule('max', 'number'),
    cert_cybenetics: rule('max', 'number'),
  },
  case: {
    max_cooler_height: rule('max', 'number'),
    max_gpu_length: rule('max', 'number'),
    total_fan_mounts: rule('max', 'number'),
    noise_dampening: rule('max', 'boolean'),
    window: rule('none', 'boolean'),
    material: rule('none', 'text'),
    form_factor: rule('compatibility', 'text'),
    rgb_controller: rule('max', 'boolean'),
    bundled_fans: rule('max', 'boolean'),
    usb_c_gen2_10g: rule('max', 'number'),
  },
  cooling: {
    tdp: rule('max', 'number'),
    noise: rule('min', 'number'),
    max_airflow_cfm: rule('max', 'number'),
    fan_size: rule('none', 'number'),
    fan_count: rule('none', 'number'),
    type: rule('none', 'text'),
    waterblock_display: rule('max', 'boolean'),
    antivibration_pads: rule('max', 'boolean'),
  },
  fan: {
    fan_size: rule('none', 'number'),
    airflow_cfm: rule('max', 'number'),
    noise_dba: rule('min', 'number'),
    rpm: rule('none', 'number'),
    static_pressure: rule('max', 'number'),
    pwm: rule('max', 'boolean'),
    rgb: rule('none', 'boolean'),
    bearing_type: rule('none', 'text'),
    antivibration_pads: rule('max', 'boolean'),
  },
  monitor: {
    refresh_rate: rule('max', 'number'),
    response_time: rule('min', 'number'),
    brightness: rule('max', 'number'),
    // raw-ключ brightness из БД содержит мусорные данные (×10 + «2» от «м²»)
    brightness_raw_corrupted: rule('none', 'text'),
    diagonal: rule('none', 'number'),
    matrix: rule('compatibility', 'text'),
    // Разрешение сравнивается по числу пикселей, но разные соотношения сторон (16:9 vs 21:9)
    // делают сравнение некорректным (4K-монитор видеонаблюдения «побеждает» OLED ультраширокий).
    resolution: rule('none', 'number'),
    pixel_density: rule('max', 'number'),
    contrast_ratio: rule('max', 'number'),
    stand_height_adjust: rule('max', 'number'),
    hdmi_version: rule('max', 'number'),
    bezel_less: rule('max', 'boolean'),
    adaptive_sync: rule('max', 'boolean'),
    flicker_free: rule('max', 'boolean'),
  },
  keyboard: {
    connection_type: rule('compatibility', 'text'),
    interface: rule('compatibility', 'text'),
    wireless_protocols: rule('compatibility', 'text'),
    type: rule('none', 'text'),
    usb_aux: rule('none', 'text'),
    пыле_и_влагозащита: rule('none', 'text'),
    сенсорная_панель: rule('none', 'text'),
    сканер_отпечатка_пальца: rule('none', 'text'),
    ролик_управления_громкостью: rule('none', 'text'),
    распознавание_степеней_нажатия: rule('none', 'text'),
    аудиовход: rule('none', 'text'),
    аудиовыход: rule('none', 'text'),
    беспроводное_подключение: rule('none', 'text'),
    // Numpad — субъективно: TKL-формат (без блока) — огромный тренд среди геймеров
    цифровой_блок: rule('none', 'text'),
    подсветка: rule('none', 'boolean'),
    оплетка_кабеля: rule('none', 'text'),
    device_switching: rule('max', 'number'),
  },
  mouse: {
    dpi: rule('max', 'number'),
    connection_type: rule('compatibility', 'text'),
    interface: rule('compatibility', 'text'),
    wireless_protocols: rule('compatibility', 'text'),
    sensor_type: rule('none', 'text'),
    // Вес игровых мышей — меньше = лучше (54 г лучше 62 г)
    вес: rule('min', 'number'),
    weight: rule('min', 'number'),
    грузы: rule('none', 'text'),
    зарядное_устройство_крэдл: rule('none', 'text'),
    тихий_клик: rule('max', 'boolean'),
    сменные_панели: rule('none', 'text'),
    коврик_в_комплекте: rule('none', 'text'),
    количество_колёс_прокрутки: rule('none', 'number'),
    количество_колес_прокрутки: rule('none', 'number'),
    максимальная_частота_опроса: rule('max', 'number'),
    частота_опроса: rule('max', 'number'),
    беспроводная_зарядка: rule('max', 'boolean'),
    // Оплётка — субъективная характеристика: киберспортсмены часто предпочитают голый кабель
    оплетка_провода: rule('none', 'text'),
    оплётка_провода: rule('none', 'text'),
    оплетка_кабеля: rule('none', 'text'),
  },
  headphones: {
    // Канонические ключи; алиасы из описания — в HEADPHONE_SPEC_ALIASES
    bluetooth_version: rule('max', 'number'),
    active_noise_cancellation: rule('max', 'boolean'),
    // multipoint — max number: «2 устройства» → 2, «Нет» → 0 (parsePresenceOrVersionScore)
    multipoint: rule('max', 'number'),
    nfc: rule('max', 'boolean'),
    autopause: rule('max', 'boolean'),
    volume_control: rule('max', 'boolean'),
    sensitivity: rule('max', 'number'),
    // driver_size несравним между вкладышами (7 мм), TWS (7 мм) и накладными (40 мм)
    driver_size: rule('none', 'number'),
    impedance: rule('none', 'number'),
    // Вес сильно зависит от форм-фактора (вкладыши г vs полноразмерные); без единого смысла «лучше»
    weight: rule('none', 'number'),
    battery_life: rule('max', 'number'),
    // мА·ч несравним с часами работы (другой форм-фактор = другой порядок чисел)
    battery_capacity_mah: rule('none', 'number'),
    sample_rate: rule('max', 'number'),
    wireless_charging: rule('max', 'boolean'),
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
  размер_излучателя: 'driver_size',
  импеданс: 'impedance',
  сопротивление: 'impedance',
  вес: 'weight',
  время_работы: 'battery_life',
  время_автономной_работы: 'battery_life',
  время_работы_с_зарядным_кейсом: 'battery_life',
  // мА·ч несравним с часами — отдельный неактивный ключ
  емкость_аккумулятора: 'battery_capacity_mah',
  частота_дискретизации: 'sample_rate',
  макс_время_работы_от_одного_заряда: 'battery_life',
  пыле_влаго_ударопрочность: 'ingress_protection',
  шумоподавление_микрофона: 'microphone_anc',
  беспроводная_зарядка: 'wireless_charging',
};

/** Клавиатура: опечатки/варианты имён → канонический ключ правила. */
const KEYBOARD_SPEC_ALIASES: Record<string, string> = {
  usbпорт: 'usb_aux',
  usbпорт_для_периферии: 'usb_aux',
  переключение_между_устройствами: 'device_switching',
};

/** Кириллические/описательные ключи → каноническое имя для категории ram. */
const RAM_SPEC_ALIASES: Record<string, string> = {
  частота: 'frequency',
  общий_объем: 'capacity',
  объем_одного_модуля: 'capacity_per_module',
  напряжение_питания: 'voltage',
  охлаждение: 'heatsink',
};

const MONITOR_SPEC_ALIASES: Record<string, string> = {
  частота_обновления_экрана: 'refresh_rate',
  время_отклика: 'response_time',
  яркость: 'brightness',
  // Поле brightness в БД содержит повреждённые данные (парсер бэкенда оставил «2» от «м²»).
  // Подавляем сравнение по raw-ключу; корректные данные приходят через «яркость».
  brightness: 'brightness_raw_corrupted',
  разрешение: 'resolution',
  плотность_пикселей: 'pixel_density',
  контрастность: 'contrast_ratio',
  регулировка_высоты_подставки: 'stand_height_adjust',
  версия_hdmi: 'hdmi_version',
  hdmi: 'hdmi_version',
  безрамочный_дизайн: 'bezel_less',
  динамическая_частота_обновления_экрана: 'adaptive_sync',
  отсутствие_мерцания_flickerfree: 'flicker_free',
};

const PSU_SPEC_ALIASES: Record<string, string> = {
  s_a_t_a: 'sata_port_count',
  макс_ток_по_линии_12v: 'max_12v_amps',
  кпд: 'efficiency_percent',
  коррекция_фактора_мощности_pfc: 'pfc_type',
  отключение_вентиляторов_fanstop: 'fan_stop',
  fanstop: 'fan_stop',
  fan_stop: 'fan_stop',
  сертификат_80_plus: 'cert_80plus',
  сертификат: 'cert_80plus',
  сертификат_cybenetics: 'cert_cybenetics',
  cybenetics: 'cert_cybenetics',
};

const GPU_SPEC_ALIASES: Record<string, string> = {
  ширина_шины_памяти: 'memory_bus_width',
  количество_потоковых_процессоров: 'cuda_cores',
  пропускная_способность_памяти: 'memory_bandwidth',
  количество_вентиляторов: 'fan_count',
  трассировка_лучей: 'ray_tracing',
  максимальная_частота_графического_процессора: 'gpu_boost_clock',
  эффективная_частота_памяти: 'effective_memory_freq',
  количество_rtядер: 'rt_cores',
};

const MOTHERBOARD_SPEC_ALIASES: Record<string, string> = {
  sata_30: 'sata_count',
  m2: 'm2_slot_count',
  максимальная_частота_памяти: 'max_memory_freq',
  звуковая_схема: 'sound_channels',
  wi_fi: 'wifi',
  wifi: 'wifi',
  bluetooth: 'bluetooth',
  usb4_до_40_гбитс: 'usb4_40g',
  thunderbolt_4: 'thunderbolt4',
  разъемы_для_корпусных_вентиляторов: 'case_fan_headers',
  количество_фаз_питания: 'power_phases',
  разъемы_для_подсветки_argb_5в: 'argb_headers',
  разъемы_для_сжо: 'watercooling_headers',
};

const CASE_SPEC_ALIASES: Record<string, string> = {
  общее_количество_мест_для_вентиляторов: 'total_fan_mounts',
  количество_мест_для_вентиляторов: 'total_fan_mounts',
  макс_длина_видеокарты: 'max_gpu_length',
  макс_высота_процессорного_кулера: 'max_cooler_height',
  шумоизоляция: 'noise_dampening',
  контроллер_подсветки: 'rgb_controller',
  вентиляторы_в_комплекте: 'bundled_fans',
  usb_32_gen2_typec_10_гбитс: 'usb_c_gen2_10g',
};

const STORAGE_SPEC_ALIASES: Record<string, string> = {
  буфер: 'buffer_size',
  энергопотребление_ожидание: 'idle_power_w',
  уровень_шума_в_режиме_ожидания: 'idle_noise_db',
  энергопотребление_чтениезапись: 'rw_active_power_w',
  время_наработки_на_отказ_мтbf: 'mtbf_millions',
  скорость_вращения_шпинделя: 'spindle_speed',
  скорость_вращения: 'spindle_speed',
};

const COOLING_SPEC_ALIASES: Record<string, string> = {
  максимальный_воздушный_поток: 'max_airflow_cfm',
  максимальный_уровень_шума: 'noise',
  встроенный_дисплей_на_водоблоке: 'waterblock_display',
  антивибрационные_прокладки: 'antivibration_pads',
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

