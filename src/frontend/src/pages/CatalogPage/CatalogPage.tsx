import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  SlidersHorizontal,
  X,
  LayoutGrid,
  List,
  Table
} from 'lucide-react';
import { FilterSidebar, EmptyState, Pagination, ProductTable, ActiveFiltersBar, buildCatalogFilterChips } from '../../components/catalog';
import { ProductCard } from '../../components/ProductCard';
import { ProductCardSkeleton } from '../../components/ui/Skeleton';
import { ApiErrorBanner } from '../../components/ui/ApiErrorBanner';
import { catalogApi } from '../../api/catalog';
import { formatCountRu, RU_FORMS } from '../../utils/pluralizeRu';
import type { ProductSummary, ProductCategory, GetProductsParams } from '../../api/types';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs/Breadcrumbs';
import { CATEGORY_LABELS_RU } from '../../utils/categoryLabels';
import { ProductQuickViewContent } from '../../components/product/ProductQuickViewContent';
import { useModal } from '../../hooks/useModal';
import styles from './CatalogPage.module.css';
import { telemetryInitAutoFlush, telemetryTrack } from '../../utils/telemetry';

/**
 * Страница каталога товаров с Dark Gold темой
 */
const VALID_CATEGORIES: ProductCategory[] = [
  'cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooling', 'monitor', 'keyboard', 'mouse', 'headphones'
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.33, 1, 0.68, 1] as const
    }
  }
};

function resolveCategoryFromUrl(
  categoryParam: string | undefined,
  categoryQuery: string | null
): ProductCategory | null {
  const fromPath = categoryParam && VALID_CATEGORIES.includes(categoryParam as ProductCategory) ? categoryParam as ProductCategory : null;
  const fromQuery = categoryQuery && VALID_CATEGORIES.includes(categoryQuery as ProductCategory) ? categoryQuery as ProductCategory : null;
  return fromPath ?? fromQuery ?? null;
}

