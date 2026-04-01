/**
 * Модалка выбора комплектующего: сетка, фильтры, предпросмотр с полными характеристиками.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Modal } from '../../ui';
import { Skeleton } from '../../ui/Skeleton';
import { ApiErrorBanner } from '../../ui/ApiErrorBanner';
import { Pagination } from '../../catalog/Pagination/Pagination';
import { useProducts } from '../../../hooks/useProducts';
import { catalogApi } from '../../../api/catalog';
import type { Product, ProductCategory, ProductSummary, ProductSpecifications } from '../../../api/types';
import type { PCComponentType, PCBuilderSelectedState } from '../../../hooks/usePCBuilder';
import { getProductImageUrl, hasValidProductImage } from '../../../utils/image';
import { specLabel, formatSpecValueForKey } from '../../../utils/specifications';
import styles from './ComponentPickerModal.module.css';

export interface ComponentPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: ProductCategory;
  slotType: PCComponentType;
  slotLabel: string;
  currentProduct?: Product | null;
  /** Текущая сборка — для узких фильтров (сокет, тип памяти) и facets */
  buildContext?: PCBuilderSelectedState;
  onConfirm: (product: Product) => void;
  onRemoveCurrent?: () => void;
  getDisplaySpecs: (type: PCComponentType, product: Product) => string[];
}

