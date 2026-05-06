import { useState, useEffect } from 'react';
import { ChevronDown, Grid3X3, DollarSign, Package, Check, Star, Tag, Search } from 'lucide-react';
import { catalogApi } from '../../api/catalog';
import { RangeSlider } from '../ui/RangeSlider';
import { Skeleton } from '../ui/Skeleton';
import type { ProductCategory, Category, FilterFacetAttribute, Manufacturer } from '../../api/types';

interface FilterSidebarProps {
  selectedCategory: ProductCategory | null;
  onCategoryChange: (category: ProductCategory | null) => void;
  categoryLocked?: boolean;
  /** Render in mobile overlay mode (no sticky, no borders) */
  mobile?: boolean;
  priceRange: { min: number; max: number };
  onPriceChange: (range: { min: number; max: number }) => void;
  selectedManufacturerIds: string[];
  onManufacturerIdsChange: (ids: string[]) => void;
  minRating: number;
  onRatingChange: (rating: number) => void;
  selectedAvailability: string[];
  onAvailabilityChange: (availability: string[]) => void;
  selectedSpecifications: Record<string, string | number | string[]>;
  onSpecificationsChange: (specs: Record<string, string | number | string[]>) => void;
  onReset: () => void;
  /** Ограничивает опции spec-фильтров указанными значениями. */
  restrictedSpecValues?: Record<string, string[]>;
  /** Спецификации для контекстных ограничений (например socket=AM4 из билда).
   *  Передаются в API для получения фасетов с учётом текущего билда. */
  effectiveSpecifications?: Record<string, string | number | string[]>;
  /**
   * Используется в ComponentPickerModal для исключения несовместимых брендов.
   * При указании 'amd' оставляем только AMD-бренды (при сокетах AM4/AM5),
   * при 'intel' — только Intel (LGA1200/LGA1700/LGA1851).
   * Определяется по вхождению 'AMD'/'Intel' в название производителя.
   */
  restrictedManufacturerPlatform?: 'amd' | 'intel';
}

// Названия категорий (счётчики загружаются динамически)
const CATEGORY_LABELS: Record<ProductCategory, string> = {
  cpu: 'Процессоры',
  gpu: 'Видеокарты',
  motherboard: 'Мат. платы',
  ram: 'Память',
  storage: 'Накопители',
  psu: 'Блоки питания',
  case: 'Корпуса',
  cooling: 'Охлаждение',
  fan: 'Вентиляторы',
  monitor: 'Мониторы',
  keyboard: 'Клавиатуры',
  mouse: 'Мыши',
  headphones: 'Наушники',
};

// Порядок категорий
const CATEGORY_ORDER: ProductCategory[] = [
  'cpu',
  'gpu',
  'motherboard',
  'ram',
  'storage',
  'psu',
  'case',
  'cooling',
  'fan',
  'monitor',
  'keyboard',
  'mouse',
  'headphones',
];

// Маппинг slug'ов бэкенда (processors, motherboards...) на ключи фронта (cpu, motherboard...)
const BACKEND_SLUG_MAP: Record<string, ProductCategory> = {
  processors: 'cpu',
  motherboards: 'motherboard',
  ram: 'ram',
  gpu: 'gpu',
  psu: 'psu',
  storage: 'storage',
  cases: 'case',
  coolers: 'cooling',
  monitors: 'monitor',
  keyboards: 'keyboard',
  mice: 'mouse',
  headphones: 'headphones',
  periphery: 'keyboard', // legacy fallback
};

