/**
 * ServicesPage - Страница услуг сервисного центра
 * Dark Gold theme с сеткой карточек услуг
 * Основано на прототипе services.html
 */
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  ChevronRight, 
  RefreshCw,
  Loader2,
  Wrench,
  TrendingUp,
  Info,
  Database,
  Box,
  Sun,
  ShieldCheck,
  Clock,
  Users,
  CreditCard,
} from 'lucide-react';
import { useServices } from '../../hooks/useServices';
import type { Service, ServiceCategory } from '../../api/types';
import styles from './ServicesPage.module.css';

// Маппинг категорий на иконки
const categoryIcons: Record<ServiceCategory, React.ComponentType<{ size?: number }>> = {
  repair: Wrench,
  upgrade: TrendingUp,
  diagnostics: Info,
  assembly: Box,
  'data-recovery': Database,
  maintenance: Sun,
};

// Преимущества (статичные, как в прототипе)
const benefits = [
  {
    id: 'benefit-1',
    title: 'Гарантия качества',
    description: 'Гарантия на все виды работ до 12 месяцев',
    icon: ShieldCheck,
  },
  {
    id: 'benefit-2',
    title: 'Быстрое выполнение',
    description: 'Большинство работ выполняется за 1-2 дня',
    icon: Clock,
  },
  {
    id: 'benefit-3',
    title: 'Опытные специалисты',
    description: 'Сертифицированные инженеры с опытом 10+ лет',
    icon: Users,
  },
  {
    id: 'benefit-4',
    title: 'Честные цены',
    description: 'Фиксированные цены без скрытых платежей',
    icon: CreditCard,
  },
];

// Анимации
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.33, 1, 0.68, 1],
    },
  },
};

interface ServiceCardProps {
  service: Service;
}

function ServiceCard({ service }: ServiceCardProps) {
  const IconComponent = categoryIcons[service.category] || Wrench;

  return (
    <motion.article
      className={styles.serviceCard}
      variants={itemVariants}
      whileHover={{ y: -4 }}
    >
      <div className={styles.serviceIcon}>
        <IconComponent size={32} />
      </div>
      <h2 className={styles.serviceName}>{service.name}</h2>
      <p className={styles.serviceDesc}>{service.shortDescription}</p>
      <div className={styles.serviceMeta}>
        <span className={styles.servicePrice}>
          от <span>{service.basePrice} BYN</span>
        </span>
        <Link to={`/services/${service.slug}`} className={styles.serviceLink}>
          Подробнее
          <ChevronRight size={14} />
        </Link>
      </div>
    </motion.article>
  );
}

export function ServicesPage() {
  const { data, isLoading, error, refetch } = useServices({ pageSize: 20 });

  const services = data?.data || [];

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          Наши <span className={styles.accent}>услуги</span>
        </h1>
        <p className={styles.pageDesc}>
          Профессиональный сервис для вашего оборудования. Ремонт, модернизация и
          диагностика от сертифицированных специалистов.
        </p>
      </header>

      {/* Loading State */}
      {isLoading && (
        <div className={styles.loading}>
          <Loader2 size={48} className={styles.loadingSpinner} />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className={styles.error}>
          <p>Не удалось загрузить услуги. Попробуйте позже.</p>
          <button onClick={() => refetch()} className={styles.retryBtn}>
            <RefreshCw size={18} />
            <span>Попробовать снова</span>
          </button>
        </div>
      )}

      {/* Services Grid */}
      {!isLoading && !error && services.length > 0 && (
        <motion.div
          className={styles.servicesGrid}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </motion.div>
      )}

      {/* Benefits */}
      <section className={styles.benefits}>
        <h2 className={styles.benefitsTitle}>Почему выбирают нас</h2>
        <div className={styles.benefitsGrid}>
          {benefits.map((benefit) => {
            const IconComponent = benefit.icon;
            return (
              <div key={benefit.id} className={styles.benefit}>
                <div className={styles.benefitIcon}>
                  <IconComponent size={20} />
                </div>
                <p className={styles.benefitText}>
                  <strong>{benefit.title}</strong>
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Нужна консультация?</h2>
          <p className={styles.ctaDesc}>
            Оставьте заявку и наш специалист свяжется с вами в течение 15 минут
          </p>
          <Link to="/service-request" className={`${styles.btn} ${styles.btnPrimary}`}>
            Оставить заявку
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}