/**
 * ServiceDetailPage - Страница детали услуги
 * Dark Gold theme с описанием услуги и прайс-листом
 * Основано на прототипе service-detail.html
 */
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Loader2,
  Clock,
  ShieldCheck,
  CheckCircle,
  FileText,
  Wrench,
  TrendingUp,
  Info,
  Database,
  Box,
  Sun,
} from 'lucide-react';
import { useServiceBySlug } from '../../hooks/useServices';
import type { Service, ServiceCategory, ServicePriceItem } from '../../api/types';
import styles from './ServiceDetailPage.module.css';

// Маппинг категорий на иконки
const categoryIcons: Record<ServiceCategory, React.ComponentType<{ size?: number }>> = {
  repair: Wrench,
  upgrade: TrendingUp,
  diagnostics: Info,
  assembly: Box,
  'data-recovery': Database,
  maintenance: Sun,
};

// Названия категорий
const categoryNames: Record<ServiceCategory, string> = {
  repair: 'Ремонт',
  upgrade: 'Апгрейд',
  diagnostics: 'Диагностика',
  assembly: 'Сборка',
  'data-recovery': 'Восстановление данных',
  maintenance: 'Обслуживание',
};

// Форматирование цены
function formatPrice(price: number, priceMax?: number): string {
  if (priceMax && priceMax !== price) {
    return `${price}-${priceMax} BYN`;
  }
  return `${price} BYN`;
}

// Компонент SVG-визуализации услуги
interface ServiceVisualProps {
  category: ServiceCategory;
  isPopular?: boolean;
}

function ServiceVisual({ category, isPopular }: ServiceVisualProps) {
  const IconComponent = categoryIcons[category] || Wrench;

  return (
    <div className={styles.serviceImage}>
      {isPopular && <span className={styles.serviceBadge}>Популярное</span>}
      <IconComponent size={120} />
    </div>
  );
}

// Компонент элемента прайс-листа
interface PriceItemRowProps {
  item: ServicePriceItem;
}

function PriceItemRow({ item }: PriceItemRowProps) {
  return (
    <tr>
      <td>
        <div className={styles.priceTableName}>{item.name}</div>
        {item.description && (
          <div className={styles.priceTableDesc}>{item.description}</div>
        )}
      </td>
      <td>
        <span className={styles.priceTablePrice}>
          {formatPrice(item.price, item.priceMax)}
        </span>
      </td>
    </tr>
  );
}

// Компонент карточки преимущества
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className={styles.featureCard}>
      <div className={styles.featureIcon}>{icon}</div>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDesc}>{description}</p>
    </div>
  );
}

export function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: service, isLoading, error, refetch } = useServiceBySlug(slug || '');

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <Loader2 size={48} className={styles.loadingSpinner} />
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Не удалось загрузить информацию об услуге.</p>
          <button onClick={() => refetch()} className={styles.retryBtn}>
            <RefreshCw size={18} />
            <span>Попробовать снова</span>
          </button>
        </div>
      </div>
    );
  }

  const IconComponent = categoryIcons[service.category] || Wrench;

  // Преимущества услуги
  const features = service.features || [
    'Гарантия качества — все работы выполняются сертифицированными специалистами с гарантией до 12 месяцев',
    'Быстрое выполнение — большинство работ выполняется за 1-2 дня. Срочный ремонт в день обращения',
    'Честные цены — фиксированные цены без скрытых платежей. Бесплатная диагностика при ремонте',
  ];

  return (
    <div className={styles.container}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb}>
        <Link to="/">Главная</Link>
        <span>/</span>
        <Link to="/services">Сервис</Link>
        <span>/</span>
        <span>{service.name}</span>
      </nav>

      {/* Service Layout */}
      <div className={styles.serviceLayout}>
        {/* Service Visual */}
        <div className={styles.serviceVisual}>
          <ServiceVisual 
            category={service.category} 
            isPopular={service.isPopular} 
          />
        </div>

        {/* Service Info */}
        <div className={styles.serviceInfo}>
          <div className={styles.serviceInfoHeader}>
            <span className={styles.serviceInfoCategory}>
              {categoryNames[service.category]}
            </span>
            <h1 className={styles.serviceInfoTitle}>{service.name}</h1>
            <p className={styles.serviceInfoDesc}>{service.description}</p>
          </div>

          <div className={styles.serviceInfoMeta}>
            <div className={styles.metaItem}>
              <div className={styles.metaIcon}>
                <Clock size={20} />
              </div>
              <div className={styles.metaText}>
                <span className={styles.metaLabel}>Срок</span>
                <span className={styles.metaValue}>{service.duration}</span>
              </div>
            </div>
            <div className={styles.metaItem}>
              <div className={styles.metaIcon}>
                <ShieldCheck size={20} />
              </div>
              <div className={styles.metaText}>
                <span className={styles.metaLabel}>Гарантия</span>
                <span className={styles.metaValue}>
                  {service.warrantyMonths > 0 
                    ? `${service.warrantyMonths} месяцев` 
                    : 'По договорённости'}
                </span>
              </div>
            </div>
            {service.completedCount && (
              <div className={styles.metaItem}>
                <div className={styles.metaIcon}>
                  <CheckCircle size={20} />
                </div>
                <div className={styles.metaText}>
                  <span className={styles.metaLabel}>Выполнено</span>
                  <span className={styles.metaValue}>
                    {service.completedCount.toLocaleString('ru-RU')}+
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className={styles.serviceInfoPrice}>
            <div className={styles.priceHeader}>
              <span className={styles.priceLabel}>от</span>
              <span className={styles.priceValue}>{service.basePrice} BYN</span>
            </div>
            {service.priceNote && (
              <p className={styles.priceNote}>{service.priceNote}</p>
            )}
          </div>

          <div className={styles.serviceInfoActions}>
            <Link 
              to={`/service-request?service=${service.slug}`} 
              className={`${styles.btn} ${styles.btnPrimary} ${styles.btnFull}`}
            >
              <FileText size={18} />
              Заказать услугу
            </Link>
            <Link 
              to="/services" 
              className={`${styles.btn} ${styles.btnGhost} ${styles.btnFull}`}
            >
              <ArrowLeft size={18} />
              Назад к услугам
            </Link>
          </div>
        </div>
      </div>

      {/* Price List */}
      {service.priceList && service.priceList.length > 0 && (
        <section className={styles.priceList}>
          <h2 className={styles.sectionTitle}>Прейскурант</h2>
          <table className={styles.priceTable}>
            <thead>
              <tr>
                <th>Услуга</th>
                <th>Стоимость</th>
              </tr>
            </thead>
            <tbody>
              {service.priceList.map((item) => (
                <PriceItemRow key={item.id} item={item} />
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Features */}
      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>Преимущества</h2>
        <div className={styles.featuresGrid}>
          {features.slice(0, 3).map((feature, index) => {
            const featureIcons = [
              <ShieldCheck size={24} key="shield" />,
              <Clock size={24} key="clock" />,
              <CheckCircle size={24} key="check" />,
            ];
            const parts = feature.split(' — ');
            return (
              <FeatureCard
                key={index}
                icon={featureIcons[index]}
                title={parts[0]}
                description={parts[1] || feature}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}