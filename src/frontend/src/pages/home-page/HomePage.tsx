import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import './HomePage.css';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Gpu, MemoryStick, HardDrive, Zap, Box, ThermometerSun, Monitor, Fan, Shield, Truck, Star, ChevronRight, ArrowRight, Award, ChevronLeft, Pause, Play, Keyboard, Mouse, Headphones } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProductCard } from '@/components/product-card/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton/ProductCardSkeleton';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { formatCountRu, RU_FORMS } from '@/utils/pluralizeRu';
import type { ProductCategory } from '@/api/types';

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

// Иконки категорий (lucide-react компоненты, а не JSX)
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

// ─── Hero Background Placeholder ───────────────────────────────────
function HeroBackground() {
  const videoA = useRef<HTMLVideoElement>(null);
  const videoB = useRef<HTMLVideoElement>(null);
  const videosRef = useRef<string[]>([]);
  const activeRef = useRef(0);
  const transitioningRef = useRef(false);

  // Probe ALL videos in parallel, store list, then start first
  useEffect(() => {
    let cancelled = false;

    const probe = async () => {
      const urls: string[] = [];
      for (let i = 1; i <= 10; i++) urls.push(`/hero-videos/video-${i}.mp4`);

      const results = await Promise.allSettled(
        urls.map(async (url) => {
          const r = await fetch(url, { method: 'HEAD' }).catch(() => null);
          return r && r.ok ? url : null;
        })
      );

      if (cancelled) return;

      const found = results
        .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled' && r.value !== null)
        .map(r => r.value)
        .sort((a, b) => {
          const na = parseInt(a.match(/video-(\d+)/)?.[1] ?? '0');
          const nb = parseInt(b.match(/video-(\d+)/)?.[1] ?? '0');
          return na - nb;
        });

      if (found.length === 0) return;

      videosRef.current = found;
      activeRef.current = 0;

      if (videoA.current) {
        videoA.current.src = found[0];
        videoA.current.load();
        videoA.current.play().catch(() => {});
      }
    };

    probe();
    return () => { cancelled = true; };
  }, []);

  const handleEnd = useCallback(() => {
    if (transitioningRef.current) return;
    const list = videosRef.current;
    if (list.length <= 1) return;

    transitioningRef.current = true;
    const idx = activeRef.current;
    const next = (idx + 1) % list.length;
    const outgoing = idx % 2 === 0 ? videoA : videoB;
    const incoming = idx % 2 === 0 ? videoB : videoA;

    if (incoming.current) {
      incoming.current.src = list[next];
      incoming.current.load();
    }

    if (outgoing.current) outgoing.current.style.opacity = '0';
    if (incoming.current) incoming.current.style.opacity = '1';

    incoming.current?.play().catch(() => {}).then(() => {
      setTimeout(() => {
        outgoing.current?.pause();
        transitioningRef.current = false;
      }, 1600);
    });

    activeRef.current = next;
  }, []);

  return (
    <div className="home-hero__bg--placeholder" aria-hidden="true">
      <video ref={videoA} className="home-hero__bg-video" muted playsInline preload="auto" onEnded={handleEnd} style={{ opacity: 1 }} />
      <video ref={videoB} className="home-hero__bg-video" muted playsInline preload="auto" onEnded={handleEnd} style={{ opacity: 0 }} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
    </div>
  );
}

// ─── Stat Card (Trust Band) ────────────────────────────────────────
interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
}

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <div className="home-trust__card">
      <div className="home-trust__icon-wrap">{icon}</div>
      <div className="home-trust__value">{value}</div>
      <div className="home-trust__label">{label}</div>
    </div>
  );
}

// ─── Category Card ─────────────────────────────────────────────────
interface CategoryCardProps {
  Icon: LucideIcon;
  name: string;
  count: number;
  href: string;
}

function CategoryCard({ Icon, name, count, href }: CategoryCardProps) {
  return (
    <Link to={href} className="home-categories__link">
      <div className="home-categories__icon-wrap">
        <Icon size={24} />
      </div>
      <span className="home-categories__name">{name}</span>
      <span className="home-categories__count">
        {formatCountRu(count, RU_FORMS.tovar)}
      </span>
    </Link>
  );
}

// ─── Gaming Setup Carousel ──────────────────────────────────────────
interface GamingSlide {
  label: string;
  subtitle: string;
  src: string;
  alt: string;
}

