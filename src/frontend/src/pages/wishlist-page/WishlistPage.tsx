import { useState, useEffect, useMemo, type ReactElement } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Heart } from 'lucide-react';
import { useWishlistStore } from '../../store/wishlistStore';
import { useCatalog } from '../../hooks/useCatalog';
import { EmptyState } from '../../components/catalog';
import { ProductCard } from '../../components/product-card/ProductCard';
import { Skeleton, ProductCardSkeleton } from '../../components/ui/Skeleton';
import { ApiErrorBanner } from '../../components/ui/ApiErrorBanner';
import type { ProductSummary, ProductCategory } from '../../api/types';
import { formatCountRu, RU_FORMS } from '../../utils/pluralizeRu';
import { CATEGORY_LABELS_RU } from '../../utils/categoryLabels';

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
  const { getProductsByIds } = useCatalog();
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
        const loaded = await getProductsByIds(items);
        if (cancelled) return;
        
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
  }, [items, getProductsByIds]);

  // Извлекаем уникальные категории из загруженных товаров
  const availableCategories = useMemo(() => {
    const unique = new Set(products.map(p => p.category));
    const result = Array.from(unique).sort();
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
      <div className="min-h-[calc(100vh-200px)] bg-[var(--bg)]" style={{ backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, var(--border-muted) 0%, transparent 50%)' }}>
        <div className="w-full max-w-[1680px] mx-auto p-6 md:p-8 flex items-center justify-center" style={{ minHeight: 'calc(100vh - 400px)' }}>
          <div className="flex flex-col items-center text-center max-w-[400px]">
            <div className="w-[100px] h-[100px] bg-[var(--border-muted)] rounded-full flex items-center justify-center mb-8 relative">
              <div className="absolute inset-[-10px] border border-dashed border-[var(--border-muted)] rounded-full animate-[rotate_20s_linear_infinite]" />
              <Heart size={48} className="text-[var(--accent)] opacity-80" />
            </div>
            <h1 className="text-3xl font-bold mb-4 text-[var(--fg)]">В избранном пока пусто</h1>
            <p className="text-[var(--fg-muted)] leading-6 mb-8">
              Добавляйте понравившиеся товары из каталога, чтобы вернуться к ним позже
            </p>
            <Link to="/catalog" className="inline-flex p-3.5 bg-[var(--accent)] text-[var(--bg)] rounded-lg font-semibold text-decoration-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_var(--border-muted)]">
              Перейти в каталог
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)] bg-[var(--bg)]" style={{ backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, var(--border-muted) 0%, transparent 50%)' }}>
      <div className="w-full max-w-[1680px] mx-auto p-6 md:p-8">
        <main className="min-w-0">
          <header className="mb-6">
            <div className="flex items-center gap-2 text-xs text-[var(--fg-dim)] mb-2">
              <Link to="/" className="text-[var(--fg-muted)] text-decoration-none transition-colors duration-200 hover:text-[var(--accent)]">Главная</Link>
              <span>/</span>
              <span>Избранное</span>
            </div>
            <h1 className="text-3xl font-bold letter-spacing-[-0.02em] text-[var(--fg)] m-0 mb-2">Избранное</h1>
            <div className="text-sm text-[var(--fg-muted)] m-0">
              {loading ? (
                <Skeleton width={160} height={18} borderRadius="sm" />
              ) : (
                formatCountRu(filteredProducts.length, RU_FORMS.tovar)
              )}
            </div>
          </header>

          {/* Упрощенный Toolbar */}
          <div className="flex flex-wrap items-center gap-3 mb-5 p-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-[0_4px_20px_var(--border-muted)] sm:flex-nowrap">
            <div className="relative flex items-center flex-1 min-w-[200px]">
              <Search size={18} className="absolute left-3.5 text-[var(--fg-dim)] pointer-events-none" />
              <input
                type="text"
                className="w-full h-10 p-0 pl-11 pr-4 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-[var(--fg)] text-sm transition-all duration-200 focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--bg-card)]"
                placeholder="Поиск в избранном..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select 
              className="h-10 px-9 pl-4 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-[var(--fg)] text-sm cursor-pointer appearance-none whitespace-nowrap bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2371717a%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpolyline points=%276 9 12 15 18 9%27%3E%3C/polyline%3E%3C/svg%3E')] bg-no-repeat bg-[right_12px_center] bg-[length:16px] transition-all duration-200 focus:outline-none focus:border-[var(--accent)]"
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
            <div className="flex items-center gap-2 mb-5 overflow-x-auto overflow-y-hidden p-1 scrollbar-thin scrollbar-color-[var(--border-muted))_transparent]">
              <button
                className="inline-flex items-center px-4 py-2 rounded-full border border-[var(--border)] bg-[var(--bg-card)] text-[var(--fg-muted)] text-sm font-medium whitespace-nowrap cursor-pointer transition-all duration-200 hover:border-[var(--border-muted)] hover:text-[var(--fg)] hover:bg-[var(--border-muted)]"
                onClick={() => setSelectedCategory(null)}
              >
                Все ({products.length})
              </button>
              {availableCategories.map((cat) => {
                const label = CATEGORY_LABELS_RU[cat];
                const count = categoryCounts.get(cat) || 0;
                return (
                  <button
                    key={cat}
                    className={`inline-flex items-center px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap cursor-pointer transition-all duration-200 hover:border-[var(--border-muted)] hover:text-[var(--fg)] hover:bg-[var(--border-muted)] ${
                      selectedCategory === cat 
                        ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--bg)] font-semibold shadow-[0_2px_8px_var(--border-muted)]' 
                        : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--fg-muted)]'
                    }`}
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
            <div className="flex justify-center p-12 md:p-16">
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
                <div className="grid grid-cols-1 gap-6 w-full sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <ProductCardSkeleton key={index} />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex justify-center p-12 md:p-16">
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
                  className="grid grid-cols-1 gap-6 w-full sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
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
                        className="w-full"
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
