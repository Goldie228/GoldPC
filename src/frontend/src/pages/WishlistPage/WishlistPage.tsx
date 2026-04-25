import { useState, useEffect, useMemo, type ReactElement } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Heart } from 'lucide-react';
import { useWishlistStore } from '../../store/wishlistStore';
import { catalogApi } from '../../api/catalog';
import { EmptyState } from '../../components/catalog';
import { ProductCard } from '../../components/ProductCard';
import { Skeleton, ProductCardSkeleton } from '../../components/ui/Skeleton';
import { ApiErrorBanner } from '../../components/ui/ApiErrorBanner';
import type { ProductSummary, ProductCategory } from '../../api/types';
import { formatCountRu, RU_FORMS } from '../../utils/pluralizeRu';
import { CATEGORY_LABELS_RU } from '../../utils/categoryLabels';
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
      ease: [0.33, 1, 0.68, 1] as const
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 }
  }
};

/**
 * WishlistPage — упрощенная страница избранных товаров
 */
export function WishlistPage(): ReactElement {
  const items = useWishlistStore((state) => state.items);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Состояния фильтров (только необходимое)
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(() => {
    const c = searchParams.get('category');
    return c as ProductCategory || null;
  });
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState(() => searchParams.get('sortBy') || 'default');

  // Синхронизация с URL (только search, category, sortBy)
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    if (searchQuery) params.set('search', searchQuery);
    if (sortBy !== 'default') params.set('sortBy', sortBy);
    
    const queryString = params.toString();
    navigate(queryString ? `/wishlist?${queryString}` : '/wishlist', { replace: true });
  }, [selectedCategory, searchQuery, sortBy, navigate]);

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

  // Извлекаем уникальные категории из загруженных товаров
  const availableCategories = useMemo(() => {
    const unique = new Set(products.map(p => p.category));
    const result = Array.from(unique).sort();
    console.log('Available categories:', result);
    return result;
  }, [products]);

  // Показываем чипсы категорий только если категорий > 1
  const showCategoryChips = availableCategories.length > 1;

  // Подсчет товаров по категориям
  const categoryCounts = useMemo(() => {
    const counts = new Map<ProductCategory, number>();
    products.forEach(p => {
      counts.set(p.category, (counts.get(p.category) || 0) + 1);
    });
    return counts;
  }, [products]);

  // Упрощенная фильтрация и сортировка
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Поиск по названию/артикулу/бренду
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.sku.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q)
      );
    }

    // Фильтр по категории
    if (selectedCategory) {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Сортировка
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'name': return a.name.localeCompare(b.name);
        default: return 0; // По умолчанию (порядок добавления)
      }
    });

    return result;
  }, [products, searchQuery, selectedCategory, sortBy]);

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
        <main className={styles.main}>
          <header className={styles.header}>
            <div className={styles.breadcrumb}>
              <Link to="/">Главная</Link>
              <span>/</span>
              <span>Избранное</span>
            </div>
            <h1 className={styles.title}>Избранное</h1>
            <div className={styles.stats}>
              {loading ? (
                <Skeleton width={160} height={18} borderRadius="sm" />
              ) : (
                formatCountRu(filteredProducts.length, RU_FORMS.tovar)
              )}
            </div>
          </header>

          {/* Упрощенный Toolbar */}
          <div className={styles.toolbar}>
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
              <option value="default">По умолчанию</option>
              <option value="price-asc">Сначала дешевле</option>
              <option value="price-desc">Сначала дороже</option>
              <option value="name">По названию</option>
            </select>
          </div>

          {/* Чипсы категорий (показываем только если категорий > 1) */}
          {showCategoryChips && (
            <div className={styles.categoryChips}>
              <button
                className={`${styles.categoryChip} ${!selectedCategory ? styles.active : ''}`}
                onClick={() => setSelectedCategory(null)}
              >
                Все ({products.length})
              </button>
              {availableCategories.map((cat) => {
                const label = CATEGORY_LABELS_RU[cat];
                const count = categoryCounts.get(cat) || 0;
                console.log(`Category: ${cat}, Label: ${label}, Count: ${count}`);
                return (
                  <button
                    key={cat}
                    className={`${styles.categoryChip} ${selectedCategory === cat ? styles.active : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {label || cat} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className={styles.errorState}>
              <ApiErrorBanner
                message={error}
                onRetry={() => window.location.reload()}
              />
            </div>
          )}

          {/* Сетка товаров */}
          {!error && (
            <>
              {loading ? (
                <div className={styles.grid}>
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
                        ? `В избранном ${formatCountRu(products.length, RU_FORMS.tovar)}, но ничего не соответствует фильтрам.`
                        : undefined
                    }
                    showResetButton={false}
                  />
                </div>
              ) : (
                <motion.div 
                  className={styles.grid}
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
                          viewMode="grid"
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
