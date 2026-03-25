import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Cpu,
  Monitor,
  MemoryStick,
  HardDrive,
  Zap,
  Box,
  ThermometerSun,
  Keyboard,
  Mouse,
  Headphones,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ProductCard } from '../../components/ProductCard';
import { ProductCardSkeleton } from '../../components/ui/Skeleton/ProductCardSkeleton';
import { ApiErrorBanner } from '../../components/ui/ApiErrorBanner';
import { useProducts } from '../../hooks/useProducts';
import { formatCountRu, RU_FORMS } from '../../utils/pluralizeRu';
import { useCategories } from '../../hooks/useCategories';
import type { ProductCategory } from '../../api/types';
import styles from './HomePage.module.css';

const DELAY_CLASSES = ['', styles.delay1, styles.delay2, styles.delay3, styles.delay4];

// Маппинг backend slug -> frontend id для ссылок
const BACKEND_TO_FRONTEND: Record<string, ProductCategory> = {
  processors: 'cpu',
  motherboards: 'motherboard',
  ram: 'ram',
  gpu: 'gpu',
  psu: 'psu',
  storage: 'storage',
  cases: 'case',
  coolers: 'cooling',
  monitors: 'monitor',
  keyboards: 'keyboard',
  mice: 'mouse',
  headphones: 'headphones',
  periphery: 'keyboard',
};

// Маппинг frontend id -> иконка
const CATEGORY_ICONS: Record<ProductCategory, LucideIcon> = {
  cpu: Cpu,
  gpu: Monitor,
  motherboard: Cpu,
  ram: MemoryStick,
  storage: HardDrive,
  psu: Zap,
  case: Box,
  cooling: ThermometerSun,
  monitor: Monitor,
  keyboard: Keyboard,
  mouse: Mouse,
  headphones: Headphones,
};

/**
 * HomePage - Main landing page for GoldPC
 * Matching prototypes/home.html design
 */
