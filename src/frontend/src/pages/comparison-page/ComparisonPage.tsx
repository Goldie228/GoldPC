import { useState, useEffect, useMemo, useCallback, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { useComparisonStore } from '../../store/comparisonStore';
import { useCatalog } from '../../hooks/useCatalog';
import { getProductImageUrl } from '../../utils/image';
import { useCart } from '../../hooks/useCart';
import { useToastStore } from '../../store/toastStore';
import { useWishlistStore } from '../../store/wishlistStore';
import type { Product, ProductSpecifications, ProductCategory, ProductImage } from '../../api/types';
import { Icon } from '../../components/ui/Icon/Icon';
import { ApiErrorBanner } from '../../components/ui/ApiErrorBanner';
import { EmptyState } from '../../components/catalog/EmptyState';
import { formatCountRu, RU_FORMS } from '../../utils/pluralizeRu';
import { ProductQuickViewContent } from '../../components/product/ProductQuickViewContent';
import { CATEGORY_LABELS_RU } from '../../utils/categoryLabels';
import { specLabel, formatSpecValueForKey } from '../../utils/specifications';
import { specificationsWithDescriptionFallback } from '../../utils/productDescriptionSpecs';
import { evaluateComparison } from '../../utils/comparison/comparisonEngine';
import { getBackendCategorySlug, normalizeCategory, normalizeSpecKey } from '../../utils/comparison/comparisonRules';
import { sortSpecKeysForComparison } from '../../utils/comparison/specKeysSort';
import { useModal } from '../../hooks/useModal';

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
  const { getProductsByIds, getFilterFacets } = useCatalog();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const { openModal, closeModal } = useModal();
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

    getProductsByIds(itemIds)
      .then((loaded) => {
        if (cancelled) return;
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
    openModal({
      title: product.name ?? 'Быстрый просмотр',
      size: 'large',
      content: (
        <ProductQuickViewContent
          product={product}
          onClose={closeModal}
        />
      ),
    });
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
    getFilterFacets(backendSlug)
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

  /** Контекст всех значений строк — нужен для conditional-сравнений (например, voltage при mixed DDR4/DDR5). */
  const specContextValues = useMemo(() => {
    const ctx: Record<string, (string | number | boolean | undefined)[]> = {};
    for (const key of specKeys) {
      ctx[key] = visibleProducts.map((p) => {
        const specs = p.specifications as ProductSpecifications | undefined;
        return specs?.[key];
      });
    }
    return ctx;
  }, [specKeys, visibleProducts]);

  const resolveSpecLabel = useCallback(
    (key: string): string => {
      const normalized = normalizeSpecKey(key);
      return facetDisplayNames[normalized] ?? specLabel(key);
    },
    [facetDisplayNames]
  );

  if (items.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="max-w-[1680px] mx-auto px-6">
          <header className="mb-8">
            <nav className="flex items-center gap-2 text-[0.75rem] text-foreground-dim mb-3">
              <Link to="/" className="text-muted-foreground no-underline transition-colors hover:text-accent">Главная</Link>
              <span>/</span>
              <span>Сравнение</span>
            </nav>
            <h1 className="text-[clamp(1.5rem,4vw,2rem)] font-semibold tracking-tight text-foreground mb-0">Сравнение</h1>
          </header>
          <div className="flex flex-col items-center justify-center p-20 bg-border-muted border border-border-muted rounded-xl backdrop-blur-sm">
            <EmptyState
              title="Список сравнения пуст"
              description="Добавляйте товары из каталога, чтобы сравнить их характеристики и выбрать лучшее решение."
              showResetButton={false}
            />
            <Link to="/catalog" className="mt-6 px-8 py-3 bg-accent text-background font-semibold no-underline rounded-md transition-all hover:-translate-y-0.5 hover:shadow-lg">
              Перейти в каталог
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="max-w-[1680px] mx-auto px-6">
          <header className="mb-8">
            <nav className="flex items-center gap-2 text-[0.75rem] text-foreground-dim mb-3">
              <Link to="/" className="text-muted-foreground no-underline transition-colors hover:text-accent">Главная</Link>
              <span>/</span>
              <span>Сравнение</span>
            </nav>
            <h1 className="text-[clamp(1.5rem,4vw,2rem)] font-semibold tracking-tight text-foreground mb-0">Сравнение</h1>
          </header>
          <div className="flex flex-col items-center gap-4 p-15 text-foreground">
            <ApiErrorBanner message={error} onRetry={() => window.location.reload()}>
              <Link to="/catalog" className="inline-flex px-8 py-3.5 bg-accent text-background font-semibold no-underline rounded-md transition-all hover:-translate-y-0.5 hover:shadow-lg">
                Перейти в каталог
              </Link>
            </ApiErrorBanner>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-[1680px] mx-auto px-6">
        <header className="mb-8">
          <nav className="flex items-center gap-2 text-[0.75rem] text-foreground-dim mb-3">
            <Link to="/" className="text-muted-foreground no-underline transition-colors hover:text-accent">Главная</Link>
            <span>/</span>
            <Link to="/catalog" className="text-muted-foreground no-underline transition-colors hover:text-accent">Каталог</Link>
            <span>/</span>
            <span>Сравнение</span>
          </nav>
          <div className="flex items-center gap-4 mb-2 flex-wrap">
            <h1 className="text-[clamp(1.5rem,4vw,2rem)] font-semibold tracking-tight text-foreground">Сравнение товаров</h1>
            {activeCategory && <span className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-accent px-3 py-1 bg-border-muted border border-border-muted rounded-full">{getCategoryLabel(activeCategory)}</span>}
          </div>
          <p className="text-[0.85rem] text-muted-foreground">
            {formatCountRu(visibleProducts.length, RU_FORMS.tovar)} в выбранной категории
          </p>
          {categories.length > 1 && (
            <div className="flex gap-2 flex-wrap mt-3.5" role="tablist" aria-label="Категории сравнения">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === category}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border transition-all text-sm cursor-pointer
                    ${activeCategory === category ? 'text-accent border-border-muted bg-border-muted' : 'text-muted-foreground border-border bg-border-muted hover:text-foreground hover:border-border-muted'}
                  `}
                  onClick={() => setActiveCategory(category)}
                >
                  <span>{getCategoryLabel(category)}</span>
                  <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full border border-border-muted bg-border-muted text-xs text-foreground">{categoryCounts.get(category) ?? 0}</span>
                </button>
              ))}
            </div>
          )}
        </header>

        {loading ? (
          <div className="flex flex-col items-center gap-4 p-25 text-muted-foreground">
            <Icon name="loader" size="xl" animated color="gold" />
            <span>Загружаем характеристики...</span>
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 bg-border-muted/50 border border-border-muted rounded-xl backdrop-blur-sm">
            <EmptyState
              title="Для этой категории пока нечего сравнивать"
              description="Выберите другую категорию в переключателе сверху или добавьте товары в сравнение из каталога."
              showResetButton={false}
            />
            <Link to="/catalog" className="mt-6 px-8 py-3 bg-accent text-background font-semibold no-underline rounded-md transition-all hover:-translate-y-0.5 hover:shadow-lg">
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto bg-card border border-border rounded-xl shadow-lg relative scrollbar-thin scrollbar-thumb-border-muted scrollbar-track-transparent">
            <table className="w-full border-separate border-spacing-0 min-w-[860px]">
              <thead>
                <tr>
                  <th className="sticky left-0 z-15 w-[240px] min-w-[200px] p-5 text-left text-[0.8rem] font-semibold text-muted-foreground bg-card border-b border-border-muted border-r border-border-muted after:content-[''] after:absolute after:top-0 after:right-[-10px] after:w-2.5 after:h-full after:bg-gradient-to-r after:from-border-muted after:to-transparent after:pointer-events-none">
                    <div className="text-accent uppercase tracking-[0.05em] text-[0.7rem]">
                      <span>Характеристики</span>
                    </div>
                  </th>
                    {visibleProducts.map((product) => {
                      const inCart = isInCart(product.id);
                      const inWishlist = isInWishlist(product.id);
                      const quantityInCart = getItemQuantity(product.id);
                      const canIncrement = product.stock <= 0 || quantityInCart < product.stock;

                      return (
                      <th
                        key={product.id}
                        className="p-6 min-w-[290px] border-l border-border-muted"
                      >
                        <div className="flex flex-col gap-4 relative">
                          <button
                            className="absolute top-[-8px] right-[-8px] w-7 h-7 flex items-center justify-center bg-border-muted border border-border-muted rounded-full text-muted-foreground cursor-pointer transition-all hover:text-accent hover:border-border-muted hover:bg-border-muted hover:scale-108 z-5"
                            onClick={() => removeItem(product.id)}
                            aria-label={`Удалить ${product.name} из сравнения`}
                            type="button"
                          >
                            <Icon name="close" size="xs" />
                          </button>
                          <Link to={`/product/${product.slug}`} className="block w-[140px] mx-auto transition-transform hover:scale-104">
                            {(() => {
                              const mainImage = getMainImage(product);
                              const url = getProductImageUrl(mainImage?.url);
                              return (
                                <div className="w-[140px] h-[140px] mx-auto rounded-xl border border-border-muted bg-white flex items-center justify-center overflow-hidden box-border">
                                  {url && !imageErrors.has(product.id) ? (
                                    <img
                                      src={url}
                                      alt={mainImage?.alt ?? product.name}
                                      className="w-full h-full object-contain block"
                                      onError={() => handleImageError(product.id)}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-border-muted rounded-0 text-foreground-dim">
                                      <Icon name="image" size="lg" color="secondary" />
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </Link>
                          <div className="flex flex-col gap-3">
                            <Link to={`/product/${product.slug}`} className="text-[0.95rem] font-medium text-foreground no-underline leading-1.4 line-clamp-2 transition-colors hover:text-accent">
                              {product.name}
                            </Link>
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-bold text-accent">{formatPrice(product.price)}</span>
                            </div>
                            <div className="flex gap-2 w-full items-center">
                              <button
                                className={`w-9.5 h-9.5 inline-flex items-center justify-center border border-border-muted bg-border-muted text-foreground transition-all rounded-md hover:border-border-muted hover:text-accent hover:bg-border-muted
                                  ${inWishlist ? 'border-border-muted bg-border-muted' : ''}
                                `}
                                onClick={() => handleToggleWishlist(product.id)}
                                aria-label={inWishlist ? 'Удалить из избранного' : 'Добавить в избранное'}
                              >
                                <Icon name="heart" size="xs" color={inWishlist ? 'gold' : 'default'} />
                              </button>
                              {inCart ? (
                                <div className="inline-flex items-center flex-1 min-h-[38px] border border-border-muted rounded-md overflow-hidden">
                                  <button
                                    className="w-8.5 h-9 border-none bg-border-muted text-foreground cursor-pointer transition-all rounded-0 hover:text-accent hover:bg-border-muted"
                                    onClick={() => handleDecrement(product)}
                                    aria-label="Уменьшить количество"
                                    type="button"
                                  >
                                    <Icon name="minus" size="xs" />
                                  </button>
                                  <span className="flex-1 text-center font-semibold text-sm text-foreground">{quantityInCart}</span>
                                  <button
                                    className="w-8.5 h-9 border-none bg-border-muted text-foreground cursor-pointer transition-all rounded-0 hover:text-accent hover:bg-border-muted disabled:opacity-45 disabled:cursor-not-allowed"
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
                                  className="flex-1 min-h-[38px] px-2.5 inline-flex items-center justify-center gap-1.5 border border-border-muted bg-border-muted text-foreground font-semibold text-[0.82rem] cursor-pointer rounded-md transition-all hover:border-border-muted hover:bg-border-muted hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed"
                                  onClick={() => handleAddToCart(product)}
                                  disabled={product.stock === 0}
                                >
                                  <Icon name="cart" size="xs" />
                                  <span>В корзину</span>
                                </button>
                              )}
                              <button
                                className="w-9.5 h-9.5 inline-flex items-center justify-center border border-border-muted bg-border-muted text-foreground transition-all rounded-md hover:border-border-muted hover:text-accent hover:bg-border-muted"
                                onClick={() => handleOpenQuickView(product)}
                                aria-label="Быстрый просмотр"
                              >
                                <Icon name="eye" size="xs" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </th>
                    );
                    })}
                </tr>
              </thead>
              <tbody>
                <tr className="hover:[&>td:first-child]:bg-[#1e1e22] hover:[&>td:not(:first-child)]:bg-border-muted">
                  <td className="sticky left-0 z-10 p-4 text-[0.8rem] font-semibold text-muted-foreground bg-card border-b border-border-muted border-r border-border-muted">Производитель</td>
                  {visibleProducts.map((product) => (
                    <td key={product.id} className="p-4 text-sm text-foreground border-b border-border-muted border-l border-border-muted text-center transition-colors">
                      {product.manufacturer?.name ?? '—'}
                    </td>
                  ))}
                </tr>
                <tr className="hover:[&>td:first-child]:bg-[#1e1e22] hover:[&>td:not(:first-child)]:bg-border-muted">
                  <td className="sticky left-0 z-10 p-4 text-[0.8rem] font-semibold text-muted-foreground bg-card border-b border-border-muted border-r border-border-muted">Рейтинг</td>
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
                        className={`p-4 text-sm text-foreground border-b border-border-muted border-l border-border-muted text-center transition-colors
                          ${ratingEvaluation.bestIndices.has(idx) ? '!bg-transparent !text-foreground font-semibold border-2 border-accent rounded' : ''}
                        `}
                      >
                        {ratingNum != null && !Number.isNaN(ratingNum) ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-border-muted rounded">
                            <Icon name="star" size="xs" color="gold" />
                            <span>{Number(ratingNum).toFixed(1)}</span>
                          </div>
                        ) : '—'}
                      </td>
                    );
                  })}
                </tr>
                <tr className="hover:[&>td:first-child]:bg-[#1e1e22] hover:[&>td:not(:first-child)]:bg-border-muted">
                  <td className="sticky left-0 z-10 p-4 text-[0.8rem] font-semibold text-muted-foreground bg-card border-b border-border-muted border-r border-border-muted">Наличие</td>
                  {visibleProducts.map((product) => (
                    <td key={product.id} className="p-4 text-sm text-foreground border-b border-border-muted border-l border-border-muted text-center transition-colors">
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full border text-[0.76rem] font-semibold
                        ${product.stock === 0 ? 'text-muted-foreground border-border-muted bg-border-muted' : 'text-accent border-border-muted bg-border-muted'}
                      `}>
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
                  const evaluation = evaluateComparison(activeCategory ?? '', key, values, specContextValues);

                  return (
                    <tr key={key} className="hover:[&>td:first-child]:bg-[#1e1e22] hover:[&>td:not(:first-child)]:bg-border-muted">
                      <td className="sticky left-0 z-10 p-4 text-[0.8rem] font-semibold text-muted-foreground bg-card border-b border-border-muted border-r border-border-muted">{resolveSpecLabel(key)}</td>
                      {visibleProducts.map((product, idx) => {
                        const specs = product.specifications as ProductSpecifications | undefined;
                        const value = specs?.[key];
                        const display = formatSpecValueForKey(key, value);
                        const cellClassName = `p-4 text-sm text-foreground border-b border-border-muted border-l border-border-muted text-center transition-colors
                          ${evaluation.bestIndices.has(idx) ? '!bg-transparent !text-foreground font-semibold border-2 border-accent rounded' : ''}
                        `;

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

    </div>
  );
}
