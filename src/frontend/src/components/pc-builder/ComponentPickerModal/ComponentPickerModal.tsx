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
import { Pagination } from '../../catalog/Pagination/Pagination';
import { FilterSidebar } from '../../catalog';
import { getProductImageUrl, hasValidProductImage } from '../../../utils/image';
import { specLabel, formatSpecValueForKey } from '../../../utils/specifications';
import { isComponentCompatible, extractSocket as _extractSocket, extractMemoryType as _extractMemoryType, extractSupportedFormFactors, getChipsetsForSocket, getSocketsForRamType, getRamTypesForSocket, extractSupportedSockets, extractTDP, caseFormFactorsForMB, mbFormFactorsForCase } from '../../../utils/compatibilityUtils';
import { useQuery } from '@tanstack/react-query';
import { useProducts } from '../../../hooks/useProducts';
import { catalogApi } from '../../../api/catalog';
import type { Product, ProductCategory, ProductImage } from '../../../api/types';
import type { PCComponentType, PCBuilderSelectedState } from '../../../hooks/usePCBuilder';
import styles from './ComponentPickerModal.module.css';

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

function summaryToProduct(s: any): Product {
  return { ...s, specifications: s.specifications ?? {} } as Product;
}

// ─── CardImageGallery: image with prev/next + hover zones + badges ────────

function CardImageGallery({ product, hasDiscount, discountPercent, outOfStock }: {
  product: any;
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
    <div className={styles.cardImage} onMouseLeave={() => setCurrentIdx(0)}>
      <div className={styles.cardImageInner}>
        {url
          ? <img src={url} alt={product.name} loading="lazy" className={styles.cardImg} />
          : <div className={styles.cardPlaceholder} />
        }
      </div>

      {/* Navigation arrows */}
      {hasMultiple && (
        <>
          <button type="button" className={`${styles.navBtn} ${styles.prevBtn}`} onClick={goPrev} aria-label="Предыдущее">
            <ChevronLeft size={18} />
          </button>
          <button type="button" className={`${styles.navBtn} ${styles.nextBtn}`} onClick={goNext} aria-label="Следующее">
            <ChevronRight size={18} />
          </button>
          {/* Image indicators */}
          <div className={styles.imageDots}>
            {validImages.map((_, i) => (
              <span key={i} className={`${styles.dot} ${i === currentIdx ? styles.dotActive : ''}`} />
            ))}
          </div>
          {/* Hover zones */}
          <div className={styles.hoverZones}>
            {validImages.map((_, i) => (
              <div key={i} className={styles.zone} onMouseEnter={() => setCurrentIdx(i)} />
            ))}
          </div>
        </>
      )}

      {hasDiscount && <span className={styles.discountBadge}>-{discountPercent}%</span>}
      {outOfStock && <span className={styles.oosBadge}>Нет в наличии</span>}
    </div>
  );
}

// ─── PickerProductCard ──────────────────────────────────

interface PickerProductCardProps {
  product: any;
  isSelected: boolean;
  isCompatible?: boolean;
  onSelect: (product: any) => void;
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
      className={`${styles.card} ${isSelected ? styles.cardSelected : ''} ${outOfStock ? styles.cardOutOfStock : ''} ${isCompatible === false ? styles.cardIncompatible : ''}`}
      onClick={isCompatible === false ? undefined : () => onSelect(product)}
    >
      <CardImageGallery product={product} hasDiscount={hasDiscount} discountPercent={discountPercent} outOfStock={outOfStock} />

