import { useState, useEffect } from 'react';
import { ChevronDown, Grid3X3, DollarSign, Package, Check, Star, Tag } from 'lucide-react';
import { catalogApi } from '../../api/catalog';
import { RangeSlider } from '../ui/RangeSlider';
import { Skeleton } from '../ui/Skeleton';
import type { ProductCategory, Category } from '../../api/types';
import styles from './FilterSidebar.module.css';

interface FilterSidebarProps {
  selectedCategory: ProductCategory | null;
  onCategoryChange: (category: ProductCategory | null) => void;
  priceRange: { min: number; max: number };
  onPriceChange: (range: { min: number; max: number }) => void;
  selectedBrands: string[];
  onBrandsChange: (brands: string[]) => void;
  minRating: number;
  onRatingChange: (rating: number) => void;
  selectedAvailability: string[];
  onAvailabilityChange: (availability: string[]) => void;
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
  peripherals: 'Периферия',
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
  'peripherals',
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
  periphery: 'peripherals',
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
  selectedBrands,
  onBrandsChange,
  minRating,
  onRatingChange,
  selectedAvailability,
  onAvailabilityChange,
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

  // Подсчёт общего количества товаров
  const totalCount = CATEGORY_ORDER.reduce((sum, slug) => sum + (categoryCounts[slug] || 0), 0);

  // Проверка активных фильтров
  const hasActiveFilters = 
    selectedCategory !== null || 
    priceRange.min > 0 || 
    priceRange.max > 0 || 
    selectedBrands.length > 0 || 
    minRating > 0 ||
    selectedAvailability.length > 0;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h2 className={styles.sidebarTitle}>
          <Grid3X3 size={16} />
          Фильтры
        </h2>
      </div>

      {/* Categories */}
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
        defaultOpen={true}
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

      {/* Brands */}
      <FilterGroup
        title="Бренды"
        icon={<Tag size={14} />}
        defaultOpen={true}
      >
        <div className={styles.checkboxList}>
          {['AMD', 'Intel', 'NVIDIA', 'ASUS', 'MSI', 'Gigabyte', 'Corsair', 'Kingston', 'Samsung', 'Western Digital'].map((brand) => (
            <label
              key={brand}
              className={`${styles.checkboxItem} ${selectedBrands.includes(brand) ? styles.checked : ''}`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={selectedBrands.includes(brand)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onBrandsChange([...selectedBrands, brand]);
                  } else {
                    onBrandsChange(selectedBrands.filter((b) => b !== brand));
                  }
                }}
              />
              <span className={styles.checkbox}>
                <Check size={10} className={styles.checkIcon} />
              </span>
              <span className={styles.checkboxLabel}>{brand}</span>
            </label>
          ))}
        </div>
      </FilterGroup>

      {/* Rating */}
      <FilterGroup
        title="Рейтинг"
        icon={<Star size={14} />}
        defaultOpen={true}
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
        defaultOpen={true}
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