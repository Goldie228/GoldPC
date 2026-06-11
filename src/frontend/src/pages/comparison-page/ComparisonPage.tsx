import { useState, useEffect, useMemo, useCallback, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { useComparisonStore } from '@/store/comparisonStore';
import { useCatalog } from '@/hooks/useCatalog';
import { getProductImageUrl } from '@/utils/image';
import { useCart } from '@/hooks/useCart';
import { useToastStore } from '@/store/toastStore';
import { useWishlistStore } from '@/store/wishlistStore';
import type { Product, ProductSpecifications, ProductCategory, ProductImage } from '@/api/types';
import { Icon } from '@/components/ui/Icon/Icon';
import { Skeleton } from '@/components/ui/Skeleton';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { EmptyState } from '@/components/catalog/EmptyState';
import { formatCountRu, RU_FORMS } from '@/utils/pluralizeRu';
import { getDisplayManufacturerName } from '@/utils/manufacturerNameOverrides';
import { CATEGORY_LABELS_RU } from '@/utils/categoryLabels';
import { specLabel, formatSpecValueForKey } from '@/utils/specifications';
import { specificationsWithDescriptionFallback } from '@/utils/productDescriptionSpecs';
import { evaluateComparison } from '@/utils/comparison/comparisonEngine';
import { getBackendCategorySlug, normalizeCategory, normalizeSpecKey } from '@/utils/comparison/comparisonRules';
import { sortSpecKeysForComparison } from '@/utils/comparison/specKeysSort';

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

function formatRating(value: unknown): number | null {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (value && typeof value === 'object' && 'average' in value) {
    const avg = (value as { average?: number }).average;
    return avg != null && !Number.isNaN(avg) ? avg : null;
  }
  return null;
}

/**
 * Страница сравнения товаров
 * Полностью переработана в соответствии с дизайн-системой GoldPC (DESIGN.md)
 */
export function ComparisonPage(): ReactElement {
  const items = useComparisonStore((state) => state.items);
  const removeItem = useComparisonStore((state) => state.removeItem);
  const clearComparison = useComparisonStore((state) => state.clearComparison);
  const { addToCart, changeQuantity, isInCart, getItemQuantity } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlistStore();
  const showToast = useToastStore((state) => state.showToast);
  const { getProductsByIds, getFilterFacets } = useCatalog();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
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
        console.error('Ошибка загрузки сравнения:', err);
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
        if (!facets) return;
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

  // ============================================================
  // Состояния: пусто, ошибка
  // ============================================================

  if (items.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-canvas-dark pb-12 pt-6">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          {/* Хлебные крошки */}
          <nav className="flex items-center gap-2 text-xs text-muted-text mb-6" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-gold transition-colors no-underline">Главная</Link>
            <span className="text-muted-text/40">/</span>
            <span className="text-body-text">Сравнение</span>
          </nav>

          {/* Карточка пустого состояния */}
          <div className="bg-card border border-border rounded-xl p-12 flex flex-col items-center justify-center max-w-[600px] mx-auto">
            <EmptyState
              title="Список сравнения пуст"
              description="Добавляйте товары из каталога, чтобы сравнить их характеристики и выбрать лучшее решение."
              showResetButton={false}
            />
            <Link
              to="/catalog"
              className="mt-6 inline-flex items-center gap-2 px-8 py-3 font-semibold text-sm no-underline rounded-lg bg-gold text-black"
            >
              Перейти в каталог
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-canvas-dark pb-12 pt-6">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          {/* Хлебные крошки */}
          <nav className="flex items-center gap-2 text-xs text-muted-text mb-6" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-gold transition-colors no-underline">Главная</Link>
            <span className="text-muted-text/40">/</span>
            <Link to="/catalog" className="hover:text-gold transition-colors no-underline">Каталог</Link>
            <span className="text-muted-text/40">/</span>
            <span className="text-body-text">Сравнение</span>
          </nav>

          <div className="flex flex-col items-center gap-4 py-20">
            <ApiErrorBanner message={error} onRetry={() => window.location.reload()}>
              <Link
                to="/catalog"
                className="inline-flex items-center gap-2 px-8 py-3 bg-gold text-gold-ink font-semibold text-sm no-underline rounded-lg transition-all hover:bg-gold-active"
              >
                Перейти в каталог
              </Link>
            </ApiErrorBanner>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // Основной контент
  // ============================================================

  return (
    <div className="min-h-screen bg-canvas-dark pb-12 pt-6">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8">
        {/* Хлебные крошки */}
        <nav className="flex items-center gap-2 text-xs text-muted-text mb-6" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-gold transition-colors no-underline">Главная</Link>
          <span className="text-muted-text/40">/</span>
          <Link to="/catalog" className="hover:text-gold transition-colors no-underline">Каталог</Link>
          <span className="text-muted-text/40">/</span>
          <span className="text-gold font-medium">Сравнение</span>
        </nav>

        {/* Секция заголовка */}
        <header className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-on-dark tracking-tight">
                Сравнение товаров
              </h1>
            </div>

            {items.length > 0 && (
              <button
                onClick={() => {
                  clearComparison();
                  showToast('Список сравнения очищен', 'info');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-muted-text bg-surface-card border border-hairline-dark rounded-lg hover:text-price-rise hover:border-price-rise/30 transition-all"
                type="button"
                aria-label="Очистить список сравнения"
              >
                <Icon name="trash" size="xs" />
                Очистить всё
              </button>
            )}
          </div>

          {/* Бейдж категории + количество товаров */}
          <div className="flex items-center gap-3 flex-wrap mb-4">
            {activeCategory && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-gold bg-gold/10 border border-gold/30 rounded-full">
                <Icon name="grid" size="xs" color="gold" />
                {getCategoryLabel(activeCategory)}
              </span>
            )}
            <p className="text-sm text-muted-text">
              {formatCountRu(visibleProducts.length, RU_FORMS.tovar)}
            </p>
          </div>

          {/* Вкладки категорий */}
          {categories.length > 1 && (
            <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Категории сравнения">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === category}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                    activeCategory === category
                      ? 'bg-gold text-gold-ink border-gold shadow-sm shadow-gold/20'
                      : 'bg-surface-elevated text-muted-text border-hairline-dark hover:text-body-text hover:border-muted-strong'
                  }`}
                  onClick={() => setActiveCategory(category)}
                >
                  <span>{getCategoryLabel(category)}</span>
                  <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-black/20 text-xs font-bold text-inherit">
                    {categoryCounts.get(category) ?? 0}
                  </span>
                </button>
              ))}
            </div>
          )}
        </header>

        {/* Состояние загрузки — skeleton таблицы */}
        {loading ? (
          <div className="bg-surface-card border border-hairline-dark rounded-xl overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[860px] border-separate border-spacing-0">
                {/* ----- Строка заголовков товаров (skeleton) ----- */}
                <thead>
                  <tr>
                    {/* Закреплённый заголовок колонки характеристик */}
                    <th className="sticky left-0 z-15 w-[220px] min-w-[200px] px-4 py-4 text-left bg-surface-card border-b border-r border-hairline-dark">
                      <Skeleton width={120} height={14} borderRadius="sm" />
                    </th>

                    {/* 4 skeleton карточки товаров */}
                    {Array.from({ length: 4 }).map((_, i) => (
                      <th
                        key={i}
                        className="sticky top-0 z-5 min-w-[280px] px-5 py-4 border-b border-l border-hairline-dark bg-surface-elevated"
                      >
                        <div className="flex flex-col items-center gap-3">
                          {/* Изображение */}
                          <Skeleton width={120} height={120} borderRadius="lg" className="mt-4" />
                          {/* Название */}
                          <Skeleton width={160} height={14} borderRadius="sm" />
                          <Skeleton width={110} height={14} borderRadius="sm" />
                          {/* Цена */}
                          <Skeleton width={100} height={22} borderRadius="sm" />
                          {/* Бейдж */}
                          <Skeleton width={80} height={20} borderRadius="full" />
                          {/* Кнопки */}
                          <div className="flex items-center gap-1.5">
                            <Skeleton width={32} height={32} borderRadius="lg" />
                            <Skeleton width={110} height={32} borderRadius="lg" />
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* ----- Строки характеристик (skeleton) ----- */}
                <tbody>
                  {Array.from({ length: 6 }).map((_, rowIdx) => (
                    <tr key={rowIdx} className="transition-colors">
                      {/* Label */}
                      <td className="sticky left-0 z-10 px-4 py-3 bg-surface-card border-b border-r border-hairline-dark">
                        <Skeleton width={rowIdx === 0 ? 110 : rowIdx === 1 ? 70 : rowIdx === 2 ? 80 : 100} height={14} borderRadius="sm" />
                      </td>
                      {/* Значения для 4 товаров */}
                      {Array.from({ length: 4 }).map((_, colIdx) => (
                        <td
                          key={colIdx}
                          className="px-4 py-3 border-b border-l border-hairline-dark text-center"
                        >
                          <Skeleton
                            width={rowIdx === 1 ? 50 : colIdx % 2 === 0 ? 80 : 65}
                            height={14}
                            borderRadius="sm"
                            className="mx-auto"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : visibleProducts.length === 0 ? (
          /* Пустое состояние для выбранной категории */
          <div className="bg-surface-card border border-hairline-dark rounded-xl p-12 flex flex-col items-center justify-center max-w-[600px] mx-auto">
            <EmptyState
              title="Для этой категории пока нечего сравнивать"
              description="Выберите другую категорию в переключателе сверху или добавьте товары в сравнение из каталога."
              showResetButton={false}
            />
            <Link
              to="/catalog"
              className="mt-6 inline-flex items-center gap-2 px-8 py-3 bg-gold text-gold-ink font-semibold text-sm no-underline rounded-lg transition-all hover:bg-gold-active"
            >
              Перейти в каталог
            </Link>
          </div>
        ) : (
          /* ============================================================ */
          /* Таблица сравнения                                             */
          /* ============================================================ */
          <div className="bg-surface-card border border-hairline-dark rounded-xl overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[860px] border-separate border-spacing-0">
                {/* ----- Строка заголовка товара ----- */}
                <thead>
                  <tr>
                    {/* Закреплённый заголовок колонки характеристик */}
                    <th className="sticky left-0 z-15 w-[220px] min-w-[200px] px-4 py-4 text-left text-xs font-semibold text-muted-text uppercase tracking-wider bg-surface-card border-b border-r border-hairline-dark">
                      <span className="text-gold">Характеристики</span>
                    </th>

                    {/* Колонки товаров */}
                    {visibleProducts.map((product) => {
                      const inCart = isInCart(product.id);
                      const inWishlist = isInWishlist(product.id);
                      const quantityInCart = getItemQuantity(product.id);
                      const canIncrement = product.stock === 0 || quantityInCart < product.stock;
                      const mainImage = getMainImage(product);
                      const imageUrl = getProductImageUrl(mainImage?.url);
                      const hasImage = imageUrl && !imageErrors.has(product.id);

                      return (
                        <th
                          key={product.id}
                          className="sticky top-0 z-5 min-w-[280px] px-5 py-4 border-b border-l border-hairline-dark bg-surface-elevated"
                        >
                          <div className="flex flex-col items-center gap-3 relative">
                            {/* Кнопка удаления */}
                            <button
                              className="absolute top-0 right-0 w-6 h-6 flex items-center justify-center rounded-full text-muted-text hover:text-price-rise hover:bg-price-rise/10 transition-all"
                              onClick={() => removeItem(product.id)}
                              aria-label={`Удалить ${product.name} из сравнения`}
                              type="button"
                            >
                              <Icon name="close" size="xs" />
                            </button>

                            {/* Изображение товара */}
                            <Link
                              to={`/product/${product.slug}`}
                              className="block w-[120px] h-[120px] rounded-xl border border-hairline-dark bg-white overflow-hidden transition-transform hover:scale-[1.03] mt-4"
                            >
                              {hasImage ? (
                                <img
                                  src={imageUrl}
                                  alt={mainImage?.alt ?? product.name}
                                  className="w-full h-full object-contain"
                                  onError={() => handleImageError(product.id)}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-surface-elevated">
                                  <Icon name="image" size="lg" color="secondary" />
                                </div>
                              )}
                            </Link>

                            {/* Название товара */}
                            <Link
                              to={`/product/${product.slug}`}
                              className="text-sm font-semibold text-on-dark no-underline line-clamp-2 text-center leading-5 hover:text-gold transition-colors max-w-[220px]"
                            >
                              {product.name}
                            </Link>

                            {/* Цена */}
                            <div className="flex items-baseline gap-1">
                              <span className="text-xl font-bold font-tabular text-on-dark">
                                {formatPrice(product.price)}
                              </span>
                            </div>

                            {/* Бейдж наличия */}
                            <span
                              className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                                product.stock === 0
                                  ? 'text-muted-text border-hairline-dark bg-surface-elevated'
                                  : 'text-price-drop border-price-drop/30 bg-price-drop/10'
                              }`}
                            >
                              {product.stock === 0 ? 'Под заказ' : 'В наличии'}
                            </span>

                            {/* Кнопки действий */}
                            <div className="flex items-center gap-1.5 w-full justify-center">
                              {/* Избранное */}
                              <button
                                className={`w-8 h-8 inline-flex items-center justify-center border rounded-lg transition-all ${
                                  inWishlist
                                    ? 'border-gold/40 bg-gold/10 text-gold'
                                    : 'border-hairline-dark text-muted-text hover:text-gold hover:border-gold/30'
                                }`}
                                onClick={() => handleToggleWishlist(product.id)}
                                aria-label={inWishlist ? 'Удалить из избранного' : 'Добавить в избранное'}
                                type="button"
                              >
                                <Icon name="heart" size="xs" color={inWishlist ? 'gold' : 'default'} />
                              </button>

                              {/* Корзина / Количество */}
                              {inCart ? (
                                <div className="inline-flex items-center flex-1 max-w-[110px] min-h-[32px] border border-hairline-dark rounded-md overflow-hidden bg-surface-card">
                                  <button
                                    className="w-7 h-8 border-none bg-surface-elevated text-muted-text cursor-pointer transition-colors hover:text-gold flex items-center justify-center"
                                    onClick={() => handleDecrement(product)}
                                    aria-label="Уменьшить количество"
                                    type="button"
                                  >
                                    <Icon name="minus" size="xs" />
                                  </button>
                                  <span className="flex-1 text-center font-tabular text-xs text-on-dark bg-surface-card">
                                    {quantityInCart}
                                  </span>
                                  <button
                                    className="w-7 h-8 border-none bg-surface-elevated text-muted-text cursor-pointer transition-colors hover:text-gold flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
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
                                  className="flex-1 max-w-[110px] min-h-[32px] inline-flex items-center justify-center gap-1 px-2.5 bg-price-drop text-on-dark font-semibold text-[11px] rounded-lg border border-price-drop/30 hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                  onClick={() => handleAddToCart(product)}
                                  disabled={product.stock === 0}
                                  type="button"
                                >
                                  <Icon name="cart" size="xs" />
                                  В корзину
                                </button>
                              )}

                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                {/* ----- Строки характеристик ----- */}
                <tbody>
                  {/* Строка производителя */}
                  <tr className="transition-colors hover:[&>td:not(:first-child)]:bg-surface-elevated/40">
                    <td className="sticky left-0 z-10 px-4 py-3 text-sm font-semibold text-muted-text bg-surface-card border-b border-r border-hairline-dark">
                      Производитель
                    </td>
                    {visibleProducts.map((product) => (
                      <td
                        key={product.id}
                        className="px-4 py-3 text-sm text-body-text border-b border-l border-hairline-dark text-center transition-colors"
                      >
                        {getDisplayManufacturerName(product.manufacturer?.name) ?? '—'}
                      </td>
                    ))}
                  </tr>

                  {/* Строка рейтинга */}
                  <tr className="transition-colors hover:[&>td:not(:first-child)]:bg-surface-elevated/40">
                    <td className="sticky left-0 z-10 px-4 py-3 text-sm font-semibold text-muted-text bg-surface-card border-b border-r border-hairline-dark">
                      Рейтинг
                    </td>
                    {visibleProducts.map((product, idx) => {
                      const ratingNum = formatRating(product.rating);
                      const ratings = visibleProducts.map((p) => formatRating(p.rating)).filter((v): v is number => v !== null);
                      const ratingEvaluation = evaluateComparison(activeCategory ?? '', 'rating', ratings);
                      const isBest = ratingEvaluation.bestIndices.has(idx);

                      return (
                        <td
                          key={product.id}
                          className={`px-4 py-3 text-sm border-b border-l border-hairline-dark text-center transition-colors ${
                            isBest
                              ? 'text-gold font-semibold bg-gold/5'
                              : 'text-body-text'
                          }`}
                        >
                          {ratingNum != null && !Number.isNaN(ratingNum) ? (
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-surface-elevated rounded">
                              <Icon name="star" size="xs" color="gold" />
                              <span className="font-tabular text-xs">{Number(ratingNum).toFixed(1)}</span>
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Строка наличия */}
                  <tr className="transition-colors hover:[&>td:not(:first-child)]:bg-surface-elevated/40">
                    <td className="sticky left-0 z-10 px-4 py-3 text-sm font-semibold text-muted-text bg-surface-card border-b border-r border-hairline-dark">
                      Наличие
                    </td>
                    {visibleProducts.map((product) => (
                      <td
                        key={product.id}
                        className="px-4 py-3 text-sm border-b border-l border-hairline-dark text-center transition-colors"
                      >
                        <span
                          className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                            product.stock === 0
                              ? 'text-muted-text border-hairline-dark bg-surface-elevated'
                              : 'text-price-drop border-price-drop/30 bg-price-drop/10'
                          }`}
                        >
                          {product.stock === 0 ? 'Под заказ' : 'В наличии'}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Динамические строки характеристик */}
                  {specKeys.map((key) => {
                    const values = visibleProducts.map((p) => {
                      const specs = p.specifications as ProductSpecifications | undefined;
                      return specs?.[key];
                    });
                    const evaluation = evaluateComparison(activeCategory ?? '', key, values, specContextValues);

                    return (
                      <tr
                        key={key}
                        className="transition-colors hover:[&>td:not(:first-child)]:bg-surface-elevated/40"
                      >
                        {/* Название характеристики - закреплённая левая колонка */}
                        <td className="sticky left-0 z-10 px-4 py-3 text-sm font-semibold text-muted-text bg-surface-card border-b border-r border-hairline-dark">
                          {resolveSpecLabel(key)}
                        </td>

                        {/* Значения характеристик */}
                        {visibleProducts.map((product, idx) => {
                          const specs = product.specifications as ProductSpecifications | undefined;
                          const value = specs?.[key];
                          const display = formatSpecValueForKey(key, value);
                          const isBest = evaluation.bestIndices.has(idx);

                          return (
                            <td
                              key={product.id}
                              className={`px-4 py-3 text-sm border-b border-l border-hairline-dark text-center transition-colors ${
                                isBest
                                  ? 'text-gold font-semibold bg-gold/5'
                                  : 'text-body-text'
                              }`}
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
          </div>
        )}
      </div>
    </div>
  );
}
