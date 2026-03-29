import { useState, useEffect, useMemo, useCallback, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useComparisonStore } from '../../store/comparisonStore';
import { catalogApi } from '../../api/catalog';
import { getProductImageUrl } from '../../utils/image';
import { useCart } from '../../hooks/useCart';
import { useToastStore } from '../../store/toastStore';
import { useWishlistStore } from '../../store/wishlistStore';
import type { Product, ProductSpecifications, ProductCategory, ProductImage } from '../../api/types';
import { Icon } from '../../components/ui/Icon/Icon';
import { ApiErrorBanner } from '../../components/ui/ApiErrorBanner';
import { EmptyState } from '../../components/catalog/EmptyState';
import { formatCountRu, RU_FORMS } from '../../utils/pluralizeRu';
import { Modal } from '../../components/ui/Modal/Modal';
import { CATEGORY_LABELS_RU } from '../../utils/categoryLabels';
import { specLabel, formatSpecValueForKey } from '../../utils/specifications';
import { specificationsWithDescriptionFallback } from '../../utils/productDescriptionSpecs';
import { evaluateComparison } from '../../utils/comparison/comparisonEngine';
import { getBackendCategorySlug, normalizeCategory, normalizeSpecKey } from '../../utils/comparison/comparisonRules';
import { sortSpecKeysForComparison } from '../../utils/comparison/specKeysSort';
import styles from './ComparisonPage.module.css';