      <div className={styles.cardContent}>
        <h4 className={styles.cardName}>
          <button type="button" className={styles.cardTitleBtn} onClick={isCompatible === false ? undefined : () => onSelect(product)} title={product.name}>
            {product.name}
          </button>
        </h4>
        {product.slug && (
          <button type="button" className={styles.openProductLink} onClick={() => onOpenProduct(product.slug)} title="Открыть страницу товара">
            <ExternalLink size={10} /> Подробнее
          </button>
        )}
        {specs.length > 0 && <ul className={styles.cardSpecs}>{specs.map((s, i) => <li key={i}>{s}</li>)}</ul>}
        <div className={styles.cardPriceRow}>
          <div className={styles.cardPrices}>
            <span className={styles.cardPrice}>{product.price.toLocaleString('ru-BY')} BYN</span>
            {hasDiscount && product.oldPrice !== undefined && (
              <span className={styles.cardOldPrice}>{product.oldPrice.toLocaleString('ru-BY')}</span>
            )}
          </div>
          <button type="button" className={`${styles.selectBtn} ${isSelected ? styles.selectBtnSelected : ''}`} onClick={isCompatible === false ? undefined : () => onSelect(product)}>
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
      className={`${styles.cardCompact} ${isSelected ? styles.cardCompactSelected : ''} ${isCompatible === false ? styles.cardIncompatible : ''}`}
      onClick={isCompatible === false ? undefined : () => onSelect(product)}
    >
      <div className={styles.compactImage}>
        {url ? <img src={url} alt="" className={styles.compactImg} /> : <div className={styles.compactPlaceholder} />}
      </div>
      <div className={styles.compactInfo}>
        <h4 className={styles.compactName}>
          <button type="button" className={styles.cardTitleBtn} onClick={isCompatible === false ? undefined : () => onSelect(product)} title={product.name}>
            {product.name}
          </button>
        </h4>
        {product.slug && (
          <button type="button" className={styles.openProductLink} onClick={() => onOpenProduct(product.slug)} title="Открыть страницу товара">
            <ExternalLink size={10} /> Подробнее
          </button>
        )}
        {specs.length > 0 && <span className={styles.compactSpecs}>{specs.join(' · ')}</span>}
      </div>
      <div className={styles.compactRight}>
        <div className={styles.compactPrices}>
          <span className={styles.compactPrice}>{product.price.toLocaleString('ru-BY')} BYN</span>
          {hasDiscount && product.oldPrice !== undefined && (
            <span className={styles.compactOldPrice}>{product.oldPrice.toLocaleString('ru-BY')}</span>
          )}
        </div>
        <button type="button" className={`${styles.selectBtn} ${isSelected ? styles.selectBtnSelected : ''}`} onClick={isCompatible === false ? undefined : () => onSelect(product)}>
          {isSelected ? 'Выбрано' : outOfStock ? 'Нет в наличии' : 'Выбрать'}
        </button>
        {outOfStock && <span className={styles.compactOos}>Нет в наличии</span>}
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
      <div className={styles.magnifierContent}>
        <img src={cur} alt="" className={styles.magnifierImage} />
        {images.length > 1 && (
          <div className={styles.magnifierNav}>
            <button type="button" className={styles.magnifierNavBtn}
              onClick={() => setIdx((i) => (i <= 0 ? images.length - 1 : i - 1))}
              aria-label="Предыдущее фото">
              <ChevronLeft size={28} />
            </button>
            <div className={styles.magnifierDots}>
              {images.map((_, i) => (
                <span key={i} className={`${styles.magDot} ${i === idx ? styles.magDotActive : ''}`}
                  onClick={() => setIdx(i)} />
              ))}
            </div>
            <button type="button" className={styles.magnifierNavBtn}
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
    <div className={styles.previewSpecs}>
      {entries.map((row) => (
        <div key={row.label} className={styles.specRow}>
          <span className={styles.specLabel}>{row.label}</span>
          <span className={styles.specValue}>{row.value}</span>
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
    // For case slot with a MB selected — pre-check all compatible FF options
    if (slotType === 'case' && buildContext?.motherboard?.product) {
      const raw = ((buildContext.motherboard.product.specifications as any)?.formFactor ??
        (buildContext.motherboard.product.specifications as any)?.form_factor ?? '') as string;
      const ffValues = caseFormFactorsForMB(raw);
      if (ffValues.length > 0) {
        setSelectedSpecifications({ formFactor: ffValues });
      } else {
        setSelectedSpecifications({});
      }
    }

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
      const s = _extractSocket(buildContext.motherboard.product.specifications);
      if (s) out.socket = s;
    }
    if (slotType === 'motherboard' && buildContext?.cpu?.product) {
      const s = _extractSocket(buildContext.cpu.product.specifications);
      if (s) out.socket = s;
    }
    if (slotType === 'ram' && buildContext?.motherboard?.product) {
      const mt = (buildContext.motherboard.product.specifications as any)?.memoryType ??
                 (buildContext.motherboard.product.specifications as any)?.memory_type ?? '';
      if (mt) { out.memoryType = mt; out.type = mt; }

      // Form factor filtering for RAM
      const mff = (buildContext.motherboard.product.specifications as any)?.memoryFormFactor ??
                  (buildContext.motherboard.product.specifications as any)?.memory_form_factor ?? 'DIMM';
      if (mff) out.memoryFormFactor = mff;
    }
    // RAM slot: if no MB but CPU selected → derive from CPU socket
    if (slotType === 'ram' && !buildContext?.motherboard?.product && buildContext?.cpu?.product) {
      const cpuSocket = _extractSocket(buildContext.cpu.product.specifications);
      if (cpuSocket) {
        const ramTypes = getRamTypesForSocket(cpuSocket);
        if (ramTypes.length > 0) {
          out.memoryType = ramTypes[0];
          out.type = ramTypes[0];
        }
      }
    }
    // Case picker: restrict to case form factors that fit the selected motherboard
    if (slotType === 'case' && buildContext?.motherboard?.product) {
      const raw = ((buildContext.motherboard.product.specifications as any)?.formFactor ??
        (buildContext.motherboard.product.specifications as any)?.form_factor ?? '') as string;
      const caseFFs = caseFormFactorsForMB(raw);
      if (caseFFs.length > 0) out.formFactor = caseFFs;
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
    const result: Record<string, string[]> = {};
    const b = buildContext ?? { ram: [], storage: [], fan: [] };

    // CPU socket sources for MB picker: intersect all constraints
    const mbSocketSources: string[][] = [];

    if (slotType === 'motherboard' && b.cpu?.product) {
      const cpuSocket = _extractSocket(b.cpu.product.specifications);
      if (cpuSocket) {
        mbSocketSources.push([cpuSocket]);
        const ramTypes = getRamTypesForSocket(cpuSocket);
        if (ramTypes.length > 0) {
          result.memoryType = ramTypes;
          result.tip_pamyati = ramTypes;
          result.type = ramTypes;
          result.memory_type = ramTypes;
        }
      }
    }
    if (slotType === 'motherboard' && !b.cpu?.product) {
      const firstRam = b.ram[0]?.product;
      if (firstRam) {
        const ramType = _extractMemoryType(firstRam.specifications);
        if (ramType === 'DDR4' || ramType === 'DDR5') {
          const sockets = getSocketsForRamType(ramType);
          if (sockets.length > 0) mbSocketSources.push(sockets);
        }
      }
    }
    // Merge MB socket sources by intersection
    if (mbSocketSources.length > 0) {
      let merged = [...mbSocketSources[0]];
      for (let i = 1; i < mbSocketSources.length; i++) {
        const set = new Set(mbSocketSources[i]);
        merged = merged.filter(s => set.has(s));
      }
      if (merged.length > 0) result.socket = merged;
    }

    // CPU socket sources for CPU picker: MB socket, RAM-derived, cooler sockets
    const cpuSocketSources: string[][] = [];

    if (slotType === 'cpu' && b.motherboard?.product) {
      const mbSocket = _extractSocket(b.motherboard.product.specifications);
      if (mbSocket) cpuSocketSources.push([mbSocket]);
    }
    if (slotType === 'cpu' && !b.cpu?.product && !b.motherboard?.product) {
      const firstRam = b.ram[0]?.product;
      if (firstRam) {
        const ramType = _extractMemoryType(firstRam.specifications);
        if (ramType === 'DDR4' || ramType === 'DDR5') {
          const sockets = getSocketsForRamType(ramType);
          if (sockets.length > 0) cpuSocketSources.push(sockets);
        }
      }
    }
    if (slotType === 'cpu' && b.cooling?.product && !b.cpu?.product && !b.motherboard?.product) {
      const coolerSockets = extractSupportedSockets(b.cooling.product.specifications);
      if (coolerSockets.length > 0) cpuSocketSources.push(coolerSockets);
    }
    // Merge CPU socket sources by intersection
    if (cpuSocketSources.length > 0) {
      let merged = [...cpuSocketSources[0]];
      for (let i = 1; i < cpuSocketSources.length; i++) {
        const set = new Set(cpuSocketSources[i]);
        merged = merged.filter(s => set.has(s));
      }
      if (merged.length > 0) result.socket = merged;
    }

    if (slotType === 'ram' && b.motherboard?.product) {
      const memType = _extractMemoryType(b.motherboard.product.specifications);
      if (memType) {
        result.memoryType = [memType];
        result.tip_pamyati = [memType];
        result.type = [memType];
      }
    }
    if (slotType === 'ram' && b.ram[0]?.product && !b.motherboard?.product && !result.type) {
      const memType = _extractMemoryType(b.ram[0].product.specifications);
      if (memType) {
        result.memoryType = [memType];
        result.tip_pamyati = [memType];
        result.type = [memType];
      }
    }
    if (slotType === 'ram' && b.cpu?.product && !b.motherboard?.product) {
      const cpuSocket = _extractSocket(b.cpu.product.specifications);
      if (cpuSocket) {
        const ramTypes = getRamTypesForSocket(cpuSocket);
        if (ramTypes.length > 0 && !result.memoryType) {
          result.memoryType = ramTypes; result.tip_pamyati = ramTypes;
          result.type = ramTypes; result.memory_type = ramTypes;
        }
      }
    }
    if (slotType === 'cooling' && b.cpu?.product) {
      const cpuSocket = _extractSocket(b.cpu.product.specifications);
      if (cpuSocket) result.socket = [cpuSocket];
    }
    if (slotType === 'motherboard' && b.case?.product) {
      const caseFFs = extractSupportedFormFactors(b.case.product.specifications);
      if (caseFFs.length > 0) { result.formFactor = caseFFs; result.format = caseFFs; }
    }
    if (slotType === 'case' && b.motherboard?.product) {
      const raw = ((b.motherboard.product.specifications as any)?.formFactor ??
        (b.motherboard.product.specifications as any)?.form_factor ??
        (b.motherboard.product.specifications as any)?.format ?? '') as string;
      const caseFFs = caseFormFactorsForMB(raw);
      if (caseFFs.length > 0) {
        result.formFactor = caseFFs;
        result.format = caseFFs;
        result.form_factor = caseFFs;
      }
    }
    // Motherboard picker: given a selected case, restrict MB FF to what fits in it
    if (slotType === 'motherboard' && b.case?.product) {
      const raw = ((b.case.product.specifications as any)?.formFactor ??
        (b.case.product.specifications as any)?.format ?? '') as string;
      const mbFFs = mbFormFactorsForCase(raw);
      if (mbFFs.length > 0) {
        result.formFactor = mbFFs;
        result.format = mbFFs;
        result.form_factor = mbFFs;
      }
    }

    return result;
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
  const [cachedProducts, setCachedProducts] = useState([]);
  const [cachedMeta, setCachedMeta] = useState(null);

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
    const catMap: Record<string, any> = {
      cpu: 'cpu', gpu: 'gpu', motherboard: 'motherboard',
      ram: 'ram', storage: 'storage', psu: 'psu',
      case: 'case', cooling: 'cooling', monitor: 'cpu',
      keyboard: 'cpu', mouse: 'cpu', headphones: 'cpu', fan: 'cpu',
    };
    const compCat = catMap[slotType] ?? 'cpu';
    return products.map((p) => {
      const result = isComponentCompatible(compCat, p, componentMap);
      return { ...p, isIncompatible: !result.compatible, incompatibilityIssues: result.issues };
    });
  }, [products, slotType, componentMap]);

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
    setSelectedCategory(cat ?? category); setPage(1); setHighlightedId(null);
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
      {/* Hide sidebar header (title "Фильтры") inside FilterSidebar */}
      <style>{`
        .${styles.filterSidebarWrap} > aside > div:first-child {
          display: none !important;
        }
        /* Override FilterSidebar colors to match picker theme */
        .${styles.filterSidebarWrap} aside {
          position: static !important;
          background: transparent !important;
          border: none !important;
          max-height: none !important;
        }
        .${styles.filterSidebarWrap} aside [class*="filterGroup"] [class*="filterHeader"] {
          color: #a1a1aa !important;
        }
        .${styles.filterSidebarWrap} aside [class*="categoryItem"] {
          color: #71717a !important;
        }
        .${styles.filterSidebarWrap} aside [class*="priceInput"],
        .${styles.filterSidebarWrap} aside input[type="number"] {
          background: rgba(0,0,0,0.25) !important;
          border-color: rgba(255,255,255,0.08) !important;
          color: #fafafa !important;
        }
        .${styles.filterSidebarWrap} aside [class*="chip"] {
          background: rgba(255,255,255,0.04) !important;
          border-color: rgba(255,255,255,0.08) !important;
          color: #71717a !important;
        }
        .${styles.filterSidebarWrap} aside [class*="chip"][class*="active"] {
          background: rgba(212,165,116,0.12) !important;
          border-color: rgba(212,165,116,0.35) !important;
          color: #d4a574 !important;
        }
      `}</style>
      <div className={styles.root}>

        {mobileFilterOpen && (
          <div className={styles.mobileOverlay} onClick={() => setMobileFilterOpen(false)}>
            <div className={styles.mobileFilterContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.mobileFilterHeader}>
                <h3>Фильтры</h3>
                <button className={styles.mobileFilterClose} onClick={() => setMobileFilterOpen(false)}><X size={24} /></button>
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

        <div className={styles.body}>
          {/* Filter Sidebar */}
          <div className={styles.filterSidebarWrap}>
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
          <div className={styles.mainCol}>
            <div className={styles.toolbar}>
              <div className={styles.toolbarLeft}>
                <button className={styles.mobileFilterBtn} onClick={() => setMobileFilterOpen(true)}>
                  <SlidersHorizontal size={16} /> Фильтры
                </button>
                <form className={styles.searchForm} onSubmit={(e) => e.preventDefault()}>
                  <Search size={16} className={styles.searchIcon} />
                  <input type="search" className={styles.searchInput} placeholder="Поиск по названию…"
                    value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); setHighlightedId(null); }} />
                  {search && <button type="button" className={styles.searchClear} onClick={() => setSearch('')}><X size={14} /></button>}
                </form>
              </div>
              <div className={styles.toolbarRight}>
                <select className={styles.sortSelect} value={sortPreset} onChange={(e) => setSortPreset(e.target.value)}>
                  {SORT_PRESETS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <label className={styles.stockCheck}>
                  <span className={styles.stockCheckIndicator}>
                    {inStockOnly && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </span>
                  <input type="checkbox" className={styles.stockCheckInput} checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
                  <span>В наличии</span>
                </label>
              </div>
            </div>

            {/* ✅ Keep old products visible while loading - overlay skeletons on top */}
            <div className={`${viewMode === 'grid' ? styles.grid : styles.list}`} style={{ position: 'relative' }}>
              {/* Render existing products first */}
              {filteredProducts.length > 0 ? (viewMode === 'grid' ? (
                filteredProducts.map((p) => (
                  <div key={p.id} className={p.isIncompatible ? styles.incompatibleWrapper : ''}>
                    <PickerProductCard product={p} isSelected={p.id === highlightedId}
                      isCompatible={!p.isIncompatible}
                      onSelect={p.isIncompatible ? noopSelect : (prod: any) => setHighlightedId(prod.id)}
                      onOpenProduct={handleOpenProduct} slotType={slotType} getDisplaySpecs={getDisplaySpecs} />
                    {p.isIncompatible && p.incompatibilityIssues?.length > 0 && (
                      <div className={styles.incompatibleReason}>
                        <Lock size={12} style={LOCK_ICON_STYLE} />
                        {p.incompatibilityIssues.join('; ')}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                filteredProducts.map((p) => (
                  <div key={p.id} className={p.isIncompatible ? styles.incompatibleWrapper : ''}>
                    <PickerProductCardCompact product={p} isSelected={p.id === highlightedId}
                      isCompatible={!p.isIncompatible}
                      onSelect={p.isIncompatible ? noopSelect : (prod: any) => setHighlightedId(prod.id)}
                      onOpenProduct={handleOpenProduct} slotType={slotType} getDisplaySpecs={getDisplaySpecs} />
                    {p.isIncompatible && p.incompatibilityIssues?.length > 0 && (
                      <div className={styles.incompatibleReason}>
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
                {meta && meta.totalItems > 0 && <div className={styles.resultsCount}>Найдено: {meta.totalItems}</div>}

                {/* Toggle incompatible visibility */}
                {incompatibleCount > 0 && (
                  <button
                    className={styles.toggleIncompatibleBtn}
                    onClick={() => setShowIncompatible(!showIncompatible)}
                  >
                    {showIncompatible
                      ? `Скрыть несовместимые (${incompatibleCount})`
                      : `Показать несовместимые (${incompatibleCount})`}
                  </button>
                )}

                {filteredProducts.length === 0 && !isPending && (
                  <div className={styles.emptyState}>
                    <h3>Нет товаров</h3>
                    <p>Не найдено подходящих компонентов. Попробуйте изменить параметры поиска.</p>
                  </div>
                )}

                {meta && meta.totalItems > 0 && meta.totalPages > 1 && (
                  <div className={styles.paginationWrap}>
                    <Pagination page={page} totalPages={meta.totalPages} totalItems={meta.totalItems}
                      pageSize={12} onPageChange={(p) => { setPage(p); setHighlightedId(null); }} showFirstLast />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Preview */}
          <aside className={styles.previewPanel}>
            {fullPreview ? (
              <>
                <div className={styles.previewHeader}>Предпросмотр</div>

                {/* Image gallery for preview */}
                {previewImageUrls.length > 0 ? (
                  <>
                    <div className={styles.previewImageGallery}>
                      {previewImageUrls.length > 1 && previewImgIdx > 0 && (
                        <button type="button" className={`${styles.prevNav} ${styles.prevNavPreview}`}
                          onClick={() => setPreviewImgIdx((i) => i - 1)}>
                          <ChevronLeft size={18} />
                        </button>
                      )}
                      {previewImageUrls.length > 1 && previewImgIdx < previewImageUrls.length - 1 && (
                        <button type="button" className={`${styles.nextNav} ${styles.nextNavPreview}`}
                          onClick={() => setPreviewImgIdx((i) => i + 1)}>
                          <ChevronRight size={18} />
                        </button>
                      )}
                      <img
                        src={previewImageUrls[previewImgIdx]}
                        alt=""
                        className={styles.previewImg}
                      />
                      <button type="button" className={styles.magnifierBtnSmall}
                        onClick={() => setMagnifierIdx(previewImgIdx)}
                        title="Увеличить фото" aria-label="Увеличить фото">
                        <ZoomIn size={20} />
                      </button>
                    </div>
                    {previewImageUrls.length > 1 && (
                      <div className={styles.previewThumbnails}>
                        {previewImageUrls.map((img, i) => (
                          <button key={i} type="button"
                            className={`${styles.previewThumb} ${i === previewImgIdx ? styles.previewThumbActive : ''}`}
                            onClick={() => setPreviewImgIdx(i)}
                          >
                            <img src={img} alt="" />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className={styles.previewPlaceholder} />
                )}

                <h4 className={styles.previewName}>{fullPreview.name}</h4>
                <div className={styles.previewPrice}>{fullPreview.price.toLocaleString('ru-BY')} BYN</div>

                {fullPreview.slug && (
                  <button type="button" className={styles.previewOpenProduct} onClick={() => handleOpenProduct(fullPreview.slug!)}>
                    <ExternalLink size={14} /> Открыть страницу товара
                  </button>
                )}

                {fullPreview.specifications && <SpecList specs={fullPreview.specifications as Record<string, unknown>} />}

                <button type="button" className={styles.confirmBtn} onClick={handleConfirm}>Выбрать</button>
              </>
            ) : (
              <div className={styles.previewEmpty}>
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
