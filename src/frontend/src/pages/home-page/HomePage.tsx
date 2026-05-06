import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Gpu, MemoryStick, HardDrive, Zap, Box, ThermometerSun, Fan, Monitor, Keyboard, Mouse, Headphones, ArrowRight, Star, Truck, Shield, CreditCard, Users, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ProductCard } from '../../components/product-card/ProductCard';
import { ProductCardSkeleton } from '../../components/ui/Skeleton/ProductCardSkeleton';
import { ApiErrorBanner } from '../../components/ui/ApiErrorBanner';
import { useProducts } from '../../hooks/useProducts';
import { formatCountRu, RU_FORMS } from '../../utils/pluralizeRu';
import { useCategories } from '../../hooks/useCategories';
import type { ProductCategory } from '../../api/types';
const DELAY_CLASSES = ['', '[transition-delay:0.1s]', '[transition-delay:0.2s]', '[transition-delay:0.3s]', '[transition-delay:0.4s]'];

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
          entry.target.classList.add('opacity-100', 'translate-y-0');
        }
      });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('[data-fade-up]');
    fadeElements.forEach((el) => observer.observe(el));

    return () => {
      fadeElements.forEach((el) => observer.unobserve(el));
    };
  }, [categoriesLoading, isLoading, isError]);

  return (
     <div className="min-h-screen bg-canvas-dark">
       <section className="relative overflow-hidden">
         <div className="absolute inset-0 overflow-hidden">
           <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-gold/5 rounded-full blur-[120px]" />
           <div className="absolute top-1/2 right-1/4 w-1/3 h-1/3 bg-blue-500/5 rounded-full blur-[100px]" />
         </div>

         <div className="relative max-w-[1440px] mx-auto px-4 md:px-8 pt-32 pb-20">
           <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 text-gold text-sm font-medium rounded-full mb-6">Конфигуратор ПК нового поколения</div>

           <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-body-text mb-8">
             <span className="block">Собери</span>
             <span className="block whitespace-nowrap">
               <span className="text-gold">идеальный</span> компьютер
             </span>
             <span className="block">за 24 часа</span>
           </h1>

           <p className="text-lg text-muted-text max-w-2xl mb-10">
             Умный подбор комплектующих с автоматической проверкой совместимости.
             Гарантия качества и бесплатная доставка.
           </p>

           <div className="flex flex-col sm:flex-row gap-4">
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

      <section className="py-20">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="flex flex-col items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-body-text mb-4">Категории</h2>
              <p className="text-lg text-muted-text max-w-2xl text-center">Выберите компонент</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" ref={categoriesRef}>
            {categoriesLoading
              ? [...Array(8)].map((_, index) => (
                  <div
                    key={`cat-skeleton-${index}`}
                    className="group relative p-6 bg-surface-card rounded-2xl border border-hairline-dark hover:border-gold/30 transition-all overflow-hidden animate-pulse min-h-[120px] opacity-0 translate-y-[20px] transition-all duration-500"
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
                      className={`group relative p-6 bg-surface-card rounded-2xl border border-hairline-dark hover:border-gold/30 transition-all overflow-hidden opacity-0 translate-y-[20px] transition-all duration-500 ${delayClass}`.trim()}
                      data-fade-up
                    >
                      <div className="w-12 h-12 flex items-center justify-center bg-gold/10 text-gold rounded-xl mb-4 group-hover:bg-gold/20 transition-colors">
                        <IconComponent size={24} />
                      </div>
                      <div className="text-lg font-semibold text-body-text mb-2">{cat.name}</div>
                      <div className="text-sm text-muted-text">{formatCountRu(count, RU_FORMS.tovar)}</div>
                    </Link>
                  );
                })}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="flex flex-col items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-body-text mb-4">Популярное</h2>
              <p className="text-lg text-muted-text max-w-2xl text-center">Выбор недели</p>
            </div>
            <Link to="/catalog" className="text-sm font-medium text-muted-text hover:text-gold flex items-center gap-1.5 transition-colors">
              Смотреть все
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" ref={productsRef}>
            {isLoading && (
              <>
                {[...Array(4)].map((_, index) => (
                  <ProductCardSkeleton key={`skeleton-${index}`} />
                ))}
              </>
            )}

            {isError && (
              <div className="text-center py-12">
                <ApiErrorBanner
                  message="Не удалось загрузить товары. Попробуйте позже."
                  onRetry={() => refetch()}
                />
              </div>
            )}

            {productsData?.data.map((product, index) => {
              const delayClass = index > 0 && index < DELAY_CLASSES.length ? DELAY_CLASSES[index] : '';
              return (
                <div key={product.id} className={`opacity-0 translate-y-[20px] transition-all duration-500 ${delayClass}`.trim()} data-fade-up>
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