function GamingCarousel({ slides }: { slides: GamingSlide[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [imgError, setImgError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
  }, [slides.length]);

  const stopAutoPlay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!paused) startAutoPlay();
    else stopAutoPlay();
    return stopAutoPlay;
  }, [paused, startAutoPlay, stopAutoPlay]);

  const goTo = (i: number) => { setCurrent(i); setImgError(false); };
  const goNext = () => { setCurrent((prev) => (prev + 1) % slides.length); setImgError(false); };
  const goPrev = () => { setCurrent((prev) => (prev - 1 + slides.length) % slides.length); setImgError(false); };

  const slide = slides[current];

  return (
    <div
      className="home-gaming__carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-label="Галерея игровых сетапов"
      aria-roledescription="carousel"
    >
      {/* Изображение с анимацией */}
      <div className="home-gaming__carousel-viewport">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current}
            className="home-gaming__carousel-slide"
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -80 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            aria-roledescription="slide"
            aria-label={`Слайд ${current + 1} из ${slides.length}`}
          >
            {imgError ? (
              <div className="home-gaming__carousel-fallback">
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="max-w-[80%] max-h-[80%]" role="img" aria-label={`Фото ${slide.label} отсутствует`}>
                       <rect x="2" y="3" width="20" height="14" rx="2" />
                       <path d="M8 21h8M12 17v4" />
                     </svg>
              </div>
            ) : (
              <img
                src={slide.src}
                alt={slide.alt}
                className="home-gaming__carousel-img"
                onError={() => setImgError(true)}
              />
            )}
            {/* Тёмное затемнение */}
            <div className="home-gaming__carousel-overlay-dark" />
            {/* Оверлей с текстом */}
            <div className="home-gaming__carousel-overlay">
              <h3 className="home-gaming__carousel-label">{slide.label}</h3>
              <p className="home-gaming__carousel-subtitle">{slide.subtitle}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Стрелки */}
      <button
        className="home-gaming__carousel-arrow home-gaming__carousel-arrow--left"
        onClick={goPrev}
        aria-label="Предыдущий слайд"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        className="home-gaming__carousel-arrow home-gaming__carousel-arrow--right"
        onClick={goNext}
        aria-label="Следующий слайд"
      >
        <ChevronRight size={24} />
      </button>

      {/* Dots + пауза */}
      <div className="home-gaming__carousel-footer">
        <div className="home-gaming__carousel-dots" role="tablist" aria-label="Навигация по слайдам">
          {slides.map((s, i) => (
            <button
              key={s.label}
              className={`home-gaming__carousel-dot ${i === current ? 'home-gaming__carousel-dot--active' : ''}`}
              onClick={() => goTo(i)}
              role="tab"
              aria-selected={i === current}
              aria-label={`Слайд ${i + 1}: ${s.label}`}
            />
          ))}
        </div>
        <button
          className="home-gaming__carousel-pause"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? 'Возобновить автовоспроизведение' : 'Приостановить автовоспроизведение'}
        >
          {paused ? <Play size={14} /> : <Pause size={14} />}
        </button>
      </div>
    </div>
  );
}

/**
 * HomePage — Главная страница GoldPC
 */
