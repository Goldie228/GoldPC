import { X, RotateCcw } from 'lucide-react';
import type { ReactElement } from 'react';
import { specLabel, formatSpecValueForKey } from '../../utils/specifications';
import styles from './ActiveFiltersBar.module.css';

type Chip = {
  id: string;
  label: string;
  onRemove?: () => void;
};

function ChipView({ chip }: { chip: Chip }): ReactElement {
  return (
    <span className={styles.chip} title={chip.label}>
      <span className={styles.chipText}>{chip.label}</span>
      {chip.onRemove && (
        <button type="button" className={styles.chipBtn} onClick={chip.onRemove} aria-label="Удалить фильтр">
          <X size={12} />
        </button>
      )}
    </span>
  );
}

export function ActiveFiltersBar(props: {
  chips: Chip[];
  activeCount: number;
  onClearAll: () => void;
}): ReactElement | null {
  if (props.chips.length === 0) return null;

  return (
    <div className={styles.bar} aria-label="Активные фильтры">
      <div className={styles.left}>
        {props.chips.map((c) => (
          <ChipView key={c.id} chip={c} />
        ))}
      </div>
      <div className={styles.right}>
        <button type="button" className={styles.clearBtn} onClick={props.onClearAll}>
          <RotateCcw size={16} />
          <span>Сбросить ({props.activeCount})</span>
        </button>
      </div>
    </div>
  );
}

export function buildCatalogFilterChips(args: {
  isCategoryLocked: boolean;
  selectedCategory: string | null;
  searchQuery: string;
  priceRange: { min: number; max: number };
  selectedManufacturerIds: string[];
  manufacturersById: Map<string, string>;
  minRating: number;
  selectedAvailability: string[];
  selectedSpecifications: Record<string, string | number | string[]>;
  onClearSearch: () => void;
  onClearPrice: () => void;
  onClearManufacturers: () => void;
  onClearRating: () => void;
  onClearAvailability: () => void;
  onClearSpecKey: (key: string) => void;
  onClearCategory: () => void;
}): Chip[] {
  const chips: Chip[] = [];

  if (args.selectedCategory && !args.isCategoryLocked) {
    chips.push({
      id: 'category',
      label: `Категория: ${args.selectedCategory}`,
      onRemove: args.onClearCategory,
    });
  }

  if (args.searchQuery.trim()) {
    chips.push({ id: 'search', label: `Поиск: ${args.searchQuery.trim()}`, onRemove: args.onClearSearch });
  }

  if (args.priceRange.min > 0 || args.priceRange.max > 0) {
    const min = args.priceRange.min > 0 ? args.priceRange.min : '…';
    const max = args.priceRange.max > 0 ? args.priceRange.max : '…';
    chips.push({ id: 'price', label: `Цена: ${min}–${max} BYN`, onRemove: args.onClearPrice });
  }

  if (args.selectedManufacturerIds.length > 0) {
    const names = args.selectedManufacturerIds
      .map((id) => args.manufacturersById.get(id) ?? id)
      .slice(0, 3);
    const rest = args.selectedManufacturerIds.length - names.length;
    chips.push({
      id: 'mfr',
      label: `Бренды: ${names.join(', ')}${rest > 0 ? ` +${rest}` : ''}`,
      onRemove: args.onClearManufacturers,
    });
  }

  if (args.minRating > 0) {
    chips.push({ id: 'rating', label: `Рейтинг: ${args.minRating}★+`, onRemove: args.onClearRating });
  }

  const hasNonDefaultAvailability =
    args.selectedAvailability.length !== 1 || args.selectedAvailability[0] !== 'in_stock';
  if (hasNonDefaultAvailability) {
    const label = args.selectedAvailability.includes('in_stock') && args.selectedAvailability.includes('on_order')
      ? 'Наличие: всё'
      : args.selectedAvailability.includes('on_order')
        ? 'Наличие: под заказ'
        : 'Наличие: в наличии';
    chips.push({ id: 'availability', label, onRemove: args.onClearAvailability });
  }

  for (const [k, v] of Object.entries(args.selectedSpecifications)) {
    let value: string;

    if (Array.isArray(v)) {
      value = v.map((item) => formatSpecValueForKey(k, item)).join(', ');
    } else if (typeof v === 'string' && v.includes(',')) {
      const [a, b] = v.split(',').map((x) => x.trim());
      if (a && b && !Number.isNaN(parseFloat(a)) && !Number.isNaN(parseFloat(b))) {
        value = `${a}–${b}`;
      } else {
        value = formatSpecValueForKey(k, v);
      }
    } else {
      value = formatSpecValueForKey(k, v);
    }

    chips.push({
      id: `spec-${k}`,
      label: `${specLabel(k)}: ${value}`,
      onRemove: () => args.onClearSpecKey(k),
    });
  }

  return chips;
}

