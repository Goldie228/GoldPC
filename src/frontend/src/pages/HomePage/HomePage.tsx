import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Gpu, MemoryStick, HardDrive, Zap, Box, ThermometerSun, Fan, Monitor, Keyboard, Mouse, Headphones, ArrowRight, Star, Truck, Shield, CreditCard, Users, ChevronRight } from 'lucide-react';
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
  gpu: Gpu,
  motherboard: Cpu,
  ram: MemoryStick,
  storage: HardDrive,
  psu: Zap,
  case: Box,
  cooling: ThermometerSun,
  fan: Fan,
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
    sortBy: 'rating',
    sortOrder: 'desc',
  });

  const heroPreviewProducts = (productsData?.data ?? []).slice(0, 3);
  void heroPreviewProducts;

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
          <div className={styles.glow1} />
          <div className={styles.glow2} />
        </div>
        <div className={styles.heroGlass} />
        
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>Конфигуратор ПК нового поколения</div>
          
          <h1 className={styles.heroTitle}>
            <span className={styles.heroTitleLine}>Собери</span>
            <span className={`${styles.heroTitleLine} ${styles.heroTitleLine2}`}>
              <span className={styles.heroTitleAccent}>идеальный</span> компьютер
            </span>
            <span className={styles.heroTitleLine}>за 24 часа</span>
          </h1>
          
          <p className={styles.heroDesc}>
            Умный подбор комплектующих с автоматической проверкой совместимости. 
            Гарантия качества и бесплатная доставка.
          </p>
          
          <div className={styles.heroActions}>
            <Link to="/pc-builder">
              <Button variant="primary" size="lg" icon={<ArrowRight size={18} />}>
                Собрать свой ПК
              </Button>
            </Link>
            <Link to="/catalog">
              <Button variant="outline" size="lg">Каталог</Button>
            </Link>
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
          </div>

          <div className={styles.categoriesGrid} ref={categoriesRef}>
            {categoriesLoading
              ? [...Array(8)].map((_, index) => (
                  <div
                    key={`cat-skeleton-${index}`}
                    className={`${styles.categoryCard} ${styles.categoryCardSkeleton} ${styles.fadeUp}`}
                  />
                ))
              : (categoriesData ?? [])
                  .filter((cat) => (cat.productCount ?? 0) > 0)
                  .map((cat, index) => {
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
