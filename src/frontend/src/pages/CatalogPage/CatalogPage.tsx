import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Cpu, 
  Monitor, 
  HardDrive, 
  MemoryStick, 
  Zap, 
  Box, 
  Fan, 
  MonitorSpeaker,
  Keyboard,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { Card, CardImage, CardBody, CardFooter } from '../../components/ui-kit/Card';
import { catalogApi } from '../../api/catalog';
import type { ProductSummary, ProductCategory, GetProductsParams } from '../../api/types';
import styles from './CatalogPage.module.css';

const CATEGORY_CONFIG: Record<ProductCategory, { label: string; icon: React.ComponentType<{ size?: number }> }> = {
  cpu: { label: 'Процессоры', icon: Cpu },
  gpu: { label: 'Видеокарты', icon: Monitor },
  motherboard: { label: 'Материнские платы', icon: HardDrive },
  ram: { label: 'Оперативная память', icon: MemoryStick },
  storage: { label: 'Накопители', icon: HardDrive },
  psu: { label: 'Блоки питания', icon: Zap },
  case: { label: 'Корпуса', icon: Box },
  cooling: { label: 'Охлаждение', icon: Fan },
  monitor: { label: 'Мониторы', icon: MonitorSpeaker },
  peripherals: { label: 'Периферия', icon: Keyboard },
};

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

const sidebarVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: [0.33, 1, 0.68, 1]
    }
  }
};

/**
 * Страница каталога товаров с Dark Gold темой
 */
export function CatalogPage() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, page]);

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
      
      const response = await catalogApi.getProducts(params);
      setProducts(response.data);
      setTotalPages(response.meta.totalPages);
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

  const handleAddToCart = (productId: string) => {
    console.log('Add to cart:', productId);
    // TODO: Implement cart functionality
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  };

  const categories = Object.keys(CATEGORY_CONFIG) as ProductCategory[];

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
          <motion.aside 
            className={styles.mobileSidebar}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className={styles.mobileSidebarHeader}>
              <h2 className={styles.sidebarTitle}>Категории</h2>
              <button 
                className={styles.closeBtn}
                onClick={() => setMobileFilterOpen(false)}
                aria-label="Закрыть"
              >
                <X size={24} />
              </button>
            </div>
            <ul className={styles.categoryList}>
              <li>
                <button
                  className={`${styles.categoryBtn} ${!selectedCategory ? styles.active : ''}`}
                  onClick={() => handleCategoryChange(null)}
                >
                  <Box size={18} />
                  <span>Все товары</span>
                </button>
              </li>
              {categories.map((category) => {
                const Icon = CATEGORY_CONFIG[category].icon;
                return (
                  <li key={category}>
                    <button
                      className={`${styles.categoryBtn} ${selectedCategory === category ? styles.active : ''}`}
                      onClick={() => handleCategoryChange(category)}
                    >
                      <Icon size={18} />
                      <span>{CATEGORY_CONFIG[category].label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <motion.aside 
        className={styles.sidebar}
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
      >
        <h2 className={styles.sidebarTitle}>Категории</h2>
        <ul className={styles.categoryList}>
          <li>
            <button
              className={`${styles.categoryBtn} ${!selectedCategory ? styles.active : ''}`}
              onClick={() => handleCategoryChange(null)}
            >
              <Box size={18} />
              <span>Все товары</span>
            </button>
          </li>
          {categories.map((category) => {
            const Icon = CATEGORY_CONFIG[category].icon;
            return (
              <li key={category}>
                <button
                  className={`${styles.categoryBtn} ${selectedCategory === category ? styles.active : ''}`}
                  onClick={() => handleCategoryChange(category)}
                >
                  <Icon size={18} />
                  <span>{CATEGORY_CONFIG[category].label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </motion.aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            {selectedCategory 
              ? CATEGORY_CONFIG[selectedCategory].label 
              : 'Каталог товаров'}
          </h1>
          
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
            <button type="submit" className={styles.searchBtn}>
              <Search size={18} />
              <span>Найти</span>
            </button>
          </form>
        </header>

        {loading && (
          <div className={styles.loading}>
            <div className={styles.spinner}>
              <RefreshCw size={32} className={styles.spinnerIcon} />
            </div>
            <p>Загрузка товаров...</p>
          </div>
        )}

        {error && (
          <div className={styles.error}>
            <p>{error}</p>
            <button onClick={fetchProducts} className={styles.retryBtn}>
              <RefreshCw size={18} />
              <span>Попробовать снова</span>
            </button>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className={styles.empty}>
            <Box size={48} className={styles.emptyIcon} />
            <p>Товары не найдены</p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <>
            <motion.div 
              className={styles.grid}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {products.map((product) => (
                <motion.div key={product.id} variants={itemVariants}>
                  <Card variant="gold-glass" className={styles.productCard}>
                    <CardImage 
                      src={product.mainImage?.url || '/placeholder-product.png'} 
                      alt={product.mainImage?.alt || product.name}
                    />
                    <CardBody>
                      <h3 className={styles.productName}>{product.name}</h3>
                      <p className={styles.productManufacturer}>
                        {product.manufacturer?.name || 'GoldPC'}
                      </p>
                      <div className={styles.productRating}>
                        <span className={styles.ratingStars}>
                          {'★'.repeat(Math.floor(product.rating || 0))}
                          {'☆'.repeat(5 - Math.floor(product.rating || 0))}
                        </span>
                        <span className={styles.ratingCount}>
                          ({product.stock} в наличии)
                        </span>
                      </div>
                    </CardBody>
                    <CardFooter>
                      <div className={styles.productPriceRow}>
                        <span className={styles.productPrice}>
                          {formatPrice(product.price)}
                        </span>
                        {product.oldPrice && (
                          <span className={styles.productOldPrice}>
                            {formatPrice(product.oldPrice)}
                          </span>
                        )}
                      </div>
                      <button 
                        className={styles.addToCartBtn}
                        onClick={() => handleAddToCart(product.id)}
                      >
                        В корзину
                      </button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

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
                <span className={styles.pageInfo}>
                  Страница {page} из {totalPages}
                </span>
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