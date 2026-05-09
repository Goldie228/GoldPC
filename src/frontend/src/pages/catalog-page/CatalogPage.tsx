import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { Search, X, SlidersHorizontal, LayoutGrid, List, Table2 } from 'lucide-react';
import { FilterSidebar } from '../../components/filter-sidebar/FilterSidebar';
import { Pagination } from '../../components/catalog/Pagination';
import { ProductTable } from '../../components/catalog/ProductTable';
import { buildCatalogFilterChips } from '../../components/catalog/ActiveFiltersBar';
import { ProductCard } from '../../components/product-card/ProductCard';
import { ProductCardSkeleton } from '../../components/ui/Skeleton';
import { ProductGrid } from '../../components/catalog/ProductGrid';
import { ProductList } from '../../components/catalog/ProductList';
import { useCatalog } from '../../hooks/useCatalog';
import { useDebounce } from '../../hooks/useDebounce';
import { formatCountRu, RU_FORMS } from '../../utils/pluralizeRu';
import type { ProductSummary, ProductCategory, GetProductsParams } from '../../api/types';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';
import { CATEGORY_LABELS_RU } from '../../utils/categoryLabels';
import { telemetryInitAutoFlush, telemetryTrack } from '../../utils/telemetry';

const VALID_CATEGORIES: ProductCategory[] = [
  'cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooling', 'monitor', 'keyboard', 'mouse', 'headphones'
];

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
  const { getProducts } = useCatalog();
  
  const resolvedCategory = resolveCategoryFromUrl(categoryParam, searchParams.get('category'));
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(resolvedCategory);
  
  useEffect(() => {
    setSelectedCategory(resolvedCategory);
  }, [resolvedCategory]);

  // Reset price bounds when category changes to force recomputation
  useEffect(() => {
    setPriceBounds({ min: 0, max: 0 });
  }, [selectedCategory]);

  // Filter state — must be declared before useEffect that references them (fetchPriceBounds)
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
    () => searchParams.get('availability')?.split(',').filter(Boolean) || []
  );
  const [selectedSpecifications, setSelectedSpecifications] = useState<Record<string, string[]>>(
    () => {
      const specParam = searchParams.get('specs');
      if (!specParam) return {};
      try {
        return JSON.parse(decodeURIComponent(specParam));
      } catch {
        return {};
      }
    }
  );

  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get('search') || ''
  );
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [page, setPage] = useState(() => {
    const p = parseInt(searchParams.get('page') || '1', 10);
    return isNaN(p) || p < 1 ? 1 : p;
  });
  const [pageSize, setPageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
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
  const debouncedPriceRange = useDebounce(priceRange, 300);

  // Price bounds - computed WITHOUT price filter, using all other active filters
  const [priceBounds, setPriceBounds] = useState<{ min: number; max: number }>({ min: 0, max: 10000 });
  const [priceBoundsLoading, setPriceBoundsLoading] = useState(false);

  // Fetch price bounds without price filter
  useEffect(() => {
    const fetchPriceBounds = async () => {
      setPriceBoundsLoading(true);
      try {
        // Build params with all filters EXCEPT price
        const params: any = {};
        if (selectedCategory) params.category = selectedCategory;
        if (debouncedSearchQuery.trim()) params.search = debouncedSearchQuery.trim();
        if (selectedManufacturerIds.length > 0) params.manufacturerIds = selectedManufacturerIds;
        if (minRating > 0) params.minRating = minRating;
        if (selectedAvailability.length > 0) {
          params.inStock = selectedAvailability.includes('in_stock');
          params.lowStock = selectedAvailability.includes('low_stock');
        }
        if (Object.keys(selectedSpecifications).length > 0) {
          params.specifications = selectedSpecifications;
        }
        params.page = 1;
        params.pageSize = 10000; // Get enough products to find real bounds

        const result = await getProducts(params);
        const prices = (result?.data ?? []).map((p: any) => p.price).filter((p: number) => p > 0);
        if (prices.length > 0) {
          setPriceBounds({
            min: Math.floor(Math.min(...prices)),
            max: Math.floor(Math.max(...prices)),
          });
        }
      } catch (err) {
        console.error('Failed to fetch price bounds:', err);
      } finally {
        setPriceBoundsLoading(false);
      }
    };

    fetchPriceBounds();
  }, [selectedCategory, debouncedSearchQuery, selectedManufacturerIds, minRating, selectedAvailability, selectedSpecifications, getProducts]);
  const computedPriceRange = priceBounds;

  const catalogScrollAnchorRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const buildApiParams = useCallback((): GetProductsParams => {
    const params: GetProductsParams = {
      page,
      pageSize,
    };

    if (selectedCategory) params.category = selectedCategory;
    if (debouncedSearchQuery.trim()) params.search = debouncedSearchQuery.trim();
    if (debouncedPriceRange.min > 0) params.priceMin = debouncedPriceRange.min;
    if (debouncedPriceRange.max > 0 && debouncedPriceRange.max < PRICE_MAX) params.priceMax = debouncedPriceRange.max;
    if (selectedManufacturerIds.length > 0) params.manufacturerIds = selectedManufacturerIds;
    if (minRating > 0) params.minRating = minRating;
    if (selectedAvailability.length > 0) {
      params.inStock = selectedAvailability.includes('in_stock');
      params.lowStock = selectedAvailability.includes('low_stock');
    }
    if (Object.keys(selectedSpecifications).length > 0) {
      params.specifications = selectedSpecifications;
    }

    switch (sortBy) {
      case 'price-asc':
        params.sortBy = 'price';
        params.sortOrder = 'asc';
        break;
      case 'price-desc':
        params.sortBy = 'price';
        params.sortOrder = 'desc';
        break;
      case 'rating':
        params.sortBy = 'rating';
        params.sortOrder = 'desc';
        break;
      case 'newest':
        params.sortBy = 'createdAt';
        params.sortOrder = 'desc';
        break;
      case 'name':
        params.sortBy = 'name';
        params.sortOrder = 'asc';
        break;
      default:
        params.sortBy = 'popularity';
        params.sortOrder = 'desc';
    }

    return params;
  }, [selectedCategory, debouncedSearchQuery, debouncedPriceRange, selectedManufacturerIds, minRating, selectedAvailability, selectedSpecifications, sortBy, page, pageSize]);

  const fetchProducts = useCallback(async (pageNum?: number) => {
    const targetPage = pageNum ?? page;
    setLoading(true);
    setError(null);

    try {
      const params = buildApiParams();
      params.page = targetPage;
      
      const result = await getProducts(params);
      
      // Defensive: ensure result has expected structure
      const items = result?.data ?? [];
      const meta = result?.meta ?? { totalPages: 1, totalItems: 0 };
      
      setProducts(items);
      setTotalPages(meta.totalPages ?? 1);
      setTotalItems(meta.totalItems ?? 0);
      setHasLoadedOnce(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load products';
      setError(message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [buildApiParams, getProducts, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();
    
    if (selectedCategory && !isCategoryLocked) {
      params.set('category', selectedCategory);
    }
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (page > 1) params.set('page', page.toString());
    if (viewMode !== 'grid') params.set('view', viewMode);
    if (sortBy !== 'popular') params.set('sortBy', sortBy);
    if (priceRange.min > 0) params.set('priceMin', priceRange.min.toString());
    if (priceRange.max > 0 && priceRange.max < PRICE_MAX) params.set('priceMax', priceRange.max.toString());
    if (selectedManufacturerIds.length > 0) params.set('manufacturerIds', selectedManufacturerIds.join(','));
    if (minRating > 0) params.set('rating', minRating.toString());
    if (selectedAvailability.length > 0) params.set('availability', selectedAvailability.join(','));
    if (Object.keys(selectedSpecifications).length > 0) {
      params.set('specs', encodeURIComponent(JSON.stringify(selectedSpecifications)));
    }

    const queryString = params.toString();
    const path = selectedCategory && isCategoryLocked 
      ? `/catalog/${selectedCategory}` 
      : '/catalog';
    
    navigate(queryString ? `${path}?${queryString}` : path, { replace: true });
  }, [selectedCategory, isCategoryLocked, searchQuery, page, viewMode, sortBy, priceRange, selectedManufacturerIds, minRating, selectedAvailability, selectedSpecifications, navigate]);

  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const query = searchInputRef.current?.value || '';
    setSearchQuery(query);
    setPage(1);
    telemetryTrack('catalog_search', { query, category: selectedCategory });
  }, [selectedCategory]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    catalogScrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  }, []);

  const handleCategoryChange = useCallback((category: ProductCategory | null) => {
    setSelectedCategory(category);
    setPage(1);
    telemetryTrack('catalog_category_change', { category });
  }, []);

  const handlePriceChange = useCallback((range: { min: number; max: number }) => {
    setPriceRange(range);
    setPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setSelectedCategory(isCategoryLocked ? selectedCategory : null);
    setPriceRange({ min: 0, max: 0 });
    setSelectedManufacturerIds([]);
    setMinRating(0);
    setSelectedAvailability([]);
    setSelectedSpecifications({});
    setSearchQuery('');
    setPage(1);
    telemetryTrack('catalog_filters_reset');
  }, [isCategoryLocked, selectedCategory]);

  // Build manufacturersById map for filter chips
  const manufacturersById = useMemo(() => {
    const map = new Map<string, string>();
    // This would normally come from API, but for chips we just need the selected ones
    selectedManufacturerIds.forEach(id => {
      // In real app, you'd look up the name from a manufacturers list
      map.set(id, id); // placeholder: use id as name
    });
    return map;
  }, [selectedManufacturerIds]);

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
    onClearAvailability: () => setSelectedAvailability([]),
    onClearSpecKey: (key: string) => setSelectedSpecifications(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    }),
    onClearCategory: () => handleCategoryChange(null),
  });

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory && !isCategoryLocked) count++;
    if (priceRange.min > 0 || priceRange.max > 0) count++;
    if (selectedManufacturerIds.length > 0) count++;
    if (minRating > 0) count++;
    if (selectedAvailability.length > 0) count++;
    if (Object.keys(selectedSpecifications).length > 0) count++;
    return count;
  }, [selectedCategory, isCategoryLocked, priceRange, selectedManufacturerIds, minRating, selectedAvailability, selectedSpecifications]);

  const handleAddToCart = (_productId: string) => {
    telemetryTrack('catalog_add_to_cart', {
      category: selectedCategory ?? 'all',
      viewMode,
    });
  };

  const categoryName = selectedCategory 
    ? CATEGORY_LABELS_RU[selectedCategory] 
    : 'Все товары';

  return (
    <div className="min-h-screen bg-[#0b0e11] flex flex-col">
       {/* Catalog toolbar — title + search + sort */}
       <div className="bg-surface-card">
         <div className="max-w-[1440px] mx-auto px-4 md:px-8">
           {/* Row 1 — Title + Search (center) + View toggle + Filter button (right) */}
            <div className="flex flex-row items-center gap-2 pt-2 pb-2">
               {/* Left: Title + count */}
               <div className="flex items-baseline gap-2 flex-shrink-0">
                 <div className="font-bold text-body-text tracking-tight" style={{ fontSize: '24px' }}>{categoryName}</div>
                 <span className="text-xs md:text-sm text-muted-text font-tabular">
                   {totalItems > 0 ? `${formatCountRu(totalItems, RU_FORMS.tovar)}` : 'Товары не найдены'}
                 </span>
               </div>

               {/* Center: Search — desktop (inline) */}
               <div className="flex justify-center items-center flex-1">
                 {/* Desktop search bar */}
                 <form
                   className="hidden sm:flex items-center gap-0 w-full max-w-[280px] flex-1"
                   onSubmit={handleSearch}
                 >
                   <input
                     type="text"
                     ref={searchInputRef}
                     className="h-9 w-full bg-surface-elevated text-body-text text-sm rounded-l-lg py-1.5 pl-4 pr-3 placeholder:text-muted-text focus:outline-none focus:ring-2 focus:ring-gold/30 border border-hairline-dark border-r-0 focus:border-gold/40 transition-all"
                     placeholder={`В «${categoryName}»`}
                     aria-label="Поиск в каталоге"
                     defaultValue={searchQuery}
                   />
                   <button
                     type="submit"
                     className="h-9 px-3 bg-gold text-gold-ink text-sm font-semibold rounded-r-lg hover:bg-gold-active transition-colors flex items-center"
                   >
                     <Search size={16} />
                   </button>
                 </form>
               </div>

               {/* Right: View toggle (desktop) + Mobile filter + search buttons */}
               <div className="flex items-center gap-3 flex-shrink-0">
                 {/* View toggle — desktop only */}
                 <div className="hidden md:flex items-center bg-surface-elevated rounded-lg p-0.5 border border-hairline-dark">
                   {[
                     { value: 'grid' as const, icon: <LayoutGrid size={18} /> },
                     { value: 'list' as const, icon: <List size={18} /> },
                     { value: 'table' as const, icon: <Table2 size={18} /> },
                   ].map(mode => (
                     <button
                       key={mode.value}
                       onClick={() => setViewMode(mode.value)}
                       className={`w-8 h-7 rounded-md flex items-center justify-center transition-all ${
                         viewMode === mode.value
                           ? 'bg-gold text-gold-ink shadow-sm'
                           : 'text-muted-text hover:text-body-text'
                       }`}
                       title={mode.value === 'grid' ? 'Сетка' : mode.value === 'list' ? 'Список' : 'Таблица'}
                     >
                       {mode.icon}
                     </button>
                   ))}
                 </div>

                 {/* Mobile search button */}
                 <button
                   onClick={() => setSearchModalOpen(true)}
                   className="sm:hidden h-9 px-2 bg-surface-elevated text-body-text text-sm rounded-lg border border-hairline-dark flex items-center gap-1 hover:bg-surface-card transition-colors"
                   aria-label="Поиск в каталоге"
                 >
                   <Search size={16} />
                 </button>

                 {/* Mobile filter button — compact icon + badge */}
                 <button
                   onClick={() => setMobileFilterOpen(true)}
                   className="lg:hidden h-9 px-2 bg-surface-elevated text-body-text text-sm rounded-lg border border-hairline-dark flex items-center gap-1 hover:bg-surface-card transition-colors relative"
                 >
                   <SlidersHorizontal size={16} />
                   {activeFilterCount > 0 && (
                     <span className="absolute -top-1 -right-1 h-4 w-4 bg-gold text-gold-ink text-[11px] font-bold rounded-full flex items-center justify-center">
                       {activeFilterCount}
                     </span>
                   )}
                 </button>
               </div>
             </div>
         </div>
       </div>

       {/* Main Content Area */}
       <div className="flex-1 w-full max-w-[1440px] mx-auto px-6 md:px-10 pt-6">
         <div className="flex gap-6">
          {/* Desktop Sidebar - 280px width */}
             <div className="hidden lg:block w-[280px] flex-shrink-0">
              <FilterSidebar
                 selectedCategory={selectedCategory}
                 onCategoryChange={handleCategoryChange}
                 categoryLocked={isCategoryLocked}
                 priceRange={priceRange}
                 onPriceChange={handlePriceChange}
                 priceMin={computedPriceRange.min}
                 priceMax={computedPriceRange.max}
                 selectedManufacturerIds={selectedManufacturerIds}
                 onManufacturerIdsChange={setSelectedManufacturerIds}
                 minRating={minRating}
                 onRatingChange={setMinRating}
                 selectedAvailability={selectedAvailability}
                 onAvailabilityChange={setSelectedAvailability}
                 selectedSpecifications={selectedSpecifications}
                 onSpecificationsChange={setSelectedSpecifications}
                 onReset={handleResetFilters}
                 totalItems={totalItems}
                 sortBy={sortBy}
                 onSortChange={setSortBy}
                 viewMode={viewMode}
                 onViewModeChange={setViewMode}
             />
          </div>

          {/* Product List Area */}
          <div className="flex-1 min-w-0">
            {/* Mobile Filter Overlay */}
            {mobileFilterOpen && (
              <div className="fixed inset-0 bg-canvas-dark/92 backdrop-blur-[4px] z-[1000] lg:hidden" onClick={() => setMobileFilterOpen(false)}>
                <div 
                  className="absolute left-0 top-0 bottom-0 w-[90vw] max-w-[380px] bg-surface-elevated overflow-y-auto"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between p-5 pb-4 border-b border-hairline-dark">
                    <h2 className="text-sm font-bold text-body-text flex items-center gap-2">
                      Фильтры
                      {activeFilterCount > 0 && (
                        <span className="h-5 min-w-5 px-1.5 bg-gold text-gold-ink text-[12px] font-bold rounded-full flex items-center justify-center">
                          {activeFilterCount}
                        </span>
                      )}
                    </h2>
                    <button 
                      className="flex items-center justify-center w-9 h-9 bg-surface-elevated border border-hairline-dark rounded-lg text-muted-text hover:bg-gold/10 hover:border-gold/30 hover:text-gold transition-all"
                      onClick={() => setMobileFilterOpen(false)}
                      aria-label="Закрыть панель фильтров"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="p-5">
                    <FilterSidebar
                          mobile
                          selectedCategory={selectedCategory}
                          onCategoryChange={handleCategoryChange}
                          categoryLocked={isCategoryLocked}
                          priceRange={priceRange}
                          onPriceChange={handlePriceChange}
                          priceMin={computedPriceRange.min}
                          priceMax={computedPriceRange.max}
                          selectedManufacturerIds={selectedManufacturerIds}
                          onManufacturerIdsChange={setSelectedManufacturerIds}
                          minRating={minRating}
                          onRatingChange={setMinRating}
                          selectedAvailability={selectedAvailability}
                          onAvailabilityChange={setSelectedAvailability}
                          selectedSpecifications={selectedSpecifications}
                          onSpecificationsChange={setSelectedSpecifications}
                          onReset={handleResetFilters}
                          totalItems={totalItems}
                          sortBy={sortBy}
                          onSortChange={setSortBy}
                          viewMode={viewMode}
                          onViewModeChange={setViewMode}
                        />
                  </div>
                </div>
              </div>
            )}

            {/* Search Modal */}
            {searchModalOpen && (
              <div className="fixed inset-0 bg-canvas-dark/92 backdrop-blur-[4px] z-[1000] lg:hidden" onClick={() => setSearchModalOpen(false)}>
                <div 
                  className="absolute left-0 right-0 top-0 p-5 pb-4 bg-surface-elevated border-b border-hairline-dark flex items-center gap-3"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                >
                  <form className="flex-1 flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); setSearchModalOpen(false); handleSearch(e); }}>
                    <input
                      type="text"
                      className="flex-1 h-9 bg-canvas-dark text-body-text text-sm rounded-lg py-1.5 pl-4 pr-3 placeholder:text-muted-text focus:outline-none focus:ring-2 focus:ring-gold/30 border border-hairline-dark transition-all"
                      placeholder={`В «${categoryName}»`}
                      aria-label="Поиск в каталоге"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="h-9 px-3 bg-gold text-gold-ink text-sm font-semibold rounded-lg hover:bg-gold-active transition-colors flex items-center"
                    >
                      <Search size={16} />
                    </button>
                  </form>
                  <button 
                    className="flex items-center justify-center w-9 h-9 bg-surface-elevated border border-hairline-dark rounded-lg text-muted-text hover:bg-gold/10 hover:border-gold/30 hover:text-gold transition-all"
                    onClick={() => setSearchModalOpen(false)}
                    aria-label="Закрыть поиск"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && !hasLoadedOnce && (
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${viewMode === 'list' ? 'grid-cols-1' : ''}`}>
                {Array.from({ length: pageSize }).map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="flex justify-center py-12">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-surface-card flex items-center justify-center mb-5">
                    <X size={28} className="text-price-rise" />
                  </div>
                  <h3 className="text-lg font-bold text-body-text mb-2">Ошибка загрузки</h3>
                  <p className="text-sm text-muted-text max-w-xs mb-6">{error}</p>
                  <button 
                    onClick={() => fetchProducts(page)}
                    className="px-6 py-2.5 bg-gold text-gold-ink text-sm font-semibold rounded-lg hover:bg-gold-active transition-colors"
                  >
                    Повторить
                  </button>
                </div>
              </div>
            )}

            {/* Products */}
            {!error && products.length > 0 && (
              <>
                {viewMode === 'table' ? (
                  <ProductTable products={products} onAddToCart={handleAddToCart} />
                ) : viewMode === 'list' ? (
                  <div className="relative">
                    <ProductList products={products} onAddToCart={handleAddToCart} />
                    {loading && hasLoadedOnce && (
                      <div className="absolute inset-0 flex items-center justify-center bg-canvas-dark/35 backdrop-blur-[2px] rounded-xl pointer-events-none">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-hairline-dark/8 bg-surface-elevated/80 text-body-text text-xs">
                          <span className="animate-spin">⟳</span>
                          <span>Обновляем список…</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <ProductGrid products={products} onAddToCart={handleAddToCart} />
                    {loading && hasLoadedOnce && (
                      <div className="absolute inset-0 flex items-center justify-center bg-canvas-dark/35 backdrop-blur-[2px] rounded-xl pointer-events-none">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-hairline-dark/8 bg-surface-elevated/80 text-body-text text-xs">
                          <span className="animate-spin">⟳</span>
                          <span>Обновляем список…</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {totalItems > 0 && (
                  <div ref={catalogScrollAnchorRef} className="mt-8 pt-6 border-t border-hairline-dark/6">
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
                  </div>
                )}
              </>
            )}

            {/* Empty State */}
            {!loading && !error && hasLoadedOnce && products.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-full bg-surface-card flex items-center justify-center mb-5">
                  <Search size={28} className="text-muted-text" />
                </div>
                <h3 className="text-lg font-bold text-body-text mb-2">Товары не найдены</h3>
                <p className="text-sm text-muted-text max-w-xs mb-6">Попробуйте изменить фильтры или поисковый запрос</p>
                <button 
                  onClick={handleResetFilters}
                  className="px-6 py-2.5 bg-gold/10 text-gold text-sm font-semibold rounded-lg hover:bg-gold/20 transition-colors"
                >
                  Сбросить фильтры
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
