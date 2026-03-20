import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  RefreshCw, 
  SlidersHorizontal,
  X,
  LayoutGrid,
  List,
  Loader2
} from 'lucide-react';
import { FilterSidebar, EmptyState } from '../../components/catalog';
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

  const [searchParams, setSearchParams] = useSearchParams();
  
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Инициализация состояния из URL params
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(
    () => (searchParams.get('category') as ProductCategory) || null
  );
  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get('search') || ''
  );
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
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
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    () => searchParams.get('brands')?.split(',').filter(Boolean) || []
  );
  const [minRating, setMinRating] = useState(
    () => parseInt(searchParams.get('rating') || '0')
  );
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>(
    () => searchParams.get('availability')?.split(',').filter(Boolean) || []
  );

  // Синхронизация фильтров с URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    if (searchQuery) params.set('search', searchQuery);
    if (priceRange.min > 0) params.set('priceMin', priceRange.min.toString());
    if (priceRange.max > 0) params.set('priceMax', priceRange.max.toString());
    if (sortBy !== 'popular') params.set('sortBy', sortBy);
    if (selectedBrands.length > 0) params.set('brands', selectedBrands.join(','));
    if (minRating > 0) params.set('rating', minRating.toString());
    if (selectedAvailability.length > 0) params.set('availability', selectedAvailability.join(','));
    setSearchParams(params, { replace: true });
  }, [selectedCategory, searchQuery, priceRange, sortBy, selectedBrands, minRating, selectedAvailability, setSearchParams]);

  // Начальная загрузка при изменении фильтров
  useEffect(() => {
    setPage(1);
    fetchProducts(1, true);
  }, [
    selectedCategory,
    searchQuery,
    priceRange,
    sortBy,
    selectedBrands,
    minRating,
    selectedAvailability,
  ]);

  const fetchProducts = async (pageNum: number, replace: boolean = false) => {
    if (replace) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);
    
    try {
      const params: GetProductsParams = {
        page: pageNum,
        pageSize: 12,
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
      
      const response = await catalogApi.getProducts(params);
      
      if (replace) {
        setProducts(response.data);
      } else {
        setProducts(prev => [...prev, ...response.data]);
      }
      
      setHasMore(response.meta.hasNext);
      setTotalItems(response.meta.totalItems);
    } catch (err) {
      setError('Не удалось загрузить товары. Попробуйте позже.');
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleShowMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage, false);
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts(1, true);
  };

  const handleCategoryChange = (category: ProductCategory | null) => {
    setSelectedCategory(category);
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
    setSelectedBrands([]);
    setMinRating(0);
    setSelectedAvailability([]);
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
              selectedBrands={selectedBrands}
              onBrandsChange={setSelectedBrands}
              minRating={minRating}
              onRatingChange={setMinRating}
              selectedAvailability={selectedAvailability}
              onAvailabilityChange={setSelectedAvailability}
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
          selectedBrands={selectedBrands}
          onBrandsChange={setSelectedBrands}
          minRating={minRating}
          onRatingChange={setMinRating}
          selectedAvailability={selectedAvailability}
          onAvailabilityChange={setSelectedAvailability}
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
          <p className={styles.stats}>Показано {products.length} из {totalItems} товаров</p>
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
                  placeholder="Поиск товаров..."
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
            <button onClick={() => fetchProducts(1, true)} className={styles.retryBtn}>
              <RefreshCw size={18} />
              <span>Попробовать снова</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && products.length === 0 && (
          <EmptyState onReset={handleResetFilters} />
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

            {/* Show More Button */}
            {hasMore && (
              <div className={styles.showMore}>
                <button
                  className={styles.showMoreBtn}
                  onClick={handleShowMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <Loader2 size={20} className={styles.spinner} />
                      <span>Загрузка...</span>
                    </>
                  ) : (
                    <span>Показать ещё</span>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}