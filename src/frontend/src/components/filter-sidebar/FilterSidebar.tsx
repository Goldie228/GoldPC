'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ChevronDown, ChevronUp, Search, RotateCcw,
  Tag, Star, Package, Grid3X3, DollarSign, Check,
  ArrowUpDown, LayoutGrid, List, Table2, SlidersHorizontal,
} from 'lucide-react';
import { catalogApi } from '../../api/catalog';
import { getDisplayManufacturerName } from '../../utils/manufacturerNameOverrides';
import { DualRangeSlider } from './DualRangeSlider';
import { Skeleton } from '../ui/Skeleton';
import type { ProductCategory, Manufacturer, Category, FilterFacetAttribute } from '../../api/types';

// ============================================================
// Constants
// ============================================================

const CATEGORY_ORDER: ProductCategory[] = [
  'cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu',
  'case', 'cooling', 'fan', 'monitor', 'keyboard', 'mouse', 'headphones',
];

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  cpu: 'Процессоры',
  gpu: 'Видеокарты',
  motherboard: 'Материнские платы',
  ram: 'Оперативная память',
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
  periphery: 'keyboard',
};

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
 * Каждый фильтр — атомарный, без объединения в «Прочее».
 */
const SPEC_ORDER: Record<string, string[]> = {
  gpu: [
    'release_year', 'proizvoditel_graficheskogo_protsessora', 'graficheskiy_protsessor',
    'videopamyat', 'tip_videopamyati', 'shirina_shiny_pamyati', 'okhlazhdenie_1',
    'razyemy_pitaniya', 'rekomenduemyy_blok_pitaniya', 'interfeys_1',
    'dlina_videokarty', 'vysota_videokarty',
  ],
  processors: [
    'socket', 'model_series', 'codename', 'architecture', 'data_vykhoda_na_rynok',
    'integrated_graphics', 'cores', 'threads', 'base_freq', 'max_freq',
    'max_memory_freq', 'tdp', 'delivery_type', 'cooling_included',
    'process_nm', 'cache_l2', 'cache_l3', 'memory_support',
    'memory_channels', 'multithreading',
  ],
  motherboards: [
    'socket', 'chipset', 'form_factor', 'memory_type',
    'memory_mixed_slots', 'memory_cudimm', 'memory_slots',
    'max_memory', 'max_memory_freq', 'data_vykhoda_na_rynok',
  ],
  ram: [
    'capacity', 'capacity_per_module', 'memory_type', 'type',
    'frequency', 'pc_index', 'cas_latency', 'ecc', 'expo',
    'xmp', 'voltage', 'data_vykhoda_na_rynok',
  ],
  storage: [
    'capacity', 'form_factor', 'interface', 'protocol',
    'read_speed', 'write_speed', 'flash_type', 'tbw',
    'data_vykhoda_na_rynok',
  ],
  psu: ['wattage', 'efficiency', 'form_factor', 'modular', 'fan_size', 'data_vykhoda_na_rynok'],
  cases: [
    'form_factor', 'material', 'material_front', 'window',
    'max_cooler_height', 'max_gpu_length', 'data_vykhoda_na_rynok',
  ],
  coolers: ['cooler_type', 'socket', 'tdp', 'fan_size', 'fan_count', 'noise', 'data_vykhoda_na_rynok'],
  monitors: [
    'diagonal', 'aspect_ratio', 'curved', 'sync_technology',
    'resolution', 'refresh_rate', 'matrix', 'type',
    'brightness', 'response_time', 'data_vykhoda_na_rynok',
  ],
  keyboards: ['type', 'interface', 'connection_type', 'wireless_protocols', 'color', 'data_vykhoda_na_rynok'],
  mice: ['type', 'interface', 'connection_type', 'wireless_protocols', 'color', 'sensor_type', 'dpi', 'data_vykhoda_na_rynok'],
  headphones: ['type', 'form_factor', 'interface', 'connection_type', 'driver_size', 'frequency_range', 'impedance', 'color', 'data_vykhoda_na_rynok'],
};

// ============================================================
// FilterGroup
// ============================================================