// Обратный маппинг: frontend -> backend slug для API
const FRONTEND_TO_BACKEND: Record<ProductCategory, string> = {
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

/**
 * Порядок атрибутов по категориям (backend slug -> ключи).
 * Каждый фильтр — атомарный, без объединения в "Прочее" или "Дополнительные".
 */
const SPEC_ORDER: Record<string, string[]> = {
  gpu: [
    'release_year',
    'proizvoditel_graficheskogo_protsessora',
    'graficheskiy_protsessor',
    'videopamyat',
    'tip_videopamyati',
    'shirina_shiny_pamyati',
    'okhlazhdenie_1',
    'razyemy_pitaniya',
    'rekomenduemyy_blok_pitaniya',
    'interfeys_1',
    'dlina_videokarty',
    'vysota_videokarty',
  ],
  processors: [
    'socket',
    'model_series',
    'codename',
    'architecture',
    'data_vykhoda_na_rynok',
    'integrated_graphics',
    'cores',
    'threads',
    'base_freq',
    'max_freq',
    'max_memory_freq',
    'tdp',
    'delivery_type',
    'cooling_included',
    'process_nm',
    'cache_l2',
    'cache_l3',
    'memory_support',
    'memory_channels',
    'multithreading',
  ],
  motherboards: [
    'socket',
    'chipset',
    'form_factor',
    'memory_type',
    'memory_mixed_slots',
    'memory_cudimm',
    'memory_slots',
    'max_memory',
    'max_memory_freq',
    'data_vykhoda_na_rynok',
  ],
  ram: [
    'capacity',
    'capacity_per_module',
    'memory_type',
    'type',
    'frequency',
    'pc_index',
    'cas_latency',
    'ecc',
    'expo',
    'xmp',
    'voltage',
    'data_vykhoda_na_rynok',
  ],
  storage: [
    'capacity',
    'form_factor',
    'interface',
    'protocol',
    'read_speed',
    'write_speed',
    'flash_type',
    'tbw',
    'data_vykhoda_na_rynok',
  ],
  psu: ['wattage', 'efficiency', 'form_factor', 'modular', 'fan_size', 'data_vykhoda_na_rynok'],
  cases: [
    'form_factor',
    'material',
    'material_front',
    'window',
    'max_cooler_height',
    'max_gpu_length',
    'data_vykhoda_na_rynok',
  ],
  coolers: ['cooler_type', 'socket', 'tdp', 'fan_size', 'fan_count', 'noise', 'data_vykhoda_na_rynok'],
  monitors: [
    'diagonal',
    'aspect_ratio',
    'curved',
    'sync_technology',
    'resolution',
    'refresh_rate',
    'matrix',
    'type',
    'brightness',
    'response_time',
    'data_vykhoda_na_rynok',
  ],
  keyboards: [
    'type',
    'interface',
    'connection_type',
    'wireless_protocols',
    'color',
    'data_vykhoda_na_rynok',
  ],
  mice: [
    'type',
    'interface',
    'connection_type',
    'wireless_protocols',
    'color',
    'sensor_type',
    'dpi',
    'data_vykhoda_na_rynok',
  ],
  headphones: [
    'type',
    'form_factor',
    'interface',
    'connection_type',
    'driver_size',
    'frequency_range',
    'impedance',
    'color',
    'data_vykhoda_na_rynok',
  ],
};

interface FilterGroupProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function FilterGroup({ title, icon, defaultOpen = true, children }: FilterGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-4 pb-3 pt-2.5 px-3.5 -mx-3.5 border-b border-[var(--border-muted)] border-l-2 border-transparent border-t border-[var(--border-muted)] border-r border-[var(--border-muted)] rounded-sm relative">
      <button
        className={`flex items-center w-full py-2 bg-transparent border-none cursor-pointer text-[0.65rem] font-semibold text-[var(--fg-secondary)] uppercase tracking-[0.1em] transition-colors ${isOpen ? 'text-[var(--color-gold-500)]' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        type="button"
      >
        <span className="flex items-center mr-2 text-[var(--color-gold-400)]">{icon}</span>
        <span className="flex-1 text-left">{title}</span>
        <ChevronDown
          size={14}
          className={`text-[var(--fg-dim)] transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}
        />
      </button>
      <div className={`max-h-0 overflow-hidden pt-0 transition-all duration-250 ${isOpen ? 'max-h-[1200px] overflow-visible pt-3' : ''}`}>
        {children}
      </div>
    </div>
  );
}

