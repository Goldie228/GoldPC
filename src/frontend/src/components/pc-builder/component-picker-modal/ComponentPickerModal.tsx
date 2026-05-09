/**
 * ComponentPickerModal — каталог-стиль: FilterSidebar + карточки + превью
 * Без корзины/избранного/сравнения/прогресс-бара/текущего товара.
 */

import { useState, useEffect, useMemo, useCallback, useTransition, useRef } from 'react';
import useDeepCompareEffect from 'use-deep-compare-effect';
import { useDebouncedCallback } from 'use-debounce';
import { Search, SlidersHorizontal, X, ExternalLink, ZoomIn, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { Modal } from '../../ui';
import { ProductCardSkeleton } from '../../ui/Skeleton';
import { ApiErrorBanner } from '../../ui/ApiErrorBanner';
import { Pagination } from '../../catalog/Pagination';
import { FilterSidebar } from '../../catalog';
import { getProductImageUrl, hasValidProductImage } from '../../../utils/image';
import { specLabel, formatSpecValueForKey } from '../../../utils/specifications';
import { extractSocket, extractMemoryType, extractFormFactor, extractTDP } from '../../../shared/utils/compatibility/extractors';
import { useQuery } from '@tanstack/react-query';
import { useProducts } from '../../../hooks/useProducts';
import { catalogApi } from '../../../api/catalog';
import type { Product, ProductCategory, ProductImage, ProductSummary, PaginationMeta } from '../../../api/types';
import type { PCComponentType } from '../../../hooks';
import type { PCBuilderSelectedState } from '../../../hooks/usePCBuilder';

const noopSelect = () => {};

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
  /** Фильтр по подстроке в названии (e.g. "вентилятор для корпуса") */
  nameFilter?: string;
  /** Значение спецификации 'type' для фильтрации (e.g. 'CPU Кулер', 'Жидкостное охлаждение'). Если массив — OR. */
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

function summaryToProduct(s: ProductSummary): Product {
  return { ...s, specifications: s.specifications ?? {} } as Product;
}

// ─── CardImageGallery: image with prev/next + hover zones + badges ────────

function CardImageGallery({ product, hasDiscount, discountPercent, outOfStock }: {
  product: Product;
  hasDiscount: boolean;
  discountPercent: number;
  outOfStock: boolean;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const allImages = useMemo<ProductImage[]>(() => {
    const imgs = product.images ?? [];
    if (product.mainImage && !imgs.some((i: ProductImage) => i.id === product.mainImage.id)) {
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
    <div className="relative w-full h-[200px] bg-[var(--color-white)] flex items-center justify-center overflow-hidden" onMouseLeave={() => setCurrentIdx(0)}>
      <div className="w-full h-full flex items-center justify-center p-2.5 box-border">
        {url
          ? <img src={url} alt={product.name} loading="lazy" className="max-w-full max-h-full w-auto h-auto object-contain" />
          : <div className="w-[30%] aspect-square rounded-full bg-[linear-gradient(135deg,#e4e4e7,#d4d4d8)] opacity-50" />
        }
      </div>

      {/* Navigation arrows */}
      {hasMultiple && (
        <>
          <button type="button" className="absolute top-1/2 -translate-y-1/2 w-7 h-7 p-0 rounded-md border border-[rgba(0,0,0,0.12)] bg-[rgba(255,255,255,0.85)] text-[var(--color-black)] flex items-center justify-center cursor-pointer opacity-0 transition-opacity z-2 left-1" onClick={goPrev} aria-label="Предыдущее">
            <ChevronLeft size={18} />
          </button>
          <button type="button" className="absolute top-1/2 -translate-y-1/2 w-7 h-7 p-0 rounded-md border border-[rgba(0,0,0,0.12)] bg-[rgba(255,255,255,0.85)] text-[var(--color-black)] flex items-center justify-center cursor-pointer opacity-0 transition-opacity z-2 right-1" onClick={goNext} aria-label="Следующее">
            <ChevronRight size={18} />
          </button>
          {/* Image indicators */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 z-2">
            {validImages.map((_, i) => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full bg-[rgba(0,0,0,0.2)] transition-all ${i === currentIdx ? "bg-[rgba(0,0,0,0.5)] w-3.5 rounded-[3px]" : ""}`} />
            ))}
          </div>
          {/* Hover zones */}
          <div className="absolute inset-0 flex z-1 pointer-events-auto">
            {validImages.map((_, i) => (
              <div key={i} className="flex-1 cursor-pointer" onMouseEnter={() => setCurrentIdx(i)} />
            ))}
          </div>
        </>
      )}

      {hasDiscount && <span className="absolute top-2 left-2 px-2 py-0.5 text-[0.64rem] font-semibold bg-[var(--error)] text-white rounded-md z-3">-{discountPercent}%</span>}
      {outOfStock && <span className="absolute top-2 right-2 px-2 py-0.5 text-[0.64rem] font-medium bg-[rgba(0,0,0,0.6)] text-white rounded-md z-3">Нет в наличии</span>}
    </div>
  );
}

// ─── PickerProductCard ──────────────────────────────────

interface PickerProductCardProps {
  product: any;
  isSelected: boolean;
  isCompatible?: boolean;
  onSelect: (product: Product) => void;
  onOpenProduct: (slug: string) => void;
  slotType: PCComponentType;
  getDisplaySpecs: (type: PCComponentType, product: Product) => string[];
}

function PickerProductCard({ product, isSelected, isCompatible, onSelect, onOpenProduct, slotType, getDisplaySpecs }: PickerProductCardProps) {
  const specs = getDisplaySpecs(slotType, summaryToProduct(product)).slice(0, 3);
  const hasDiscount = product.oldPrice !== undefined && product.oldPrice > product.price;
  const discountPercent = hasDiscount ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
  const outOfStock = product.stock === 0 || !product.isActive;

  return (
    <div
      className={`flex flex-col items-stretch gap-0 border border-[rgba(255,255,255,0.06)] rounded-lg bg-[var(--color-black-soft)] cursor-pointer text-left text-inherit font-inherit overflow-hidden transition-all hover:border-[rgba(212,165,116,0.25)] hover:-translate-y-[1px] ${isSelected ? "border-[var(--accent)] shadow-[0_0_0_1px_rgba(212,165,116,0.15)] bg-[linear-gradient(145deg,rgba(212,165,116,0.08),var(--color-black-soft))]" : ""} ${outOfStock ? "opacity-60" : ""} ${isCompatible === false ? "opacity-45 pointer-events-none relative" : ""}`}
      onClick={isCompatible === false ? undefined : () => onSelect(product)}
    >
      <CardImageGallery product={product} hasDiscount={hasDiscount} discountPercent={discountPercent} outOfStock={outOfStock} />

      <div className="p-2.5 flex flex-col gap-1 flex-1">
        <h4 className="m-0">
          <button type="button" className="inline text-[0.74rem] font-medium text-[var(--fg)] leading-[1.3] m-0 p-0 bg-none border-none text-left cursor-pointer display-[-webkit-box] -webkit-line-clamp-2 -webkit-box-orient-vertical overflow-hidden hover:text-[var(--accent)]" onClick={isCompatible === false ? undefined : () => onSelect(product)} title={product.name}>
            {product.name}
          </button>
        </h4>
        {product.slug && (
          <button type="button" className="inline-flex items-center gap-[3px] p-0 m-0 bg-none border-none text-[0.64rem] text-[var(--fg-muted)] cursor-pointer transition-colors hover:text-[var(--accent)]" onClick={() => onOpenProduct(product.slug)} title="Открыть страницу товара">
            <ExternalLink size={10} /> Подробнее
          </button>
        )}
        {specs.length > 0 && <ul className="m-0 p-0 list-none flex flex-col gap-[3px]">{specs.map((s, i) => <li key={i}>{s}</li>)}</ul>}
        <div className="flex items-center justify-between gap-2 mt-auto">
          <div className="flex flex-col gap-0.5">
            <span className="text-[0.85rem] font-semibold text-[var(--accent)] whitespace-nowrap">{product.price.toLocaleString('ru-BY')} BYN</span>
            {hasDiscount && product.oldPrice !== undefined && (
              <span className="text-[0.64rem] text-[var(--fg-dim)] line-through">{product.oldPrice.toLocaleString('ru-BY')}</span>
            )}
          </div>
          <button type="button" className={`px-3 py-1 text-[0.68rem] font-semibold rounded-md border border-[var(--accent)] bg-transparent text-[var(--accent)] cursor-pointer whitespace-nowrap transition-all ${isSelected ? "bg-[var(--accent)] text-[var(--color-black-soft)]" : ""}`} onClick={isCompatible === false ? undefined : () => onSelect(product)}>
            {isSelected ? 'Выбрано' : outOfStock ? 'Нет в наличии' : 'Выбрать'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PickerProductCardCompact ───────────────────────────

function PickerProductCardCompact({ product, isSelected, isCompatible, onSelect, onOpenProduct, slotType, getDisplaySpecs }: PickerProductCardProps) {
  const url = product.mainImage?.url && hasValidProductImage(product.mainImage.url)
    ? getProductImageUrl(product.mainImage.url) : null;
  const specs = getDisplaySpecs(slotType, summaryToProduct(product)).slice(0, 2);
  const hasDiscount = product.oldPrice !== undefined && product.oldPrice > product.price;
  const outOfStock = product.stock === 0 || !product.isActive;

  return (
    <div
      className={`flex items-center gap-3 p-2 border border-[rgba(255,255,255,0.06)] rounded-md bg-[var(--color-black-soft)] text-inherit font-inherit transition-all hover:border-[rgba(212,165,116,0.25)] ${isSelected ? "border-[var(--accent)] bg-[linear-gradient(145deg,rgba(212,165,116,0.08),var(--color-black-soft))]" : ""} ${isCompatible === false ? "opacity-45 pointer-events-none relative" : ""}`}
      onClick={isCompatible === false ? undefined : () => onSelect(product)}
    >
      <div className="w-14 h-14 rounded-md bg-[var(--color-white)] p-1.5 flex items-center justify-center flex-shrink-0 box-border">
        {url ? <img src={url} alt="" className="w-full h-full object-contain" /> : <div className="w-1/2 aspect-square rounded-full bg-[#e4e4e7] opacity-50" />}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="m-0 whitespace-nowrap overflow-hidden text-ellipsis">
          <button type="button" className="inline text-[0.74rem] font-medium text-[var(--fg)] leading-[1.3] m-0 p-0 bg-none border-none text-left cursor-pointer display-[-webkit-box] -webkit-line-clamp-2 -webkit-box-orient-vertical overflow-hidden hover:text-[var(--accent)]" onClick={isCompatible === false ? undefined : () => onSelect(product)} title={product.name}>
            {product.name}
          </button>
        </h4>
        {product.slug && (
          <button type="button" className="inline-flex items-center gap-[3px] p-0 m-0 bg-none border-none text-[0.64rem] text-[var(--fg-muted)] cursor-pointer transition-colors hover:text-[var(--accent)]" onClick={() => onOpenProduct(product.slug)} title="Открыть страницу товара">
            <ExternalLink size={10} /> Подробнее
          </button>
        )}
        {specs.length > 0 && <span className="text-[0.65rem] text-[var(--fg-dim)] whitespace-nowrap overflow-hidden text-ellipsis">{specs.join(' · ')}</span>}
      </div>
      <div className="flex flex-col items-flex-end gap-1.5 flex-shrink-0">
        <div className="flex flex-col items-flex-end">
          <span className="text-[0.82rem] font-semibold text-[var(--accent)] whitespace-nowrap">{product.price.toLocaleString('ru-BY')} BYN</span>
          {hasDiscount && product.oldPrice !== undefined && (
            <span className="text-[0.62rem] text-[var(--fg-dim)] line-through">{product.oldPrice.toLocaleString('ru-BY')}</span>
          )}
        </div>
        <button type="button" className={`px-3 py-1 text-[0.68rem] font-semibold rounded-md border border-[var(--accent)] bg-transparent text-[var(--accent)] cursor-pointer whitespace-nowrap transition-all ${isSelected ? "bg-[var(--accent)] text-[var(--color-black-soft)]" : ""}`} onClick={isCompatible === false ? undefined : () => onSelect(product)}>
          {isSelected ? 'Выбрано' : outOfStock ? 'Нет в наличии' : 'Выбрать'}
        </button>
        {outOfStock && <span className="text-[0.62rem] text-[var(--error)]">Нет в наличии</span>}
      </div>
    </div>
  );
}

// ─── Image magnifier modal (uses our Modal) ────────────

function ImageMagnifier({ images, initIdx, onClose }: { images: string[]; initIdx: number; onClose: () => void }) {
  const [idx, setIdx] = useState(initIdx);
  const cur = images[Math.min(idx, images.length - 1)] ?? images[0] ?? '';

  useEffect(() => { setIdx(initIdx); }, [initIdx]);

  return (
    <Modal isOpen onClose={onClose} title="Изображение товара" size="large" showCloseButton>
      <div className="flex flex-col items-center gap-4 py-4 pb-6">
        <img src={cur} alt="" className="max-w-[90%] max-h-[75vh] w-auto h-auto object-contain bg-white rounded-2xl p-6 box-border shadow-[0_4px_24px_var(--border-muted)]" />
        {images.length > 1 && (
          <div className="flex items-center gap-4">
            <button type="button" className="w-10 h-10 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(0,0,0,0.6)] text-[var(--fg)] flex items-center justify-center cursor-pointer transition-all hover:bg-[rgba(0,0,0,0.85)] hover:border-[var(--accent)]"
              onClick={() => setIdx((i) => (i <= 0 ? images.length - 1 : i - 1))}
              aria-label="Предыдущее фото">
              <ChevronLeft size={28} />
            </button>
            <div className="flex gap-1.5">
              {images.map((_, i) => (
                <span key={i} className={`w-2 h-2 rounded-full bg-[rgba(255,255,255,0.15)] cursor-pointer transition-all ${i === idx ? "bg-[var(--accent)] w-5 rounded-[4px]" : ""}`}
                  onClick={() => setIdx(i)} />
              ))}
            </div>
            <button type="button" className="w-10 h-10 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(0,0,0,0.6)] text-[var(--fg)] flex items-center justify-center cursor-pointer transition-all hover:bg-[rgba(0,0,0,0.85)] hover:border-[var(--accent)]"
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

// ─── SpecList ───────────────────────────────────────────

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
        <div key={row.label} className="flex flex-wrap gap-1 items-1 border-b border-[rgba(255,255,255,0.05)] pb-1.5 text-[0.74rem]">
          <span className="text-[var(--fg-muted)] flex-1 flex-basis-[40%]">{row.label}</span>
          <span className="text-[var(--fg)] flex-1 flex-basis-[60%] text-right word-break-break-word">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── ComponentPickerModal ───────────────────────────────

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
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [magnifierIdx, setMagnifierIdx] = useState<number | null>(null);
  const [previewImgIdx, setPreviewImgIdx] = useState(0);
  const [showIncompatible, setShowIncompatible] = useState(true);

  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 });
  const [selectedManufacturerIds, setSelectedManufacturerIds] = useState<string[]>([]);
  const [minRating] = useState(0);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>(['in_stock']);
  const [selectedSpecifications, setSelectedSpecifications] = useState<Record<string, string | number | string[]>>({});

  const prevIsOpen = useRef(false);

  useEffect(() => {
    // Only reset state WHEN MODAL FIRST OPENS, not on every dependency change
    if (isOpen && !prevIsOpen.current) {
      // ✅ Batch ALL state updates in a single re-render using functional updates
      setSelectedCategory(category);
      setSearch(''); setDebouncedSearch(''); setSortPreset('popular'); setPreviewImgIdx(0);
      setInStockOnly(false); setHighlightedId(currentProduct?.id ?? null);
      setPage(1); setViewMode('grid');
      setPriceRange({ min: 0, max: 0 });
      setSelectedManufacturerIds([]);
    }

    // ALWAYS update compatibility filters when buildContext changes, even after mount

    prevIsOpen.current = isOpen;
  }, [isOpen, category, currentProduct?.id, slotType, buildContext]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(t);
  }, [search]);

  // Sync FilterSidebar availability changes → inStockOnly (the flag useProducts reads)
  useEffect(() => {
    setInStockOnly(selectedAvailability.length > 0 && selectedAvailability.includes('in_stock'));
  }, [selectedAvailability]);

  const [isPending, startTransition] = useTransition();

  const { sortBy, sortOrder } = useMemo(() => parseSort(sortPreset), [sortPreset]);

  const priceMin = priceRange.min > 0 ? priceRange.min : undefined;
  const priceMax = priceRange.max > 0 ? priceRange.max : undefined;

  const effectiveSpecs = useMemo(() => {
    const out = { ...selectedSpecifications };
    // typeFilter — фильтрация по спецификации 'type' (e.g. cooling vs fan)
    if (typeFilter) {
      out.type = Array.isArray(typeFilter) ? typeFilter : [typeFilter];
    }
    if (slotType === 'cpu' && buildContext?.motherboard?.product) {
      const s = extractSocket(buildContext.motherboard.product.specifications);
      if (s) out.socket = s;
    }
    if (slotType === 'motherboard' && buildContext?.cpu?.product) {
      const s = extractSocket(buildContext.cpu.product.specifications);
      if (s) out.socket = s;
    }
    if (slotType === 'ram' && buildContext?.motherboard?.product) {
      const mt = extractMemoryType(buildContext.motherboard.product.specifications);
      if (mt) { out.memoryType = mt; out.type = mt; }

      // Form factor filtering for RAM
      const mff = (buildContext.motherboard.product.specifications as Record<string, unknown>)["memoryFormFactor"] ??
                  (buildContext.motherboard.product.specifications as Record<string, unknown>)["memory_form_factor"] ?? 'DIMM';
      if (mff) out.memoryFormFactor = mff;
    }
    // PSU picker: enforce minimum wattage based on GPU+CPU selection
    if (slotType === 'psu' && (buildContext?.gpu?.product || buildContext?.cpu?.product)) {
      const gpuW = buildContext.gpu?.product ? extractTDP(buildContext.gpu.product.specifications) : 0;
      const cpuW = buildContext.cpu?.product ? extractTDP(buildContext.cpu.product.specifications) : 0;
      const minWatt = gpuW + cpuW + 50;
      if (minWatt > 0) {
        // Use a special marker that FilterSidebar picks up to set the range min
        out['wattage_min'] = minWatt;
      }
    }
    // Case picker: restrict to case form factors that fit the selected motherboard
    if (slotType === 'case' && buildContext?.motherboard?.product) {
      const mbFF = extractFormFactor(buildContext.motherboard.product.specifications);
      if (mbFF) {
        // Simple case form factor matching
        const caseFFs = [mbFF];
        out.formFactor = caseFFs;
      }
    }
    return out;
  // ✅ Fix slider reset bug: deep compare dependencies to prevent new object instance on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(selectedSpecifications), slotType, buildContext]);

  // 🔹 Single consolidated filters object - ALL dependencies go HERE
  const filters = useMemo(() => ({
    category: selectedCategory,
    search: debouncedSearch,
    sortBy,
    sortOrder,
    inStockOnly,
    specifications: Object.keys(effectiveSpecs).length > 0 ? effectiveSpecs : undefined,
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
    effectiveSpecs,
    selectedManufacturerIds,
    page,
    priceMin,
    priceMax
  ]);

  // ── Restricted spec values from build context ──
  const restrictedSpecValues = useMemo(() => {
    return {};
  }, [slotType, buildContext]);

  // 🔹 Debounced fetch function - 300ms delay for user input
  const fetchProducts = useDebouncedCallback((filters) => {
    startTransition(() => {
      refetch(filters);
    });
  }, 300);

  const { data: productsResponse, isLoading, error, refetch } = useProducts(filters, { enabled: false });

  // 🔹 Single effect with DEEP comparison - EXACTLY ONE request when filters change
  useDeepCompareEffect(() => {
    if (!isOpen) return;
    fetchProducts(filters);
  }, [filters, isOpen, fetchProducts]);

  // 🔹 Keep old products during loading to prevent layout shift
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

  // ── Compatibility filtering ──

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

  const productsWithCompatibility = useMemo(() => {
    return products.map((p) => {
      return { ...p, isIncompatible: false, incompatibilityIssues: [] as string[] };
    });
  }, [products]);

  const incompatibleCount = useMemo(
    () => productsWithCompatibility.filter((p) => p.isIncompatible).length,
    [productsWithCompatibility],
  );

  // Keep incompatible items in the visible list, but filter by nameFilter
  const filteredProducts = useMemo(() => {
    return productsWithCompatibility.filter((p) => {
      if (!showIncompatible && p.isIncompatible) return false;
      if (nameFilter && !p.name.toLowerCase().includes(nameFilter.toLowerCase())) return false;
      return true;
    });
  }, [productsWithCompatibility, showIncompatible, nameFilter]);

  const previewProduct = useMemo(() => {
    if (!highlightedId) return null;
    const fromList = productsWithCompatibility.find((p) => p.id === highlightedId);
    if (fromList) return summaryToProduct(fromList);
    if (currentProduct?.id === highlightedId) return currentProduct as Product;
    return null;
  }, [productsWithCompatibility, highlightedId, currentProduct]);

  const { data: detailProduct } = useQuery({
    queryKey: ['catalog-product', highlightedId],
    queryFn: () => catalogApi.getProduct(highlightedId!),
    enabled: isOpen && !!highlightedId,
    staleTime: 5 * 60_000,
  });

  const fullPreview = detailProduct ?? previewProduct;

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
    const p = fullPreview || previewProduct;
    if (p) onConfirm(p as Product);
  };

  const handleCategoryChange = useCallback((cat: ProductCategory | null) => {
    setSelectedCategory((cat as ProductCategory) ?? category); setPage(1); setHighlightedId(null);
  }, [category]);

  const handleResetFilters = useCallback(() => {
    // Keep the computed price bounds, just reset min/max to full range
    setPriceRange((prev) => prev); // don't zero out — keep derived bounds
    setSelectedManufacturerIds([]);
    setSelectedSpecifications({}); setSelectedAvailability([]); setInStockOnly(false); setPage(1);
  }, []);

  const handleOpenProduct = useCallback((slug: string) => {
    window.open(`/product/${slug}`, '_blank', 'noopener,noreferrer');
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Выбор: ${slotLabel}`} size="xlarge" showCloseButton>
      
      <div className="flex flex-col gap-0 min-h-0 h-full flex-1 overflow-hidden">

        {mobileFilterOpen && (
          <div className="fixed inset-0 bg-[var(--border-muted)] z-[1100] flex justify-end" onClick={() => setMobileFilterOpen(false)}>
            <div className="w-[320px] max-w-[85vw] bg-[var(--bg-card)] border-l border-[rgba(255,255,255,0.06)] p-0 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-3 border-b border-[rgba(255,255,255,0.06)] sticky top-0 bg-[var(--bg-card)] z-1 flex-shrink-0">
                <h3>Фильтры</h3>
                <button className="bg-none border-none text-[var(--fg-muted)] cursor-pointer p-1 flex transition-colors hover:text-[var(--fg)]" onClick={() => setMobileFilterOpen(false)}><X size={24} /></button>
              </div>
              <FilterSidebar
                selectedCategory={selectedCategory} onCategoryChange={handleCategoryChange} categoryLocked={true}
                priceRange={priceRange} onPriceChange={setPriceRange}
                selectedManufacturerIds={selectedManufacturerIds} onManufacturerIdsChange={setSelectedManufacturerIds}
                minRating={minRating} onRatingChange={() => {}}
                selectedAvailability={selectedAvailability} onAvailabilityChange={setSelectedAvailability}
                selectedSpecifications={effectiveSpecs} onSpecificationsChange={setSelectedSpecifications}
                onReset={handleResetFilters}
                restrictedSpecValues={restrictedSpecValues}
                effectiveSpecifications={effectiveSpecs}
                restrictedManufacturerPlatform={restrictedManufacturerPlatform}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-[220px_1fr_280px] gap-4 min-h-0 flex-1 overflow-hidden items-stretch">
          {/* Filter Sidebar */}
          <div className="overflow-y-auto bg-[var(--color-black-soft)] p-2 self-start max-h-full scrollbar-thin scrollbar-thumb-[rgba(255,255,255,0.1)] scrollbar-track-transparent">
            <FilterSidebar
              selectedCategory={selectedCategory} onCategoryChange={handleCategoryChange} categoryLocked={true}
              priceRange={priceRange} onPriceChange={setPriceRange}
              selectedManufacturerIds={selectedManufacturerIds} onManufacturerIdsChange={setSelectedManufacturerIds}
              minRating={minRating} onRatingChange={() => {}}
              selectedAvailability={selectedAvailability} onAvailabilityChange={setSelectedAvailability}
              selectedSpecifications={effectiveSpecs}
              effectiveSpecifications={effectiveSpecs}
              onSpecificationsChange={setSelectedSpecifications}
              onReset={handleResetFilters}
              restrictedSpecValues={restrictedSpecValues}
              restrictedManufacturerPlatform={restrictedManufacturerPlatform}
            />
          </div>

          {/* Products */}
          <div className="min-w-0 flex flex-col gap-2.5 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[rgba(255,255,255,0.12)] scrollbar-track-transparent">
            <div className="flex items-center justify-between gap-3 py-1.5 px-0 flex-wrap flex-shrink-0 border-b border-[rgba(255,255,255,0.06)]">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <button className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[rgba(255,255,255,0.08)] bg-[var(--color-black-soft)] text-[var(--fg)] text-xs cursor-pointer flex-shrink-0" onClick={() => setMobileFilterOpen(true)}>
                  <SlidersHorizontal size={16} /> Фильтры
                </button>
                <form className="flex-1 min-w-[160px] relative" onSubmit={(e) => e.preventDefault()}>
                  <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--fg-dim)] pointer-events-none" />
                  <input type="search" className="w-full py-1.5 pl-[30px] pr-7 rounded-md border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.25)] text-[var(--fg)] text-xs placeholder:text-[var(--fg-dim)] focus:outline-none focus:outline-2 focus:outline-[rgba(212,165,116,0.35)] focus:outline-offset-0" placeholder="Поиск по названию…"
                    value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); setHighlightedId(null); }} />
                  {search && <button type="button" className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-none border-none text-[var(--fg-dim)] cursor-pointer p-0.5 flex hover:text-[var(--fg-muted)]" onClick={() => setSearch('')}><X size={14} /></button>}
                </form>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <select className="px-[28px] py-0 h-8 rounded-md border border-[rgba(255,255,255,0.08)] bg-[var(--color-black-soft)] text-[var(--fg)] text-xs appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2371717a%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpolyline points=%276 9 12 15 18 9%27%3E%3C/polyline%3E%3C/svg%3E')] bg-no-repeat bg-[right_8px_center] bg-[length:12px] cursor-pointer focus:outline-none focus:border-[var(--accent)]" value={sortPreset} onChange={(e) => setSortPreset(e.target.value)}>
                  {SORT_PRESETS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <label className="flex items-center gap-1.5 text-xs text-[var(--fg-muted)] cursor-pointer select-none whitespace-nowrap">
                  <span className="w-4 h-4 rounded border-[1.5px] border-[rgba(255,255,255,0.15)] bg-[rgba(0,0,0,0.3)] flex items-center justify-center flex-shrink-0 transition-all text-transparent">
                    {inStockOnly && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </span>
                  <input type="checkbox" className="fixed opacity-0 pointer-events-none w-0 h-0" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
                  <span>В наличии</span>
                </label>
              </div>
            </div>

            {/* ✅ Keep old products visible while loading - overlay skeletons on top */}
            <div className={`${viewMode === 'grid' ? "grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6" : "flex flex-col gap-2"} relative`}>
              {/* Render existing products first */}
              {filteredProducts.length > 0 ? (viewMode === 'grid' ? (
                filteredProducts.map((p) => (
                  <div key={p.id} className={p.isIncompatible ? "relative" : ''}>
                    <PickerProductCard product={p} isSelected={p.id === highlightedId}
                      isCompatible={!p.isIncompatible}
                      onSelect={p.isIncompatible ? noopSelect : (prod: any) => setHighlightedId(prod.id)}
                      onOpenProduct={handleOpenProduct} slotType={slotType} getDisplaySpecs={getDisplaySpecs} />
                    {p.isIncompatible && p.incompatibilityIssues?.length > 0 && (
                      <div className="text-[0.7rem] text-[var(--error)] p-1.5 bg-[rgba(248,113,113,0.05)] rounded mt-1">
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
                      onSelect={p.isIncompatible ? noopSelect : (prod: any) => setHighlightedId(prod.id)}
                      onOpenProduct={handleOpenProduct} slotType={slotType} getDisplaySpecs={getDisplaySpecs} />
                    {p.isIncompatible && p.incompatibilityIssues?.length > 0 && (
                      <div className="text-[0.7rem] text-[var(--error)] p-1.5 bg-[rgba(248,113,113,0.05)] rounded mt-1">
                        <Lock size={12} style={LOCK_ICON_STYLE} />
                        {p.incompatibilityIssues.join('; ')}
                      </div>
                    )}
                  </div>
                ))
              )) : null}

              {/* Render skeletons over top during pending state */}
              {isPending && (
                <>
                  {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
                </>
              )}
            </div>

            {error && <ApiErrorBanner message="Не удалось загрузить список." onRetry={() => refetch()} />}

            {!error && (
              <>
                {meta && meta.totalItems > 0 && <div className="text-[0.72rem] text-[var(--fg-dim)] pb-1 flex-shrink-0">Найдено: {meta.totalItems}</div>}

                {/* Toggle incompatible visibility */}
                {incompatibleCount > 0 && (
                  <button
                    className="mt-3 px-3.5 py-2 border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] text-[var(--fg-muted)] rounded-md text-xs cursor-pointer transition-all hover:bg-[rgba(255,255,255,0.08)] hover:text-[var(--fg)]"
                    onClick={() => setShowIncompatible(!showIncompatible)}
                  >
                    {showIncompatible
                      ? `Скрыть несовместимые (${incompatibleCount})`
                      : `Показать несовместимые (${incompatibleCount})`}
                  </button>
                )}

                {filteredProducts.length === 0 && !isPending && (
                  <div className="text-center p-8 text-[var(--fg-muted)]">
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

          {/* Preview */}
          <aside className="sticky top-0 flex flex-col gap-2.5 p-3.5 rounded-md border border-[rgba(255,255,255,0.06)] bg-[var(--color-black-soft)] max-h-full overflow-y-auto flex-shrink-0 scrollbar-thin scrollbar-thumb-[rgba(255,255,255,0.1)] scrollbar-track-transparent">
            {fullPreview ? (
              <>
                <div className="text-[0.72rem] font-semibold uppercase tracking-wider text-[var(--fg-dim)] border-b border-[rgba(255,255,255,0.06)] pb-1.5">Предпросмотр</div>

                {/* Image gallery for preview */}
                {previewImageUrls.length > 0 ? (
                  <>
                    <div className="relative w-full aspect-square min-h-[180px] rounded-lg bg-[var(--color-white)] p-3 box-border flex items-center justify-center overflow-hidden">
                      {previewImageUrls.length > 1 && previewImgIdx > 0 && (
                        <button type="button" className="absolute top-1/2 -translate-y-1/2 w-7 h-7 p-0 rounded-md border border-[rgba(0,0,0,0.12)] bg-[rgba(255,255,255,0.85)] text-[var(--color-black)] flex items-center justify-center cursor-pointer z-2 left-1"
                          onClick={() => setPreviewImgIdx((i) => i - 1)}>
                          <ChevronLeft size={18} />
                        </button>
                      )}
                      {previewImageUrls.length > 1 && previewImgIdx < previewImageUrls.length - 1 && (
                        <button type="button" className="absolute top-1/2 -translate-y-1/2 w-7 h-7 p-0 rounded-md border border-[rgba(0,0,0,0.12)] bg-[rgba(255,255,255,0.85)] text-[var(--color-black)] flex items-center justify-center cursor-pointer z-2 right-1"
                          onClick={() => setPreviewImgIdx((i) => i + 1)}>
                          <ChevronRight size={18} />
                        </button>
                      )}
                      <img
                        src={previewImageUrls[previewImgIdx]}
                        alt=""
                        className="max-w-[90%] max-h-[90%] w-auto h-auto object-contain"
                      />
                      <button type="button" className="absolute bottom-2 right-2 w-9 h-9 rounded-full border border-[rgba(255,255,255,0.2)] bg-[rgba(0,0,0,0.6)] text-[rgba(255,255,255,0.8)] flex items-center justify-center cursor-pointer transition-all z-2 hover:bg-[rgba(0,0,0,0.8)] hover:text-white hover:border-[var(--accent)]"
                        onClick={() => setMagnifierIdx(previewImgIdx)}
                        title="Увеличить фото" aria-label="Увеличить фото">
                        <ZoomIn size={20} />
                      </button>
                    </div>
                    {previewImageUrls.length > 1 && (
                      <div className="flex gap-1 overflow-x-auto p-0.5">
                        {previewImageUrls.map((img, i) => (
                          <button key={i} type="button"
                            className={`w-11 h-11 rounded-md border border-[rgba(255,255,255,0.06)] bg-[var(--fg)] p-[3px] flex-shrink-0 cursor-pointer flex items-center justify-center box-border transition-colors ${i === previewImgIdx ? "border-[var(--accent)] shadow-[0_0_0_1px_rgba(212,165,116,0.3)]" : ""}`}
                            onClick={() => setPreviewImgIdx(i)}
                          >
                            <img src={img} alt="" />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full aspect-square rounded-lg bg-[linear-gradient(135deg,#e4e4e7,#d4d4d8)] opacity-30" />
                )}

                <h4 className="m-0 text-[0.85rem] font-semibold text-[var(--fg)] word-break-break-word leading-[1.3]">{fullPreview.name}</h4>
                <div className="m-0 text-base font-semibold text-[var(--accent)]">{fullPreview.price.toLocaleString('ru-BY')} BYN</div>

                {fullPreview.slug && (
                  <button type="button" className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-[rgba(212,165,116,0.25)] bg-transparent text-[var(--accent)] text-xs font-medium cursor-pointer transition-all w-full hover:bg-[rgba(212,165,116,0.1)]" onClick={() => handleOpenProduct(fullPreview.slug!)}>
                    <ExternalLink size={14} /> Открыть страницу товара
                  </button>
                )}

                {fullPreview.specifications && <SpecList specs={fullPreview.specifications as Record<string, unknown>} />}

                <button type="button" className="mt-auto px-4 py-2.5 border-none rounded-md bg-[var(--accent)] text-[var(--color-black-soft)] text-[0.85rem] font-semibold cursor-pointer transition-all hover:bg-[#e0b68a] hover:-translate-y-[1px]" onClick={handleConfirm}>Выбрать</button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-[200px] text-[var(--fg-dim)]">
                <h4>Предпросмотр</h4>
                <p>Выберите товар из списка, здесь появятся его характеристики.</p>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Magnifier */}
      {magnifierIdx !== null && previewImageUrls.length > 0 && (
        <ImageMagnifier images={previewImageUrls} initIdx={magnifierIdx} onClose={() => setMagnifierIdx(null)} />
      )}
    </Modal>
  );
}
