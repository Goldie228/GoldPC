'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Search, RotateCcw } from 'lucide-react';
import { catalogApi } from '../../api/catalog';
import type { ProductCategory, Manufacturer, Category, FilterFacetAttribute } from '../../api/types';

// === Prototype JSX Components ===
function DualRangeSlider({
  min, max, step, minVal, maxVal, onMinChange, onMaxChange,
}: {
  min: number; max: number; step: number;
  minVal: number; maxVal: number;
  onMinChange: (v: number) => void;
  onMaxChange: (v: number) => void;
}) {
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const sliderRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<'min' | 'max' | null>(null);

  const updateValue = (clientX: number, thumb: 'min' | 'max') => {
    const el = sliderRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    let val = min + ratio * (max - min);
    val = Math.round(val / step) * step;
    val = Math.max(min, Math.min(max, val));
    if (thumb === 'min') {
      onMinChange(Math.min(val, maxVal));
    } else {
      onMaxChange(Math.max(val, minVal));
    }
  };

  const onDown = (e: React.PointerEvent, thumb: 'min' | 'max') => {
    e.preventDefault();
    dragging.current = thumb;
    updateValue(e.clientX, thumb);
    const onMove = (ev: PointerEvent) => {
      if (dragging.current) updateValue(ev.clientX, dragging.current);
    };
    const onUp = () => {
      dragging.current = null;
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  };

  return (
    <div ref={sliderRef} className="relative h-8 w-full cursor-pointer touch-action-none select-none">
      {/* Background track */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-white/20" />
      {/* Active range */}
      <div
        className="absolute top-1/2 -translate-y-1/2 h-1 rounded-full bg-yellow-400"
        style={{ left: `${pct(minVal)}%`, right: `${100 - pct(maxVal)}%` }}
      />
      {/* Min thumb */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-yellow-400 border-2 border-white shadow-sm hover:brightness-110 cursor-grab active:cursor-grabbing"
        style={{ left: `${pct(minVal)}%` }}
        onPointerDown={(e) => onDown(e, 'min')}
      />
      {/* Max thumb */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-yellow-400 border-2 border-white shadow-sm hover:brightness-110 cursor-grab active:cursor-grabbing"
        style={{ left: `${pct(maxVal)}%` }}
        onPointerDown={(e) => onDown(e, 'max')}
      />
      {/* Invisible inputs for accessibility */}
      <input
        type="range"
        min={min} max={max} step={step}
        value={minVal}
        readOnly
        tabIndex={-1}
        className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
        aria-label="Minimum price"
      />
      <input
        type="range"
        min={min} max={max} step={step}
        value={maxVal}
        readOnly
        tabIndex={-1}
        className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
        aria-label="Maximum price"
      />
    </div>
  );
}

function FilterGroup({ title, defaultOpen = true, children }: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-hairline-dark last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 text-sm font-semibold text-on-dark hover:text-gold transition-colors group"
      >
        {title}
        <span className={`p-0.5 rounded transition-colors ${open ? 'text-muted-text' : 'text-muted-text group-hover:text-gold'}`}>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="pb-4">{children}</div>
      </div>
    </div>
  );
}

function StarRating({ rating, onChange }: { rating: number; onChange: (r: number) => void }) {
  return (
    <div className="space-y-1">
      {[4, 3, 2, 1].map(r => (
        <label key={r} className="flex items-center gap-2.5 cursor-pointer group py-1 px-1.5 -mx-1.5 rounded-md hover:bg-surface-elevated/50 transition-colors">
          <input
            type="radio"
            name="rating"
            checked={rating === r}
            onChange={() => onChange(r)}
            className="filter-radio self-center"
          />
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
              <span key={s} className={`text-sm ${s <= r ? 'text-gold' : 'text-muted-text'}`}>&#9733;</span>
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

// === Main FilterSidebar Component ===
export interface FilterSidebarProps {
  selectedCategory: ProductCategory | null;
  onCategoryChange: (category: ProductCategory | null) => void;
  categoryLocked?: boolean;
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
  restrictedSpecValues?: Record<string, string[]>;
  effectiveSpecifications?: Record<string, string | number | string[]>;
  restrictedManufacturerPlatform?: 'amd' | 'intel';
  totalItems?: number;
}

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

export function FilterSidebar({
  selectedCategory,
  onCategoryChange,
  categoryLocked = false,
  mobile = false,
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
  effectiveSpecifications: _effectiveSpecifications,
  restrictedManufacturerPlatform,
  totalItems = 0,
}: FilterSidebarProps) {
  const [mfrSearch, setMfrSearch] = useState('');
  const [showAllMfrs, setShowAllMfrs] = useState(false);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterFacets, setFilterFacets] = useState<FilterFacetAttribute[]>([]);
  const [loadingFacets, setLoadingFacets] = useState(false);

  // Fetch manufacturers
  useEffect(() => {
    const fetchManufacturers = async () => {
      try {
        const data = await catalogApi.getManufacturers(selectedCategory ?? undefined);
        let filtered = data;
        if (restrictedManufacturerPlatform) {
          filtered = data.filter(m => {
            const name = m.name.toLowerCase();
            return restrictedManufacturerPlatform === 'amd' 
              ? name.includes('amd') || name.includes('амд')
              : name.includes('intel') || name.includes('интел');
          });
        }
        setManufacturers(filtered);
      } catch (err) {
        console.error('Failed to fetch manufacturers:', err);
      }
    };
    fetchManufacturers();
  }, [selectedCategory, restrictedManufacturerPlatform]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await catalogApi.getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch filter facets for specifications
  useEffect(() => {
    if (!selectedCategory) {
      setFilterFacets([]);
      return;
    }
    const fetchFacets = async () => {
      setLoadingFacets(true);
      try {
        const data = await catalogApi.getFilterFacets(selectedCategory, {
          manufacturerIds: selectedManufacturerIds,
          specifications: selectedSpecifications as Record<string, string>,
          specificationRanges: undefined,
          inStock: selectedAvailability.includes('in_stock'),
        });
        setFilterFacets(data);
      } catch (err) {
        console.error('Failed to fetch filter facets:', err);
      } finally {
        setLoadingFacets(false);
      }
    };
    fetchFacets();
  }, [selectedCategory, selectedManufacturerIds, selectedSpecifications, selectedAvailability]);

  // Filter manufacturers by search
  const filteredMfrs = manufacturers.filter(m =>
    m.name.toLowerCase().includes(mfrSearch.toLowerCase())
  );
  const visibleMfrs = showAllMfrs ? filteredMfrs : filteredMfrs.slice(0, 6);

  // Calculate active filter count
  const activeCount = [
    selectedCategory !== null,
    priceRange.min > 0 || priceRange.max > 0,
    selectedManufacturerIds.length > 0,
    minRating > 0,
    selectedAvailability.length !== 1 || selectedAvailability[0] !== 'in_stock',
    Object.keys(selectedSpecifications).length > 0,
  ].filter(Boolean).length;

  // Handlers
  const handleCategoryChange = (cat: ProductCategory | null) => {
    if (!categoryLocked) onCategoryChange(cat);
  };

  const handlePriceMinChange = (v: number) => {
    onPriceChange({ ...priceRange, min: v });
  };

  const handlePriceMaxChange = (v: number) => {
    onPriceChange({ ...priceRange, max: v });
  };

  const handleManufacturerToggle = (id: string) => {
    const current = selectedManufacturerIds;
    onManufacturerIdsChange(
      current.includes(id) ? current.filter(m => m !== id) : [...current, id]
    );
  };

  const handleAvailabilityToggle = (val: string) => {
    const current = selectedAvailability;
    onAvailabilityChange(
      current.includes(val) ? current.filter(v => v !== val) : [...current, val]
    );
  };

  const handleSpecChange = (key: string, value: string | number | string[]) => {
    onSpecificationsChange({ ...selectedSpecifications, [key]: value });
  };

  return (
    <div className={`bg-surface-card rounded-xl ${mobile ? '' : 'sticky top-[64px] max-h-[calc(100vh-80px)] overflow-y-auto mt-2'} ${mobile ? '' : 'lg:rounded-xl'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-hairline-dark sticky top-0 bg-surface-card z-10">
        <div>
          <h2 className="text-[24px] font-semibold text-on-dark flex items-center gap-2">
            Фильтры
            {activeCount > 0 && (
              <span className="h-5 min-w-[20px] px-1 bg-gold text-gold-ink text-[12px] font-bold rounded-full flex items-center justify-center leading-5">
                {activeCount}
              </span>
            )}
          </h2>
          <span className="text-xs text-muted-text mt-0.5 block">{totalItems.toLocaleString('ru-BY')} результатов</span>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-gold text-xs font-medium hover:text-gold-active transition-colors px-2 py-1 rounded-md hover:bg-gold/5"
        >
          <RotateCcw size={11} />
          Сбросить
        </button>
      </div>

      <div className="p-4 pt-4">
        {/* Category */}
        <FilterGroup title="Категория">
          <div className="space-y-1">
            <button
              onClick={() => handleCategoryChange(null)}
              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                selectedCategory === null
                  ? 'text-gold bg-gold/5 font-medium'
                  : 'text-body-text hover:text-gold hover:bg-surface-elevated/50'
              }`}
            >
              Все категории
            </button>
            {(categories || []).map(cat => (
              <button
                key={cat.slug}
                onClick={() => handleCategoryChange(cat.slug as ProductCategory)}
                disabled={categoryLocked && cat.slug !== selectedCategory}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                  selectedCategory === cat.slug
                    ? 'text-gold bg-gold/5 font-medium'
                    : 'text-body-text hover:text-gold hover:bg-surface-elevated/50'
                } ${categoryLocked && cat.slug !== selectedCategory ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {CATEGORY_LABELS[cat.slug as ProductCategory] ?? cat.name}
              </button>
            ))}
          </div>
        </FilterGroup>

        {/* Price */}
        <FilterGroup title="Цена">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-[10px] text-muted-text mb-1.5 block uppercase tracking-wider">От</label>
                <input
                  type="number"
                  value={priceRange.min || ''}
                  onChange={(e) => handlePriceMinChange(Number(e.target.value) || 0)}
                  className="w-full h-9 bg-surface-elevated text-on-dark text-sm font-tabular rounded-lg px-3 border border-hairline-dark focus:outline-none focus:ring-1 focus:ring-gold/30 focus:border-gold/40 transition-all"
                  placeholder="0"
                />
              </div>
              <span className="text-muted-text text-sm mt-5">—</span>
              <div className="flex-1">
                <label className="text-[10px] text-muted-text mb-1.5 block uppercase tracking-wider">До</label>
                <input
                  type="number"
                  value={priceRange.max || ''}
                  onChange={(e) => handlePriceMaxChange(Number(e.target.value) || 0)}
                  className="w-full h-9 bg-surface-elevated text-on-dark text-sm font-tabular rounded-lg px-3 border border-hairline-dark focus:outline-none focus:ring-1 focus:ring-gold/30 focus:border-gold/40 transition-all"
                  placeholder="10 000"
                />
              </div>
            </div>
            <DualRangeSlider
              min={0}
              max={10000}
              step={100}
              minVal={priceRange.min}
              maxVal={priceRange.max}
              onMinChange={handlePriceMinChange}
              onMaxChange={handlePriceMaxChange}
            />
            <div className="flex justify-between text-[10px] text-muted-text font-tabular">
              <span>0 BYN</span>
              <span>10 000 BYN</span>
            </div>
          </div>
        </FilterGroup>

        {/* Manufacturers */}
        <FilterGroup title="Производители">
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Поиск брендов..."
                value={mfrSearch}
                onChange={(e) => setMfrSearch(e.target.value)}
                className="w-full h-9 bg-surface-elevated text-on-dark text-sm rounded-lg pl-8 pr-3 border border-hairline-dark placeholder:text-muted-text focus:outline-none focus:ring-1 focus:ring-gold/30 focus:border-gold/40 transition-all"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-text" size={13} />
            </div>
            <div className="space-y-0.5 max-h-[200px] overflow-y-auto overflow-x-hidden pr-1">
              {(visibleMfrs || []).map(mfr => (
                <label key={mfr.id} className="flex items-center gap-2.5 cursor-pointer group py-1.5 px-2 -mx-2 rounded-md hover:bg-surface-elevated/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedManufacturerIds.includes(mfr.id)}
                    onChange={() => handleManufacturerToggle(mfr.id)}
                    className="filter-checkbox"
                  />
                  <span className="text-sm text-body-text group-hover:text-on-dark transition-colors">{mfr.name}</span>
                </label>
              ))}
            </div>
            {!showAllMfrs && filteredMfrs.length > 6 && (
              <button
                onClick={() => setShowAllMfrs(true)}
                className="text-gold text-xs font-medium hover:text-gold-active transition-colors"
              >
                Ещё {filteredMfrs.length - 6} брендов
              </button>
            )}
          </div>
        </FilterGroup>

        {/* Rating */}
        <FilterGroup title="Рейтинг" defaultOpen={false}>
          <StarRating
            rating={minRating}
            onChange={onRatingChange}
          />
        </FilterGroup>

        {/* Availability */}
        <FilterGroup title="Наличие" defaultOpen={false}>
          <div className="space-y-0.5">
            {[
              { value: 'all', label: 'Все товары' },
              { value: 'in_stock', label: 'Только в наличии' },
            ].map(opt => (
              <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group py-1.5 px-2 -mx-2 rounded-md hover:bg-surface-elevated/50 transition-colors">
                <input
                  type="radio"
                  name="availability"
                  checked={selectedAvailability.length === 0 && opt.value === 'all' || selectedAvailability.includes(opt.value)}
                  onChange={() => {
                    if (opt.value === 'all') {
                      onAvailabilityChange([]);
                    } else {
                      handleAvailabilityToggle(opt.value);
                    }
                  }}
                  className="filter-radio self-center"
                />
                <span className="text-sm text-body-text group-hover:text-on-dark transition-colors">
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </FilterGroup>

        {/* Specifications (Facets) */}
        {filterFacets.length > 0 && (
          <FilterGroup title="Характеристики" defaultOpen={false}>
            {loadingFacets ? (
              <div className="text-sm text-muted-text">Загрузка...</div>
            ) : (
              <div className="space-y-4">
                {(filterFacets || []).map(facet => {
                  const restricted = restrictedSpecValues?.[facet.key];
                  const options = restricted 
                    ? (facet.values || []).filter(v => restricted.includes(v.value))
                    : (facet.values || []);
                  
                  return (
                    <div key={facet.key} className="space-y-1">
                      <h4 className="text-xs font-semibold text-muted-text uppercase tracking-wider">{facet.name}</h4>
                      <div className="space-y-0.5">
                        {(options || []).map(opt => {
                          const isSelected = (() => {
                            const val = selectedSpecifications[facet.key];
                            if (Array.isArray(val)) return val.includes(opt.value);
                            return val === opt.value;
                          })();
                          
                          return (
                            <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group py-1 px-2 -mx-2 rounded-md hover:bg-surface-elevated/50 transition-colors">
                              <input
                                type={facet.multiSelect ? 'checkbox' : 'radio'}
                                name={facet.key}
                                checked={isSelected}
                                onChange={() => {
                                  if (facet.multiSelect) {
                                    const current = (selectedSpecifications[facet.key] as string[]) || [];
                                    const next = isSelected 
                                      ? current.filter(v => v !== opt.value)
                                      : [...current, opt.value];
                                    handleSpecChange(facet.key, next);
                                  } else {
                                    handleSpecChange(facet.key, opt.value);
                                  }
                                }}
                                className={facet.multiSelect ? "sr-only" : "sr-only"}
                              />
                              <span className="text-sm text-body-text group-hover:text-on-dark transition-colors">
                                {opt.value} {opt.count !== undefined && <span className="text-muted-text text-xs">({opt.count})</span>}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                
                {Object.keys(selectedSpecifications).length > 0 && (
                  <button
                    onClick={() => onSpecificationsChange({})}
                    className="text-[11px] text-gold hover:text-gold-active transition-colors"
                  >
                    Сбросить характеристики
                  </button>
                )}
              </div>
            )}
          </FilterGroup>
        )}
      </div>
    </div>
  );
}