export function FilterSidebar({ mobile = false, 
  selectedCategory,
  onCategoryChange,
  categoryLocked = false,
  priceRange,
  onPriceChange,
  selectedManufacturerIds,
  onManufacturerIdsChange,
  minRating,
  onRatingChange,
  selectedAvailability,
  onAvailabilityChange,
  selectedSpecifications,
  onSpecificationsChange,
  onReset,
  restrictedSpecValues,
  effectiveSpecifications,
  restrictedManufacturerPlatform,
}: FilterSidebarProps) {
  const [priceBounds, setPriceBounds] = useState<{ min: number; max: number }>({ min: 0, max: 50000 });
  const PRICE_MIN = priceBounds.min;
  const PRICE_MAX = priceBounds.max;
  const PRICE_STEP = Math.max(1, Math.ceil((PRICE_MAX - PRICE_MIN) / 200));

  const clampNumber = (value: number, min: number, max: number): number =>
    Math.min(max, Math.max(min, value));

  const normalizePriceRange = (range: { min: number; max: number }) => {
    const min = clampNumber(range.min, PRICE_MIN, PRICE_MAX);
    const max = clampNumber(range.max, PRICE_MIN, PRICE_MAX);
    // Treat `0` as "not set" for our filtering UI.
    // Otherwise, entering only `min` (e.g. {min: 1000, max: 0}) would swap
    // and accidentally turn it into {min: 0, max: 1000}.
    const minUnset = range.min === 0;
    const maxUnset = range.max === 0;
    if (minUnset || maxUnset) {
      if (minUnset && maxUnset) {
        return { min: PRICE_MIN, max: PRICE_MAX };
      }
      return { min: minUnset ? 0 : min, max: maxUnset ? 0 : max };
    }

    if (min <= max) return { min, max };
    return { min: max, max: min };
  };

  // Состояние для хранения количества товаров в каждой категории
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filterAttributes, setFilterAttributes] = useState<FilterFacetAttribute[]>([]);
  const [specAttrsLoading, setSpecAttrsLoading] = useState(false);
  const [specSearchQuery, setSpecSearchQuery] = useState<Record<string, string>>({});
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [manufacturersLoading, setManufacturersLoading] = useState(false);
  
  // Локальное состояние для debounce цены
  const [localPriceRange, setLocalPriceRange] = useState({
    ...normalizePriceRange(priceRange),
  });
  
  // Debounce для обновления цены
  useEffect(() => {
    const timer = window.setTimeout(() => {
      // Avoid a feedback loop:
      // localPriceRange -> onPriceChange -> parent priceRange -> localPriceRange sync -> ...
      // If values didn't actually change, skip notifying the parent.
      if (
        localPriceRange.min !== priceRange.min ||
        localPriceRange.max !== priceRange.max
      ) {
        onPriceChange(localPriceRange);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localPriceRange, onPriceChange, priceRange]);
  
  // Синхронизация локального состояния с пропсами
  useEffect(() => {
    const next = normalizePriceRange(priceRange);
    setLocalPriceRange((prev) => {
      if (prev.min === next.min && prev.max === next.max) return prev;
      return next;
    });
  }, [priceRange]);

  // Загрузка категорий с количеством товаров (реальные данные с API)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await catalogApi.getCategories();
        const counts: Record<string, number> = {};
        categories?.forEach((cat: Category) => {
          if (cat?.slug != null) {
            const key = (BACKEND_SLUG_MAP[cat.slug] ?? cat.slug) as ProductCategory;
            // Несколько backend-категорий могут маппиться на один frontend (keyboards + periphery -> keyboard)
            counts[key] = (counts[key] ?? 0) + (cat.productCount ?? 0);
          }
        });
        setCategoryCounts(counts);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setCategoryCounts({});
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Загрузка атрибутов фильтрации только при смене категории.
  // При изменении самих фильтров (бренды, характеристики) перезагружаются лишь товары,
  // а сайдбар остаётся стабильным, без лишних спиннеров/миганий.
  useEffect(() => {
    if (!selectedCategory) {
      setFilterAttributes([]);
      setSpecSearchQuery({});
      return;
    }
    const backendSlug = FRONTEND_TO_BACKEND[selectedCategory];

    const fetchAttrs = async () => {
      setSpecAttrsLoading(true);
      try {
        // Only use build-context specs (effectiveSpecifications) for facet filtering.
        // User's selectedSpecifications should narrow PRODUCTS only, not hide facet options.
        const ctxSpecs = effectiveSpecifications && Object.keys(effectiveSpecifications).length > 0
          ? effectiveSpecifications
          : undefined;
        // Serialize: arrays become comma-separated strings for ASP.NET model binding
        const serializedSpecs = ctxSpecs
          ? Object.fromEntries(
              Object.entries(ctxSpecs).map(([k, v]) => [k, Array.isArray(v) ? v.join(',') : String(v)])
            ) as Record<string, string>
          : undefined;
        const isInStock = selectedAvailability.includes('in_stock');
        const attrs = await catalogApi.getFilterFacets(backendSlug, { specifications: serializedSpecs, inStock: isInStock });
        setFilterAttributes(attrs);
      } catch (err) {
        console.error('Failed to fetch filter attributes:', err);
        setFilterAttributes([]);
      } finally {
        setSpecAttrsLoading(false);
      }
    };
    fetchAttrs();
  }, [selectedCategory, JSON.stringify(effectiveSpecifications), selectedAvailability]);

  // Fetch real price bounds from catalog API (cheapest + most expensive item in category)
  useEffect(() => {
    if (!selectedCategory) {
      setPriceBounds({ min: 0, max: 50000 });
      return;
    }
    let cancelled = false;
    const fetchPriceBounds = async () => {
      try {
        const [minRes, maxRes] = await Promise.all([
          catalogApi.getProducts({ category: selectedCategory, pageSize: 1, sortBy: 'price', sortOrder: 'asc', inStock: true }),
          catalogApi.getProducts({ category: selectedCategory, pageSize: 1, sortBy: 'price', sortOrder: 'desc', inStock: true }),
        ]);
        if (cancelled) return;
        const minP = minRes.data[0]?.price;
        const maxP = maxRes.data[0]?.price;
        if (minP != null && maxP != null) {
          setPriceBounds({ min: Math.floor(minP), max: Math.ceil(maxP) });
        }
      } catch (err) {
        console.error('Failed to fetch price bounds:', err);
      }
    };
    fetchPriceBounds();
    return () => { cancelled = true; };
  }, [selectedCategory]);

  // Загрузка производителей: по категории или всех
  useEffect(() => {
    const fetchManufacturers = async () => {
      setManufacturersLoading(true);
      try {
        const backendSlug = selectedCategory ? FRONTEND_TO_BACKEND[selectedCategory] : undefined;
        const list = await catalogApi.getManufacturers(backendSlug);
        if (list.length > 0) {
          setManufacturers(list);
          return;
        }
        // API не вернул — извлекаем бренды из названий товаров
        // Паттерн: первое латинское слово в названии товара — производитель
        const productsResponse = await catalogApi.getProducts(selectedCategory ? { category: selectedCategory, pageSize: 500 } : { pageSize: 500 });
        const brandSet = new Set<string>();
        const brandRe = /^[\p{Script=Cyrillic}\p{P}\s]*([A-Za-z][A-Za-z0-9-]+)/u;
        for (const p of productsResponse.data ?? []) {
          const m = p.name?.match(brandRe);
          if (m) brandSet.add(m[1]);
        }
        const extracted: Manufacturer[] = Array.from(brandSet)
          .sort()
          .map((name, i) => ({ id: `extracted-${i}`, name }));
        if (extracted.length > 0) {
          setManufacturers(extracted);
        }
      } catch (err) {
        console.error('Failed to fetch manufacturers:', err);
        setManufacturers([]);
      } finally {
        setManufacturersLoading(false);
      }
    };
    fetchManufacturers();
  }, [selectedCategory]);

  // Подсчёт общего количества товаров
  const totalCount = CATEGORY_ORDER.reduce((sum, slug) => sum + (categoryCounts[slug] || 0), 0);

  // Проверка активных фильтров (наличие по умолчанию ['in_stock'] не считается)
  const hasNonDefaultAvailability = selectedAvailability.length !== 1 || selectedAvailability[0] !== 'in_stock';
  const hasActiveFilters = 
    selectedCategory !== null || 
    priceRange.min > 0 || 
    priceRange.max > 0 || 
    selectedManufacturerIds.length > 0 || 
    minRating > 0 ||
    hasNonDefaultAvailability ||
    Object.keys(selectedSpecifications).length > 0;

  return (
    <aside className={`sticky top-[100px] w-full bg-[var(--bg-elevated)] border-r border-[var(--border-muted)] border-t border-[var(--border-muted)] border-b border-[var(--border-muted)] border-l-2 border-l-transparent py-5 px-4 overflow-y-auto overflow-x-visible max-h-[calc(100vh-120px)] shadow-lg ${mobile ? 'relative top-auto left-auto w-full h-auto max-h-none overflow-visible bg-transparent backdrop-filter-none border-none shadow-none p-0' : ''}`}>
      <div className="mb-4 pb-2.5 border-b border-[var(--border-muted)] relative">
        <h2 className="flex items-center gap-[10px] text-[0.95rem] font-semibold text-[var(--fg-primary)] tracking-[0.02em]">
          <Grid3X3 size={16} />
          Фильтры
        </h2>
      </div>

      {/* Categories — открыта по умолчанию для быстрой навигации */}
      {!categoryLocked && (
        <FilterGroup
          title="Категории"
          icon={<Grid3X3 size={14} />}
        defaultOpen={true}
      >
        <div className="flex flex-col gap-1.5 max-h-[240px] overflow-y-auto overflow-x-hidden">
          <button
            type="button"
            className={`flex items-center w-full py-2.5 px-3 pl-6 bg-transparent border-none border-l-2 border-transparent cursor-pointer text-[0.8rem] text-[var(--fg-muted)] text-left transition-all duration-200 rounded-r-md relative ${!selectedCategory ? 'text-[var(--accent)] font-semibold border-l-2 border-[var(--accent)] pl-6' : ''}`}
            onClick={() => onCategoryChange(null)}
          >
            <span className="flex-1">Все товары</span>
            <span className="flex items-center justify-center text-[0.65rem] text-[var(--fg-dim)] py-0.5 px-1.5 bg-[var(--border-muted)] rounded-sm transition-colors" aria-hidden={loading ? true : undefined}>
                {loading ? <Skeleton width={44} height={12} borderRadius="sm" /> : totalCount}
              </span>
            </button>
            {CATEGORY_ORDER.map((category) => (
              <button
                key={category}
                type="button"
                className={`flex items-center w-full py-2.5 px-3 pl-6 bg-transparent border-none border-l-2 border-transparent cursor-pointer text-[0.8rem] text-[var(--fg-muted)] text-left transition-all duration-200 rounded-r-md relative ${selectedCategory === category ? 'text-[var(--accent)] font-semibold border-l-2 border-[var(--accent)] pl-6' : ''}`}
                onClick={() => onCategoryChange(category)}
              >
                <span className="flex-1">{CATEGORY_LABELS[category]}</span>
                <span className="flex items-center justify-center text-[0.65rem] text-[var(--fg-dim)] py-0.5 px-1.5 bg-[var(--border-muted)] rounded-sm transition-colors">
                {loading ? <Skeleton width={36} height={12} borderRadius="sm" /> : (categoryCounts[category] || 0)}
              </span>
            </button>
          ))}
        </div>
      </FilterGroup>
      )}

      {/* Price */}
      <FilterGroup
        title="Цена"
        icon={<DollarSign size={14} />}
        defaultOpen={false}
      >
        <RangeSlider
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={localPriceRange}
          onChange={setLocalPriceRange}
          formatValue={(v) => `${v.toLocaleString('ru-RU')} BYN`}
        />
        <div className="flex items-end gap-3 mt-5">
          <div className="flex-1 relative">
            <label className="block text-[0.6rem] font-medium text-[var(--fg-secondary)] uppercase tracking-[0.1em] mb-1.5">От</label>
            <input
              type="number"
              className="w-full py-2.5 px-3 bg-[var(--bg-elevated)] border border-[var(--border-muted)] text-[var(--fg-primary)] text-[0.8rem] rounded-sm transition-all duration-200"
              value={localPriceRange.min || ''}
              onChange={(e) => setLocalPriceRange({ ...localPriceRange, min: parseInt(e.target.value) || 0 })}
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={PRICE_STEP}
              placeholder="Мин"
            />
          </div>
          <span className="text-[0.8rem] text-[var(--fg-dim)] mb-2.5 opacity-50">—</span>
          <div className="flex-1 relative">
            <label className="block text-[0.6rem] font-medium text-[var(--fg-secondary)] uppercase tracking-[0.1em] mb-1.5">До</label>
            <input
              type="number"
              className="w-full py-2.5 px-3 bg-[var(--bg-elevated)] border border-[var(--border-muted)] text-[var(--fg-primary)] text-[0.8rem] rounded-sm transition-all duration-200"
              value={localPriceRange.max || ''}
              onChange={(e) => setLocalPriceRange({ ...localPriceRange, max: parseInt(e.target.value) || 0 })}
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={PRICE_STEP}
              placeholder="Макс"
            />
          </div>
        </div>
      </FilterGroup>

      {/* Динамические фильтры по характеристикам — разбиты на логические группы */}
      {selectedCategory && filterAttributes.length > 0 && (() => {
        const backendSlug = FRONTEND_TO_BACKEND[selectedCategory];
        const order = SPEC_ORDER[backendSlug] ?? [];
        const attrMap = new Map(filterAttributes.map((a) => [a.key, a]));
        const orderedKeys = [
          ...order.filter((k) => attrMap.has(k)),
          ...filterAttributes.map((a) => a.key).filter((k) => !order.includes(k)),
        ];
        const groups = orderedKeys.map((key) => ({ keys: [key] }));

        const renderAttr = (attr: FilterFacetAttribute, options?: { hideLabel?: boolean }) => {
          if (attr.filterType === 'range') {
            if (attr.minValue == null && attr.maxValue == null) return null;
            const isVideoMemory = attr.key === 'videopamyat';

            // Бэкенд хранит видеопамять в МБ, но фильтр показывает в ГБ.
            // Для PSU wattage может быть установлен контекстный минимум из билда.
            // Для остальных числовых характеристик работаем в «сырых» единицах.
            const rawMin = attr.minValue ?? 0;
            const rawMax = attr.maxValue ?? Math.max(rawMin + 1, 100);

            // Контекстный минимум из сборки (GPU+CPU TDP) передан через effectiveSpecifications
            const effectiveMin = attr.key === 'power' || attr.key === 'wattage'
              ? (effectiveSpecifications?.['wattage_min'] as number | undefined) ?? null
              : null;
            const rangeMin = effectiveMin != null ? Math.max(rawMin, effectiveMin) : rawMin;

            const isWattage = attr.key === 'power' || attr.key === 'wattage';

            const toUi = (v: number) => (isVideoMemory ? v / 1024 : v);
            const fromUi = (v: number) => (isVideoMemory ? v * 1024 : v);

            const minValUi = toUi(rangeMin);
            const maxValUi = toUi(rawMax);

            const raw = selectedSpecifications[attr.key];
            const rangeStr = typeof raw === 'string' ? raw : undefined;

            const [selMinRaw, selMaxRaw] = rangeStr?.includes(',')
              ? rangeStr.split(',').map((s) => parseFloat(s.trim()) || 0)
              : [rawMin, rawMax];

            const minSelUi = toUi(selMinRaw || rawMin);
            const maxSelUi = toUi(selMaxRaw || rawMax);

            const localRange = { min: minSelUi, max: maxSelUi };

            const rangeSpanUi = maxValUi - minValUi;
            const step =
              isVideoMemory || attr.key.includes('capacity')
                ? 1
                : Math.max(1, Math.floor(rangeSpanUi / 100) || 1);

             return (
              <div key={attr.key} className="mb-3 pb-3 border-b border-[var(--border-muted)]">
                {!options?.hideLabel && <span className="block text-[0.7rem] font-semibold text-[var(--fg-secondary)] uppercase tracking-[0.05em] mb-2">{attr.displayName}</span>}
                {effectiveMin != null && isWattage && (
                  <div className="text-[0.7rem] text-[var(--accent)] mb-2 py-1 px-2 bg-[color-mix(in_srgb,var(--bg-elevated)_95%,transparent)] rounded-sm" title={`Минимальная мощность с учётом выбранной конфигурации: ${effectiveMin}Вт`}>
                    Мин. {effectiveMin}Вт для вашей сборки
                  </div>
                )}
                <RangeSlider
                  min={minValUi}
                  max={maxValUi}
                  step={step}
                  value={localRange}
                  onCommit={(r) => {
                    const next = { ...selectedSpecifications };
                    // For wattage, don't allow user to set below effectiveMin
                    const committedMinRaw = effectiveMin != null
                      ? Math.max(fromUi(r.min), effectiveMin)
                      : fromUi(r.min);
                    const committedMaxRaw = fromUi(r.max);

                    // Возвращаемся в исходные единицы (МБ для видеопамяти)
                    if (committedMinRaw === rawMin && committedMaxRaw === rawMax) {
                      delete next[attr.key];
                    } else {
                      next[attr.key] = `${committedMinRaw},${committedMaxRaw}`;
                    }
                    onSpecificationsChange(next);
                  }}
                  formatValue={(v) => {
                    const display = isVideoMemory ? v : v;
                    return Number.isInteger(display) ? display.toString() : display.toFixed(1);
                  }}
                />
              </div>
            );
          }
          if (attr.filterType === 'select') {
            const optionsList = attr.options ?? [];
            const showSearch = optionsList.length > 15;
            const query = (specSearchQuery[attr.key] ?? '').trim().toLowerCase();
            const filteredOptions = showSearch && query
              ? optionsList.filter((o) => o.value.toLowerCase().includes(query))
              : optionsList;
            const selected = selectedSpecifications[attr.key];
            const selectedArr = Array.isArray(selected) ? selected : selected != null ? [String(selected)] : [];
            const isChecked = (val: string) => selectedArr.includes(val);
            
            // Clean up Integrated Graphics values
            const cleanOptions = attr.key === 'integrated_graphics'
              ? filteredOptions.filter((o) => !/^\d+$/.test(o.value))
              : filteredOptions;

            // Apply restrictedSpecValues if provided
            const restrictKey = attr.key;
            const allowed = restrictedSpecValues?.[restrictKey];

            // Also check if selectedSpecifications has a locked value (single value, not array)
            // This happens when effectiveSpecs hard-codes a spec (e.g., socket from buildContext)
            const lockedValue = selectedSpecifications[restrictKey];
            const isLockArray = Array.isArray(lockedValue);
            const isLocked = typeof lockedValue === 'string' && !isLockArray;

            // Для `type` — умный фильтр: DDR4 должен совпадать с "DDR4 DIMM",
            // но НЕ с "DDR4 SO-DIMM" / "DDR4 DIMM Registered" / чипами ("1Gx8")
            const isMatchingDDRType = (optionValue: string, expectedTypes: string[]): boolean => {
              const upper = optionValue.toUpperCase();
              // Чип-значения (не DDR-типы)
              if (/^[0-9]+[GM]x[0-9]+/i.test(optionValue)) return false;
              if (/\bSO-DIMM\b/i.test(optionValue)) return false;
              if (/\bREGISTERED\b/i.test(optionValue)) return false;
              return expectedTypes.some((dt) => upper.startsWith(dt.toUpperCase()) && !/\bSO-DIMM\b/.test(upper) && !/\bREGISTERED\b/.test(upper));
            };

            let finalOptions = cleanOptions;
            if (allowed) {
              if (attr.key === 'type') {
                finalOptions = cleanOptions.filter((o) => isMatchingDDRType(o.value, allowed));
              } else {
                finalOptions = cleanOptions.filter((o) => allowed.some(a => a.toLowerCase() === o.value.toLowerCase()));
              }
            } else if (isLocked && lockedValue) {
              // Locked to a single value — show only that value, hide all others
              const lockedUpper = String(lockedValue).toUpperCase();
              finalOptions = cleanOptions.filter((o) => o.value.toUpperCase() === lockedUpper);
            }

            return (
              <div key={attr.key} className="mb-3 pb-3 border-b border-[var(--border-muted)]">
                {!options?.hideLabel && <span className="block text-[0.7rem] font-semibold text-[var(--fg-secondary)] uppercase tracking-[0.05em] mb-2">{attr.displayName}</span>}
                {showSearch && (
                  <div className="relative mb-2">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--fg-dim)] pointer-events-none" aria-hidden />
                    <input
                      type="search"
                      placeholder="Поиск..."
                      value={specSearchQuery[attr.key] ?? ''}
                      onChange={(e) =>
                        setSpecSearchQuery((prev) => ({ ...prev, [attr.key]: e.target.value }))
                      }
                      className="w-full py-2 px-3 pl-8 bg-[var(--bg-elevated)] border border-[var(--border-muted)] text-[var(--fg-primary)] text-[0.8rem] rounded-sm transition-colors"
                    />
                  </div>
                )}
                <div className="flex flex-col gap-0.5 max-h-[160px] overflow-y-auto overflow-x-hidden">
                  {finalOptions.length > 0 ? (
                    finalOptions.map(({ value: val, count }) => {
                      const disabled = count === 0 && !isChecked(val);
                      return (
                      <label
                        key={val}
                        className={`flex items-center py-2.5 px-3 cursor-pointer transition-all duration-200 rounded-sm border-l-2 border-transparent relative ${isChecked(val) ? 'text-[var(--accent)] border-l-2 border-[var(--accent)]' : ''}`}
                        aria-disabled={disabled ? true : undefined}
                        style={disabled ? { opacity: 0.55 } : undefined}
                      >
                        <input
                          type="checkbox"
                          className="absolute inset-0 w-full h-full m-0 opacity-0 cursor-pointer z-10"
                          checked={isChecked(val)}
                          disabled={disabled}
                          onChange={() => {
                            const next = { ...selectedSpecifications };
                            const newArr = isChecked(val)
                              ? selectedArr.filter((v) => v !== val)
                              : [...selectedArr, val];
                            if (newArr.length === 0) delete next[attr.key];
                            else next[attr.key] = newArr;
                            onSpecificationsChange(next);
                          }}
                        />
                        <span className="w-4 h-4 border border-[var(--fg-dim)] rounded-sm flex items-center justify-center mr-3 transition-all duration-200 flex-shrink-0" aria-hidden="true">
                          <Check size={10} className={`opacity-0 text-[var(--accent)] transition-opacity duration-200 ${isChecked(val) ? 'opacity-100' : ''}`} aria-hidden />
                        </span>
                        <span className="text-[0.8rem] text-[var(--fg-muted)] transition-colors">{val} <span style={{ opacity: 0.7 }}>({count})</span></span>
                      </label>
                    );
                    })
                  ) : (
                    <span className="block text-[0.75rem] text-[var(--fg-dim)] py-2 px-3 italic">
                      {showSearch && query ? 'Ничего не найдено' : 'Нет вариантов'}
                    </span>
                  )}
                </div>
              </div>
            );
          }
          return null;
        };

        return specAttrsLoading ? (
          <FilterGroup title="Характеристики" icon={<Tag size={14} />} defaultOpen={false}>
            <div className="flex flex-col gap-0.5 max-h-[200px] overflow-y-auto overflow-x-hidden">
              <Skeleton width="100%" height={24} borderRadius="sm" />
              <Skeleton width="100%" height={24} borderRadius="sm" />
            </div>
          </FilterGroup>
        ) : (
          groups.map((group) => {
            const attrsInGroup = group.keys.map((k) => attrMap.get(k)).filter(Boolean) as FilterFacetAttribute[];
            const singleAttrGroup = attrsInGroup.length === 1;
            const rendered = attrsInGroup.map((attr) => renderAttr(attr, { hideLabel: singleAttrGroup })).filter(Boolean);
            if (rendered.length === 0) return null;
            const title = attrsInGroup[0]?.displayName ?? group.keys[0];
            return (
              <FilterGroup key={group.keys[0]} title={title} icon={<Tag size={14} />} defaultOpen={false}>
                <div className="flex flex-col gap-0.5 max-h-[200px] overflow-y-auto overflow-x-hidden">{rendered}</div>
              </FilterGroup>
            );
          })
        );
      })()}

      {/* Manufacturers (бренды) — реальные данные с API */}
      <FilterGroup
        title="Бренды"
        icon={<Tag size={14} />}
        defaultOpen={false}
      >
        <div className="flex flex-col gap-0.5 max-h-[200px] overflow-y-auto overflow-x-hidden">
          {manufacturersLoading ? (
            <>
              <Skeleton width="100%" height={24} borderRadius="sm" />
              <Skeleton width="100%" height={24} borderRadius="sm" />
              <Skeleton width="100%" height={24} borderRadius="sm" />
            </>
          ) : manufacturers.length === 0 ? (
            <span className="block text-[0.75rem] text-[var(--fg-dim)] py-2 px-3 italic">Нет производителей</span>
          ) : (
            manufacturers
              .filter((m) => {
                if (!restrictedManufacturerPlatform) return true;
                const name = m.name.toLowerCase();
                if (restrictedManufacturerPlatform === 'amd') return name.includes('amd');
                if (restrictedManufacturerPlatform === 'intel') return name.includes('intel');
                return true;
              })
              .map((m) => (
                <label
                  key={m.id}
                  className={`flex items-center py-2.5 px-3 cursor-pointer transition-all duration-200 rounded-sm border-l-2 border-transparent relative ${selectedManufacturerIds.includes(m.id) ? 'text-[var(--accent)] border-l-2 border-[var(--accent)]' : ''}`}
                >
                  <input
                    type="checkbox"
                    className="absolute inset-0 w-full h-full m-0 opacity-0 cursor-pointer z-10"
                    checked={selectedManufacturerIds.includes(m.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onManufacturerIdsChange([...selectedManufacturerIds, m.id]);
                      } else {
                        onManufacturerIdsChange(selectedManufacturerIds.filter((id) => id !== m.id));
                      }
                    }}
                  />
                  <span className="w-4 h-4 border border-[var(--fg-dim)] rounded-sm flex items-center justify-center mr-3 transition-all duration-200 flex-shrink-0" aria-hidden="true">
                    <Check size={10} className={`opacity-0 text-[var(--accent)] transition-opacity duration-200 ${selectedManufacturerIds.includes(m.id) ? 'opacity-100' : ''}`} aria-hidden />
                  </span>
                  <span className="text-[0.8rem] text-[var(--fg-muted)] transition-colors">{m.name}</span>
                </label>
              ))
          )}
        </div>
      </FilterGroup>

       {/* Rating */}
       <FilterGroup
         title="Рейтинг"
         icon={<Star size={14} />}
         defaultOpen={false}
       >
         <div className="flex flex-col gap-0.5 max-h-[180px] overflow-y-auto overflow-x-hidden" role="radiogroup" aria-label="Минимальный рейтинг">
           {[4, 3, 2, 1].map((rating) => {
             const labelText = `${rating}★ и выше`;
             return (
               <label
                 key={rating}
                 className={`flex items-center py-2.5 px-3 cursor-pointer transition-all duration-200 rounded-sm border-l-2 border-transparent relative ${minRating === rating ? 'text-[var(--accent)] border-l-2 border-[var(--accent)]' : ''}`}
               >
                 <input
                   type="radio"
                   name="rating"
                   className="absolute inset-0 w-full h-full m-0 opacity-0 cursor-pointer z-10"
                   checked={minRating === rating}
                   onChange={() => onRatingChange(rating)}
                   aria-label={labelText}
                 />
                 <span className="w-4 h-4 border border-[var(--fg-dim)] rounded-full flex items-center justify-center mr-3 transition-all duration-200 flex-shrink-0" aria-hidden="true">
                   <Check size={10} className={`opacity-0 text-[var(--accent)] transition-opacity duration-200 ${minRating === rating ? 'opacity-100' : ''}`} aria-hidden />
                 </span>
                 <span className="flex gap-0.5 mr-2" aria-hidden="true">
                   {Array.from({ length: 5 }).map((_, i) => (
                     <Star
                       key={i}
                       size={12}
                       className={i < rating ? 'text-[var(--accent)] drop-shadow-[0_0_2px_var(--border-brand)]' : 'text-[var(--fg-dim)] opacity-30'}
                       aria-hidden
                     />
                   ))}
                 </span>
                 <span className="text-[0.8rem] text-[var(--fg-muted)] transition-colors" aria-hidden="true">
                   {labelText}
                 </span>
               </label>
             );
           })}
           <label
             className={`flex items-center py-2.5 px-3 cursor-pointer transition-all duration-200 rounded-sm border-l-2 border-transparent relative ${minRating === 0 ? 'text-[var(--accent)] border-l-2 border-[var(--accent)]' : ''}`}
           >
             <input
               type="radio"
               name="rating"
               className="absolute inset-0 w-full h-full m-0 opacity-0 cursor-pointer z-10"
               checked={minRating === 0}
               onChange={() => onRatingChange(0)}
               aria-label="Любой рейтинг"
             />
             <span className="w-4 h-4 border border-[var(--fg-dim)] rounded-full flex items-center justify-center mr-3 transition-all duration-200 flex-shrink-0" aria-hidden="true">
               <Check size={10} className={`opacity-0 text-[var(--accent)] transition-opacity duration-200 ${minRating === 0 ? 'opacity-100' : ''}`} aria-hidden />
             </span>
             <span className="text-[0.8rem] text-[var(--fg-muted)] transition-colors" aria-hidden="true">Любой рейтинг</span>
           </label>
         </div>
       </FilterGroup>

       {/* Stock Status */}
       <FilterGroup
         title="Наличие"
         icon={<Package size={14} />}
         defaultOpen={false}
       >
         <div className="flex flex-col gap-0.5 max-h-[200px] overflow-y-auto overflow-x-hidden">
           <label
             className={`flex items-center py-2.5 px-3 cursor-pointer transition-all duration-200 rounded-sm border-l-2 border-transparent relative ${selectedAvailability.includes('in_stock') ? 'text-[var(--accent)] border-l-2 border-[var(--accent)]' : ''}`}
           >
             <input
               type="checkbox"
               className="absolute inset-0 w-full h-full m-0 opacity-0 cursor-pointer z-10"
               checked={selectedAvailability.includes('in_stock')}
               onChange={(e) => {
                 if (e.target.checked) {
                   onAvailabilityChange([...selectedAvailability, 'in_stock']);
                 } else {
                   onAvailabilityChange(selectedAvailability.filter((a) => a !== 'in_stock'));
                 }
               }}
             />
             <span className="w-4 h-4 border border-[var(--fg-dim)] rounded-sm flex items-center justify-center mr-3 transition-all duration-200 flex-shrink-0" aria-hidden="true">
               <Check size={10} className={`opacity-0 text-[var(--accent)] transition-opacity duration-200 ${selectedAvailability.includes('in_stock') ? 'opacity-100' : ''}`} aria-hidden />
             </span>
             <span className="text-[0.8rem] text-[var(--fg-muted)] transition-colors">В наличии</span>
           </label>
           <label
             className={`flex items-center py-2.5 px-3 cursor-pointer transition-all duration-200 rounded-sm border-l-2 border-transparent relative ${selectedAvailability.includes('on_order') ? 'text-[var(--accent)] border-l-2 border-[var(--accent)]' : ''}`}
           >
             <input
               type="checkbox"
               className="absolute inset-0 w-full h-full m-0 opacity-0 cursor-pointer z-10"
               checked={selectedAvailability.includes('on_order')}
               onChange={(e) => {
                 if (e.target.checked) {
                   onAvailabilityChange([...selectedAvailability, 'on_order']);
                 } else {
                   onAvailabilityChange(selectedAvailability.filter((a) => a !== 'on_order'));
                 }
               }}
             />
             <span className="w-4 h-4 border border-[var(--fg-dim)] rounded-sm flex items-center justify-center mr-3 transition-all duration-200 flex-shrink-0" aria-hidden="true">
               <Check size={10} className={`opacity-0 text-[var(--accent)] transition-opacity duration-200 ${selectedAvailability.includes('on_order') ? 'opacity-100' : ''}`} aria-hidden />
             </span>
             <span className="text-[0.8rem] text-[var(--fg-muted)] transition-colors">Под заказ</span>
           </label>
         </div>
       </FilterGroup>

       {/* Reset Button - показывается только при активных фильтрах */}
       {hasActiveFilters && (
         <button type="button" className="flex items-center justify-center gap-2 w-full py-2.5 px-4 mt-4 bg-transparent border border-[var(--border-brand)] text-[var(--accent)] text-[0.75rem] font-medium cursor-pointer transition-all duration-250 rounded-md relative overflow-hidden" onClick={onReset}>
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
             <polyline points="1 4 1 10 7 10" />
             <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
           </svg>
           Сбросить фильтры
         </button>
       )}
     </aside>
   );
 }