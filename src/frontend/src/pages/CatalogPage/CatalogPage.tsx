import { useState, useEffect } from 'react';
import { ProductCard } from '../../components/ProductCard';
import { catalogApi } from '../../api/catalog';
import type { ProductSummary, ProductCategory, GetProductsParams } from '../../api/types';
import styles from './CatalogPage.module.css';

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  cpu: 'Процессоры',
  gpu: 'Видеокарты',
  motherboard: 'Материнские платы',
  ram: 'Оперативная память',
  storage: 'Накопители',
  psu: 'Блоки питания',
  case: 'Корпуса',
  cooling: 'Охлаждение',
  monitor: 'Мониторы',
  peripherals: 'Периферия',
};

/**
 * Страница каталога товаров
 */
export function CatalogPage() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
  };

  const handleAddToCart = (productId: string) => {
    console.log('Add to cart:', productId);
    // TODO: Implement cart functionality
    alert('Товар добавлен в корзину!');
  };

  const categories = Object.keys(CATEGORY_LABELS) as ProductCategory[];

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <h2 className={styles.sidebarTitle}>Категории</h2>
        <ul className={styles.categoryList}>
          <li>
            <button
              className={`${styles.categoryBtn} ${!selectedCategory ? styles.active : ''}`}
              onClick={() => handleCategoryChange(null)}
            >
              Все товары
            </button>
          </li>
          {categories.map((category) => (
            <li key={category}>
              <button
                className={`${styles.categoryBtn} ${selectedCategory === category ? styles.active : ''}`}
                onClick={() => handleCategoryChange(category)}
              >
                {CATEGORY_LABELS[category]}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            {selectedCategory 
              ? CATEGORY_LABELS[selectedCategory] 
              : 'Каталог товаров'}
          </h1>
          
          <form className={styles.searchForm} onSubmit={handleSearch}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Поиск товаров..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className={styles.searchBtn}>
              🔍
            </button>
          </form>
        </header>

        {loading && (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Загрузка товаров...</p>
          </div>
        )}

        {error && (
          <div className={styles.error}>
            <p>{error}</p>
            <button onClick={fetchProducts} className={styles.retryBtn}>
              Попробовать снова
            </button>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className={styles.empty}>
            <p>Товары не найдены</p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <>
            <div className={styles.grid}>
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  ← Назад
                </button>
                <span className={styles.pageInfo}>
                  Страница {page} из {totalPages}
                </span>
                <button
                  className={styles.pageBtn}
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Вперёд →
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}