export function CatalogPage() {
  const PRICE_MIN = 0;
  const PRICE_MAX = 10000;
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

  const { category: categoryParam } = useParams<{ category?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isCategoryLocked = Boolean(categoryParam);
  
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const { openModal, closeModal } = useModal();
  
  // Инициализация и синхронизация категории из URL (path или query)
  const resolvedCategory = resolveCategoryFromUrl(categoryParam, searchParams.get('category'));
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(resolvedCategory);
  
  // Синхронизация selectedCategory при навигации (path или query изменились извне)
  useEffect(() => {
    setSelectedCategory(resolvedCategory);
  }, [resolvedCategory]);
  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get('search') || ''
  );
  const [page, setPage] = useState(() => {
    const p = parseInt(searchParams.get('page') || '1', 10);
    return isNaN(p) || p < 1 ? 1 : p;
  });
  const [pageSize, setPageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>(() => {
    const v = searchParams.get('view');
    return (v === 'list' || v === 'table') ? v : 'grid';
  });
  const [priceRange, setPriceRange] = useState(() => ({
    ...normalizePriceRange({
      min: parseInt(searchParams.get('priceMin') || '0'),
      max: parseInt(searchParams.get('priceMax') || '0'),
    }),
  }));
  const [sortBy, setSortBy] = useState(
    () => searchParams.get('sortBy') || 'popular'
  );
  const [selectedManufacturerIds, setSelectedManufacturerIds] = useState<string[]>(
    () => searchParams.get('manufacturerIds')?.split(',').filter(Boolean) || []
  );
  const [minRating, setMinRating] = useState(
    () => parseInt(searchParams.get('rating') || '0')
  );
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>(
    () => searchParams.get('availability')?.split(',').filter(Boolean) || ['in_stock']
  );
  const [selectedSpecifications, setSelectedSpecifications] = useState<Record<string, string | number | string[]>>(() => {
    const specStr = searchParams.get('specs');
    if (!specStr) return {};
    try {
      return JSON.parse(decodeURIComponent(specStr)) as Record<string, string | number | string[]>;
    } catch {
      return {};
    }
  });

  // === Telemetry (engagement baseline) ===
  const catalogStartTsRef = useRef<number>(performance.now());
  const filterChangeCountRef = useRef<number>(0);
  const firstInteractionSentRef = useRef<boolean>(false);

  useEffect(() => {
    telemetryInitAutoFlush();
  }, []);

  useEffect(() => {
    catalogStartTsRef.current = performance.now();
    filterChangeCountRef.current = 0;
    firstInteractionSentRef.current = false;
    telemetryTrack('catalog_view', {
      category: selectedCategory ?? 'all',
      viewMode,
    });
  }, [selectedCategory, viewMode]);

  // Синхронизация фильтров и страницы с URL (path + query)
  useEffect(() => {
    const params = new URLSearchParams();
    // When category is fixed via path (/catalog/:category), don't duplicate it in query string.
    if (selectedCategory && !isCategoryLocked) params.set('category', selectedCategory);
    if (searchQuery) params.set('search', searchQuery);
    if (priceRange.min > 0) params.set('priceMin', priceRange.min.toString());
    if (priceRange.max > 0) params.set('priceMax', priceRange.max.toString());
    if (sortBy !== 'popular') params.set('sortBy', sortBy);
    if (selectedManufacturerIds.length > 0) params.set('manufacturerIds', selectedManufacturerIds.join(','));
    if (minRating > 0) params.set('rating', minRating.toString());
    if (selectedAvailability.length > 0) params.set('availability', selectedAvailability.join(','));
    if (Object.keys(selectedSpecifications).length > 0) {
      params.set('specs', encodeURIComponent(JSON.stringify(selectedSpecifications)));
    }
    if (viewMode !== 'grid') params.set('view', viewMode);
    if (page > 1) params.set('page', page.toString());

    // Stay on current path if we are at /catalog/:category and THAT category is selected.
    // Otherwise (if at /catalog OR if category changed while on a locked path), stay on /catalog.
    const path = (isCategoryLocked && selectedCategory === categoryParam)
      ? `/catalog/${categoryParam}`
      : '/catalog';

    // If we are NOT on a locked path, but a category is selected, add it to query params
    if (selectedCategory && path === '/catalog') {
      params.set('category', selectedCategory);
    }

    const finalQueryString = params.toString();
    const fullPath = finalQueryString ? `${path}?${finalQueryString}` : path;
    navigate(fullPath, { replace: true });
  }, [selectedCategory, isCategoryLocked, searchQuery, priceRange, sortBy, selectedManufacturerIds, minRating, selectedAvailability, selectedSpecifications, page, navigate, viewMode, categoryParam]);

  const filterDeps = [
    selectedCategory,
    searchQuery,
    priceRange,
    sortBy,
    selectedManufacturerIds,
    minRating,
    selectedAvailability,
    selectedSpecifications,
  ];

  const isInitialMount = useRef(true);

  // Сброс на стр. 1 при изменении фильтров или pageSize (не на первый рендер — чтим page из URL)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setPage(1);
  }, [...filterDeps, pageSize]);

  useEffect(() => {
    if (isInitialMount.current) return;
    filterChangeCountRef.current += 1;
    if (!firstInteractionSentRef.current) {
      firstInteractionSentRef.current = true;
      telemetryTrack('catalog_first_interaction', {
        msSinceView: Math.round(performance.now() - catalogStartTsRef.current),
        category: selectedCategory ?? 'all',
      });
    }
    telemetryTrack('catalog_filters_changed', {
      count: filterChangeCountRef.current,
      category: selectedCategory ?? 'all',
    });
  }, [selectedCategory, searchQuery, priceRange, sortBy, selectedManufacturerIds, minRating, selectedAvailability, selectedSpecifications]);

  // Загрузка при смене страницы, фильтров или pageSize
  useEffect(() => {
    fetchProducts(page);
  }, [page, pageSize, ...filterDeps]);

  const manufacturersById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) {
      if (p.manufacturer?.id && p.manufacturer?.name) {
        map.set(p.manufacturer.id, p.manufacturer.name);
      }
    }
    return map;
  }, [products]);

  const fetchProducts = async (pageNum: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const params: GetProductsParams = {
        page: pageNum,
        pageSize,
      };
      
      if (selectedCategory) {
        params.category = selectedCategory;
      }
      
      if (searchQuery) {
        params.search = searchQuery;
      }

      if (priceRange.min > 0) {
        params.priceMin = priceRange.min;
      }

      if (priceRange.max > 0) {
        params.priceMax = priceRange.max;
      }

      if (selectedManufacturerIds.length > 0) {
        params.manufacturerIds = selectedManufacturerIds;
      }

      // Маппинг sortBy на API параметры
      if (sortBy === 'price-asc') {
        params.sortBy = 'price';
        params.sortOrder = 'asc';
      } else if (sortBy === 'price-desc') {
        params.sortBy = 'price';
        params.sortOrder = 'desc';
      } else if (sortBy === 'rating') {
        params.sortBy = 'rating';
        params.sortOrder = 'desc';
      } else if (sortBy === 'newest') {
        params.sortBy = 'createdAt';
        params.sortOrder = 'desc';
      } else if (sortBy === 'name') {
        params.sortBy = 'name';
        params.sortOrder = 'asc';
      }

      // Фильтр по минимальному рейтингу
      if (minRating > 0) {
        params.rating = minRating;
      }

      // Фильтр по наличию: при выборе обоих (in_stock + on_order) — не передаём inStock (показать всё)
      const hasInStock = selectedAvailability.includes('in_stock');
      const hasOnOrder = selectedAvailability.includes('on_order');
      if (hasInStock && !hasOnOrder) {
        params.inStock = true;
      } else if (hasOnOrder && !hasInStock) {
        params.inStock = false;
      }
      // selectedAvailability.length === 0 — по умолчанию только в наличии
      if (selectedAvailability.length === 0) {
        params.inStock = true;
      }

      // Фильтр по характеристикам: разделяем select (в т.ч. мультивыбор) и range
      const specsSelect: Record<string, string | number | string[]> = {};
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
            specsSelect[k] = typeof v === 'number' ? v : str;
          }
        }
      }
      if (Object.keys(specsSelect).length > 0) params.specifications = specsSelect;
      if (Object.keys(specsRange).length > 0) params.specificationRanges = specsRange;
      
      const response = await catalogApi.getProducts(params);
      
      setProducts(response.data);
      setTotalPages(response.meta.totalPages);
      setTotalItems(response.meta.totalItems);
      setHasLoadedOnce(true);

      if (response.data.length === 0) {
        telemetryTrack('catalog_empty_state', {
          category: selectedCategory ?? 'all',
          filterChangeCount: filterChangeCountRef.current,
        });
      }
    } catch (err) {
      setError('Не удалось загрузить товары. Попробуйте позже.');
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const openQuickView = useCallback(
    async (productId: string) => {
      telemetryTrack('catalog_quick_view_open', { productId, category: selectedCategory ?? 'all' });
      try {
        const product = await catalogApi.getProduct(productId);
        openModal({
          title: product.name ?? 'Быстрый просмотр',
          size: 'large',
          content: (
            <ProductQuickViewContent
              product={product}
              onClose={closeModal}
            />
          ),
        });
      } catch (err) {
        console.error('Failed to load product for quick view:', err);
      }
    },
    [selectedCategory, openModal, closeModal]
  );

  const catalogScrollAnchorRef = useRef<HTMLDivElement>(null);

  const handlePageChange = useCallback((newPage: number) => {
    const clamped = Math.max(1, Math.min(newPage, totalPages));
    setPage(clamped);
    requestAnimationFrame(() => {
      catalogScrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [totalPages]);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    requestAnimationFrame(() => {
      catalogScrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts(1);
  };

  const handleCategoryChange = (category: ProductCategory | null) => {
    setSelectedCategory(category);
    setSelectedSpecifications({});
    setPage(1);
    setMobileFilterOpen(false);
  };

  const handlePriceChange = useCallback((range: { min: number; max: number }) => {
    // Prevent feedback loop:
    // FilterSidebar -> onPriceChange -> CatalogPage -> re-render -> FilterSidebar sync -> ...
    // If values didn't actually change, don't touch state (keeps references stable).
    setPriceRange((prev) => {
      if (prev.min === range.min && prev.max === range.max) return prev;
      return range;
    });
  }, []);

  const handleResetFilters = () => {
    setSelectedCategory(null);
    setPriceRange({ min: 0, max: 0 });
    setSelectedManufacturerIds([]);
    setMinRating(0);
    setSelectedAvailability(['in_stock']);
    setSelectedSpecifications({});
    setPage(1);
    setSearchQuery('');
  };

  const activeFilterCount =
    (searchQuery.trim() ? 1 : 0) +
    (priceRange.min > 0 || priceRange.max > 0 ? 1 : 0) +
    (selectedManufacturerIds.length > 0 ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    ((selectedAvailability.length !== 1 || selectedAvailability[0] !== 'in_stock') ? 1 : 0) +
    (Object.keys(selectedSpecifications).length > 0 ? 1 : 0);

  const chips = buildCatalogFilterChips({
    isCategoryLocked,
    selectedCategory,
    searchQuery,
    priceRange,
    selectedManufacturerIds,
    manufacturersById,
    minRating,
    selectedAvailability,
    selectedSpecifications,
    onClearSearch: () => setSearchQuery(''),
    onClearPrice: () => setPriceRange({ min: 0, max: 0 }),
    onClearManufacturers: () => setSelectedManufacturerIds([]),
    onClearRating: () => setMinRating(0),
    onClearAvailability: () => setSelectedAvailability(['in_stock']),
    onClearSpecKey: (key) => {
      setSelectedSpecifications((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    onClearCategory: () => setSelectedCategory(null),
  });

  const handleAddToCart = (_productId: string) => {
    // ProductCard already adds to cart via useCart; callback for optional analytics
    telemetryTrack('catalog_add_to_cart', {
      category: selectedCategory ?? 'all',
      viewMode,
    });
  };

  return (
    <div className={styles.container} role="main" aria-label="Каталог товаров GoldPC">
      {/* Mobile Filter Toggle */}
      <button 
        className={styles.mobileFilterToggle}
        onClick={() => setMobileFilterOpen(true)}
        aria-label="Открыть фильтры"
        aria-expanded={mobileFilterOpen}
        aria-controls="mobile-filter-sidebar"
      >
        <SlidersHorizontal size={20} />
        <span>Фильтры</span>
      </button>

      {/* Mobile Filter Overlay */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <div className={styles.mobileOverlay} onClick={() => setMobileFilterOpen(false)}>
            <motion.div 
              id="mobile-filter-sidebar"
              className={styles.mobileSidebar}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              role="complementary"
              aria-label="Боковая панель фильтров"
            >
              <div className={styles.mobileSidebarHeader}>
                <h2 className={styles.mobileSidebarTitle}>Фильтры</h2>
                <button 
                  className={styles.closeBtn}
                  onClick={() => setMobileFilterOpen(false)}
                  aria-label="Закрыть панель фильтров"
                >
                  <X size={24} />
                </button>
              </div>
              <FilterSidebar
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
                categoryLocked={isCategoryLocked}
                priceRange={priceRange}
                onPriceChange={handlePriceChange}
                selectedManufacturerIds={selectedManufacturerIds}
                onManufacturerIdsChange={setSelectedManufacturerIds}
                minRating={minRating}
                onRatingChange={setMinRating}
                selectedAvailability={selectedAvailability}
                onAvailabilityChange={setSelectedAvailability}
                selectedSpecifications={selectedSpecifications}
                onSpecificationsChange={setSelectedSpecifications}
                onReset={handleResetFilters}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar - 20% width */}
      <div className={styles.sidebarWrapper}>
        <FilterSidebar
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          categoryLocked={isCategoryLocked}
          priceRange={priceRange}
          onPriceChange={handlePriceChange}
          selectedManufacturerIds={selectedManufacturerIds}
          onManufacturerIdsChange={setSelectedManufacturerIds}
          minRating={minRating}
          onRatingChange={setMinRating}
          selectedAvailability={selectedAvailability}
          onAvailabilityChange={setSelectedAvailability}
          selectedSpecifications={selectedSpecifications}
          onSpecificationsChange={setSelectedSpecifications}
          onReset={handleResetFilters}
        />
      </div>

      {/* Main Content - 80% width */}
      <main className={styles.main}>
        {/* Page Header */}
        <header className={styles.header}>
          <Breadcrumbs
            items={
              selectedCategory
                ? [
                    { label: 'Главная', to: '/' },
                    { label: 'Каталог', to: '/catalog' },
                    { label: CATEGORY_LABELS_RU[selectedCategory] },
                  ]
                : [
                    { label: 'Главная', to: '/' },
                    { label: 'Каталог' },
                  ]
            }
          />
          <h1 className={styles.title}>Каталог комплектующих</h1>
          <p className={styles.stats}>
            {totalItems > 0 ? `Всего ${formatCountRu(totalItems, RU_FORMS.tovar)}` : 'Товары не найдены'}
          </p>
        </header>

        {/* Toolbar — якорь для прокрутки при смене страницы */}
        <div ref={catalogScrollAnchorRef} className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <button 
              className={styles.mobileFilterBtn}
              onClick={() => setMobileFilterOpen(true)}
            >
              <SlidersHorizontal size={16} />
              Фильтры
            </button>
            <div className={styles.viewToggle}>
              <button 
                className={`${styles.viewToggleBtn} ${viewMode === 'grid' ? styles.active : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Сетка"
              >
                <LayoutGrid size={16} />
              </button>
              <button 
                className={`${styles.viewToggleBtn} ${viewMode === 'list' ? styles.active : ''}`}
                onClick={() => setViewMode('list')}
                aria-label="Список"
              >
                <List size={16} />
              </button>
              <button 
                className={`${styles.viewToggleBtn} ${viewMode === 'table' ? styles.active : ''}`}
                onClick={() => setViewMode('table')}
                aria-label="Таблица"
              >
                <Table size={16} />
              </button>
            </div>
          </div>
          <div className={styles.toolbarRight}>
            <form className={styles.searchForm} onSubmit={handleSearch}>
              <div className={styles.searchWrapper}>
                <Search size={18} className={styles.searchIcon} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Поиск в каталоге..."
                  aria-label="Поиск в каталоге"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
            <select 
              className={styles.sortSelect}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="popular">По популярности</option>
              <option value="price-asc">Сначала дешевле</option>
              <option value="price-desc">Сначала дороже</option>
              <option value="rating">По рейтингу</option>
              <option value="newest">По новизне</option>
              <option value="name">По названию</option>
            </select>
          </div>
        </div>

        <ActiveFiltersBar
          chips={chips}
          activeCount={activeFilterCount}
          onClearAll={handleResetFilters}
        />

        {/* Loading State - Skeleton only for first load */}
        {loading && !hasLoadedOnce && (
          <div className={`${styles.grid} ${viewMode === 'list' ? styles.listView : ''} ${viewMode === 'table' ? styles.tableView : ''}`}>
            {Array.from({ length: 12 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className={styles.errorState}>
            <ApiErrorBanner message={error} onRetry={() => fetchProducts(page)} />
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && hasLoadedOnce && products.length === 0 && (
          <div className={styles.emptyStateWrapper}>
            <EmptyState
              title="0 товаров по выбранным фильтрам"
              description="Попробуйте снять один из фильтров ниже или сбросить всё — так вы быстрее найдёте подходящий вариант."
              onReset={handleResetFilters}
              actions={[
                ...(priceRange.min > 0 || priceRange.max > 0
                  ? [{ label: 'Снять цену', onClick: () => setPriceRange({ min: 0, max: 0 }) }]
                  : []),
                ...(selectedManufacturerIds.length > 0
                  ? [{ label: 'Снять бренды', onClick: () => setSelectedManufacturerIds([]) }]
                  : []),
                ...(Object.keys(selectedSpecifications).length > 0
                  ? [{ label: 'Сбросить характеристики', onClick: () => setSelectedSpecifications({}) }]
                  : []),
                ...(searchQuery.trim()
                  ? [{ label: 'Очистить поиск', onClick: () => setSearchQuery('') }]
                  : []),
              ]}
            />
          </div>
        )}

        {/* Product Grid - 4 columns */}
        {!error && products.length > 0 && (
          <>
            {viewMode === 'table' ? (
              <ProductTable products={products} onAddToCart={handleAddToCart} />
            ) : (
              <div className={styles.gridWrapper}>
                <motion.div 
                  className={`${styles.grid} ${viewMode === 'list' ? styles.listView : ''}`}
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {products.map((product, index) => (
                    <motion.div key={product.id} variants={itemVariants} className={styles.gridItem}>
                      <ProductCard 
                        product={product} 
                        onAddToCart={handleAddToCart}
                        onQuickView={openQuickView}
                        viewMode={viewMode}
                        imageFetchPriority={viewMode === 'grid' && index < 4 ? 'high' : undefined}
                      />
                    </motion.div>
                  ))}
                </motion.div>
                {loading && hasLoadedOnce && (
                  <div className={styles.loadingOverlay} aria-hidden="true">
                    <div className={styles.loadingOverlayInner}>
                      <span className={styles.spinnerIcon}>⟳</span>
                      <span>Обновляем список…</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {totalItems > 0 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                showPageSizeSelector={true}
                showFirstLast={totalPages > 5}
                disabled={loading}
              />
            )}
          </>
        )}

      </main>
    </div>
  );
}