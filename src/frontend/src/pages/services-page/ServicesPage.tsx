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
      ease: [0.33, 1, 0.68, 1] as const,
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
      className="bg-[var(--bg-card)] border border-[var(--border)] p-8 transition-all duration-300 relative overflow-hidden flex flex-col"
      variants={itemVariants}
      whileHover={{ y: -4 }}
    >
      <div className="absolute top-0 left-0 w-full h-0.75 bg-[var(--accent)] scale-x-0 origin-left transition-transform duration-300 hover:scale-x-100" />
      <div className="w-16 h-16 flex items-center justify-center bg-[var(--bg-elevated)] mb-6 text-[var(--fg-dim)] transition-colors duration-300 hover:text-[var(--accent)]">
        <IconComponent size={32} />
      </div>
      <h2 className="text-xl font-semibold mb-3 letter-spacing-[-0.01em]">{service.name}</h2>
      <p className="text-sm text-[var(--fg-muted)] leading-6 mb-6 flex-grow">{service.shortDescription}</p>
      <div className="flex justify-between items-center pt-5 border-t border-[var(--border)]">
        <span className="font-[var(--font-sans)] text-sm text-[var(--fg-dim)]">
          от <span className="text-[var(--accent)] font-medium">{service.basePrice} BYN</span>
        </span>
        <Link to={`/services/${service.slug}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--fg-muted)] text-decoration-none transition-colors duration-200 hover:text-[var(--accent)]">
          Подробнее
          <ChevronRight size={14} className="w-3.5 h-3.5 transition-transform duration-200 hover:translate-x-1" />
        </Link>
      </div>
    </motion.article>
  );
}

export function ServicesPage() {
  const { data, isLoading, error, refetch } = useServices({ pageSize: 20 });

  const services = data?.data || [];

  return (
    <div className="relative z-1 max-w-[1200px] mx-auto px-6 py-12">
      {/* Page Header */}
      <header className="mb-12">
        <h1 className="text-[clamp(2rem,4vw,3rem)] font-bold letter-spacing-[-0.03em] mb-4">
          Нашы <span className="text-[var(--accent)]">услуги</span>
        </h1>
        <p className="text-base text-[var(--fg-muted)] max-w-[600px] leading-7">
          Профессиональный сервис для вашего оборудования. Ремонт, модернизация и
          диагностика от сертифицированных специалистов.
        </p>
      </header>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center min-h-[300px]">
          <Loader2 size={48} className="text-[var(--accent)] animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center p-12 text-[var(--fg-muted)]">
          <p>Не удалось загрузить услуги. Попробуйте позже.</p>
          <button onClick={() => refetch()} className="inline-flex items-center gap-2 p-3 mt-4 bg-[var(--bg-card)] border border-[var(--border)] text-[var(--fg)] cursor-pointer transition-all duration-200 hover:border-[var(--accent)] hover:text-[var(--accent)]">
            <RefreshCw size={18} />
            <span>Попробовать снова</span>
          </button>
        </div>
      )}

      {/* Services Grid */}
      {!isLoading && !error && services.length > 0 && (
        <motion.div
          className="grid grid-cols-3 gap-6 md:grid-cols-2 sm:grid-cols-1"
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
      <section className="mt-20 p-12 bg-[var(--bg-card)] border border-[var(--border)]">
        <h2 className="text-xl font-semibold mb-8 letter-spacing-[-0.01em]">Почему выбирают нас</h2>
        <div className="grid grid-cols-4 gap-8 lg:grid-cols-2 sm:grid-cols-1">
          {benefits.map((benefit) => {
            const IconComponent = benefit.icon;
            return (
              <div key={benefit.id} className="flex items-start gap-4">
                <div className="w-10 h-10 flex items-center justify-center bg-[var(--accent-glow)] border border-[var(--border-accent)] text-[var(--accent)] flex-shrink-0">
                  <IconComponent size={20} />
                </div>
                <p className="text-sm leading-6 text-[var(--fg-muted)]">
                  <strong className="text-[var(--fg)] block mb-1">{benefit.title}</strong>
                  {benefit.description}
                </p>
              </div>
 );


      {/* CTA */}
      <section className="mt-20 p-12 bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-elevated)] border border-[var(--border)] text-center relative overflow-hidden">
        <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] bg-[radial-gradient(circle,var(--accent-glow)_0%,transparent_70%)] blur-[60px]" />
        <div className="relative z-1">
          <h2 className="text-2xl font-semibold mb-3">Нужна консультация?</h2>
          <p className="text-sm text-[var(--fg-muted)] mb-6">
            Оставьте заявку и наш специалист свяжется с вами в течение 15 минут
          </p>
          <Link to="/service-request" className="inline-flex items-center gap-2.5 p-3.5 font-[var(--font-sans)] text-sm font-semibold text-decoration-none border-none cursor-pointer transition-all duration-200 bg-[var(--accent)] text-[var(--bg)] hover:bg-[var(--accent-bright,#e8c4a0)] hover:-translate-y-0.5">
            Оставить заявку
            <ArrowRight size={16} className="w-4 h-4" />
          </Link>
        </div>
      </section>
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