/** Placeholder контент для модального окна быстрого просмотра */
function QuickViewContent({ product }: { product: Product }): ReactElement {
  const ratingValue = typeof product.rating === 'number'
    ? product.rating
    : (product.rating as { average?: number } | undefined)?.average;
    
  return (
    <div className={styles.quickViewContent}>
      <div className={styles.quickViewImage}>
        {product.mainImage?.url ? (
          <div className={styles.quickViewImageWrapper}>
            <img
              src={product.mainImage.url}
              alt={product.mainImage.alt ?? product.name}
            />
          </div>
        ) : (
          <div className={styles.quickViewPlaceholder}>
            <Icon name="image" size="2xl" color="secondary" />
          </div>
        )}
      </div>
      <div className={styles.quickViewDetails}>
        {product.manufacturer != null && (
          <span className={styles.quickViewManufacturer}>
            {product.manufacturer.name}
          </span>
        )}
        <h2 className={styles.quickViewName}>{product.name}</h2>
        <div className={styles.quickViewPrice}>
          {formatPrice(product.price)}
        </div>
        {ratingValue != null && !Number.isNaN(ratingValue) && (
          <div className={styles.quickViewRating}>
            <div className={styles.stars}>
              {'★'.repeat(Math.round(ratingValue))}
              {'☆'.repeat(5 - Math.round(ratingValue))}
            </div>
            <span>{Number(ratingValue).toFixed(1)}</span>
          </div>
        )}
        <div className={styles.quickViewDescription}>
          {product.descriptionShort != null && product.descriptionShort.trim() !== '' ? (
            <>
              <p className={styles.quickViewDescriptionText}>{product.descriptionShort}</p>
              <Link to={`/product/${product.slug}`} className={styles.quickViewLink}>
                Подробнее на странице товара →
              </Link>
            </>
          ) : (
            <Link to={`/product/${product.slug}`} className={styles.quickViewLink}>
              Подробное описание на странице товара →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/** Получить главное изображение товара (mainImage или первое из images) */
function getMainImage(product: Product): ProductImage | undefined {
  if (product.mainImage?.url) return product.mainImage;
  const images = product.images;
  if (!images?.length) return undefined;
  return images.find((i) => i.isMain) ?? images[0];
}

function getCategoryLabel(category: string): string {
  const normalized = normalizeCategory(category);
  return CATEGORY_LABELS_RU[normalized as ProductCategory] ?? normalized;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'BYN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}


/**
 * Страница сравнения товаров
 */
export function ComparisonPage(): ReactElement {
  const items = useComparisonStore((state) => state.items);
  const removeItem = useComparisonStore((state) => state.removeItem);
  const { addToCart, changeQuantity, isInCart, getItemQuantity } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlistStore();
  const showToast = useToastStore((state) => state.showToast);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [facetDisplayNames, setFacetDisplayNames] = useState<Record<string, string>>({});

  const itemIds = useMemo(() => items.map((i) => i.id), [items]);

  const productsWithMergedSpecs = useMemo(
    () =>
      products.map((p) => ({
        ...p,
        specifications: specificationsWithDescriptionFallback(p.specifications, p.description),
      })),
    [products]
  );

  useEffect(() => {
    if (itemIds.length === 0) {
      setProducts([]);
      setLoading(false);
      setError(null);
      setImageErrors(new Set());
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.allSettled(itemIds.map((id) => catalogApi.getProduct(id)))
      .then((results) => {
        if (cancelled) return;
        const loaded = results
          .filter((r): r is PromiseFulfilledResult<Product> => r.status === 'fulfilled')
          .map((r) => r.value);
        setProducts(loaded);
        if (loaded.length === 0 && itemIds.length > 0) {
          setError('Не удалось загрузить товары для сравнения.');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError('Не удалось загрузить товары для сравнения.');
        console.error('Comparison fetch error:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [itemIds]);

  const handleImageError = useCallback((productId: string) => {
    setImageErrors((prev) => new Set(prev).add(productId));
  }, []);

  const handleAddToCart = (product: Product): void => {
    if (product.stock === 0) return;
    if (isInCart(product.id)) return;
    addToCart(product, 1);
    showToast('Товар добавлен в корзину', 'success');
  };

  const handleDecrement = (product: Product): void => {
    const quantity = getItemQuantity(product.id);
    if (quantity <= 1) {
      changeQuantity(product.id, -1);
      showToast('Товар удалён из корзины', 'info');
      return;
    }
    changeQuantity(product.id, -1);
  };

  const handleIncrement = (product: Product): void => {
    const quantity = getItemQuantity(product.id);
    if (product.stock > 0 && quantity >= product.stock) {
      showToast('Достигнуто максимальное количество на складе', 'info');
      return;
    }
    changeQuantity(product.id, 1);
  };

  const handleToggleWishlist = (productId: string): void => {
    const inWishlist = isInWishlist(productId);
    toggleWishlist(productId);
    showToast(inWishlist ? 'Удалено из избранного' : 'Добавлено в избранное', inWishlist ? 'info' : 'success');
  };

  const handleOpenQuickView = (product: Product) => {
    setQuickViewProduct(product);
  };

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((product) => {
      const category = normalizeCategory(product.category);
      if (category !== '') {
        counts.set(category, (counts.get(category) ?? 0) + 1);
      }
    });
    return counts;
  }, [products]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((product) => {
      const category = normalizeCategory(product.category);
      if (category !== '') set.add(category);
    });
    return Array.from(set).sort((a, b) => getCategoryLabel(a).localeCompare(getCategoryLabel(b), 'ru'));
  }, [products]);

  useEffect(() => {
    if (categories.length === 0) {
      setActiveCategory(null);
      return;
    }
    if (activeCategory === null || !categories.includes(activeCategory)) {
      setActiveCategory(categories[0]);
    }
  }, [activeCategory, categories]);

  const visibleProducts = useMemo(() => {
    if (!activeCategory) return productsWithMergedSpecs;
    return productsWithMergedSpecs.filter((product) => normalizeCategory(product.category) === activeCategory);
  }, [activeCategory, productsWithMergedSpecs]);

  useEffect(() => {
    if (!activeCategory) {
      setFacetDisplayNames({});
      return;
    }
    const backendSlug = getBackendCategorySlug(activeCategory);
    if (!backendSlug) {
      setFacetDisplayNames({});
      return;
    }
    let cancelled = false;
    catalogApi
      .getFilterFacets(backendSlug)
      .then((facets) => {
        if (cancelled) return;
        const next: Record<string, string> = {};
        facets.forEach((facet) => {
          const normalizedKey = normalizeSpecKey(facet.key);
          next[normalizedKey] = facet.displayName;
        });
        setFacetDisplayNames(next);
      })
      .catch(() => {
        if (!cancelled) setFacetDisplayNames({});
      });
    return () => {
      cancelled = true;
    };
  }, [activeCategory]);

  const specKeys = useMemo(() => {
    const keys = new Set<string>();
    visibleProducts.forEach((p) => {
      const specs = p.specifications as ProductSpecifications | undefined;
      if (specs) Object.keys(specs).forEach((k) => keys.add(k));
    });
    return sortSpecKeysForComparison(Array.from(keys));
  }, [visibleProducts]);

  const resolveSpecLabel = useCallback(
    (key: string): string => {
      const normalized = normalizeSpecKey(key);
      return facetDisplayNames[normalized] ?? specLabel(key);
    },
    [facetDisplayNames]
  );

  if (items.length === 0 && !loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <header className={styles.header}>
            <nav className={styles.breadcrumb}>
              <Link to="/">Главная</Link>
              <span>/</span>
              <span>Сравнение</span>
            </nav>
            <h1 className={styles.title}>Сравнение</h1>
          </header>
          <div className={styles.emptyStateWrapper}>
            <EmptyState 
              title="Список сравнения пуст"
              description="Добавляйте товары из каталога, чтобы сравнить их характеристики и выбрать лучшее решение."
              showResetButton={false}
            />
            <Link to="/catalog" className={styles.backToCatalog}>
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
          <header className={styles.header}>
            <nav className={styles.breadcrumb}>
              <Link to="/">Главная</Link>
              <span>/</span>
              <span>Сравнение</span>
            </nav>
            <h1 className={styles.title}>Сравнение</h1>
          </header>
          <div className={styles.errorContainer}>
            <ApiErrorBanner message={error} onRetry={() => window.location.reload()}>
              <Link to="/catalog" className={styles.emptyBtn}>
                Перейти в каталог
              </Link>
            </ApiErrorBanner>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <nav className={styles.breadcrumb}>
            <Link to="/">Главная</Link>
            <span>/</span>
            <Link to="/catalog">Каталог</Link>
            <span>/</span>
            <span>Сравнение</span>
          </nav>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Сравнение товаров</h1>
            {activeCategory && <span className={styles.categoryBadge}>{getCategoryLabel(activeCategory)}</span>}
          </div>
          <p className={styles.stats}>
            {formatCountRu(visibleProducts.length, RU_FORMS.tovar)} в выбранной категории
          </p>
          {categories.length > 1 && (
            <div className={styles.categoryTabs} role="tablist" aria-label="Категории сравнения">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === category}
                  className={`${styles.categoryTab} ${activeCategory === category ? styles.categoryTabActive : ''}`}
                  onClick={() => setActiveCategory(category)}
                >
                  <span>{getCategoryLabel(category)}</span>
                  <span className={styles.categoryTabCount}>{categoryCounts.get(category) ?? 0}</span>
                </button>
              ))}
            </div>
          )}
        </header>

        {loading ? (
          <div className={styles.loading}>
            <Icon name="loader" size="xl" animated color="gold" />
            <span>Загружаем характеристики...</span>
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className={styles.emptyStateWrapper}>
            <EmptyState
              title="Для этой категории пока нечего сравнивать"
              description="Выберите другую категорию в переключателе сверху или добавьте товары в сравнение из каталога."
              showResetButton={false}
            />
            <Link to="/catalog" className={styles.backToCatalog}>
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.stickyCol}>
                    <div className={styles.cornerHeader}>
                      <span>Характеристики</span>
                    </div>
                  </th>
                  <AnimatePresence mode="popLayout">
                    {visibleProducts.map((product) => {
                      const inCart = isInCart(product.id);
                      const inWishlist = isInWishlist(product.id);
                      const quantityInCart = getItemQuantity(product.id);
                      const canIncrement = product.stock <= 0 || quantityInCart < product.stock;

                      return (
                      <motion.th 
                        key={product.id} 
                        className={styles.productCol}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <div className={styles.productHeader}>
                          <button
                            className={styles.removeBtn}
                            onClick={() => removeItem(product.id)}
                            aria-label={`Удалить ${product.name} из сравнения`}
                            type="button"
                          >
                            <Icon name="close" size="xs" />
                          </button>
                          <Link to={`/product/${product.slug}`} className={styles.productImageLink}>
                            {(() => {
                              const img = getMainImage(product);
                              const url = getProductImageUrl(img?.url);
                              return url && !imageErrors.has(product.id) ? (
                                <img
                                  src={url}
                                  alt={img?.alt ?? product.name}
                                  className={styles.productImage}
                                  onError={() => handleImageError(product.id)}
                                />
                              ) : (
                              <div className={styles.productImagePlaceholder}>
                                <Icon name="image" size="lg" color="secondary" />
                              </div>
                              );
                            })()}
                          </Link>
                          <div className={styles.productInfo}>
                            <Link to={`/product/${product.slug}`} className={styles.productName}>
                              {product.name}
                            </Link>
                            <div className={styles.priceContainer}>
                              <span className={styles.price}>{formatPrice(product.price)}</span>
                            </div>
                            <div className={styles.actionButtons}>
                              <button
                                className={`${styles.wishlistBtn} ${inWishlist ? styles.wishlistBtnActive : ''}`}
                                onClick={() => handleToggleWishlist(product.id)}
                                aria-label={inWishlist ? 'Удалить из избранного' : 'Добавить в избранное'}
                              >
                                <Icon name="heart" size="xs" color={inWishlist ? 'gold' : 'default'} />
                              </button>
                              {inCart ? (
                                <div className={styles.quantityControls}>
                                  <button
                                    className={styles.quantityButton}
                                    onClick={() => handleDecrement(product)}
                                    aria-label="Уменьшить количество"
                                    type="button"
                                  >
                                    <Icon name="minus" size="xs" />
                                  </button>
                                  <span className={styles.quantityValue}>{quantityInCart}</span>
                                  <button
                                    className={styles.quantityButton}
                                    onClick={() => handleIncrement(product)}
                                    disabled={!canIncrement || product.stock === 0}
                                    aria-label="Увеличить количество"
                                    type="button"
                                  >
                                    <Icon name="plus" size="xs" />
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  className={styles.addToCartBtn}
                                  onClick={() => handleAddToCart(product)}
                                  disabled={product.stock === 0}
                                >
                                  <Icon name="cart" size="xs" />
                                  <span>В корзину</span>
                                </button>
                              )}
                              <button 
                                className={styles.quickViewMiniBtn}
                                onClick={() => handleOpenQuickView(product)}
                                aria-label="Быстрый просмотр"
                              >
                                <Icon name="eye" size="xs" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.th>
                    );
                    })}
                  </AnimatePresence>
                </tr>
              </thead>
              <tbody>
                <tr className={styles.row}>
                  <td className={styles.stickyCol}>Производитель</td>
                  {visibleProducts.map((product) => (
                    <td key={product.id} className={styles.valueCell}>
                      {product.manufacturer?.name ?? '—'}
                    </td>
                  ))}
                </tr>
                <tr className={styles.row}>
                  <td className={styles.stickyCol}>Рейтинг</td>
                  {visibleProducts.map((product, idx) => {
                    const ratingNum =
                      typeof product.rating === 'number'
                        ? product.rating
                        : (product.rating as { average?: number } | undefined)?.average;
                    const ratings = visibleProducts.map((p) =>
                      typeof p.rating === 'number' ? p.rating : (p.rating as { average?: number })?.average
                    );
                    const ratingEvaluation = evaluateComparison(activeCategory ?? '', 'rating', ratings);
                    return (
                      <td
                        key={product.id}
                        className={`${styles.valueCell} ${ratingEvaluation.bestIndices.has(idx) ? styles.bestValue : ''}`}
                      >
                        {ratingNum != null && !Number.isNaN(ratingNum) ? (
                          <div className={styles.ratingBox}>
                            <Icon name="star" size="xs" color="gold" />
                            <span>{Number(ratingNum).toFixed(1)}</span>
                          </div>
                        ) : '—'}
                      </td>
                    );
                  })}
                </tr>
                <tr className={styles.row}>
                  <td className={styles.stickyCol}>Наличие</td>
                  {visibleProducts.map((product) => (
                    <td key={product.id} className={styles.valueCell}>
                      <span className={`${styles.stockBadge} ${product.stock === 0 ? styles.outOfStock : styles.inStock}`}>
                        {product.stock === 0 ? 'Под заказ' : 'В наличии'}
                      </span>
                    </td>
                  ))}
                </tr>
                {specKeys.map((key) => {
                  const values = visibleProducts.map((p) => {
                    const specs = p.specifications as ProductSpecifications | undefined;
                    return specs?.[key];
                  });
                  const evaluation = evaluateComparison(activeCategory ?? '', key, values);

                  return (
                    <tr key={key} className={styles.row}>
                      <td className={styles.stickyCol}>{resolveSpecLabel(key)}</td>
                      {visibleProducts.map((product, idx) => {
                        const specs = product.specifications as ProductSpecifications | undefined;
                        const value = specs?.[key];
                        const display = formatSpecValueForKey(key, value);
                        const cellClassName = `${styles.valueCell} ${
                          evaluation.bestIndices.has(idx) ? styles.bestValue : ''
                        }`;

                        return (
                          <td
                            key={product.id}
                            className={cellClassName}
                          >
                            {display}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Модальное окно быстрого просмотра */}
      <Modal
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        title="Быстрый просмотр"
        size="large"
      >
        {quickViewProduct && <QuickViewContent product={quickViewProduct} />}
      </Modal>
    </div>
  );
}
