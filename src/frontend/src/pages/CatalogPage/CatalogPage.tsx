import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  RefreshCw, 
  SlidersHorizontal,
  X,
  LayoutGrid,
  List
} from 'lucide-react';
import { FilterSidebar, EmptyState, Pagination } from '../../components/catalog';
import { ProductCard } from '../../components/ProductCard';
import { ProductCardSkeleton } from '../../components/ui/Skeleton';
import { catalogApi } from '../../api/catalog';
import type { ProductSummary, ProductCategory, GetProductsParams } from '../../api/types';
import styles from './CatalogPage.module.css';

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
      ease: [0.33, 1, 0.68, 1]
    }
  }
};

/**
 * Страница каталога товаров с Dark Gold темой
 * Layout: Sidebar (20%) | Product Grid (80%)
 */
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
  
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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

  // Синхронизация фильтров и страницы с URL (path + query)
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
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
    if (page > 1) params.set('page', page.toString());
    const queryString = params.toString();
    const path = selectedCategory ? `/catalog/${selectedCategory}` : '/catalog';
    const fullPath = queryString ? `${path}?${queryString}` : path;
    navigate(fullPath, { replace: true });
  }, [selectedCategory, searchQuery, priceRange, sortBy, selectedManufacturerIds, minRating, selectedAvailability, selectedSpecifications, page, navigate]);

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

  // Загрузка при смене страницы, фильтров или pageSize
  useEffect(() => {
    fetchProducts(page);
  }, [page, pageSize, ...filterDeps]);

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
    } catch (err) {
      setError('Не удалось загрузить товары. Попробуйте позже.');
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = useCallback((newPage: number) => {
    const clamped = Math.max(1, Math.min(newPage, totalPages));
    setPage(clamped);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [totalPages]);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleAddToCart = (productId: string) => {
    console.log('Add to cart:', productId);
    // TODO: Implement cart functionality
  };

  return (
    <div className={styles.container}>
      {/* Mobile Filter Toggle */}
      <button 
        className={styles.mobileFilterToggle}
        onClick={() => setMobileFilterOpen(true)}
        aria-label="Открыть фильтры"
      >
        <SlidersHorizontal size={20} />
        <span>Фильтры</span>
      </button>

      {/* Mobile Filter Overlay */}
      {mobileFilterOpen && (
        <div className={styles.mobileOverlay} onClick={() => setMobileFilterOpen(false)}>
          <motion.div 
            className={styles.mobileSidebar}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className={styles.mobileSidebarHeader}>
              <h2 className={styles.mobileSidebarTitle}>Фильтры</h2>
              <button 
                className={styles.closeBtn}
                onClick={() => setMobileFilterOpen(false)}
                aria-label="Закрыть"
              >
                <X size={24} />
              </button>
            </div>
            <FilterSidebar
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
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

      {/* Desktop Sidebar - 20% width */}
      <div className={styles.sidebarWrapper}>
        <FilterSidebar
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
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
          <nav className={styles.breadcrumb}>
            <a href="/">Главная</a>
            <span>/</span>
            <span>Каталог</span>
          </nav>
          <h1 className={styles.title}>Каталог комплектующих</h1>
          <p className={styles.stats}>
            {totalItems > 0 ? `Всего ${totalItems} товаров` : 'Товары не найдены'}
          </p>
        </header>

        {/* Toolbar */}
        <div className={styles.toolbar}>
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

        {/* Loading State - Skeleton Grid */}
        {loading && (
          <div className={`${styles.grid} ${viewMode === 'list' ? styles.listView : ''}`}>
            {Array.from({ length: 12 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className={styles.error}>
            <p>{error}</p>
            <button onClick={() => fetchProducts(1)} className={styles.retryBtn}>
              <RefreshCw size={18} />
              <span>Попробовать снова</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && products.length === 0 && (
          <div className={styles.emptyStateWrapper}>
            <EmptyState onReset={handleResetFilters} />
          </div>
        )}

        {/* Product Grid - 4 columns */}
        {!loading && !error && products.length > 0 && (
          <>
            <motion.div 
              className={`${styles.grid} ${viewMode === 'list' ? styles.listView : ''}`}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {products.map((product) => (
                <motion.div key={product.id} variants={itemVariants} className={styles.gridItem}>
                  <ProductCard 
                    product={product} 
                    onAddToCart={handleAddToCart}
                  />
                </motion.div>
              ))}
            </motion.div>

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