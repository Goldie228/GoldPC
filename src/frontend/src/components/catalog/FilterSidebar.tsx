import { useState, useEffect } from 'react';
import { ChevronDown, Grid3X3, DollarSign, Package, Check, Star, Tag } from 'lucide-react';
import { catalogApi } from '../../api/catalog';
import { RangeSlider } from '../ui/RangeSlider';
import { Skeleton } from '../ui/Skeleton';
import type { ProductCategory, Category, FilterAttribute, Manufacturer } from '../../api/types';
import styles from './FilterSidebar.module.css';

interface FilterSidebarProps {
  selectedCategory: ProductCategory | null;
  onCategoryChange: (category: ProductCategory | null) => void;
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
    'data_vykhoda_na_rynok_2',
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
    'socket_compatibility',
    'form_factor',
    'memory_type',
    'memory_slots',
    'max_memory',
    'max_memory_freq',
    'data_vykhoda_na_rynok',
  ],
  ram: [
    'capacity',
    'capacity_per_module',
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
  coolers: ['type', 'socket', 'tdp', 'fan_size', 'fan_count', 'noise', 'data_vykhoda_na_rynok'],
  monitors: [
    'diagonal',
    'resolution',
    'refresh_rate',
    'matrix',
    'type',
    'brightness',
    'response_time',
    'data_vykhoda_na_rynok',
  ],
  keyboards: ['type', 'interface', 'color', 'data_vykhoda_na_rynok'],
  mice: ['type', 'interface', 'color', 'sensor_type', 'dpi', 'data_vykhoda_na_rynok'],
  headphones: ['type', 'interface', 'connection_type', 'driver_size', 'frequency_range', 'impedance', 'color', 'data_vykhoda_na_rynok'],
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
    <div className={styles.filterGroup}>
      <button
        className={`${styles.filterHeader} ${isOpen ? styles.filterHeaderOpen : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        type="button"
      >
        <span className={styles.filterHeaderIcon}>{icon}</span>
        <span className={styles.filterHeaderTitle}>{title}</span>
        <ChevronDown
          size={14}
          className={`${styles.filterHeaderChevron} ${isOpen ? '' : styles.rotated}`}
        />
      </button>
      <div className={`${styles.filterContent} ${isOpen ? styles.open : ''}`}>
        {children}
      </div>
    </div>
  );
}

export function FilterSidebar({
  selectedCategory,
  onCategoryChange,
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
}: FilterSidebarProps) {
  const PRICE_MIN = 0;
  // Mock catalog prices are in BYN and usually <= ~6000 per category.
  // Huge max (500000) makes the slider "jump" too aggressively.
  const PRICE_MAX = 10000;
  const PRICE_STEP = 25;

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
      return { min: minUnset ? 0 : min, max: maxUnset ? 0 : max };
    }

    if (min <= max) return { min, max };
    return { min: max, max: min };
  };

  // Состояние для хранения количества товаров в каждой категории
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filterAttributes, setFilterAttributes] = useState<FilterAttribute[]>([]);
  const [specAttrsLoading, setSpecAttrsLoading] = useState(false);
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
            counts[key] = cat.productCount ?? 0;
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

  // Загрузка атрибутов фильтрации при выборе категории и фильтров (контекстные значения: при Intel — без AM4/AM5)
  useEffect(() => {
    if (!selectedCategory) {
      setFilterAttributes([]);
      return;
    }
    const backendSlug = FRONTEND_TO_BACKEND[selectedCategory];

    const specsSelect: Record<string, string> = {};
    const specsRange: Record<string, string> = {};
    for (const [k, v] of Object.entries(selectedSpecifications)) {
      if (Array.isArray(v)) {
        if (v.length > 0) specsSelect[k] = v.length === 1 ? v[0] : v.join(',');
      } else {
        const str = String(v);
        if (str.includes(',')) {
          const parts = str.split(',');
          if (parts.length === 2 && !Number.isNaN(parseFloat(parts[0])) && !Number.isNaN(parseFloat(parts[1]))) {
            specsRange[k] = str;
          } else {
            specsSelect[k] = str;
          }
        } else {
          specsSelect[k] = typeof v === 'number' ? String(v) : str;
        }
      }
    }

    const filterParams =
      selectedManufacturerIds.length > 0 || Object.keys(specsSelect).length > 0 || Object.keys(specsRange).length > 0
        ? {
            manufacturerIds: selectedManufacturerIds.length > 0 ? selectedManufacturerIds : undefined,
            specifications: Object.keys(specsSelect).length > 0 ? specsSelect : undefined,
            specificationRanges: Object.keys(specsRange).length > 0 ? specsRange : undefined,
          }
        : undefined;

    const fetchAttrs = async () => {
      setSpecAttrsLoading(true);
      try {
        const attrs = await catalogApi.getFilterAttributes(backendSlug, filterParams);
        setFilterAttributes(attrs);
      } catch (err) {
        console.error('Failed to fetch filter attributes:', err);
        setFilterAttributes([]);
      } finally {
        setSpecAttrsLoading(false);
      }
    };
    fetchAttrs();
  }, [selectedCategory, selectedManufacturerIds, selectedSpecifications]);

  // Загрузка производителей: по категории или всех
  useEffect(() => {
    const fetchManufacturers = async () => {
      setManufacturersLoading(true);
      try {
        const backendSlug = selectedCategory ? FRONTEND_TO_BACKEND[selectedCategory] : undefined;
        const list = await catalogApi.getManufacturers(backendSlug);
        setManufacturers(list);
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
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h2 className={styles.sidebarTitle}>
          <Grid3X3 size={16} />
          Фильтры
        </h2>
      </div>

      {/* Categories — открыта по умолчанию для быстрой навигации */}
      <FilterGroup
        title="Категории"
        icon={<Grid3X3 size={14} />}
        defaultOpen={true}
      >
        <div className={styles.categoryList}>
          <button
            className={`${styles.categoryItem} ${!selectedCategory ? styles.active : ''}`}
            onClick={() => onCategoryChange(null)}
          >
            <span className={styles.categoryName}>Все товары</span>
            <span className={styles.categoryCount} aria-hidden={loading ? true : undefined}>
              {loading ? <Skeleton width={44} height={12} borderRadius="sm" /> : totalCount}
            </span>
          </button>
          {CATEGORY_ORDER.map((category) => (
            <button
              key={category}
              className={`${styles.categoryItem} ${selectedCategory === category ? styles.active : ''}`}
              onClick={() => onCategoryChange(category)}
            >
              <span className={styles.categoryName}>{CATEGORY_LABELS[category]}</span>
              <span className={styles.categoryCount}>
                {loading ? <Skeleton width={36} height={12} borderRadius="sm" /> : (categoryCounts[category] || 0)}
              </span>
            </button>
          ))}
        </div>
      </FilterGroup>

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
        <div className={styles.priceInputs}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>От</label>
            <input
              type="number"
              className={styles.priceInput}
              value={localPriceRange.min || ''}
              onChange={(e) => setLocalPriceRange({ ...localPriceRange, min: parseInt(e.target.value) || 0 })}
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={PRICE_STEP}
              placeholder="Мин"
            />
          </div>
          <span className={styles.priceSeparator}>—</span>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>До</label>
            <input
              type="number"
              className={styles.priceInput}
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

        const renderAttr = (attr: FilterAttribute) => {
          if (attr.filterType === 'range') {
            if (attr.minValue == null && attr.maxValue == null) return null;
            const minVal = attr.minValue ?? 0;
            const maxVal = attr.maxValue ?? Math.max(minVal + 1, 100);
            const raw = selectedSpecifications[attr.key];
            const rangeStr = typeof raw === 'string' ? raw : undefined;
            const [minSel, maxSel] = rangeStr?.includes(',')
              ? rangeStr.split(',').map((s) => parseFloat(s.trim()) || 0)
              : [minVal, maxVal];
            const localRange = { min: minSel || minVal, max: maxSel || maxVal };
            const rangeSpan = maxVal - minVal;
            const step = attr.key.includes('videopamyat') || attr.key.includes('capacity') ? 1 : Math.max(1, Math.floor(rangeSpan / 100) || 1);
            return (
              <div key={attr.key} className={styles.specFilterBlock}>
                <span className={styles.specFilterLabel}>{attr.displayName}</span>
                <RangeSlider
                  min={minVal}
                  max={maxVal}
                  step={step}
                  value={localRange}
                  onChange={(r) => {
                    const next = { ...selectedSpecifications };
                    if (r.min === minVal && r.max === maxVal) delete next[attr.key];
                    else next[attr.key] = `${r.min},${r.max}`;
                    onSpecificationsChange(next);
                  }}
                  formatValue={(v) => (Number.isInteger(v) ? v.toString() : v.toFixed(0))}
                />
              </div>
            );
          }
          if (attr.filterType === 'select') {
            const values = attr.values ?? [];
            const selected = selectedSpecifications[attr.key];
            const selectedArr = Array.isArray(selected) ? selected : selected != null ? [String(selected)] : [];
            const isChecked = (val: string) => selectedArr.includes(val);
            return (
              <div key={attr.key} className={styles.specFilterBlock}>
                <span className={styles.specFilterLabel}>{attr.displayName}</span>
                <div className={styles.specFilterValues}>
                  {values.length > 0 ? (
                    values.map((val) => (
                      <label key={val} className={`${styles.checkboxItem} ${isChecked(val) ? styles.checked : ''}`}>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={isChecked(val)}
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
                        <span className={styles.checkbox}><Check size={10} className={styles.checkIcon} /></span>
                        <span className={styles.checkboxLabel}>{val}</span>
                      </label>
                    ))
                  ) : (
                    <span className={styles.emptySpecHint}>Нет вариантов</span>
                  )}
                </div>
              </div>
            );
          }
          return null;
        };

        return specAttrsLoading ? (
          <FilterGroup title="Характеристики" icon={<Tag size={14} />} defaultOpen={false}>
            <div className={styles.checkboxList}>
              <Skeleton width="100%" height={24} borderRadius="sm" />
              <Skeleton width="100%" height={24} borderRadius="sm" />
            </div>
          </FilterGroup>
        ) : (
          groups.map((group) => {
            const attrsInGroup = group.keys.map((k) => attrMap.get(k)).filter(Boolean) as FilterAttribute[];
            const rendered = attrsInGroup.map(renderAttr).filter(Boolean);
            if (rendered.length === 0) return null;
            const title = attrsInGroup[0]?.displayName ?? group.keys[0];
            return (
              <FilterGroup key={group.keys[0]} title={title} icon={<Tag size={14} />} defaultOpen={false}>
                <div className={styles.checkboxList}>{rendered}</div>
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
        <div className={styles.checkboxList}>
          {manufacturersLoading ? (
            <>
              <Skeleton width="100%" height={24} borderRadius="sm" />
              <Skeleton width="100%" height={24} borderRadius="sm" />
              <Skeleton width="100%" height={24} borderRadius="sm" />
            </>
          ) : manufacturers.length === 0 ? (
            <span className={styles.emptySpecHint}>Нет производителей</span>
          ) : (
            manufacturers.map((m) => (
              <label
                key={m.id}
                className={`${styles.checkboxItem} ${selectedManufacturerIds.includes(m.id) ? styles.checked : ''}`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={selectedManufacturerIds.includes(m.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onManufacturerIdsChange([...selectedManufacturerIds, m.id]);
                    } else {
                      onManufacturerIdsChange(selectedManufacturerIds.filter((id) => id !== m.id));
                    }
                  }}
                />
                <span className={styles.checkbox}>
                  <Check size={10} className={styles.checkIcon} />
                </span>
                <span className={styles.checkboxLabel}>{m.name}</span>
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
        <div className={styles.ratingOptions}>
          {[4, 3, 2, 1].map((rating) => (
            <label
              key={rating}
              className={`${styles.ratingOption} ${minRating === rating ? styles.checked : ''}`}
            >
              <input
                type="radio"
                name="rating"
                className="sr-only"
                checked={minRating === rating}
                onChange={() => onRatingChange(rating)}
              />
              <span className={styles.ratingRadio}>
                <Check size={10} className={styles.checkIcon} />
              </span>
              <span className={styles.ratingStars}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={i < rating ? styles.starFilled : styles.starEmpty}
                  />
                ))}
              </span>
              <span className={styles.ratingLabel}>и выше</span>
            </label>
          ))}
          <label
            className={`${styles.ratingOption} ${minRating === 0 ? styles.checked : ''}`}
          >
            <input
              type="radio"
              name="rating"
              className="sr-only"
              checked={minRating === 0}
              onChange={() => onRatingChange(0)}
            />
            <span className={styles.ratingRadio}>
              <Check size={10} className={styles.checkIcon} />
            </span>
            <span className={styles.ratingLabel}>Любой рейтинг</span>
          </label>
        </div>
      </FilterGroup>

      {/* Stock Status */}
      <FilterGroup
        title="Наличие"
        icon={<Package size={14} />}
        defaultOpen={false}
      >
        <div className={styles.checkboxList}>
          <label
            className={`${styles.checkboxItem} ${selectedAvailability.includes('in_stock') ? styles.checked : ''}`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={selectedAvailability.includes('in_stock')}
              onChange={(e) => {
                if (e.target.checked) {
                  onAvailabilityChange([...selectedAvailability, 'in_stock']);
                } else {
                  onAvailabilityChange(selectedAvailability.filter((a) => a !== 'in_stock'));
                }
              }}
            />
            <span className={styles.checkbox}>
              <Check size={10} className={styles.checkIcon} />
            </span>
            <span className={styles.checkboxLabel}>В наличии</span>
          </label>
          <label
            className={`${styles.checkboxItem} ${selectedAvailability.includes('on_order') ? styles.checked : ''}`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={selectedAvailability.includes('on_order')}
              onChange={(e) => {
                if (e.target.checked) {
                  onAvailabilityChange([...selectedAvailability, 'on_order']);
                } else {
                  onAvailabilityChange(selectedAvailability.filter((a) => a !== 'on_order'));
                }
              }}
            />
            <span className={styles.checkbox}>
              <Check size={10} className={styles.checkIcon} />
            </span>
            <span className={styles.checkboxLabel}>Под заказ</span>
          </label>
        </div>
      </FilterGroup>

      {/* Reset Button - показывается только при активных фильтрах */}
      {hasActiveFilters && (
        <button className={styles.resetBtn} onClick={onReset}>
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