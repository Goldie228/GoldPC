import { useState } from 'react';
import { ChevronDown, Grid3X3, DollarSign, Package, Check } from 'lucide-react';
import type { ProductCategory } from '../../api/types';
import styles from './FilterSidebar.module.css';

interface FilterSidebarProps {
  selectedCategory: ProductCategory | null;
  onCategoryChange: (category: ProductCategory | null) => void;
  priceRange: { min: number; max: number };
  onPriceChange: (range: { min: number; max: number }) => void;
  onReset: () => void;
}

interface CategoryConfig {
  label: string;
  count: number;
}

const CATEGORY_CONFIG: Record<ProductCategory, CategoryConfig> = {
  cpu: { label: 'Процессоры', count: 42 },
  gpu: { label: 'Видеокарты', count: 38 },
  motherboard: { label: 'Мат. платы', count: 56 },
  ram: { label: 'Память', count: 89 },
  storage: { label: 'Накопители', count: 67 },
  psu: { label: 'Блоки питания', count: 34 },
  case: { label: 'Корпуса', count: 28 },
  cooling: { label: 'Охлаждение', count: 45 },
  monitor: { label: 'Мониторы', count: 22 },
  peripherals: { label: 'Периферия', count: 51 },
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
        className={styles.filterHeader}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
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
  onReset,
}: FilterSidebarProps) {
  const categories = Object.keys(CATEGORY_CONFIG) as ProductCategory[];
  const totalCount = Object.values(CATEGORY_CONFIG).reduce((sum, cat) => sum + cat.count, 0);

  const handleMinPriceChange = (value: string) => {
    const min = parseInt(value) || 0;
    onPriceChange({ ...priceRange, min });
  };

  const handleMaxPriceChange = (value: string) => {
    const max = parseInt(value) || 0;
    onPriceChange({ ...priceRange, max });
  };

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
            <span className={styles.categoryCount}>{totalCount}</span>
          </button>
          {categories.map((category) => (
            <button
              key={category}
              className={`${styles.categoryItem} ${selectedCategory === category ? styles.active : ''}`}
              onClick={() => onCategoryChange(category)}
            >
              <span className={styles.categoryName}>{CATEGORY_CONFIG[category].label}</span>
              <span className={styles.categoryCount}>{CATEGORY_CONFIG[category].count}</span>
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
        <div className={styles.priceInputs}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>От</label>
            <input
              type="number"
              className={styles.priceInput}
              value={priceRange.min || ''}
              onChange={(e) => handleMinPriceChange(e.target.value)}
              placeholder="Мин"
            />
          </div>
          <span className={styles.priceSeparator}>—</span>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>До</label>
            <input
              type="number"
              className={styles.priceInput}
              value={priceRange.max || ''}
              onChange={(e) => handleMaxPriceChange(e.target.value)}
              placeholder="Макс"
            />
          </div>
        </div>
      </FilterGroup>

      {/* Stock Status */}
      <FilterGroup
        title="Наличие"
        icon={<Package size={14} />}
        defaultOpen={true}
      >
        <div className={styles.stockOptions}>
          <label className={`${styles.stockOption} ${styles.checked}`}>
            <input type="radio" name="stock" className="sr-only" defaultChecked />
            <span className={styles.stockRadio}>
              <Check size={10} className={styles.checkIcon} />
            </span>
            <span className={styles.stockLabel}>В наличии</span>
          </label>
          <label className={styles.stockOption}>
            <input type="radio" name="stock" className="sr-only" />
            <span className={styles.stockRadio}>
              <Check size={10} className={styles.checkIcon} />
            </span>
            <span className={styles.stockLabel}>Под заказ</span>
          </label>
          <label className={styles.stockOption}>
            <input type="radio" name="stock" className="sr-only" />
            <span className={styles.stockRadio}>
              <Check size={10} className={styles.checkIcon} />
            </span>
            <span className={styles.stockLabel}>Все</span>
          </label>
        </div>
      </FilterGroup>

      {/* Reset Button */}
      <button className={styles.resetBtn} onClick={onReset}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
        Сбросить фильтры
      </button>
    </aside>
  );
}