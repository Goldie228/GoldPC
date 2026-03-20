import { useState, useEffect, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { useWishlistStore } from '../../store/wishlistStore';
import { catalogApi } from '../../api/catalog';
import { ProductCard } from '../../components/ProductCard';
import type { ProductSummary } from '../../api/types';
import styles from './WishlistPage.module.css';

/**
 * WishlistPage — страница избранных товаров
 */
export function WishlistPage(): ReactElement {
  const items = useWishlistStore((state) => state.items);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) {
      setProducts([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.allSettled(items.map((id) => catalogApi.getProduct(id)))
      .then((results) => {
        if (cancelled) return;
        const loaded = results
          .filter((r): r is PromiseFulfilledResult<ProductSummary> => r.status === 'fulfilled')
          .map((r) => r.value);
        setProducts(loaded);
        if (loaded.length === 0 && items.length > 0) {
          setError('Не удалось загрузить избранные товары.');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError('Не удалось загрузить избранные товары.');
        console.error('Wishlist fetch error:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [items]);

  if (items.length === 0 && !loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.title}>Избранное</h1>
          <div className={styles.empty}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className={styles.emptyIcon}
              aria-hidden
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <h2 className={styles.emptyTitle}>В избранном пока пусто</h2>
            <p className={styles.emptyText}>
              Добавляйте понравившиеся товары из каталога
            </p>
            <Link to="/catalog" className={styles.emptyBtn}>
              Перейти в каталог
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.title}>Избранное</h1>
          <div className={styles.error}>
            <p>{error}</p>
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
        <header className={styles.header}>
          <h1 className={styles.title}>Избранное</h1>
          <p className={styles.stats}>
            {products.length} {products.length === 1 ? 'товар' : 'товаров'}
          </p>
        </header>

        {loading ? (
          <div className={styles.loading}>
            <span className={styles.spinner} aria-hidden />
            <span>Загрузка...</span>
          </div>
        ) : (
          <div className={styles.grid}>
            {products.map((product) => (
              <div key={product.id} className={styles.gridItem}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
