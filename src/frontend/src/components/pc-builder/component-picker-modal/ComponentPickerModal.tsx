/**
 * ComponentPickerModal — каталог-стиль: FilterSidebar + карточки + превью
 * Без корзины/избранного/сравнения/прогресс-бара/текущего товара.
 */

import { useState, useEffect, useMemo, useCallback, useTransition, useRef } from 'react';
import useDeepCompareEffect from 'use-deep-compare-effect';
import { useDebouncedCallback } from 'use-debounce';
import { Search, SlidersHorizontal, X, ExternalLink, ZoomIn, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { Modal, BottomSheet } from '@/components/ui';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { Pagination } from '@/components/catalog/Pagination';
import { FilterSidebar } from '@/components/filter-sidebar/FilterSidebar';
import { getProductImageUrl, hasValidProductImage } from '@/utils/image';
import { specLabel, formatSpecValueForKey, splitSpecsAndRanges } from '@/utils/specifications';
import { extractSocket, extractFormFactor, extractTDP, extractMemoryFormFactor, extractMemoryType, extractMemoryTypeWithFallback, extractStorageType, extractM2Slots, extractSataPorts } from '@/shared/utils/compatibility/extractors';
import { checkRAM, checkCooler, detectMemoryFormFactorFromName, resolveSocket } from '@/shared/utils/compatibility/checks';
import { useQuery } from '@tanstack/react-query';
import { useProducts } from '@/hooks/useProducts';
import { catalogApi } from '@/api/catalog';
import type { Product, ProductCategory, ProductImage, ProductSummary, ProductSpecifications, PaginationMeta } from '@/api/types';
import type { PCComponentType } from '@/hooks';
import type { PCBuilderSelectedState } from '@/hooks/usePCBuilder';

const noopSelect = (_product: ProductSummary) => {};

const LOCK_ICON_STYLE = { display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' as const } satisfies React.CSSProperties;

// ─────────────────────────────────────────────────────────

export interface ComponentPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: ProductCategory;
  slotType: PCComponentType;
  slotLabel: string;
  currentProduct?: Product | null;
  buildContext?: PCBuilderSelectedState;
  onConfirm: (product: Product) => void;
  getDisplaySpecs: (type: PCComponentType, product: Product) => string[];
  /** Фильтр по подстроке в названии (например, "вентилятор для корпуса") */
  nameFilter?: string;
  /** Значение спецификации 'type' для фильтрации (например, 'CPU Кулер', 'Жидкостное охлаждение'). Если массив — ИЛИ. */
  typeFilter?: string | string[];
  /** Платформа для фильтра производителей: 'amd' или 'intel' */
  restrictedManufacturerPlatform?: 'amd' | 'intel';
  /** Количество выбранных компонентов (для multi-slot) */
  selectedCount?: number;
  /** Общее количество найденных товаров */
  totalCount?: number;
}

const SORT_PRESETS = [
  { value: 'popular', label: 'По популярности' },
  { value: 'price-asc', label: 'Сначала дешевле' },
  { value: 'price-desc', label: 'Сначала дороже' },
  { value: 'name', label: 'По названию' },
  { value: 'rating', label: 'По рейтингу' },
  { value: 'newest', label: 'Новые' },
] as const;

function parseSort(p: string) {
  switch (p) {
    case 'price-asc': return { sortBy: 'price' as const, sortOrder: 'asc' as const };
    case 'price-desc': return { sortBy: 'price' as const, sortOrder: 'desc' as const };
    case 'rating': return { sortBy: 'rating' as const, sortOrder: 'desc' as const };
    case 'newest': return { sortBy: 'createdAt' as const, sortOrder: 'desc' as const };
    case 'name': return { sortBy: 'name' as const, sortOrder: 'asc' as const };
    default: return { sortBy: 'price' as const, sortOrder: 'asc' as const };
  }
}

/**
 * Безопасное преобразование ProductSummary в Product с заполнением
 * спецификаций из новых полей совместимости, доступных в ProductSummary.
 * Убирает хак с `specifications: {}`, который вызывал баги.
 */
function enrichSummaryToProduct(s: ProductSummary): Product {
  const specs: ProductSpecifications = {};
  if (s.socket) specs.socket = s.socket;
  if (s.memoryType) specs.memoryType = s.memoryType;
  if (s.memoryFormFactor) specs.memoryFormFactor = s.memoryFormFactor;
  if (s.tdp != null) specs.tdp = s.tdp;
  if (s.wattage != null) specs.wattage = s.wattage;
  // Если входной объект — полноценный Product со спецификациями, копируем их
  const fullProduct = s as Product;
  if (fullProduct.specifications) {
    const fullMemType = extractMemoryType(fullProduct.specifications);
    if (fullMemType) specs.memoryType = fullMemType;
  }
  // Пытаемся определить тип по названию как запасной вариант для checkRAM
  const nameUpper = s.name.toUpperCase();
  if (nameUpper.includes('DDR5')) specs.type = 'DDR5';
  else if (nameUpper.includes('DDR4') || nameUpper.includes('LPDDR4')) specs.type = 'DDR4';
  else if (nameUpper.includes('DDR3') || nameUpper.includes('DDR3L')) specs.type = 'DDR3';
  // Запасной вариант для материнских плат: определяем DDR по сокету/чипсету
  else if (s.category?.toLowerCase().includes('материнск')) {
    const specs2 = fullProduct.specifications ?? {} as ProductSpecifications;
    const socket = s.socket || (typeof specs2.socket === 'string' ? specs2.socket : '') || '';
    const chipset = typeof specs2.chipset === 'string' ? specs2.chipset : '';
    const both = (socket + ' ' + chipset + ' ' + s.name).toUpperCase();
    // AM5 → DDR5, LGA 1851 → DDR5
    if (both.includes('AM5') || both.includes('LGA1851') || both.includes('1851')) specs.type = 'DDR5';
    // HM55/HM65/HM75/HM85 → DDR3
    else if (/\bHM[5678]\d/.test(both)) specs.type = 'DDR3';
    // Всё остальное (AM4, LGA1151, LGA1200, LGA1700 и т.д.) → DDR4
    else specs.type = 'DDR4';
  }
  return { ...s, specifications: specs } as Product;
}

// ─── CardImageGallery: изображение с навигацией + зоны наведения + бейджи ────────

function CardImageGallery({ product, hasDiscount, discountPercent, outOfStock }: {
  product: ProductSummary;
  hasDiscount: boolean;
  discountPercent: number;
  outOfStock: boolean;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const allImages = useMemo<ProductImage[]>(() => {
    const imgs = product.images ?? [];
    if (product.mainImage && !imgs.some((i: ProductImage) => i.id === product.mainImage?.id)) {
      return [product.mainImage, ...imgs];
    }
    return imgs;
  }, [product]);

  const validImages = allImages.filter((i) => hasValidProductImage(i.url));
  const current = validImages[currentIdx];
  const url = current && hasValidProductImage(current.url) ? getProductImageUrl(current.url) : null;

  const goPrev = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setCurrentIdx((p) => (p <= 0 ? validImages.length - 1 : p - 1)); };
  const goNext = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setCurrentIdx((p) => (p >= validImages.length - 1 ? 0 : p + 1)); };

  const hasMultiple = validImages.length > 1;

  return (
    <div className="relative w-full h-[200px] bg-white flex items-center justify-center overflow-hidden" onMouseLeave={() => setCurrentIdx(0)}>
      <div className="w-full h-full flex items-center justify-center p-2.5 box-border">
        {url
          ? <img src={url} alt={product.name} loading="lazy" className="max-w-full max-h-full w-auto h-auto object-contain" width={200} height={200} />
          : <div className="w-[30%] aspect-square rounded-full bg-surface-elevated opacity-50" />
        }
      </div>

      {/* Навигационные стрелки */}
      {hasMultiple && (
        <>
          <button type="button" className="absolute top-1/2 -translate-y-1/2 w-7 h-7 p-0 rounded-md border border-black/10 bg-white/85 text-black flex items-center justify-center cursor-pointer opacity-0 transition-opacity z-2 left-1" onClick={goPrev} aria-label="Предыдущее">
            <ChevronLeft size={18} />
          </button>
          <button type="button" className="absolute top-1/2 -translate-y-1/2 w-7 h-7 p-0 rounded-md border border-black/10 bg-white/85 text-black flex items-center justify-center cursor-pointer opacity-0 transition-opacity z-2 right-1" onClick={goNext} aria-label="Следующее">
            <ChevronRight size={18} />
          </button>
          {/* Индикаторы изображений */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 z-2">
            {validImages.map((_, i) => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full bg-[rgba(0,0,0,0.2)] transition-all ${i === currentIdx ? "bg-[rgba(0,0,0,0.5)] w-3.5 rounded-[3px]" : ""}`} />
            ))}
          </div>
          {/* Зоны наведения */}
          <div className="absolute inset-0 flex z-1 pointer-events-auto">
            {validImages.map((_, i) => (
              <div key={i} className="flex-1 cursor-pointer" onMouseEnter={() => setCurrentIdx(i)} />
            ))}
          </div>
        </>
      )}

      {hasDiscount && <span className="absolute top-2 left-2 px-2 py-0.5 text-[0.64rem] font-semibold bg-price-rise text-white rounded-md z-3">-{discountPercent}%</span>}
      {outOfStock && <span className="absolute top-2 right-2 px-2 py-0.5 text-[0.64rem] font-medium bg-black/60 text-white rounded-md z-3">Нет в наличии</span>}
    </div>
  );
}

// ─── PickerProductCard (карточка товара в модалке) ──────────────────────────────────

interface PickerProductCardProps {
  product: ProductSummary;
  isSelected: boolean;
  isCompatible?: boolean;
  onSelect: (product: ProductSummary) => void;
  onOpenProduct: (slug: string) => void;
  slotType: PCComponentType;
  getDisplaySpecs: (type: PCComponentType, product: Product) => string[];
}

function PickerProductCard({ product, isSelected, isCompatible, onSelect, onOpenProduct, slotType, getDisplaySpecs }: PickerProductCardProps) {
  const specs = getDisplaySpecs(slotType, enrichSummaryToProduct(product)).slice(0, 3);
   const hasDiscount = product.oldPrice !== undefined && product.oldPrice !== null && product.oldPrice > product.price;
   const discountPercent = hasDiscount ? Math.round((1 - product.price / product.oldPrice!) * 100) : 0;
  const outOfStock = product.stock === 0 || !product.isActive;

  return (
    <div
      className={`flex flex-col items-stretch gap-0 border border-white/5 rounded-lg bg-surface-card cursor-pointer text-left text-inherit font-inherit overflow-hidden transition-all hover:border-gold/25 hover:-translate-y-[1px] ${isSelected ? "border-gold bg-gold/5" : ""} ${outOfStock ? "opacity-60" : ""} ${isCompatible === false ? "opacity-45 pointer-events-none relative" : ""}`}
      onClick={isCompatible === false ? undefined : () => onSelect(product)}
    >
      <CardImageGallery product={product} hasDiscount={hasDiscount} discountPercent={discountPercent} outOfStock={outOfStock} />

      <div className="p-2.5 flex flex-col gap-1 flex-1">
        <h4 className="m-0">
          <button type="button" className="inline text-[0.74rem] font-medium text-body-text leading-[1.3] m-0 p-0 bg-none border-none text-left cursor-pointer display-[-webkit-box] -webkit-line-clamp-2 -webkit-box-orient-vertical overflow-hidden hover:text-gold" onClick={isCompatible === false ? undefined : () => onSelect(product)} title={product.name}>
            {product.name}
          </button>
        </h4>
         {product.slug && (
           <button type="button" className="inline-flex items-center gap-[3px] p-0 m-0 bg-none border-none text-[0.64rem] text-muted-foreground cursor-pointer transition-colors hover:text-gold" onClick={() => onOpenProduct(product.slug!)} title="Открыть страницу товара">
             <ExternalLink size={10} /> Подробнее
           </button>
         )}
         {specs.length > 0 && <ul className="m-0 p-0 list-none flex flex-col gap-[4px]">{specs.map((s, i) => <li key={i} className="text-muted-foreground text-[0.68rem] flex items-start gap-1.5"><span className="text-gold mt-[1px]">•</span>{s}</li>)}</ul>}
        <div className="flex items-center justify-between gap-2 mt-auto">
          <div className="flex flex-col gap-0.5">
            <span className="text-[0.85rem] font-semibold text-gold whitespace-nowrap">{product.price.toLocaleString('ru-BY')} BYN</span>
            {hasDiscount && product.oldPrice !== undefined && (
              <span className="text-[0.64rem] text-muted-foreground line-through">{product.oldPrice.toLocaleString('ru-BY')}</span>
            )}
          </div>
          <button type="button" className={`px-3 py-1 text-[0.68rem] font-semibold rounded-md border border-gold bg-transparent text-gold cursor-pointer whitespace-nowrap transition-all ${isSelected ? "text-black font-bold shadow-sm" : ""}`} style={isSelected ? { backgroundColor: 'var(--accent)' } : undefined} onClick={isCompatible === false ? undefined : () => onSelect(product)}>
            {isSelected ? 'Выбрано' : outOfStock ? 'Нет в наличии' : 'Выбрать'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PickerProductCardCompact (компактная карточка) ───────────────────────────

function PickerProductCardCompact({ product, isSelected, isCompatible, onSelect, onOpenProduct, slotType, getDisplaySpecs }: PickerProductCardProps) {
  const url = product.mainImage?.url && hasValidProductImage(product.mainImage.url)
    ? getProductImageUrl(product.mainImage.url) : null;
  const specs = getDisplaySpecs(slotType, enrichSummaryToProduct(product)).slice(0, 2);
  const hasDiscount = product.oldPrice !== undefined && product.oldPrice > product.price;
  const outOfStock = product.stock === 0 || !product.isActive;

  return (
    <div
      className={`flex items-center gap-3 p-2 border border-white/5 rounded-md bg-surface-card text-inherit font-inherit transition-all hover:border-gold/25 ${isSelected ? "border-gold bg-gold/5" : ""} ${isCompatible === false ? "opacity-45 pointer-events-none relative" : ""}`}
      onClick={isCompatible === false ? undefined : () => onSelect(product)}
    >
      <div className="w-14 h-14 rounded-md bg-white p-1.5 flex items-center justify-center flex-shrink-0 box-border">
        {url ? <img src={url} alt="" className="w-full h-full object-contain" width={56} height={56} loading="lazy" /> : <div className="w-1/2 aspect-square rounded-full bg-zinc-200 opacity-50" />}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="m-0 whitespace-nowrap overflow-hidden text-ellipsis">
          <button type="button" className="inline text-[0.74rem] font-medium text-body-text leading-[1.3] m-0 p-0 bg-none border-none text-left cursor-pointer display-[-webkit-box] -webkit-line-clamp-2 -webkit-box-orient-vertical overflow-hidden hover:text-gold" onClick={isCompatible === false ? undefined : () => onSelect(product)} title={product.name}>
            {product.name}
          </button>
        </h4>
         {product.slug && (
           <button type="button" className="inline-flex items-center gap-[3px] p-0 m-0 bg-none border-none text-[0.64rem] text-muted-foreground cursor-pointer transition-colors hover:text-gold" onClick={() => onOpenProduct(product.slug!)} title="Открыть страницу товара">
             <ExternalLink size={10} /> Подробнее
           </button>
         )}
        {specs.length > 0 && <span className="text-[0.65rem] text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">{specs.join(' · ')}</span>}
      </div>
      <div className="flex flex-col items-flex-end gap-1.5 flex-shrink-0">
        <div className="flex flex-col items-flex-end">
          <span className="text-[0.82rem] font-semibold text-gold whitespace-nowrap">{product.price.toLocaleString('ru-BY')} BYN</span>
          {hasDiscount && product.oldPrice !== undefined && (
            <span className="text-[0.62rem] text-muted-foreground line-through">{product.oldPrice.toLocaleString('ru-BY')}</span>
          )}
        </div>
          <button type="button" className={`px-3 py-1 text-[0.68rem] font-semibold rounded-md border border-gold bg-transparent text-gold cursor-pointer whitespace-nowrap transition-all ${isSelected ? "text-black font-bold shadow-sm" : ""}`} style={isSelected ? { backgroundColor: 'var(--accent)' } : undefined} onClick={isCompatible === false ? undefined : () => onSelect(product)}>
          {isSelected ? 'Выбрано' : outOfStock ? 'Нет в наличии' : 'Выбрать'}
        </button>
        {outOfStock && <span className="text-[0.62rem] text-price-rise">Нет в наличии</span>}
      </div>
    </div>
  );
}

// ─── Модальное окно увеличения изображения (использует наш Modal) ────────────

function ImageMagnifier({ images, initIdx, onClose }: { images: string[]; initIdx: number; onClose: () => void }) {
  const [idx, setIdx] = useState(initIdx);
  const cur = images[Math.min(idx, images.length - 1)] ?? images[0] ?? '';

  useEffect(() => { setIdx(initIdx); }, [initIdx]);

  return (
    <Modal isOpen onClose={onClose} title="Изображение товара" size="large" showCloseButton>
      <div className="flex flex-col items-center gap-4 py-4 pb-6">
        <img src={cur} alt="Изображение товара" className="max-w-[90%] max-h-[75vh] w-auto h-auto object-contain bg-white rounded-2xl p-6 box-border shadow-[0_4px_24px_var(--border-muted)]" width={800} height={600} loading="eager" />
        {images.length > 1 && (
          <div className="flex items-center gap-4">
            <button type="button" className="w-10 h-10 rounded-full border border-white/10 bg-black/60 text-body-text flex items-center justify-center cursor-pointer transition-all hover:bg-black/85 hover:border-gold"
              onClick={() => setIdx((i) => (i <= 0 ? images.length - 1 : i - 1))}
              aria-label="Предыдущее фото">
              <ChevronLeft size={28} />
            </button>
            <div className="flex gap-1.5">
              {images.map((_, i) => (
                <span key={i} className={`w-2 h-2 rounded-full bg-[rgba(255,255,255,0.15)] cursor-pointer transition-all ${i === idx ? "bg-gold w-5 rounded-[4px]" : ""}`}
                  onClick={() => setIdx(i)} />
              ))}
            </div>
            <button type="button" className="w-10 h-10 rounded-full border border-white/10 bg-black/60 text-body-text flex items-center justify-center cursor-pointer transition-all hover:bg-black/85 hover:border-gold"
              onClick={() => setIdx((i) => (i >= images.length - 1 ? 0 : i + 1))}
              aria-label="Следующее фото">
              <ChevronRight size={28} />
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── SpecList (список характеристик) ───────────────────────────────────────────

function SpecList({ specs }: { specs: Record<string, unknown> }) {
  const entries = useMemo(() => {
    return Object.entries(specs)
      .filter(([, v]) => v != null && v !== '' && v !== false)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 12)
      .map(([k, v]) => ({ label: specLabel(k), value: formatSpecValueForKey(k, v as string | number | boolean) }));
  }, [specs]);

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-0">
      {entries.map((row) => (
        <div key={row.label} className="flex flex-wrap gap-1 items-center py-2 px-1.5 text-[0.78rem] rounded-sm even:bg-[rgba(255,255,255,0.02)]">
          <span className="text-muted-foreground font-medium flex-1 flex-basis-[40%]">{row.label}</span>
          <span className="text-body-text flex-1 flex-basis-[60%] text-right word-break-break-word">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── ComponentPickerModal (основной компонент) ───────────────────────────────

export function ComponentPickerModal({
  isOpen, onClose, category, slotType, slotLabel,
  currentProduct, buildContext, onConfirm, getDisplaySpecs, nameFilter, typeFilter, restrictedManufacturerPlatform,
}: ComponentPickerModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>(category);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortPreset, setSortPreset] = useState('popular');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [magnifierIdx, setMagnifierIdx] = useState<number | null>(null);
  const [previewImgIdx, setPreviewImgIdx] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 0 });
  const [selectedManufacturerIds, setSelectedManufacturerIds] = useState<string[]>([]);
  const [selectedSpecifications, setSelectedSpecifications] = useState<Record<string, string | number | string[]>>({});
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);

  const { sortBy, sortOrder } = useMemo(() => parseSort(sortPreset), [sortPreset]);

  const priceMin = priceRange.min > 0 ? priceRange.min : undefined;
  const priceMax = priceRange.max > 0 ? priceRange.max : undefined;

  const effectiveSpecs = useMemo(() => {
    const out = { ...selectedSpecifications };
    // typeFilter — фильтрация по спецификации 'type' (например, cooling vs fan)
    if (typeFilter) {
      out.type = Array.isArray(typeFilter) ? typeFilter : [typeFilter];
    }
    if (slotType === 'cpu' && buildContext?.motherboard?.product) {
      const s = resolveSocket(buildContext.motherboard.product);
      if (s) out.socket = s;
    }
    if (slotType === 'motherboard' && buildContext?.cpu?.product) {
      const s = resolveSocket(buildContext.cpu.product);
      if (s) out.socket = s;
    }
    if (slotType === 'ram' && buildContext?.motherboard?.product) {
      // Фильтруем по типу памяти на сервере, чтобы пагинация была корректной
      const mt = extractMemoryTypeWithFallback(buildContext.motherboard.product, buildContext.motherboard.product.specifications);
      if (mt) out.type = mt;
    }
    // Выбор БП: устанавливаем минимальную мощность на основе GPU+CPU
    if (slotType === 'psu' && (buildContext?.gpu?.product || buildContext?.cpu?.product)) {
      const gpuW = buildContext.gpu?.product ? extractTDP(buildContext.gpu.product.specifications) : 0;
      const cpuW = buildContext.cpu?.product ? extractTDP(buildContext.cpu.product.specifications) : 0;
      const minWatt = gpuW + cpuW + 50;
      if (minWatt > 0) {
        // Используем специальный маркер, который FilterSidebar подхватит для установки минимума диапазона
        out['wattage_min'] = minWatt;
      }
    }
    // Выбор корпуса: ограничиваем форм-факторы, подходящие для выбранной материнской платы
    if (slotType === 'case' && buildContext?.motherboard?.product) {
      const mbFF = extractFormFactor(buildContext.motherboard.product.specifications);
      if (mbFF) {
        // Простое сопоставление форм-факторов корпуса
        const caseFFs = [mbFF];
        out.formFactor = caseFFs;
      }
    }
    return out;
  // ✅ Исправлен баг сброса слайдера: глубокое сравнение зависимостей чтобы не создавать новый объект при каждом рендере
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(selectedSpecifications), slotType, buildContext]);

  // 🔹 Единый объединённый объект фильтров — ВСЕ зависимости ЗДЕСЬ
  const { specifications: splitSpecs, specificationRanges: splitRanges } = useMemo(
    () => splitSpecsAndRanges(effectiveSpecs),
    [effectiveSpecs],
  );

  const filters = useMemo(() => ({
    category: selectedCategory,
    search: debouncedSearch,
    sortBy,
    sortOrder,
    inStockOnly,
    specifications: Object.keys(splitSpecs).length > 0 ? splitSpecs : undefined,
    specificationRanges: Object.keys(splitRanges).length > 0 ? splitRanges : undefined,
    manufacturerIds: selectedManufacturerIds.length > 0 ? selectedManufacturerIds : undefined,
    page,
    priceMin,
    priceMax,
  }), [
    selectedCategory,
    debouncedSearch,
    sortBy,
    sortOrder,
    inStockOnly,
    splitSpecs,
    splitRanges,
    selectedManufacturerIds,
    page,
    priceMin,
    priceMax
  ]);

  // ── Ограниченные значения спецификаций из контекста сборки ──
  const restrictedSpecValues = useMemo((): Record<string, string[]> => {
    return {};
  }, [slotType, buildContext]);

  // 🔹 Дебаунс-функция загрузки — задержка 300мс для пользовательского ввода
  const fetchProducts = useDebouncedCallback(() => {
    startTransition(() => {
      void refetch({ cancelRefetch: true });
    });
  }, 300);

  const { data: productsResponse, isLoading, error, refetch } = useProducts(filters, { enabled: false });

  // 🔹 Единый эффект с ГЛУБОКИМ сравнением — РОВНО ОДИН запрос при изменении фильтров
  useDeepCompareEffect(() => {
    if (!isOpen) return;
    fetchProducts();
  }, [filters, isOpen, fetchProducts]);

  // 🔹 Сохраняем старые товары во время загрузки, чтобы избежать смещения верстки
  const [cachedProducts, setCachedProducts] = useState<ProductSummary[]>([]);
  const [cachedMeta, setCachedMeta] = useState<PaginationMeta | null>(null);

  useEffect(() => {
    if (productsResponse?.data) {
      setCachedProducts(productsResponse.data);
      setCachedMeta(productsResponse.meta);
    }
  }, [productsResponse?.data, productsResponse?.meta]);

  const products = isPending ? cachedProducts : (productsResponse?.data ?? cachedProducts);
  const meta = isPending ? cachedMeta : (productsResponse?.meta ?? cachedMeta);

  // ── Фильтрация по совместимости ──

  const componentMap = useMemo(() => {
    const b = buildContext ?? { ram: [], storage: [], fan: [] };
    return {
      cpu: b.cpu?.product ?? null,
      gpu: b.gpu?.product ?? null,
      motherboard: b.motherboard?.product ?? null,
      ram: b.ram[0]?.product ?? null,
      psu: b.psu?.product ?? null,
      case: b.case?.product ?? null,
      cooling: b.cooling?.product ?? null,
    };
  }, [buildContext]);

  // ── Фоновое обогащение: пакетная загрузка полных спецификаций для ОЗУ ──
  // ProductSummary не имеет поля `specifications`, поэтому extractMemoryFormFactor возвращает null.
  // Когда материнская плата выбрана, загружаем полные данные Product (со спецификациями)
  // для всех видимых товаров ОЗУ, чтобы точно определить SO-DIMM.
  const ramProductIdsKey = useMemo(() => {
    if (slotType !== 'ram' || products.length === 0) return '';
    return products.map(p => p.id).sort().join(',');
  }, [slotType, products]);

  const fullRamSpecsQuery = useQuery({
    queryKey: ['full-ram-specs', ramProductIdsKey],
    queryFn: async () => {
      const ids = ramProductIdsKey.split(',').filter(Boolean);
      const map = new Map<string, Product>();
      // Низкая параллельность, чтобы не перегружать сервер
      const CONCURRENCY = 2;
      for (let i = 0; i < ids.length; i += CONCURRENCY) {
        const batch = ids.slice(i, i + CONCURRENCY);
        const results = await Promise.allSettled(
          batch.map(id => catalogApi.getProduct(id))
        );
        for (const r of results) {
          if (r.status === 'fulfilled' && r.value) {
            map.set(r.value.id, r.value);
          }
        }
      }
      return map;
    },
    enabled: isOpen && slotType === 'ram' && !!componentMap.motherboard && ramProductIdsKey.length > 0,
    staleTime: 5_000,
    gcTime: 30_000,
  });

  // Проверка совместимости — проверяем тип памяти (DDR3/4/5) когда спецификации доступны
  const productsWithCompatibility = useMemo(() => {
    const mb = componentMap.motherboard;
    const cpu = componentMap.cpu;
    const isRam = slotType === 'ram';
    const isStorage = slotType === 'storage';
    const isCooler = slotType === 'cooling';


    // Предварительный подсчёт текущих накопителей по типу (актуально только при выбранной материнской плате)
    const currentM2 = isStorage && mb && buildContext
      ? buildContext.storage.filter(s => extractStorageType(s.product.specifications) === 'm2').length
      : 0;
    const currentSata = isStorage && mb && buildContext
      ? buildContext.storage.filter(s => extractStorageType(s.product.specifications) === 'sata').length
      : 0;
    const mbM2Slots = isStorage && mb ? extractM2Slots(mb.specifications) : null;
    const mbSataPorts = isStorage && mb ? extractSataPorts(mb.specifications) : null;

    // CPU↔Motherboard socket check
    const mbSocket = mb ? resolveSocket(mb) : null;

    return products.map((p) => {
      // When selecting a CPU: filter by motherboard socket
      if (slotType === 'cpu' && mb && mbSocket) {
        const cpuSocket = resolveSocket(p);
        if (cpuSocket && cpuSocket !== mbSocket) {
          return {
            ...p, isIncompatible: true,
            incompatibilityIssues: [`Сокет ${cpuSocket} несовместим с материнской платой (${mbSocket})`],
          };
        }
      }

      // When selecting a motherboard: filter by CPU socket
      if (slotType === 'motherboard' && cpu) {
        const cpuSocket = resolveSocket(cpu);
        const mbCandidateSocket = resolveSocket(p);
        if (cpuSocket && mbCandidateSocket && cpuSocket !== mbCandidateSocket) {
          return {
            ...p, isIncompatible: true,
            incompatibilityIssues: [`Сокет ${mbCandidateSocket} несовместим с процессором (${cpuSocket})`],
          };
        }
      }

      if (isRam && mb) {
        const ramProduct = enrichSummaryToProduct(p);
        const rt = extractMemoryType(ramProduct.specifications);
        const mt = extractMemoryType(mb.specifications);
        if (rt && mt && rt !== mt) {
          return {
            ...p, isIncompatible: true,
            incompatibilityIssues: [`Тип памяти ${rt} не поддерживается материнской платой (${mt})`],
          };
        }

        // Проверяем форм-фактор (SO-DIMM vs DIMM)
        const rff = extractMemoryFormFactor(ramProduct.specifications)
          ?? detectMemoryFormFactorFromName(ramProduct.name, ramProduct.sku);
        const mff = extractMemoryFormFactor(mb.specifications) ?? 'DIMM';

        if (rff && mff && rff !== mff) {
          const ffMsg = rff === 'SO-DIMM'
            ? `Форм-фактор ${rff} — для ноутбуков, не подходит для десктопной материнской платы (${mff})`
            : `Форм-фактор ${rff} несовместим с материнской платой (${mff})`;
          return {
            ...p, isIncompatible: true,
            incompatibilityIssues: [ffMsg],
          };
        }
      }

      // Совместимость накопителей: скрываем диски, которые превышают лимиты M.2/SATA материнской платы
      if (isStorage && mb) {
        // Приводим тип для доступа к полным спецификациям (может быть undefined в ProductSummary)
        const fullSpecs = (p as Product).specifications ?? {};
        const diskType = extractStorageType(fullSpecs);
        // Без interface/form_factor в summary невозможно определить тип — пропускаем
        if (diskType !== 'other') {
          if (diskType === 'm2' && mbM2Slots !== null && currentM2 >= mbM2Slots) {
            return {
              ...p, isIncompatible: true,
              incompatibilityIssues: [`Материнская плата поддерживает только ${mbM2Slots} M.2 накопитель(ей); все слоты заняты`],
            };
          }
          if (diskType === 'sata' && mbSataPorts !== null && currentSata >= mbSataPorts) {
            return {
              ...p, isIncompatible: true,
              incompatibilityIssues: [`Материнская плата поддерживает только ${mbSataPorts} SATA накопитель(ей); все порты заняты`],
            };
          }
        }
      }

      // Cooler socket compatibility: warn if cooler may not support CPU socket
      if (isCooler && cpu) {
        const cpuSocket = resolveSocket(cpu.specifications, cpu.name);
        if (cpuSocket) {
          const coolerProduct = enrichSummaryToProduct(p);
          const supportedSockets = coolerProduct.specifications?.socket_support
            ? (coolerProduct.specifications.socket_support as string).split(/[,;]\s*/).map(s => s.trim().toUpperCase())
            : [];
          // If cooler lists supported sockets and CPU socket isn't among them, warn
          if (supportedSockets.length > 0 && !supportedSockets.some(s => cpuSocket.toUpperCase().includes(s) || s.includes(cpuSocket.toUpperCase()))) {
            return {
              ...p, isIncompatible: true,
              incompatibilityIssues: [`Кулер может не поддерживать сокет ${cpuSocket}`],
            };
          }
        }
      }

      return { ...p, isIncompatible: false, incompatibilityIssues: [] as string[] };
    });
  }, [products, slotType, componentMap, buildContext]);

  // Скрываем несовместимые товары — пользователь не увидит то, что не подходит для его сборки
  const filteredProducts = useMemo(() => {
    return productsWithCompatibility.filter((p) => {
      if (p.isIncompatible) return false;
      if (nameFilter && !p.name.toLowerCase().includes(nameFilter.toLowerCase())) return false;
      return true;
    });
  }, [productsWithCompatibility, nameFilter]);

  const previewProduct = useMemo(() => {
    if (!highlightedId) return null;
    const fromList = productsWithCompatibility.find((p) => p.id === highlightedId);
    if (fromList) return enrichSummaryToProduct(fromList);
    if (currentProduct?.id === highlightedId) return currentProduct;
    return null;
  }, [productsWithCompatibility, highlightedId, currentProduct]);

  const { data: detailProduct } = useQuery({
    queryKey: ['catalog-product', highlightedId],
    queryFn: () => catalogApi.getProduct(highlightedId!),
    enabled: isOpen && !!highlightedId,
    staleTime: 5 * 60_000,
  });

  const fullPreview = detailProduct ?? previewProduct;

  const previewIncompatibility = useMemo(() => {
    if (!highlightedId) return { isIncompatible: false, issues: [] as string[] };
    const found = productsWithCompatibility.find(p => p.id === highlightedId);
    if (found?.isIncompatible) {
      return { isIncompatible: true, issues: found.incompatibilityIssues ?? [] };
    }
    return { isIncompatible: false, issues: [] };
  }, [productsWithCompatibility, highlightedId]);

  const previewImages = useMemo(() => {
    if (!fullPreview) return [];
    const imgs = fullPreview.images ?? [];
    if (fullPreview.mainImage && !imgs.some((i: ProductImage) => i.id === fullPreview.mainImage?.id)) {
      return [fullPreview.mainImage, ...imgs];
    }
    return imgs;
  }, [fullPreview]);

  const previewImageUrls = useMemo(() => {
    return previewImages
      .filter((i) => hasValidProductImage(i.url))
      .map((i) => getProductImageUrl(i.url)!)
      .filter(Boolean);
  }, [previewImages]);

  const handleConfirm = () => {
    if (!highlightedId) return;
    // Защита: не даём подтвердить выбор несовместимого товара
    const isIncompatible = productsWithCompatibility.some(
      (pw) => pw.id === highlightedId && pw.isIncompatible,
    );
    if (isIncompatible) return;
    const p = fullPreview || previewProduct;
    if (p) onConfirm(p);
  };

  const handleCategoryChange = useCallback((cat: ProductCategory | null) => {
    setSelectedCategory((cat as ProductCategory) ?? category); setPage(1); setHighlightedId(null);
  }, [category]);

  const handleResetFilters = useCallback(() => {
    // Сохраняем вычисленные границы цен, просто сбрасываем min/max на полный диапазон
    setPriceRange((prev) => prev); // don't zero out — keep derived bounds
    setSelectedManufacturerIds([]);
    setSelectedSpecifications({}); setSelectedAvailability([]); setMinRating(0); setInStockOnly(false); setPage(1);
  }, []);

  const handleOpenProduct = useCallback((slug: string) => {
    window.open(`/product/${slug}`, '_blank', 'noopener,noreferrer');
  }, []);

  // ── Общий рендер содержимого превью (используется и в desktop aside, и в mobile BottomSheet) ──
  const renderPreviewContent = () => {
    if (!fullPreview) return null;
    return (
      <div className="flex flex-col gap-3">
        <div className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground border-b border-white/5 pb-1.5">Предпросмотр</div>

        {/* Галерея изображений для предпросмотра */}
        {previewImageUrls.length > 0 ? (
          <>
            <div className="relative w-full aspect-square min-h-[140px] rounded-lg bg-white p-3 box-border flex items-center justify-center overflow-hidden">
              {previewImageUrls.length > 1 && previewImgIdx > 0 && (
                <button type="button" className="absolute top-1/2 -translate-y-1/2 w-7 h-7 p-0 rounded-md border border-black/10 bg-white/85 text-black flex items-center justify-center cursor-pointer z-2 left-1"
                  onClick={() => setPreviewImgIdx((i) => i - 1)}>
                  <ChevronLeft size={18} />
                </button>
              )}
              {previewImageUrls.length > 1 && previewImgIdx < previewImageUrls.length - 1 && (
                <button type="button" className="absolute top-1/2 -translate-y-1/2 w-7 h-7 p-0 rounded-md border border-black/10 bg-white/85 text-black flex items-center justify-center cursor-pointer z-2 right-1"
                  onClick={() => setPreviewImgIdx((i) => i + 1)}>
                  <ChevronRight size={18} />
                </button>
              )}
              <img
                src={previewImageUrls[previewImgIdx]}
                alt=""
                className="max-w-[90%] max-h-[90%] w-auto h-auto object-contain"
                width={240}
                height={240}
                loading="eager"
              />
              <button type="button" className="absolute bottom-2 right-2 w-9 h-9 rounded-full border border-[rgba(255,255,255,0.2)] bg-black/60 text-white/80 flex items-center justify-center cursor-pointer transition-all z-2 hover:bg-[rgba(0,0,0,0.8)] hover:text-white hover:border-gold"
                onClick={() => setMagnifierIdx(previewImgIdx)}
                title="Увеличить фото" aria-label="Увеличить фото">
                <ZoomIn size={20} />
              </button>
            </div>
            {previewImageUrls.length > 1 && (
              <div className="flex gap-1 overflow-x-auto p-0.5">
                {previewImageUrls.map((img, i) => (
                  <button key={i} type="button"
                    className={`w-11 h-11 rounded-md border border-white/5 bg-body-text p-[3px] flex-shrink-0 cursor-pointer flex items-center justify-center box-border transition-colors ${i === previewImgIdx ? "border-gold shadow-[0_0_0_1px_rgba(252,213,53,0.3)]" : ""}`}
                    onClick={() => setPreviewImgIdx(i)}
                  >
                    <img src={img} alt="" width={44} height={44} loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full aspect-square rounded-lg bg-surface-elevated opacity-30" />
        )}

        <h4 className="m-0 text-[0.85rem] font-semibold text-body-text word-break-break-word leading-[1.3]">{fullPreview.name}</h4>

        {/* Цена + кнопка подтверждения в одну строку */}
        <div className="flex items-center justify-between gap-3">
          <div className="m-0 text-base font-semibold text-gold whitespace-nowrap">{fullPreview.price.toLocaleString('ru-BY')} BYN</div>
          <button
            type="button"
            className={`px-5 py-2.5 border-none rounded-md text-[0.85rem] font-semibold transition-all whitespace-nowrap ${
              previewIncompatibility.isIncompatible
                ? 'bg-[rgba(255,255,255,0.08)] text-muted-foreground cursor-not-allowed'
                : 'bg-gold text-neutral-900 cursor-pointer hover:bg-gold-active active:scale-[0.97]'
            }`}
            onClick={previewIncompatibility.isIncompatible ? undefined : handleConfirm}
            disabled={previewIncompatibility.isIncompatible}
            title={previewIncompatibility.isIncompatible ? 'Компонент несовместим с вашей сборкой' : undefined}
          >
            {previewIncompatibility.isIncompatible ? 'Несовместим' : 'Выбрать'}
          </button>
        </div>

        {fullPreview.slug && (
          <button type="button" className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-gold/25 bg-transparent text-gold text-xs font-medium cursor-pointer transition-all w-full hover:bg-[rgba(252,213,53,0.1)]" onClick={() => handleOpenProduct(fullPreview.slug!)}>
            <ExternalLink size={14} /> Открыть страницу товара
          </button>
        )}

        {previewIncompatibility.isIncompatible && (
          <div className="text-[0.7rem] text-price-rise p-2 bg-[rgba(248,113,113,0.05)] rounded-md">
            <Lock size={12} style={LOCK_ICON_STYLE} />
            {previewIncompatibility.issues.join('; ') || 'Компонент несовместим с текущей сборкой'}
          </div>
        )}

        {fullPreview.specifications && <SpecList specs={fullPreview.specifications as Record<string, unknown>} />}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Выбор: ${slotLabel}`} size="xlarge" showCloseButton>
      
      <div className="flex flex-col gap-0 min-h-0 h-full flex-1 overflow-hidden">

        {/* Мобильный оверлей фильтров — использует ТОТ ЖЕ FilterSidebar через проп mobile */}
        {mobileFilterOpen && (
          <div
            className="fixed inset-0 bg-white/6 z-[1100] md:hidden"
            role="button"
            tabIndex={0}
            onClick={() => setMobileFilterOpen(false)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMobileFilterOpen(false); } }}
            aria-label="Закрыть фильтры"
          >
            <div className="absolute right-0 top-0 bottom-0 w-[90vw] max-w-[380px] bg-surface-card border-l border-white/5 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 pb-4 border-b border-white/5">
                <h3 className="m-0 text-sm font-bold text-body-text flex items-center gap-2">Фильтры</h3>
                <button className="flex items-center justify-center w-9 h-9 bg-transparent border border-[rgba(255,255,255,0.08)] rounded-lg text-muted-foreground cursor-pointer transition-all hover:bg-gold/10 hover:border-gold/30 hover:text-gold" onClick={() => setMobileFilterOpen(false)}><X size={20} /></button>
              </div>
              <FilterSidebar
                mobile
                selectedCategory={selectedCategory} onCategoryChange={handleCategoryChange} categoryLocked={true}
                priceRange={priceRange} onPriceChange={setPriceRange}
                selectedManufacturerIds={selectedManufacturerIds} onManufacturerIdsChange={setSelectedManufacturerIds}
              minRating={minRating} onRatingChange={setMinRating}
              selectedAvailability={selectedAvailability} onAvailabilityChange={setSelectedAvailability}
              selectedSpecifications={selectedSpecifications} onSpecificationsChange={setSelectedSpecifications}
                onReset={handleResetFilters}
                restrictedSpecValues={restrictedSpecValues}
                effectiveSpecifications={effectiveSpecs}
                restrictedManufacturerPlatform={restrictedManufacturerPlatform}
                sortBy={sortPreset}
                onSortChange={setSortPreset}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr_280px] gap-4 min-h-0 flex-1 overflow-hidden items-stretch">
          {/* Боковая панель фильтров — видна на десктопе, скрыта на мобилке (использует оверлей) */}
          <div className="overflow-y-auto self-start max-h-full max-md:hidden">
            <FilterSidebar
              selectedCategory={selectedCategory} onCategoryChange={handleCategoryChange} categoryLocked={true}
              priceRange={priceRange} onPriceChange={setPriceRange}
              selectedManufacturerIds={selectedManufacturerIds} onManufacturerIdsChange={setSelectedManufacturerIds}
              minRating={minRating} onRatingChange={setMinRating}
              selectedAvailability={selectedAvailability} onAvailabilityChange={setSelectedAvailability}
              selectedSpecifications={selectedSpecifications}
              effectiveSpecifications={effectiveSpecs}
              onSpecificationsChange={setSelectedSpecifications}
              onReset={handleResetFilters}
              restrictedSpecValues={restrictedSpecValues}
              restrictedManufacturerPlatform={restrictedManufacturerPlatform}
              sortBy={sortPreset}
              onSortChange={setSortPreset}
            />
          </div>

          {/* Товары */}
          <div className="min-w-0 flex flex-col gap-2.5 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[rgba(255,255,255,0.12)] scrollbar-track-transparent">
            <div className="flex items-center gap-2 py-1.5 px-0 flex-shrink-0 border-b border-white/5">
              {/* Поиск + кнопка Фильтры (mobile) */}
              <button className="flex md:hidden items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[rgba(255,255,255,0.08)] bg-surface-card text-body-text text-xs cursor-pointer flex-shrink-0" onClick={() => setMobileFilterOpen(true)}>
                <SlidersHorizontal size={16} /> Фильтры
              </button>
              <form className="flex-1 min-w-0 relative" onSubmit={(e) => e.preventDefault()}>
                <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input type="search" className="w-full py-1.5 pl-[30px] pr-7 rounded-md border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.25)] text-body-text text-xs placeholder:text-muted-foreground focus:outline-none focus:outline-2 focus:outline-[rgba(252,213,53,0.35)] focus:outline-offset-0" placeholder="Поиск по названию…"
                  value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); setHighlightedId(null); }} />
                {search && <button type="button" className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-none border-none text-muted-foreground cursor-pointer p-0.5 flex hover:text-muted-foreground" onClick={() => setSearch('')}><X size={14} /></button>}
              </form>
            </div>

            {/* ✅ Показываем старые товары во время загрузки — скелетоны поверх */}
            <div className={`${viewMode === 'grid' ? "grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6" : "flex flex-col gap-2"} relative`}>
              {/* Рендерим существующие товары первыми */}
              {filteredProducts.length > 0 ? (viewMode === 'grid' ? (
                filteredProducts.map((p) => (
                  <div key={p.id} className={p.isIncompatible ? "relative" : ''}>
                    <PickerProductCard product={p} isSelected={p.id === highlightedId}
                      isCompatible={!p.isIncompatible}
                      onSelect={p.isIncompatible ? noopSelect : (prod) => setHighlightedId(prod.id)}
                      onOpenProduct={handleOpenProduct} slotType={slotType} getDisplaySpecs={getDisplaySpecs} />
                    {p.isIncompatible && p.incompatibilityIssues?.length > 0 && (
                      <div className="text-[0.7rem] text-price-rise p-1.5 bg-[rgba(248,113,113,0.05)] rounded mt-1">
                        <Lock size={12} style={LOCK_ICON_STYLE} />
                        {p.incompatibilityIssues.join('; ')}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                filteredProducts.map((p) => (
                  <div key={p.id} className={p.isIncompatible ? "relative" : ''}>
                    <PickerProductCardCompact product={p} isSelected={p.id === highlightedId}
                      isCompatible={!p.isIncompatible}
                      onSelect={p.isIncompatible ? noopSelect : (prod) => setHighlightedId(prod.id)}
                      onOpenProduct={handleOpenProduct} slotType={slotType} getDisplaySpecs={getDisplaySpecs} />
                    {p.isIncompatible && p.incompatibilityIssues?.length > 0 && (
                      <div className="text-[0.7rem] text-price-rise p-1.5 bg-[rgba(248,113,113,0.05)] rounded mt-1">
                        <Lock size={12} style={LOCK_ICON_STYLE} />
                        {p.incompatibilityIssues.join('; ')}
                      </div>
                    )}
                  </div>
                ))
              )) : null}

              {/* Рендерим скелетоны поверх во время загрузки */}
              {isPending && (
                <>
                  {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
                </>
              )}
            </div>

            {error && <ApiErrorBanner message="Не удалось загрузить список." onRetry={() => void refetch()} />}

            {!error && (
              <>
                {meta && meta.totalItems > 0 && <div className="text-[0.72rem] text-muted-foreground pb-1 flex-shrink-0">Найдено: {meta.totalItems}</div>}

                {filteredProducts.length === 0 && !isPending && (
                  <div className="text-center p-8 text-muted-foreground">
                    <h3>Нет товаров</h3>
                    <p>Не найдено подходящих компонентов. Попробуйте изменить параметры поиска.</p>
                  </div>
                )}

                {meta && meta.totalItems > 0 && meta.totalPages > 1 && (
                  <div className="p-2 pb-1 flex-shrink-0 -mx-1 px-1">
                    <Pagination page={page} totalPages={meta.totalPages} totalItems={meta.totalItems}
                      pageSize={12} onPageChange={(p) => { setPage(p); setHighlightedId(null); }} showFirstLast />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Предпросмотр (только десктоп — на мобилке используется BottomSheet) */}
          <aside className="max-md:hidden md:sticky top-0 flex flex-col gap-2.5 p-3.5 rounded-md border border-white/5 bg-surface-card max-h-full overflow-y-auto flex-shrink-0 scrollbar-thin scrollbar-thumb-[rgba(255,255,255,0.1)] scrollbar-track-transparent">
            {fullPreview ? renderPreviewContent() : (
              <div className="flex flex-col items-center justify-center text-center h-[200px] text-muted-foreground">
                <h4>Предпросмотр</h4>
                <p>Выберите товар из списка, здесь появятся его характеристики.</p>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Mobile BottomSheet: предпросмотр при выборе товара */}
      {isMobile && (
        <BottomSheet isOpen={!!fullPreview} onClose={() => setHighlightedId(null)}>
          {renderPreviewContent()}
        </BottomSheet>
      )}

      {/* Увеличитель */}
      {magnifierIdx !== null && previewImageUrls.length > 0 && (
        <ImageMagnifier images={previewImageUrls} initIdx={magnifierIdx} onClose={() => setMagnifierIdx(null)} />
      )}
    </Modal>
  );
}
