import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Cpu, 
  Monitor, 
  MemoryStick,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ProductCard } from '../../components/ProductCard';
import { ProductCardSkeleton } from '../../components/ui/Skeleton/ProductCardSkeleton';
import { useProducts } from '../../hooks/useProducts';
import './HomePage.css';

// Dummy build data for hero visual
const buildItems = [
  {
    id: 1,
    name: 'AMD Ryzen 7 7800X3D',
    spec: '8C / 16T / 4.2GHz',
    price: '1 450 BYN',
    icon: Cpu,
  },
  {
    id: 2,
    name: 'RTX 4070 Ti Super',
    spec: '16GB GDDR6X',
    price: '3 200 BYN',
    icon: Monitor,
  },
  {
    id: 3,
    name: 'G.Skill Trident Z5 32GB',
    spec: 'DDR5-6000 CL30',
    price: '650 BYN',
    icon: MemoryStick,
  },
];

// Category data
const categoriesData = [
  { id: 'cpu', name: 'Процессоры', count: '124 товара', icon: Cpu },
  { id: 'gpu', name: 'Видеокарты', count: '86 товаров', icon: Monitor },
  { id: 'motherboard', name: 'Мат. платы', count: '72 товара', icon: Cpu },
  { id: 'ram', name: 'Память', count: '98 товаров', icon: MemoryStick },
];

/**
 * HomePage - Main landing page for GoldPC
 * Matching prototypes/home.html design
 */
export function HomePage() {
  // Refs for scroll animations
  const categoriesRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef<HTMLDivElement>(null);

  // Fetch popular products (featured items, limit 8)
  const { data: productsData, isLoading, isError } = useProducts({
    pageSize: 8,
    isFeatured: true,
    sortBy: 'rating',
    sortOrder: 'desc',
  });

  // Scroll reveal effect
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    // Observe all fade-up elements
    const fadeElements = document.querySelectorAll('.fadeUp');
    fadeElements.forEach(el => observer.observe(el));

    return () => {
      fadeElements.forEach(el => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="homePage">
      {/* Hero Section */}
      <section className="hero">
        {/* Background decorations */}
        <div className="heroBg">
          <div className="gridPattern"></div>
          <div className="glow1"></div>
          <div className="glow2"></div>
        </div>

        <div className="heroContent">
          {/* Hero Text */}
          <div className="heroText">
            <div className="heroTag">PC Builder v2.0</div>
            <h1 className="heroTitle">
              <span className="heroTitleLine">Собери свой</span>
              <span className="heroTitleLine heroTitleLine2">
                <span className="text-accent">идеальный</span>&nbsp;ПК
              </span>
            </h1>
            <p className="heroDesc">
              Интеллектуальный конфигуратор с проверкой совместимости в реальном времени. 
              Профессиональная сборка за 24 часа.
            </p>
            <div className="heroActions">
              <Link to="/pc-builder">
                <Button variant="primary" icon={<ArrowRight size={16} />}>
                  Начать сборку
                </Button>
              </Link>
              <Link to="/catalog">
                <Button variant="ghost">Каталог</Button>
              </Link>
            </div>
            
            {/* Stats */}
            <div className="heroStats">
              <div className="stat">
                <span className="statValue">12K+</span>
                <span className="statLabel">Сборок</span>
              </div>
              <div className="stat">
                <span className="statValue">98%</span>
                <span className="statLabel">Совместимость</span>
              </div>
              <div className="stat">
                <span className="statValue">24ч</span>
                <span className="statLabel">Сборка</span>
              </div>
            </div>
          </div>

          {/* Hero Visual - Build Preview Card */}
          <div className="heroVisual">
            <div className="heroCard">
              <div className="cardHeader">
                <span className="cardTitle">Текущая сборка</span>
                <span className="cardBadge">LIVE</span>
              </div>
              <div className="buildPreview">
                {buildItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <div key={item.id} className="buildItem">
                      <div className="buildIcon">
                        <IconComponent size={20} />
                      </div>
                      <div className="buildInfo">
                        <div className="buildName">{item.name}</div>
                        <div className="buildSpec">{item.spec}</div>
                      </div>
                      <div className="buildPrice">{item.price}</div>
                    </div>
                  );
                })}
              </div>
              <div className="buildTotal">
                <span className="totalLabel">Итого</span>
                <span className="totalValue"><span>5 300</span> BYN</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories">
        <div className="container">
          <div className="sectionHeader">
            <div>
              <h2 className="sectionTitle">Категории</h2>
              <p className="sectionSubtitle">Выберите компонент</p>
            </div>
            <Link to="/catalog" className="viewAll">
              Все категории
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="categoriesGrid" ref={categoriesRef}>
            {categoriesData.map((category, index) => {
              const IconComponent = category.icon;
              const delayClass = index > 0 ? `delay${index}` : '';
              return (
                <Link
                  key={category.id}
                  to={`/catalog?category=${category.id}`}
                  className={`categoryCard fadeUp ${delayClass}`}
                >
                  <div className="categoryIcon">
                    <IconComponent size={24} />
                  </div>
                  <div className="categoryName">{category.name}</div>
                  <div className="categoryCount">{category.count}</div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Popular Products Section */}
      <section className="products">
        <div className="container">
          <div className="sectionHeader">
            <div>
              <h2 className="sectionTitle">Популярное</h2>
              <p className="sectionSubtitle">Выбор недели</p>
            </div>
            <Link to="/catalog" className="viewAll">
              Смотреть все
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="productsGrid" ref={productsRef}>
            {/* Loading state - show skeletons */}
            {isLoading && (
              <>
                {[...Array(4)].map((_, index) => (
                  <ProductCardSkeleton key={`skeleton-${index}`} />
                ))}
              </>
            )}

            {/* Error state */}
            {isError && (
              <div className="productsError">
                <p>Не удалось загрузить товары. Попробуйте позже.</p>
              </div>
            )}

            {/* Success - show products */}
            {productsData?.data.map((product, index) => {
              const delayClass = index > 0 ? `delay${index}` : '';
              return (
                <div key={product.id} className={`fadeUp ${delayClass}`}>
                  <ProductCard product={product} />
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}