export function HomePage() {
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const { data: productsData, isLoading, isError, refetch } = useProducts({
    pageSize: 8,
    sortBy: 'rating',
    sortOrder: 'desc',
  });

  const popularProducts = useMemo(() => (productsData?.data ?? []).slice(0, 8), [productsData]);

  // Категории для рендера
  const trustItems = useMemo(() => [
    { icon: <Shield size={28} strokeWidth={1.5} />, value: '5 лет', label: 'Гарантия на все товары' },
    { icon: <Award size={28} strokeWidth={1.5} />, value: '100 000+', label: 'Ремонтов проведено успешно' },
    { icon: <Star size={28} strokeWidth={1.5} />, value: '98%', label: 'Довольных клиентов' },
    { icon: <Truck size={28} strokeWidth={1.5} />, value: '24–48 ч', label: 'Срок доставки по РБ' },
  ], []);

  // Gaming setups (авто-слайдер)
  const gamingSlides: GamingSlide[] = useMemo(() => [
    {
      label: 'Игровой сетап PRO',
      subtitle: 'Топовая конфигурация для киберспорта на базе RTX 5090',
      src: '/placeholders/setup-1.png',
      alt: 'Игровой сетап PRO',
    },
    {
      label: 'Стримерская станция',
      subtitle: 'Профессиональное оборудование для стримов и контента',
      src: '/placeholders/setup-2.png',
      alt: 'Стримерская станция',
    },
    {
      label: 'Домашний офис',
      subtitle: 'Эргономичное рабочее место для продуктивной работы',
      src: '/placeholders/setup-3.png',
      alt: 'Домашний офис',
    },
  ], []);

  const categories = useMemo(() => (categoriesData ?? []).filter((c) => (c.productCount ?? 0) > 0), [categoriesData]);

  // Static fallback categories for instant render while API loads
  const staticCategories = useMemo(() => {
    const known = [
      { slug: 'processors', name: 'Процессоры', icon: Cpu },
      { slug: 'motherboards', name: 'Материнские платы', icon: Cpu },
      { slug: 'memory', name: 'Оперативная память', icon: MemoryStick },
      { slug: 'graphics', name: 'Видеокарты', icon: Gpu },
      { slug: 'storage', name: 'Накопители', icon: HardDrive },
      { slug: 'power', name: 'Блоки питания', icon: Zap },
      { slug: 'cooling', name: 'Охлаждение', icon: ThermometerSun },
      { slug: 'cases', name: 'Корпуса', icon: Box },
      { slug: 'monitors', name: 'Мониторы', icon: Monitor },
      { slug: 'fan', name: 'Вентиляторы', icon: Fan },
    ];
    return known.map((c) => ({
      id: c.slug,
      slug: c.slug,
      name: c.name,
      icon: c.icon,
      productCount: categories.find((cat) => cat.slug === c.slug)?.productCount ?? 0,
    }));
  }, [categories]);

  return (
    <div id="main" className="min-h-screen bg-canvas-dark">
      {/* ════════════ 1. HERO BAND ════════════ */}
      <section className="home-hero" aria-label="Главный баннер">
        <HeroBackground />
        <div className="home-hero__content">
          <div className="home-hero__badge">
            <Award size={16} strokeWidth={2} />
            Эксклюзивные ПК нового поколения
          </div>
          <h1 className="home-hero__title">
            Собери <span className="text-gold">идеальный</span> компьютер<br />
            за <span className="text-gold">24 часа</span>
          </h1>
          <p className="home-hero__subtitle">
            Умный подбор комплектующих с автоматической проверкой совместимости.
            Гарантия качества и бесплатная доставка по всей Беларуси.
          </p>
          <div className="home-hero__actions">
            <Link to="/pc-builder">
              <Button variant="primary" size="lg" icon={<ArrowRight size={18} />}>
                Собрать свой ПК
              </Button>
            </Link>
            <Link to="/catalog">
              <Button variant="secondary" size="lg">
                Каталог
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════ 2. CATEGORIES ════════════ */}
      <section className="home-categories" aria-label="Категории">
        <div className="home-categories__inner">
          <div className="home-categories__header">
            <h2 className="home-categories__title">Категории</h2>
            <p className="home-categories__desc">Выберите компонент для вашего ПК</p>
          </div>
          <div className="home-categories__grid">
            {(() => {
              const cats = categoriesLoading && categories.length === 0
                ? staticCategories
                : categories.map((cat) => ({
                    ...cat,
                    icon: CATEGORY_ICONS[(BACKEND_TO_FRONTEND[cat.slug] ?? cat.slug)] ?? Cpu,
                  }));
              const COLS = 5;
              const remainder = cats.length % COLS;
              return cats.map((cat, i) => {
                const frontendId = (BACKEND_TO_FRONTEND[cat.slug] ?? cat.slug);
                const IconComponent = cat.icon ?? CATEGORY_ICONS[frontendId] ?? Cpu;
                const isLastRow = remainder !== 0 && i >= cats.length - remainder;
                const span = isLastRow ? COLS / remainder : 1;
                return (
                  <motion.div
                    key={cat.id}
                    style={isLastRow ? { gridColumn: `span ${span}` } : undefined}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-20px' }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                  >
                    <CategoryCard
                      Icon={IconComponent}
                      name={cat.name}
                      count={cat.productCount ?? 0}
                      href={`/catalog/${frontendId}`}
                    />
                  </motion.div>
                );
              });
            })()}
          </div>
        </div>
      </section>

      {/* ════════════ 3. GAMING SETUP CAROUSEL ════════════ */}
      <section className="home-gaming" aria-label="Вдохновляющие сетапы">
        <div className="home-gaming__inner">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5 }}
          >
            <GamingCarousel slides={gamingSlides} />
          </motion.div>
        </div>
      </section>

      {/* ════════════ 4. TRUST BAND ════════════ */}
      <section className="home-trust" aria-label="Почему выбирают GoldPC">
        <div className="home-trust__inner">
          <div className="home-trust__header">
            <h2 className="home-trust__title">Почему выбирают GoldPC</h2>
            <p className="home-trust__subtitle">
              Более 10 лет на рынке — качество, которому доверяют
            </p>
          </div>
          <div className="home-trust__grid">
            {trustItems.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <StatCard icon={item.icon} value={item.value} label={item.label} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ 5. POPULAR ════════════ */}
      <section className="home-popular" aria-label="Популярные товары">
        <div className="home-popular__inner">
          <div className="home-popular__header">
            <h2 className="home-popular__title">Популярное</h2>
            <Link to="/catalog" className="home-popular__link">
              Выбор недели <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <div key={`pop-skel-${i}`}>
                  <ProductCardSkeleton />
                </div>
              ))}
            {isError && (
              <div className="col-span-full flex justify-center py-12">
                <ApiErrorBanner
                  message="Не удалось загрузить товары. Попробуйте позже."
                  onRetry={() => refetch()}
                />
              </div>
            )}
            {popularProducts.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <ProductCard product={product} imageFetchPriority={i === 0 ? 'high' : undefined} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>



      {/* ════════════ 7. CTA BAND ════════════ */}
      <section className="home-cta" aria-label="Призыв к действию">
        <div className="home-cta__inner">
          <h2 className="home-cta__title">
            Готовы к <span className="text-gold">апгрейду</span>?
          </h2>
          <p className="home-cta__subtitle">
            Оставьте заявку — наш специалист подберёт идеальную конфигурацию
            под ваши задачи и бюджет.
          </p>
          <div className="home-cta__actions">
            <Link to="/pc-builder">
              <Button variant="primary" size="lg" icon={<ArrowRight size={18} />}>
                Собрать ПК
              </Button>
            </Link>
            <Link to="/catalog">
              <Button variant="outline" size="lg">
                В каталог
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}