function FilterGroup({
  title,
  icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-hairline-dark last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 text-xs font-semibold text-on-dark hover:text-gold transition-colors group"
        aria-expanded={open}
        type="button"
      >
        <span className="flex items-center gap-1.5">
          {icon && <span className="text-muted-text shrink-0">{icon}</span>}
          {title}
        </span>
        <span className={`p-0.5 rounded transition-colors ${open ? 'text-muted-text' : 'text-muted-text group-hover:text-gold'}`}>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>
      <div className={`transition-all duration-200 ${open ? 'max-h-[600px] opacity-100 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="pb-4 pt-1">{children}</div>
      </div>
    </div>
  );
}

// ============================================================
// StarRating
// ============================================================

function StarRating({ rating, onChange }: { rating: number; onChange: (r: number) => void }) {
  return (
    <div className="space-y-1">
      {[4, 3, 2, 1].map(r => (
        <label key={r} className="flex items-center gap-2.5 cursor-pointer group py-1 px-1.5 -mx-1.5 rounded-md hover:bg-surface-elevated/50 transition-colors">
          <input
            type="radio"
            name="rating"
            checked={rating === r}
            onChange={() => onChange(rating === r ? 0 : r)}
            className="filter-radio self-center"
          />
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
              <span key={s} className={`text-xs ${s <= r ? 'text-gold' : 'text-muted-text'}`}>&#9733;</span>
            ))}
          </div>
          <span className="text-[11px] text-muted-text group-hover:text-body-text transition-colors">и выше</span>
        </label>
      ))}
      {rating > 0 && (
        <button onClick={() => onChange(0)} className="text-[11px] text-gold hover:text-gold-active transition-colors ml-1.5 mt-1">
          Сбросить
        </button>
      )}
    </div>
  );
}

// ============================================================
// FilterSidebar
// ============================================================

export interface FilterSidebarProps {
  selectedCategory: ProductCategory | null;
  onCategoryChange: (category: ProductCategory | null) => void;
  categoryLocked?: boolean;
  /** Render in mobile overlay mode (no sticky, no borders) */
  mobile?: boolean;
  priceRange: { min: number; max: number };
  onPriceChange: (range: { min: number; max: number }) => void;
  priceMin?: number;
  priceMax?: number;
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
  totalItems?: number;
  sortBy?: string;
  onSortChange?: (value: string) => void;
  viewMode?: 'grid' | 'list' | 'table';
  onViewModeChange?: (value: 'grid' | 'list' | 'table') => void;
}

export function FilterSidebar({
  selectedCategory,
  onCategoryChange,
  categoryLocked = false,
  mobile = false,
  priceRange,
  onPriceChange,
  priceMin: propPriceMin,
  priceMax: propPriceMax,
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
  effectiveSpecifications: effectiveSpecs,
  restrictedManufacturerPlatform: _restrictedManufacturerPlatform,
  totalItems: _totalItems = 0,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
}: FilterSidebarProps) {
  // === Local state ===
  const [mfrSearch, setMfrSearch] = useState('');
  const [showAllMfrs, setShowAllMfrs] = useState(false);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [_categories, setCategories] = useState<Category[]>([]);
  const [filterFacets, setFilterFacets] = useState<FilterFacetAttribute[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [manufacturersLoading, setManufacturersLoading] = useState(false);
  const [priceBounds, setPriceBounds] = useState<{ min: number; max: number }>({ min: 0, max: 10000 });
  const [_priceBoundsLoading, setPriceBoundsLoading] = useState(false);
  const [localPriceRange, setLocalPriceRange] = useState({ min: 0, max: 0 });
  const [specSearchQuery, setSpecSearchQuery] = useState<Record<string, string>>({});
  /** Локальные значения range-слайдеров характеристик (обновляются только по onCommit) */
  const [localSpecRanges, setLocalSpecRanges] = useState<Record<string, { min: number; max: number }>>({});

  // === Sync local price with props ===
  useEffect(() => {
    setLocalPriceRange({ min: priceRange.min || 0, max: priceRange.max || 0 });
  }, [priceRange]);

  // === Debounce local price → parent ===
  useEffect(() => {
    // Don't fire on initial sync (when local === prop)
    if (localPriceRange.min === priceRange.min && localPriceRange.max === priceRange.max) return;
    const timer = window.setTimeout(() => {
      onPriceChange(localPriceRange);
    }, 400);
    return () => clearTimeout(timer);
  }, [localPriceRange, onPriceChange, /* priceRange — intentionally omitted to avoid loop */]);

  // === Reset local spec ranges when category changes or specs are cleared ===
  useEffect(() => {
    setLocalSpecRanges({});
  }, [selectedCategory]);

  useEffect(() => {
    if (Object.keys(selectedSpecifications).length === 0) {
      setLocalSpecRanges({});
    }
  }, [selectedSpecifications]);

  // === Fetch categories with product counts ===
  useEffect(() => {
    let cancelled = false;
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const data = await catalogApi.getCategories();
        if (cancelled) return;
        const counts: Record<string, number> = {};
        data?.forEach((cat) => {
          if (cat?.slug != null) {
            const key = (BACKEND_SLUG_MAP[cat.slug] ?? cat.slug) as ProductCategory;
            counts[key] = (counts[key] ?? 0) + (cat.productCount ?? 0);
          }
        });
        setCategories(data || []);
        setCategoryCounts(counts);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    };
    fetchCategories();
    return () => { cancelled = true; };
  }, []);

  // === Fetch filter facets for specifications ===
  useEffect(() => {
    if (!selectedCategory) {
      setFilterFacets([]);
      setSpecSearchQuery({});
      return;
    }
    let cancelled = false;
    const fetchFacets = async () => {
      try {
        const backendSlug = FRONTEND_TO_BACKEND[selectedCategory];
        // Facets always show ALL options with real counts.
        // Spec constraints are applied at the product query level.
        const isInStock = selectedAvailability.includes('in_stock');
        const attrs = await catalogApi.getFilterFacets(backendSlug, {
          specifications: undefined,
          inStock: isInStock,
        });
        if (!cancelled) {
          setFilterFacets(attrs);
          setSpecSearchQuery({});
        }
      } catch (err) {
        console.error('Failed to fetch filter facets:', err);
        if (!cancelled) setFilterFacets([]);
      }
    };
    fetchFacets();
    return () => { cancelled = true; };
  }, [selectedCategory, selectedAvailability]);

  // === Fetch real price bounds ===
  useEffect(() => {
    if (!selectedCategory) {
      setPriceBounds({ min: 0, max: 10000 });
      return;
    }
    // If parent provides price bounds, use them directly
    if (propPriceMin != null && propPriceMin > 0 && propPriceMax != null && propPriceMax > 0) {
      setPriceBounds({ min: propPriceMin, max: propPriceMax });
      return;
    }
    let cancelled = false;
    const fetchPriceBounds = async () => {
      setPriceBoundsLoading(true);
      try {
        const [minRes, maxRes] = await Promise.all([
          catalogApi.getProducts({ category: selectedCategory, pageSize: 1, sortBy: 'price', sortOrder: 'asc', inStock: true }),
          catalogApi.getProducts({ category: selectedCategory, pageSize: 1, sortBy: 'price', sortOrder: 'desc', inStock: true }),
        ]);
        if (cancelled) return;
        const minP = minRes?.data?.[0]?.price;
        const maxP = maxRes?.data?.[0]?.price;
        if (minP != null && maxP != null) {
          setPriceBounds({ min: Math.floor(minP), max: Math.ceil(maxP) });
        }
      } catch (err) {
        console.error('Failed to fetch price bounds:', err);
      } finally {
        if (!cancelled) setPriceBoundsLoading(false);
      }
    };
    fetchPriceBounds();
    return () => { cancelled = true; };
  }, [selectedCategory, propPriceMin, propPriceMax]);

  // === Fetch manufacturers ===
  useEffect(() => {
    let cancelled = false;
    const fetchManufacturers = async () => {
      setManufacturersLoading(true);
      try {
        const backendSlug = selectedCategory ? FRONTEND_TO_BACKEND[selectedCategory] : undefined;
        const list = await catalogApi.getManufacturers(backendSlug);
        if (cancelled) return;
        if (list.length > 0) {
          setManufacturers(list);
        } else {
          // Fallback: extract brands from product names
          const productsResponse = await catalogApi.getProducts(
            selectedCategory ? { category: selectedCategory, pageSize: 500 } : { pageSize: 500 }
          );
          const brandSet = new Set<string>();
          const brandRe = /^[\p{Script=Cyrillic}\p{P}\s]*([A-Za-z][A-Za-z0-9-]+)/u;
          for (const p of productsResponse?.data ?? []) {
            const m = p.name?.match(brandRe);
            if (m) brandSet.add(m[1]);
          }
          setManufacturers(Array.from(brandSet).sort().map((name, _i) => ({ id: `brand-${name}`, name })));
        }
      } catch (err) {
        console.error('Failed to fetch manufacturers:', err);
        setManufacturers([]);
      } finally {
        if (!cancelled) setManufacturersLoading(false);
      }
    };
    fetchManufacturers();
    return () => { cancelled = true; };
  }, [selectedCategory]);

  // === Computed ===
  // Дедупликация производителей с одинаковым отображаемым именем
  // (например, BE и be quiet! — одно и то же)
  const dedupedManufacturers = useMemo(() => {
    const seen = new Set<string>();
    return manufacturers.filter(m => {
      const displayName = getDisplayManufacturerName(m.name);
      if (seen.has(displayName)) return false;
      seen.add(displayName);
      return true;
    });
  }, [manufacturers]);
  const filteredMfrs = dedupedManufacturers.filter(m =>
    getDisplayManufacturerName(m.name).toLowerCase().includes(mfrSearch.toLowerCase())
  );
  const visibleMfrs = showAllMfrs ? filteredMfrs : filteredMfrs.slice(0, 6);

  const activeCount = [
    selectedCategory !== null,
    priceRange.min > 0 || priceRange.max > 0,
    selectedManufacturerIds.length > 0,
    minRating > 0,
    selectedAvailability.length > 0,
    Object.keys(selectedSpecifications).length > 0,
  ].filter(Boolean).length;

  const PRICE_MIN = priceBounds.min;
  const PRICE_MAX = priceBounds.max;
  const PRICE_STEP = Math.max(1, Math.ceil((PRICE_MAX - PRICE_MIN) / 200));

  // === Handlers ===
  const handlePriceSliderChange = (values: { min: number; max: number }) => {
    setLocalPriceRange(values);
  };

  const handlePriceSliderCommit = (values: { min: number; max: number }) => {
    setLocalPriceRange(values);
    onPriceChange(values);
  };

  const handleMinInputChange = (rawValue: string) => {
    if (rawValue === '') {
      setLocalPriceRange(prev => ({ ...prev, min: 0 }));
      onPriceChange({ min: 0, max: localPriceRange.max });
      return;
    }
    const v = parseInt(rawValue, 10);
    if (Number.isNaN(v) || v < 0) return;
    setLocalPriceRange(prev => ({ ...prev, min: v }));
    onPriceChange({ min: v, max: localPriceRange.max });
  };

  const handleMaxInputChange = (rawValue: string) => {
    if (rawValue === '') {
      setLocalPriceRange(prev => ({ ...prev, max: 0 }));
      onPriceChange({ min: localPriceRange.min, max: 0 });
      return;
    }
    const v = parseInt(rawValue, 10);
    if (Number.isNaN(v) || v < 0) return;
    setLocalPriceRange(prev => ({ ...prev, max: v }));
    onPriceChange({ min: localPriceRange.min, max: v });
  };

  const handleManufacturerToggle = (id: string) => {
    onManufacturerIdsChange(
      selectedManufacturerIds.includes(id)
        ? selectedManufacturerIds.filter(m => m !== id)
        : [...selectedManufacturerIds, id],
    );
  };

  const handleAvailabilityToggle = (val: string) => {
    onAvailabilityChange(
      selectedAvailability.includes(val)
        ? selectedAvailability.filter(v => v !== val)
        : [...selectedAvailability, val],
    );
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <div
      className={`bg-surface-card rounded-xl ${
        mobile
          ? ''
          : 'sticky top-[64px] max-h-[calc(100vh-80px)] overflow-y-auto mt-2 lg:rounded-xl'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-hairline-dark sticky top-0 bg-surface-card z-10">
        <div>
          <div role="heading" aria-level={2} className="text-sm font-semibold text-on-dark flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-muted-text" />
            Фильтры
            {activeCount > 0 && (
              <span className="h-4 min-w-[16px] px-1 bg-gold text-gold-ink text-[10px] font-bold rounded-full flex items-center justify-center leading-4">
                {activeCount}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onReset}
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors px-2 py-1 rounded-md ${
            activeCount > 0
              ? 'text-gold hover:text-gold-active hover:bg-gold/5'
              : 'text-muted-text hover:text-body-text hover:bg-surface-elevated/50'
          }`}
          type="button"
        >
          <RotateCcw size={11} />
          Сбросить
        </button>
      </div>

      <div className="p-4 pt-4">
        {/* Sorting */}
        {(sortBy && onSortChange) && (
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <ArrowUpDown size={14} className="text-muted-text flex-shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="flex-1 h-9 bg-surface-elevated text-on-dark text-xs rounded-lg px-3 pr-8 border border-hairline-dark focus:outline-none focus:ring-1 focus:ring-gold/30 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20fill%3D%22%23707a8a%22%20viewBox%3D%220%200%2016%2016%22%3E%3Cpath%20d%3D%22M8%2011L3%206h10z%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_10px_center] bg-no-repeat hover:border-muted-strong transition-colors"
              >
                <option value="popular">По популярности</option>
                <option value="price-asc">Цена: по возрастанию</option>
                <option value="price-desc">Цена: по убыванию</option>
                <option value="rating">По рейтингу</option>
                <option value="newest">Новинки</option>
                <option value="name">Название: А → Я</option>
              </select>
            </div>
          </div>
        )}

        {/* View toggle — mobile only */}
        {mobile && viewMode && onViewModeChange && (
          <div className="flex items-center bg-surface-elevated rounded-lg p-0.5 border border-hairline-dark mb-4">
            {[
              { value: 'grid' as const, icon: <LayoutGrid size={18} /> },
              { value: 'list' as const, icon: <List size={18} /> },
              { value: 'table' as const, icon: <Table2 size={18} /> },
            ].map(mode => (
              <button
                key={mode.value}
                onClick={() => onViewModeChange(mode.value)}
                className={`flex-1 h-8 rounded-md flex items-center justify-center transition-all ${
                  viewMode === mode.value
                    ? 'bg-gold text-gold-ink shadow-sm'
                    : 'text-muted-text hover:text-body-text'
                }`}
                title={mode.value === 'grid' ? 'Сетка' : mode.value === 'list' ? 'Список' : 'Таблица'}
                type="button"
              >
                {mode.icon}
              </button>
            ))}
          </div>
        )}

        {/* === Categories === */}
        {!categoryLocked && (
          <FilterGroup
            title="Категории"
            icon={<Grid3X3 size={14} />}
            defaultOpen={true}
          >
            <div className="space-y-0.5 max-h-[320px] overflow-y-auto overflow-x-hidden pr-0.5">
              <button
                type="button"
                onClick={() => onCategoryChange(null)}
                className={`flex items-center justify-between w-full py-2 pl-3 pr-2 text-xs rounded-lg transition-colors ${
                  selectedCategory === null
                    ? 'text-gold bg-gold/5 font-medium border-l-2 border-gold'
                    : 'text-body-text hover:text-gold hover:bg-surface-elevated/50 border-l-2 border-transparent'
                }`}
              >
                <span>Все товары</span>
                <span className="text-[10px] text-muted-text bg-[var(--border-muted)] rounded px-1.5 py-0.5 font-tabular shrink-0 ml-2">
                  {categoriesLoading ? <Skeleton width={30} height={10} borderRadius="sm" /> : CATEGORY_ORDER.reduce((sum, slug) => sum + (categoryCounts[slug] || 0), 0)}
                </span>
              </button>
              {CATEGORY_ORDER.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onCategoryChange(cat)}
                  disabled={categoryLocked && cat !== selectedCategory}
                  className={`flex items-center justify-between w-full py-2 pl-3 pr-2 text-xs rounded-lg transition-colors ${
                    selectedCategory === cat
                      ? 'text-gold bg-gold/5 font-medium border-l-2 border-gold'
                      : 'text-body-text hover:text-gold hover:bg-surface-elevated/50 border-l-2 border-transparent'
                  } ${categoryLocked && cat !== selectedCategory ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <span>{CATEGORY_LABELS[cat]}</span>
                  <span className="text-[10px] text-muted-text bg-[var(--border-muted)] rounded px-1.5 py-0.5 font-tabular shrink-0 ml-2">
                    {categoriesLoading ? <Skeleton width={24} height={10} borderRadius="sm" /> : (categoryCounts[cat] ?? '—')}
                  </span>
                </button>
              ))}
            </div>
          </FilterGroup>
        )}

        {/* === Price === */}
        <FilterGroup title="Цена" icon={<DollarSign size={14} />} defaultOpen={false}>
          <div className="space-y-3">
            <DualRangeSlider
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={PRICE_STEP}
              minVal={localPriceRange.min}
              maxVal={localPriceRange.max}
              onChange={handlePriceSliderChange}
              onCommit={handlePriceSliderCommit}
              priceGap={Math.max(10, (PRICE_MAX - PRICE_MIN) * 0.1)}
              formatValue={v => `${Math.floor(v).toLocaleString('ru-RU')} Br`}
            />
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="text-[10px] text-muted-text mb-1 block uppercase tracking-wider" htmlFor="price-min">
                  От
                </label>
                <input
                  id="price-min"
                  type="text"
                  inputMode="numeric"
                  value={localPriceRange.min || ''}
                  onChange={e => handleMinInputChange(e.target.value)}
                  className="w-full h-9 bg-surface-elevated text-on-dark text-xs font-tabular rounded-lg px-3 border border-hairline-dark focus:outline-none focus:ring-1 focus:ring-gold/30 focus:border-gold/40 transition-all"
                  placeholder={String(PRICE_MIN)}
                />
              </div>
              <span className="text-muted-text text-xs mt-5 select-none">—</span>
              <div className="flex-1">
                <label className="text-[10px] text-muted-text mb-1 block uppercase tracking-wider" htmlFor="price-max">
                  До
                </label>
                <input
                  id="price-max"
                  type="text"
                  inputMode="numeric"
                  value={localPriceRange.max || ''}
                  onChange={e => handleMaxInputChange(e.target.value)}
                  className="w-full h-9 bg-surface-elevated text-on-dark text-xs font-tabular rounded-lg px-3 border border-hairline-dark focus:outline-none focus:ring-1 focus:ring-gold/30 focus:border-gold/40 transition-all"
                  placeholder={String(PRICE_MAX)}
                />
              </div>
            </div>
          </div>
        </FilterGroup>

        {/* === Dynamic Specifications === */}
        {selectedCategory && filterFacets.length > 0 && (() => {
          const backendSlug = FRONTEND_TO_BACKEND[selectedCategory];
          const order = SPEC_ORDER[backendSlug] ?? [];
          const attrMap = new Map(filterFacets.map(a => [a.key, a]));
          const orderedKeys = [
            ...order.filter(k => attrMap.has(k)),
            ...filterFacets.map(a => a.key).filter(k => !order.includes(k)),
          ];
          const groups = orderedKeys.map(key => ({ keys: [key] }));

          const renderAttr = (attr: FilterFacetAttribute, options?: { hideLabel?: boolean }) => {
            // --- Range filter ---
            if (attr.filterType === 'range') {
              if (attr.minValue == null && attr.maxValue == null) return null;
              const isVideoMemory = attr.key === 'videopamyat';
              const rawMin = attr.minValue ?? 0;
              const rawMax = attr.maxValue ?? Math.max(rawMin + 1, 100);

              // Контекстный минимум из сборки (GPU+CPU TDP)
              const effectiveMin = attr.key === 'power' || attr.key === 'wattage'
                ? (effectiveSpecs?.['wattage_min'] as number | undefined) ?? null
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
                ? rangeStr.split(',').map(s => parseFloat(s.trim()) || 0)
                : [rawMin, rawMax];

              const localRange = { min: toUi(selMinRaw || rawMin), max: toUi(selMaxRaw || rawMax) };
              const displayRange = localSpecRanges[attr.key] ?? localRange;
              const rangeSpanUi = maxValUi - minValUi;
              const step = isVideoMemory || attr.key.includes('capacity')
                ? 1
                : Math.max(1, Math.floor(rangeSpanUi / 100) || 1);

              return (
                <div key={attr.key} className="mb-3 pb-3 border-b border-hairline-dark/60 last:border-b-0">
                  {!options?.hideLabel && (
                    <span className="block text-[10px] font-semibold text-muted-text uppercase tracking-[0.08em] mb-2">
                      {attr.displayName}
                    </span>
                  )}
                  {effectiveMin != null && isWattage && (
                    <div className="text-[10px] text-gold mb-1.5 py-1 px-2 bg-gold/5 rounded border border-gold/10" title={`Минимальная мощность с учётом выбранной конфигурации: ${effectiveMin}Вт`}>
                      Мин. {effectiveMin}Вт для вашей сборки
                    </div>
                  )}
                  <DualRangeSlider
                    min={minValUi}
                    max={maxValUi}
                    step={step}
                    minVal={displayRange.min}
                    maxVal={displayRange.max}
                    onChange={values => {
                      setLocalSpecRanges(prev => ({ ...prev, [attr.key]: values }));
                    }}
                    onCommit={values => {
                      const next = { ...selectedSpecifications };
                      const committedMinRaw = effectiveMin != null
                        ? Math.max(fromUi(values.min), effectiveMin)
                        : fromUi(values.min);
                      const committedMaxRaw = fromUi(values.max);
                      if (committedMinRaw === rawMin && committedMaxRaw === rawMax) {
                        delete next[attr.key];
                      } else {
                        next[attr.key] = `${committedMinRaw},${committedMaxRaw}`;
                      }
                      onSpecificationsChange(next);
                    }}
                    formatValue={v => (Number.isInteger(v) ? v.toString() : v.toFixed(1))}
                  />
                </div>
              );
            }

            // --- Select filter ---
            if (attr.filterType === 'select') {
              const optionsList = attr.options ?? [];
              const showSearch = optionsList.length > 15;
              const query = (specSearchQuery[attr.key] ?? '').trim().toLowerCase();
              const filteredOptions = showSearch && query
                ? optionsList.filter(o => o.value.toLowerCase().includes(query))
                : optionsList;

              const selected = selectedSpecifications[attr.key];
              const selectedArr = Array.isArray(selected) ? selected
                : selected != null ? [String(selected)]
                : [];
              const isChecked = (val: string) => selectedArr.includes(val);

              // Убираем чисто числовые значения для integrated_graphics
              const cleanOptions = attr.key === 'integrated_graphics'
                ? filteredOptions.filter(o => !/^\d+$/.test(o.value))
                : filteredOptions;

              const allowed = restrictedSpecValues?.[attr.key];
              const lockedValue = selectedSpecifications[attr.key];
              const isLockArray = Array.isArray(lockedValue);
              const isLocked = typeof lockedValue === 'string' && !isLockArray;

              // Для type — умный фильтр DDR
              const isMatchingDDRType = (optionValue: string, expectedTypes: string[]): boolean => {
                const upper = optionValue.toUpperCase();
                if (/^[0-9]+[GM]x[0-9]+/i.test(optionValue)) return false;
                if (/\bSO-DIMM\b/i.test(optionValue)) return false;
                if (/\bREGISTERED\b/i.test(optionValue)) return false;
                return expectedTypes.some(dt =>
                  upper.startsWith(dt.toUpperCase())
                  && !/\bSO-DIMM\b/.test(upper)
                  && !/\bREGISTERED\b/.test(upper),
                );
              };

              let finalOptions = cleanOptions;
              if (allowed) {
                finalOptions = attr.key === 'type'
                  ? cleanOptions.filter(o => isMatchingDDRType(o.value, allowed))
                  : cleanOptions.filter(o => allowed.some(a => a.toLowerCase() === o.value.toLowerCase()));
              } else if (isLocked && lockedValue) {
                const lockedUpper = String(lockedValue).toUpperCase();
                finalOptions = cleanOptions.filter(o => o.value.toUpperCase() === lockedUpper);
              }

              return (
                <div key={attr.key} className="mb-3 pb-3 border-b border-hairline-dark/60 last:border-b-0">
                  {!options?.hideLabel && (
                    <span className="block text-[10px] font-semibold text-muted-text uppercase tracking-[0.08em] mb-2">
                      {attr.displayName}
                    </span>
                  )}
                  {showSearch && (
                    <div className="relative mb-2">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-text pointer-events-none" aria-hidden />
                      <input
                        type="search"
                        placeholder="Поиск..."
                        value={specSearchQuery[attr.key] ?? ''}
                        onChange={e =>
                          setSpecSearchQuery(prev => ({ ...prev, [attr.key]: e.target.value }))
                        }
                        className="w-full h-8 bg-surface-elevated text-on-dark text-xs rounded-lg pl-8 pr-3 border border-hairline-dark placeholder:text-muted-text focus:outline-none focus:ring-1 focus:ring-gold/30 focus:border-gold/40 transition-all"
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5 max-h-[200px] overflow-y-auto overflow-x-hidden">
                    {finalOptions.length > 0 ? (
                      finalOptions.map(({ value: val, count }) => {
                        const disabled = count === 0 && !isChecked(val);
                        return (
                          <div
                            key={val}
                            role="checkbox"
                            aria-checked={isChecked(val)}
                            aria-disabled={disabled || undefined}
                            tabIndex={disabled ? -1 : 0}
                            onClick={() => {
                              if (disabled) return;
                              const next = { ...selectedSpecifications };
                              const newArr = isChecked(val)
                                ? selectedArr.filter(v => v !== val)
                                : [...selectedArr, val];
                              if (newArr.length === 0) delete next[attr.key];
                              else next[attr.key] = newArr;
                              onSpecificationsChange(next);
                            }}
                            onKeyDown={(e) => {
                              if (disabled) return;
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                const next = { ...selectedSpecifications };
                                const newArr = isChecked(val)
                                  ? selectedArr.filter(v => v !== val)
                                  : [...selectedArr, val];
                                if (newArr.length === 0) delete next[attr.key];
                                else next[attr.key] = newArr;
                                onSpecificationsChange(next);
                              }
                            }}
                            className={`flex items-center py-1.5 px-3 cursor-pointer transition-all duration-200 rounded-md border-l-2 border-transparent relative ${
                              isChecked(val)
                                ? 'text-gold border-l-2 border-gold font-medium'
                                : 'text-body-text hover:text-on-dark hover:bg-surface-elevated/50'
                            } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                          >
                            <span className="w-4 h-4 border border-muted-foreground rounded flex items-center justify-center mr-2.5 transition-all duration-200 flex-shrink-0">
                              <Check
                                size={10}
                                className={`transition-opacity duration-200 ${isChecked(val) ? 'opacity-100 text-gold' : 'opacity-0'}`}
                                aria-hidden
                              />
                            </span>
                            <span className="text-xs">
                              {val}
                              {' '}
                              <span className="text-muted-foreground">({count})</span>
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <span className="block text-xs text-muted-foreground py-2 px-3 italic">
                        {showSearch && query ? 'Ничего не найдено' : 'Нет вариантов'}
                      </span>
                    )}
                  </div>
                </div>
              );
            }
            return null;
          };

          return false ? (
            <FilterGroup title="Характеристики" icon={<Tag size={14} />} defaultOpen={false}>
              <div className="space-y-2">
                <Skeleton width="100%" height={20} borderRadius="sm" />
                <Skeleton width="100%" height={20} borderRadius="sm" />
                <Skeleton width="100%" height={20} borderRadius="sm" />
              </div>
            </FilterGroup>
          ) : (
            groups.map(group => {
              const attrsInGroup = group.keys.map(k => attrMap.get(k)).filter(Boolean) as FilterFacetAttribute[];
              const singleAttrGroup = attrsInGroup.length === 1;
              const rendered = attrsInGroup.map(attr => renderAttr(attr, { hideLabel: singleAttrGroup })).filter(Boolean);
              if (rendered.length === 0) return null;
              const title = attrsInGroup[0]?.displayName ?? group.keys[0];
              return (
                <FilterGroup key={group.keys[0]} title={title} icon={<Tag size={14} />} defaultOpen={false}>
                  {rendered}
                </FilterGroup>
              );
            })
          );
        })()}

        {/* === Manufacturers === */}
        <FilterGroup title="Производители" icon={<Tag size={14} />} defaultOpen={false}>
          <div className="space-y-0.5">
            <div className="relative mb-2">
              <input
                type="text"
                placeholder="Поиск брендов..."
                value={mfrSearch}
                onChange={e => setMfrSearch(e.target.value)}
                className="w-full h-9 bg-surface-elevated text-on-dark text-xs rounded-lg pl-8 pr-3 border border-hairline-dark placeholder:text-muted-text focus:outline-none focus:ring-1 focus:ring-gold/30 focus:border-gold/40 transition-all"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-text" size={13} />
            </div>
            <div className="space-y-0.5 max-h-[200px] overflow-y-auto overflow-x-hidden pr-1">
              {(visibleMfrs || []).map(mfr => (
                <div
                  key={mfr.id}
                  role="checkbox"
                  aria-checked={selectedManufacturerIds.includes(mfr.id)}
                  tabIndex={0}
                  onClick={() => handleManufacturerToggle(mfr.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleManufacturerToggle(mfr.id); } }}
                  className={`flex items-center py-1.5 px-3 cursor-pointer transition-all duration-200 rounded-md border-l-2 border-transparent relative ${
                    selectedManufacturerIds.includes(mfr.id)
                      ? 'text-gold border-l-2 border-gold font-medium'
                      : 'text-body-text hover:text-on-dark hover:bg-surface-elevated/50'
                  }`}
                >
                  <span className="w-4 h-4 border border-muted-foreground rounded flex items-center justify-center mr-2.5 transition-all duration-200 flex-shrink-0">
                    <Check
                      size={10}
                      className={`transition-opacity duration-200 ${selectedManufacturerIds.includes(mfr.id) ? 'opacity-100 text-gold' : 'opacity-0'}`}
                      aria-hidden
                    />
                  </span>
                  <span className="text-xs transition-colors">{getDisplayManufacturerName(mfr.name)}</span>
                </div>
              ))}
              {manufacturersLoading && (
                <>
                  <Skeleton width="100%" height={20} borderRadius="sm" />
                  <Skeleton width="100%" height={20} borderRadius="sm" />
                  <Skeleton width="100%" height={20} borderRadius="sm" />
                </>
              )}
            </div>
            {!showAllMfrs && filteredMfrs.length > 6 && (
              <button
                type="button"
                onClick={() => setShowAllMfrs(true)}
                className="text-gold text-xs font-medium hover:text-gold-active transition-colors w-full text-left"
              >
                Ещё {filteredMfrs.length - 6} брендов
              </button>
            )}
          </div>
        </FilterGroup>

        {/* === Rating === */}
        <FilterGroup title="Рейтинг" icon={<Star size={14} />} defaultOpen={false}>
          <div className="space-y-0.5">
            <StarRating rating={minRating} onChange={onRatingChange} />
          </div>
        </FilterGroup>

        {/* === Availability === */}
        <FilterGroup title="Наличие" icon={<Package size={14} />} defaultOpen={false}>
          <div className="space-y-0.5">
            {/* Все товары */}
            <div
              role="checkbox"
              aria-checked={selectedAvailability.length === 0}
              tabIndex={0}
              onClick={() => onAvailabilityChange([])}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAvailabilityChange([]); } }}
              className={`flex items-center py-1.5 px-3 cursor-pointer transition-all duration-200 rounded-md border-l-2 border-transparent relative ${
                selectedAvailability.length === 0
                  ? 'text-gold border-l-2 border-gold font-medium'
                  : 'text-body-text hover:text-on-dark hover:bg-surface-elevated/50'
              }`}
            >
              <span className="w-4 h-4 border border-muted-foreground rounded flex items-center justify-center mr-2.5 transition-all duration-200 flex-shrink-0">
                <Check
                  size={10}
                  className={`transition-opacity duration-200 ${selectedAvailability.length === 0 ? 'opacity-100 text-gold' : 'opacity-0'}`}
                  aria-hidden
                />
              </span>
              <span className="text-xs">Все товары</span>
            </div>
            {/* В наличии */}
            <div
              role="checkbox"
              aria-checked={selectedAvailability.includes('in_stock')}
              tabIndex={0}
              onClick={() => handleAvailabilityToggle('in_stock')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleAvailabilityToggle('in_stock'); } }}
              className={`flex items-center py-1.5 px-3 cursor-pointer transition-all duration-200 rounded-md border-l-2 border-transparent relative ${
                selectedAvailability.includes('in_stock')
                  ? 'text-gold border-l-2 border-gold font-medium'
                  : 'text-body-text hover:text-on-dark hover:bg-surface-elevated/50'
              }`}
            >
              <span className="w-4 h-4 border border-muted-foreground rounded flex items-center justify-center mr-2.5 transition-all duration-200 flex-shrink-0">
                <Check
                  size={10}
                  className={`transition-opacity duration-200 ${selectedAvailability.includes('in_stock') ? 'opacity-100 text-gold' : 'opacity-0'}`}
                  aria-hidden
                />
              </span>
              <span className="text-xs">В наличии</span>
            </div>
            {/* Под заказ */}
            <div
              role="checkbox"
              aria-checked={selectedAvailability.includes('on_order')}
              tabIndex={0}
              onClick={() => handleAvailabilityToggle('on_order')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleAvailabilityToggle('on_order'); } }}
              className={`flex items-center py-1.5 px-3 cursor-pointer transition-all duration-200 rounded-md border-l-2 border-transparent relative ${
                selectedAvailability.includes('on_order')
                  ? 'text-gold border-l-2 border-gold font-medium'
                  : 'text-body-text hover:text-on-dark hover:bg-surface-elevated/50'
              }`}
            >
              <span className="w-4 h-4 border border-muted-foreground rounded flex items-center justify-center mr-2.5 transition-all duration-200 flex-shrink-0">
                <Check
                  size={10}
                  className={`transition-opacity duration-200 ${selectedAvailability.includes('on_order') ? 'opacity-100 text-gold' : 'opacity-0'}`}
                  aria-hidden
                />
              </span>
              <span className="text-xs">Под заказ</span>
            </div>
          </div>
</FilterGroup>

      </div>
    </div>
  );
}