const BACKEND_SLUG: Record<ProductCategory, string> = {
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
  coolers: ['type', 'socket', 'tdp', 'fan_size', 'fan_count', 'noise', 'data_vykhoda_na_rynok'],
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

const SORT_PRESETS = [
  { value: 'price-asc', label: 'Цена: по возрастанию' },
  { value: 'price-desc', label: 'Цена: по убыванию' },
  { value: 'name-asc', label: 'Название: А–Я' },
  { value: 'name-desc', label: 'Название: Я–А' },
  { value: 'rating-desc', label: 'Рейтинг: выше' },
  { value: 'createdAt-desc', label: 'Сначала новые' },
] as const;

function parseSort(preset: string): {
  sortBy: 'price' | 'name' | 'rating' | 'createdAt';
  sortOrder: 'asc' | 'desc';
} {
  if (preset === 'price-asc') return { sortBy: 'price', sortOrder: 'asc' };
  if (preset === 'price-desc') return { sortBy: 'price', sortOrder: 'desc' };
  if (preset === 'name-asc') return { sortBy: 'name', sortOrder: 'asc' };
  if (preset === 'name-desc') return { sortBy: 'name', sortOrder: 'desc' };
  if (preset === 'rating-desc') return { sortBy: 'rating', sortOrder: 'desc' };
  if (preset === 'createdAt-desc') return { sortBy: 'createdAt', sortOrder: 'desc' };
  return { sortBy: 'createdAt', sortOrder: 'desc' };
}

function summaryToProduct(s: ProductSummary): Product {
  return {
    ...s,
    specifications: (s as Product).specifications ?? {},
  } as Product;
}

function extractSocket(specs: ProductSpecifications | undefined): string | null {
  if (!specs) return null;
  return (specs.socket as string) || (specs.cpuSocket as string) || null;
}

export function ComponentPickerModal({
  isOpen,
  onClose,
  category,
  slotType,
  slotLabel,
  currentProduct,
  buildContext,
  onConfirm,
  onRemoveCurrent,
  getDisplaySpecs,
}: ComponentPickerModalProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortPreset, setSortPreset] = useState<string>('price-asc');
  const [priceMinStr, setPriceMinStr] = useState('');
  const [priceMaxStr, setPriceMaxStr] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [facetFilters, setFacetFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!isOpen) return;
    setSearch('');
    setDebouncedSearch('');
    setSortPreset('price-asc');
    setPriceMinStr('');
    setPriceMaxStr('');
    setInStockOnly(false);
    setPage(1);
    setPageSize(12);
    setFacetFilters({});
    setHighlightedId(currentProduct?.id ?? null);
  }, [isOpen, category, currentProduct?.id]);

  const { sortBy, sortOrder } = useMemo(() => parseSort(sortPreset), [sortPreset]);

  const priceMin = useMemo(() => {
    const n = parseFloat(priceMinStr.replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [priceMinStr]);

  const priceMax = useMemo(() => {
    const n = parseFloat(priceMaxStr.replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [priceMaxStr]);

  const categorySlug = BACKEND_SLUG[category] ?? category;

  const compatibilitySpecs = useMemo(() => {
    const out: Record<string, string> = { ...facetFilters };
    const ctx = buildContext;
    if (!ctx) return out;
    if (slotType === 'cpu' && ctx.motherboard?.product) {
      const sock = extractSocket(ctx.motherboard.product.specifications);
      if (sock) out.socket = sock;
    }
    if (slotType === 'motherboard' && ctx.cpu?.product) {
      const sock = extractSocket(ctx.cpu.product.specifications);
      if (sock) out.socket = sock;
    }
    if (slotType === 'ram' && ctx.motherboard?.product) {
      const mt = ctx.motherboard.product.specifications?.memoryType as string | undefined;
      if (mt) out.memoryType = mt;
    }
    return out;
  }, [buildContext, slotType, facetFilters]);

  const { data: facetData } = useQuery({
    queryKey: ['picker-facets', categorySlug, compatibilitySpecs],
    queryFn: () =>
      catalogApi.getFilterFacets(categorySlug, {
        specifications: compatibilitySpecs,
      }),
    enabled: isOpen,
    staleTime: 60_000,
  });

  const queryParams = useMemo(
    () => ({
      category,
      page,
      pageSize,
      search: debouncedSearch || undefined,
      sortBy,
      sortOrder,
      priceMin,
      priceMax,
      inStock: inStockOnly ? true : undefined,
      specifications:
        Object.keys(compatibilitySpecs).length > 0 ? compatibilitySpecs : undefined,
    }),
    [
      category,
      page,
      pageSize,
      debouncedSearch,
      sortBy,
      sortOrder,
      priceMin,
      priceMax,
      inStockOnly,
      compatibilitySpecs,
    ]
  );

  const { data: productsResponse, isLoading, error, refetch } = useProducts(queryParams, {
    enabled: isOpen,
  });

  const products = productsResponse?.data ?? [];
  const meta = productsResponse?.meta;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortPreset, priceMinStr, priceMaxStr, inStockOnly, compatibilitySpecs, pageSize]);

  const handleFilterSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  }, []);

  const highlightedSummary = useMemo(() => {
    if (!highlightedId) return undefined;
    const fromList = products.find((p) => p.id === highlightedId);
    if (fromList) return fromList;
    if (currentProduct?.id === highlightedId) return currentProduct as ProductSummary;
    return undefined;
  }, [products, highlightedId, currentProduct]);

  const highlightedProduct = highlightedSummary ? summaryToProduct(highlightedSummary) : null;

  const { data: detailProduct, isLoading: detailLoading } = useQuery({
    queryKey: ['catalog-product', highlightedId],
    queryFn: () => catalogApi.getProduct(highlightedId!),
    enabled: isOpen && !!highlightedId,
    staleTime: 5 * 60_000,
  });

  const previewProduct = detailProduct ?? highlightedProduct;

  const previewSpecEntries = useMemo(() => {
    if (!previewProduct?.specifications) return [];
    const specs = previewProduct.specifications as Record<string, unknown>;
    return Object.keys(specs)
      .filter((k) => specs[k] != null && specs[k] !== '')
      .sort((a, b) => a.localeCompare(b))
      .map((k) => ({
        key: k,
        label: specLabel(k),
        value: formatSpecValueForKey(k, specs[k]),
      }));
  }, [previewProduct]);

  const previewShortSpecs = previewProduct
    ? getDisplaySpecs(slotType, previewProduct)
    : [];

  const handleConfirm = () => {
    if (!highlightedProduct) return;
    onConfirm(highlightedProduct);
  };

  const title = `Выбор: ${slotLabel}`;

  const order = SPEC_ORDER[categorySlug] ?? [];
  const attrMap = new Map((facetData ?? []).map((a) => [a.key, a]));
  const orderedKeys = [
    ...order.filter((k) => attrMap.has(k)),
  ];
  
  const facetSelects = orderedKeys
    .map((key) => attrMap.get(key))
    .filter((a): a is FilterFacetAttribute => !!a && a.filterType === 'select' && (a.options?.length ?? 0) > 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xlarge" showCloseButton>
      <div className={styles.root}>
        {currentProduct && (
          <div className={styles.currentBar}>
            <span className={styles.currentLabel}>
              В слоте сейчас: <strong>{currentProduct.name}</strong>
            </span>
            {onRemoveCurrent && (
              <button type="button" className={styles.btnDanger} onClick={onRemoveCurrent}>
                Снять выбор
              </button>
            )}
          </div>
        )}

        <form className={styles.toolbar} onSubmit={handleFilterSubmit}>
          <div className={styles.searchWrap}>
            <Search className={styles.searchIcon} size={18} aria-hidden />
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Поиск по названию…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Поиск по каталогу"
            />
          </div>
          <label className={styles.fieldLabel}>
            <span className={styles.fieldCaption}>Сортировка</span>
            <select
              className={styles.select}
              value={sortPreset}
              onChange={(e) => setSortPreset(e.target.value)}
            >
              {SORT_PRESETS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.fieldLabel}>
            <span className={styles.fieldCaption}>Цена от</span>
            <input
              type="text"
              inputMode="decimal"
              className={styles.inputNum}
              placeholder="0"
              value={priceMinStr}
              onChange={(e) => setPriceMinStr(e.target.value)}
            />
          </label>
          <label className={styles.fieldLabel}>
            <span className={styles.fieldCaption}>до</span>
            <input
              type="text"
              inputMode="decimal"
              className={styles.inputNum}
              placeholder="∞"
              value={priceMaxStr}
              onChange={(e) => setPriceMaxStr(e.target.value)}
            />
          </label>
          <label className={styles.checkLabel}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
            />
            <span>Только в наличии</span>
          </label>
        </form>

        {facetSelects.length > 0 && (
          <div className={styles.facetRow} role="group" aria-label="Фильтры по характеристикам">
            {facetSelects.map((attr) => (
              <label key={attr.key} className={styles.facetField}>
                <span className={styles.fieldCaption}>{attr.displayName}</span>
                <select
                  className={styles.selectSm}
                  value={facetFilters[attr.key] ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFacetFilters((prev) => {
                      const next = { ...prev };
                      if (!v) delete next[attr.key];
                      else next[attr.key] = v;
                      return next;
                    });
                  }}
                >
                  <option value="">Все</option>
                  {(attr.options ?? []).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.value} ({opt.count})
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        )}

        <div className={`${styles.body} ${highlightedProduct ? styles.bodyWithPreview : styles.bodyFullWidth}`}>
          <div className={styles.gridCol}>
            {isLoading && (
              <div className={styles.skeletonGrid}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={styles.skeletonCard}>
                    <Skeleton width="100%" height={120} borderRadius="sm" />
                    <Skeleton width="80%" height={14} borderRadius="sm" />
                    <Skeleton width="40%" height={12} borderRadius="sm" />
                  </div>
                ))}
              </div>
            )}

            {error && (
              <ApiErrorBanner message="Не удалось загрузить список комплектующих." onRetry={() => refetch()} />
            )}

            {!isLoading && !error && (
              <>
                {products.length === 0 ? (
                  <p className={styles.empty}>Нет товаров по заданным условиям.</p>
                ) : (
                  <div className={styles.grid} role="listbox" aria-label="Список товаров">
                    {products.map((p) => {
                      const url =
                        p.mainImage?.url && hasValidProductImage(p.mainImage.url)
                          ? getProductImageUrl(p.mainImage.url)
                          : null;
                      const selected = highlightedId === p.id;
                      const prod = summaryToProduct(p);
                      const specs = getDisplaySpecs(slotType, prod).slice(0, 2);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          className={`${styles.tile} ${selected ? styles.tileSelected : ''}`}
                          onClick={() => setHighlightedId(p.id)}
                        >
                          <div className={styles.tileImageWrap}>
                            {url ? (
                              <img src={url} alt="" className={styles.tileImg} loading="lazy" />
                            ) : (
                              <div className={styles.tilePlaceholder} aria-hidden />
                            )}
                          </div>
                          <span className={styles.tileName}>{p.name}</span>
                          {specs.length > 0 && (
                            <span className={styles.tileSpecs}>{specs.join(' · ')}</span>
                          )}
                          <span className={styles.tilePrice}>
                            {p.price.toLocaleString('ru-BY')} BYN
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {meta && meta.totalItems > 0 && (
                  <div className={styles.paginationWrap}>
                    <Pagination
                      page={page}
                      totalPages={meta.totalPages}
                      totalItems={meta.totalItems}
                      pageSize={pageSize}
                      onPageChange={(p) => {
                        setPage(p);
                        setHighlightedId(null);
                      }}
                      onPageSizeChange={(sz) => {
                        setPageSize(sz);
                        setPage(1);
                        setHighlightedId(null);
                      }}
                      showPageSizeSelector
                      showFirstLast
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {highlightedProduct && (
          <aside className={styles.preview} aria-label="Предпросмотр">
            <div className={styles.previewImageWrap}>
              {previewProduct &&
              previewProduct.mainImage?.url &&
              hasValidProductImage(previewProduct.mainImage.url) ? (
                <img
                  src={getProductImageUrl(previewProduct.mainImage.url) ?? undefined}
                  alt=""
                  className={styles.previewImg}
                />
              ) : (
                <div className={styles.previewPlaceholder} aria-hidden />
              )}
            </div>
            <h4 className={styles.previewTitle}>{previewProduct?.name ?? highlightedProduct.name}</h4>
            <p className={styles.previewPrice}>
              {(previewProduct ?? highlightedProduct).price.toLocaleString('ru-BY')} BYN
            </p>
            {typeof (previewProduct ?? highlightedProduct).stock === 'number' && (
              <p className={styles.previewStock}>
                {(previewProduct ?? highlightedProduct).stock! > 0
                  ? `В наличии: ${(previewProduct ?? highlightedProduct).stock}`
                  : 'Нет в наличии'}
              </p>
            )}
            {detailLoading && (
              <p className={styles.previewLoading}>Загрузка характеристик…</p>
            )}
            {previewShortSpecs.length > 0 && (
              <ul className={styles.previewSpecsShort}>
                {previewShortSpecs.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            )}
            {previewSpecEntries.length > 0 && (
              <div className={styles.previewSpecsFull}>
                <p className={styles.previewSpecsHeading}>Характеристики</p>
                <ul className={styles.previewSpecsList}>
                  {previewSpecEntries.map((row) => (
                    <li key={row.key}>
                      <span className={styles.specKey}>{row.label}</span>
                      <span className={styles.specVal}>{row.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleConfirm}
              disabled={
                typeof (previewProduct ?? highlightedProduct).stock === 'number' &&
                (previewProduct ?? highlightedProduct).stock! <= 0
              }
            >
              {typeof (previewProduct ?? highlightedProduct).stock === 'number' &&
              (previewProduct ?? highlightedProduct).stock! <= 0
                ? 'Нет в наличии'
                : 'Выбрать'}
            </button>
          </aside>
          )}
        </div>
      </div>
    </Modal>
  );
}
