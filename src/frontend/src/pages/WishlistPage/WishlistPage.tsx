import { useState, useEffect, useCallback, useMemo, type ReactElement } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  SlidersHorizontal,
  X,
  LayoutGrid,
  List,
  Table,
  Heart
} from 'lucide-react';
import { useWishlistStore } from '../../store/wishlistStore';
import { catalogApi } from '../../api/catalog';
import { FilterSidebar, EmptyState, ProductTable } from '../../components/catalog';
import { ProductCard } from '../../components/ProductCard';
import { Skeleton, ProductCardSkeleton } from '../../components/ui/Skeleton';
import { ApiErrorBanner } from '../../components/ui/ApiErrorBanner';
import type { ProductSummary, ProductCategory } from '../../api/types';
import { formatCountRu, RU_FORMS } from '../../utils/pluralizeRu';
import styles from './WishlistPage.module.css';

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
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 }
  }
};

/**
 * WishlistPage — страница избранных товаров с фильтрацией и сортировкой
 */
export function WishlistPage(): ReactElement {
  const items = useWishlistStore((state) => state.items);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Состояния фильтров
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(() => {
    const c = searchParams.get('category');
    return c as ProductCategory || null;
  });
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [priceRange, setPriceRange] = useState(() => ({
    min: parseInt(searchParams.get('priceMin') || '0'),
    max: parseInt(searchParams.get('priceMax') || '0'),
  }));
  const [sortBy, setSortBy] = useState(() => searchParams.get('sortBy') || 'popular');
  const [selectedManufacturerIds, setSelectedManufacturerIds] = useState<string[]>(
    () => searchParams.get('manufacturerIds')?.split(',').filter(Boolean) || []
  );
  const [minRating, setMinRating] = useState(() => parseInt(searchParams.get('rating') || '0'));
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>(
    () => searchParams.get('availability')?.split(',').filter(Boolean) || ['in_stock', 'on_order']
  );
  const [selectedSpecifications, setSelectedSpecifications] = useState<Record<string, string | number | string[]>>(() => {
    const specStr = searchParams.get('specs');
    if (!specStr) return {};
    try {
      return JSON.parse(decodeURIComponent(specStr));
    } catch {
      return {};
    }
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>(() => {
    const v = searchParams.get('view');
    return (v === 'list' || v === 'table') ? v : 'grid';
  });
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Синхронизация с URL
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
    if (viewMode !== 'grid') params.set('view', viewMode);
    
    const queryString = params.toString();
    navigate(queryString ? `/wishlist?${queryString}` : '/wishlist', { replace: true });
  }, [selectedCategory, searchQuery, priceRange, sortBy, selectedManufacturerIds, minRating, selectedAvailability, selectedSpecifications, viewMode, navigate]);

  // Загрузка товаров по ID
  useEffect(() => {
    if (items.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const fetchAll = async () => {
      try {
        const results = await Promise.allSettled(items.map((id) => catalogApi.getProduct(id)));
        if (cancelled) return;
        
        const loaded = results
          .filter((r): r is PromiseFulfilledResult<ProductSummary> => r.status === 'fulfilled')
          .map((r) => r.value);
        
        setProducts(loaded);
        setError(null);
      } catch (err) {
        if (!cancelled) setError('Не удалось загрузить избранные товары.');
        console.error('Wishlist fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();

    return () => {
      cancelled = true;
    };
  }, [items]);

  // Локальная фильтрация и сортировка
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Поиск
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.sku.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q)
      );
    }

    // Категория
    if (selectedCategory) {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Цена
    if (priceRange.min > 0) {
      result = result.filter(p => p.price >= priceRange.min);
    }
    if (priceRange.max > 0) {
      result = result.filter(p => p.price <= priceRange.max);
    }

    // Производитель
    if (selectedManufacturerIds.length > 0) {
      result = result.filter(p => p.manufacturer?.id && selectedManufacturerIds.includes(p.manufacturer.id));
    }

    // Рейтинг
    if (minRating > 0) {
      result = result.filter(p => {
        const rating = typeof p.rating === 'number' ? p.rating : p.rating?.average || 0;
        return rating >= minRating;
      });
    }

    // Наличие
    const hasInStock = selectedAvailability.includes('in_stock');
    const hasOnOrder = selectedAvailability.includes('on_order');
    if (hasInStock && !hasOnOrder) {
      result = result.filter(p => p.stock > 0);
    } else if (hasOnOrder && !hasInStock) {
      result = result.filter(p => p.stock === 0);
    }

    // Сортировка
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'rating': {
          const ra = typeof a.rating === 'number' ? a.rating : a.rating?.average || 0;
          const rb = typeof b.rating === 'number' ? b.rating : b.rating?.average || 0;
          return rb - ra;
        }
        case 'newest': return new Date((b as { createdAt?: string }).createdAt || 0).getTime() - new Date((a as { createdAt?: string }).createdAt || 0).getTime();
        case 'name': return a.name.localeCompare(b.name);
        default: return 0; // По популярности (в Wishlist нет явной популярности, оставляем порядок добавления)
      }
    });

    return result;
  }, [products, searchQuery, selectedCategory, priceRange, selectedManufacturerIds, minRating, selectedAvailability, sortBy]);

  const handleResetFilters = useCallback(() => {
    setSelectedCategory(null);
    setSearchQuery('');
    setPriceRange({ min: 0, max: 0 });
    setSelectedManufacturerIds([]);
    setMinRating(0);
    setSelectedAvailability(['in_stock', 'on_order']);
    setSelectedSpecifications({});
    setSortBy('popular');
  }, []);

  if (items.length === 0 && !loading) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyContainer}>
          <div className={styles.emptyContent}>
            <div className={styles.emptyIconWrapper}>
              <Heart size={48} className={styles.emptyIcon} />
            </div>
            <h1 className={styles.emptyTitle}>В избранном пока пусто</h1>
            <p className={styles.emptyText}>
              Добавляйте понравившиеся товары из каталога, чтобы вернуться к ним позже
            </p>
            <Link to="/catalog" className={styles.emptyBtn}>
              Перейти в каталог
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Sidebar - Desktop */}
        <aside className={styles.sidebarWrapper}>
          <FilterSidebar
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            priceRange={priceRange}
            onPriceChange={setPriceRange}
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
        </aside>

        {/* Mobile Filter Drawer */}
        <AnimatePresence>
          {mobileFilterOpen && (
            <>
              <motion.div 
                className={styles.mobileOverlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileFilterOpen(false)}
              />
              <motion.div 
                className={styles.mobileSidebar}
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
              >
                <div className={styles.mobileSidebarHeader}>
                  <h2 className={styles.mobileSidebarTitle}>Фильтры</h2>
                  <button className={styles.closeBtn} onClick={() => setMobileFilterOpen(false)}>
                    <X size={20} />
                  </button>
                </div>
                <FilterSidebar
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  priceRange={priceRange}
                  onPriceChange={setPriceRange}
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
            </>
          )}
        </AnimatePresence>

        <main className={styles.main}>
          <header className={styles.header}>
            <div className={styles.breadcrumb}>
              <Link to="/">Главная</Link>
              <span>/</span>
              <span>Избранное</span>
            </div>
            <h1 className={styles.title}>Избранное</h1>
            <p className={styles.stats}>
              {loading ? (
                <Skeleton width={160} height={18} borderRadius="sm" />
              ) : (
                formatCountRu(filteredProducts.length, RU_FORMS.tovar)
              )}
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
                <span>Фильтры</span>
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
              <div className={styles.searchWrapper}>
                <Search size={18} className={styles.searchIcon} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Поиск в избранном..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select 
                className={styles.sortSelect}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="popular">По умолчанию</option>
                <option value="price-asc">Сначала дешевле</option>
                <option value="price-desc">Сначала дороже</option>
                <option value="rating">По рейтингу</option>
                <option value="newest">По новизне</option>
                <option value="name">По названию</option>
              </select>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className={styles.errorState}>
              <ApiErrorBanner
                message={error}
                onRetry={() => window.location.reload()}
              />
            </div>
          )}

          {/* Grid/List/Table View */}
          {!error && (
            <>
              {loading ? (
                <div className={`${styles.grid} ${viewMode === 'list' ? styles.listView : ''} ${viewMode === 'table' ? styles.tableView : ''}`}>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <ProductCardSkeleton key={index} />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className={styles.emptyStateWrapper}>
                  <EmptyState
                    title="Ничего не найдено"
                    description={
                      products.length > 0
                        ? `В избранном ${formatCountRu(items.length, RU_FORMS.tovar)}, показано 0.`
                        : undefined
                    }
                    onReset={handleResetFilters}
                    showResetButton={products.length > 0}
                  />
                </div>
              ) : viewMode === 'table' ? (
                <ProductTable products={filteredProducts} />
              ) : (
                <motion.div 
                  className={`${styles.grid} ${viewMode === 'list' ? styles.listView : ''}`}
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <AnimatePresence mode="popLayout">
                    {filteredProducts.map((product) => (
                      <motion.div 
                        key={product.id} 
                        variants={itemVariants} 
                        layout
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className={styles.gridItem}
                      >
                        <ProductCard 
                          product={product} 
                          viewMode={viewMode}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
