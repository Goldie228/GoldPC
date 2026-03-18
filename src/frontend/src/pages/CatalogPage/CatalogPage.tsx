import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  RefreshCw, 
  Box,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  LayoutGrid,
  List
} from 'lucide-react';
import { FilterSidebar } from '../../components/catalog';
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
  hidden: { opacity: 0, y: 20 },
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
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 });
  const [sortBy, setSortBy] = useState('popular');

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, page, sortBy]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: GetProductsParams = {
        page,
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleCategoryChange = (category: ProductCategory | null) => {
    setSelectedCategory(category);
    setPage(1);
    setMobileFilterOpen(false);
  };

  const handlePriceChange = (range: { min: number; max: number }) => {
    setPriceRange(range);
  };

  const handleResetFilters = () => {
    setSelectedCategory(null);
    setPriceRange({ min: 0, max: 0 });
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
          <p className={styles.stats}>Найдено {totalItems} товаров</p>
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
            <button onClick={fetchProducts} className={styles.retryBtn}>
              <RefreshCw size={18} />
              <span>Попробовать снова</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && products.length === 0 && (
          <div className={styles.empty}>
            <Box size={48} className={styles.emptyIcon} />
            <p>Товары не найдены</p>
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
                <motion.div key={product.id} variants={itemVariants}>
                  <ProductCard 
                    product={product} 
                    onAddToCart={handleAddToCart}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  aria-label="Предыдущая страница"
                >
                  <ChevronLeft size={20} />
                  <span>Назад</span>
                </button>
                
                <div className={styles.pageNumbers}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        className={`${styles.pageNumber} ${page === pageNum ? styles.active : ''}`}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  className={styles.pageBtn}
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  aria-label="Следующая страница"
                >
                  <span>Вперёд</span>
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}