export function HomePage() {
  const categoriesRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef<HTMLDivElement>(null);

  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();

  const { data: productsData, isLoading, isError, refetch } = useProducts({
    pageSize: 8,
    isFeatured: true,
    sortBy: 'rating',
    sortOrder: 'desc',
  });

  const heroPreviewProducts = (productsData?.data ?? []).slice(0, 3);
  const heroPreviewTotal = heroPreviewProducts.reduce((sum, p) => sum + p.price, 0);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(styles.fadeUpVisible);
        }
      });
    }, observerOptions);

    const fadeElements = document.querySelectorAll(`.${styles.fadeUp}`);
    fadeElements.forEach((el) => observer.observe(el));

    return () => {
      fadeElements.forEach((el) => observer.unobserve(el));
    };
  }, [categoriesLoading, isLoading, isError]);

  return (
    <div className={styles.homePage}>
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <div className={styles.gridPattern} />
          <div className={styles.glow1} />
          <div className={styles.glow2} />
        </div>

        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <div className={styles.heroTag}>PC Builder v2.0</div>
            <h1 className={styles.heroTitle}>
              <span className={styles.heroTitleLine}>Собери свой</span>
              <span className={`${styles.heroTitleLine} ${styles.heroTitleLine2}`}>
                <span className={styles.heroTitleAccent}>идеальный</span>&nbsp;ПК
              </span>
            </h1>
            <p className={styles.heroDesc}>
              Интеллектуальный конфигуратор с проверкой совместимости в реальном времени.
              Профессиональная сборка за 24 часа.
            </p>
            <div className={styles.heroActions}>
              <Link to="/pc-builder">
                <Button variant="primary" icon={<ArrowRight size={16} />}>
                  Начать сборку
                </Button>
              </Link>
              <Link to="/catalog">
                <Button variant="ghost">Каталог</Button>
              </Link>
            </div>

            <div className={styles.heroStats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>12K+</span>
                <span className={styles.statLabel}>Сборок</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>98%</span>
                <span className={styles.statLabel}>Совместимость</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>24ч</span>
                <span className={styles.statLabel}>Сборка</span>
              </div>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.heroCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Топ по рейтингу</span>
                <span className={styles.cardBadge}>LIVE</span>
              </div>
              <div className={styles.buildPreview}>
                {isLoading &&
                  [...Array(3)].map((_, i) => (
                    <div key={`hero-skel-${i}`} className={`${styles.buildItem} ${styles.buildItemSkeleton}`} aria-hidden>
                      <div className={`${styles.buildIcon} ${styles.buildIconSkeleton}`} />
                      <div className={styles.buildInfo}>
                        <div className={styles.buildNameSkeleton} />
                        <div className={styles.buildSpecSkeleton} />
                      </div>
                      <div className={styles.buildPriceSkeleton} />
                    </div>
                  ))}
                {!isLoading &&
                  heroPreviewProducts.map((product) => {
                    const IconComponent = CATEGORY_ICONS[product.category] ?? Cpu;
                    const spec =
                      product.descriptionShort?.trim().slice(0, 48) ||
                      [product.brand, product.category].filter(Boolean).join(' · ') ||
                      'В каталоге';
                    return (
                      <Link
                        key={product.id}
                        to={`/product/${product.id}`}
                        className={`${styles.buildItem} ${styles.buildItemLink}`}
                      >
                        <div className={styles.buildIcon}>
                          <IconComponent size={20} />
                        </div>
                        <div className={styles.buildInfo}>
                          <div className={styles.buildName}>{product.name}</div>
                          <div className={styles.buildSpec}>{spec}</div>
                        </div>
                        <div className={styles.buildPrice}>
                          {product.price.toLocaleString('ru-BY')} BYN
                        </div>
                      </Link>
                    );
                  })}
                {!isLoading && heroPreviewProducts.length === 0 && (
                  <div className={styles.heroPreviewEmpty}>
                    <p>Скоро здесь появятся рекомендованные товары.</p>
                    <Link to="/catalog" className={styles.heroPreviewEmptyLink}>
                      Перейти в каталог
                    </Link>
                  </div>
                )}
              </div>
              <div className={styles.buildTotal}>
                <span className={styles.totalLabel}>
                  {heroPreviewProducts.length > 0
                    ? `Итого, ${formatCountRu(heroPreviewProducts.length, RU_FORMS.tovar)}`
                    : 'Итого'}
                </span>
                <span className={styles.totalValue}>
                  <span>
                    {heroPreviewProducts.length > 0
                      ? heroPreviewTotal.toLocaleString('ru-BY')
                      : '—'}
                  </span>{' '}
                  BYN
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.categories}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Категории</h2>
              <p className={styles.sectionSubtitle}>Выберите компонент</p>
            </div>
            <Link to="/catalog" className={styles.viewAll}>
              Все категории
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className={styles.categoriesGrid} ref={categoriesRef}>
            {categoriesLoading
              ? [...Array(8)].map((_, index) => (
                  <div
                    key={`cat-skeleton-${index}`}
                    className={`${styles.categoryCard} ${styles.categoryCardSkeleton} ${styles.fadeUp}`}
                  />
                ))
              : (categoriesData ?? []).map((cat, index) => {
                  const frontendId = (BACKEND_TO_FRONTEND[cat.slug] ?? cat.slug) as ProductCategory;
                  const IconComponent = CATEGORY_ICONS[frontendId] ?? Cpu;
                  const delayClass = index > 0 && index < DELAY_CLASSES.length ? DELAY_CLASSES[index] : '';
                  const count = cat.productCount ?? 0;
                  return (
                    <Link
                      key={cat.id}
                      to={`/catalog/${frontendId}`}
                      className={`${styles.categoryCard} ${styles.fadeUp} ${delayClass}`.trim()}
                    >
                      <div className={styles.categoryIcon}>
                        <IconComponent size={24} />
                      </div>
                      <div className={styles.categoryName}>{cat.name}</div>
                      <div className={styles.categoryCount}>{formatCountRu(count, RU_FORMS.tovar)}</div>
                    </Link>
                  );
                })}
          </div>
        </div>
      </section>

      <section className={styles.products}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Популярное</h2>
              <p className={styles.sectionSubtitle}>Выбор недели</p>
            </div>
            <Link to="/catalog" className={styles.viewAll}>
              Смотреть все
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className={styles.productsGrid} ref={productsRef}>
            {isLoading && (
              <>
                {[...Array(4)].map((_, index) => (
                  <ProductCardSkeleton key={`skeleton-${index}`} />
                ))}
              </>
            )}

            {isError && (
              <div className={styles.productsError}>
                <ApiErrorBanner
                  message="Не удалось загрузить товары. Попробуйте позже."
                  onRetry={() => refetch()}
                />
              </div>
            )}

            {productsData?.data.map((product, index) => {
              const delayClass = index > 0 && index < DELAY_CLASSES.length ? DELAY_CLASSES[index] : '';
              return (
                <div key={product.id} className={`${styles.fadeUp} ${delayClass}`.trim()}>
                  <ProductCard
                    product={product}
                    imageFetchPriority={index === 0 ? 'high' : undefined}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
