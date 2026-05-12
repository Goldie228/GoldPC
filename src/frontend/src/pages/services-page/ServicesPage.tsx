/**
 * ServicesPage - Страница услуг сервисного центра
 * Dark Gold theme с сеткой карточек услуг
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

// Изображения для категорий услуг (мок)
const categoryImages: Partial<Record<ServiceCategory, string>> = {
  repair: '/placeholders/services/repair.svg',
  upgrade: '/placeholders/services/upgrade.svg',
  diagnostics: '/placeholders/services/diagnostics.svg',
  assembly: '/placeholders/services/assembly.svg',
  'data-recovery': '/placeholders/services/data-recovery.svg',
  maintenance: '/placeholders/services/maintenance.svg',
};

// Преимущества
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
  const imageSrc = categoryImages[service.category];

  return (
    <motion.article
      className="bg-surface-card rounded-xl border border-hairline-dark p-6 md:p-8 transition-all duration-300 relative overflow-hidden flex flex-col group"
      variants={itemVariants}
      whileHover={{ y: -4 }}
    >
      {/* Image */}
      {imageSrc && (
        <div className="rounded-lg overflow-hidden mb-5 bg-surface-elevated">
          <img
            src={imageSrc}
            alt={service.name}
            className="w-full h-40 object-contain p-4"
            loading="lazy"
          />
        </div>
      )}
      {/* Icon fallback if no image */}
      {!imageSrc && (
        <div className="w-16 h-16 flex items-center justify-center bg-surface-elevated mb-5 text-gold rounded-lg">
          <IconComponent size={32} />
        </div>
      )}
      <h2 className="text-xl font-semibold text-body-text mb-3">{service.name}</h2>
      <p className="text-sm text-muted-text leading-relaxed mb-6 flex-grow">{service.shortDescription}</p>
      <div className="flex justify-between items-center pt-5 border-t border-hairline-dark">
        <span className="text-sm text-muted-text">
          от <span className="text-gold font-semibold">{service.basePrice} BYN</span>
        </span>
        <Link
          to={`/services/${service.slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-text hover:text-gold transition-colors"
        >
          Подробнее
          <ChevronRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </motion.article>
  );
}

export function ServicesPage() {
  const { data, isLoading, error, refetch } = useServices({ pageSize: 20 });

  const services = data?.data || [];

  return (
    <main className="min-h-screen bg-canvas-dark pt-24 md:pt-28 pb-20">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-text mb-8">
          <Link to="/" className="hover:text-gold transition-colors">Главная</Link>
          <span className="text-muted-text">/</span>
          <span className="text-body-text">Услуги</span>
        </nav>

        {/* Page Header */}
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-body-text mb-4 tracking-[-0.02em]">
            Наши <span className="text-gold">услуги</span>
          </h1>
          <p className="text-lg text-muted-text max-w-[600px] leading-relaxed">
            Профессиональный сервис для вашего оборудования. Ремонт, модернизация и
            диагностика от сертифицированных специалистов.
          </p>
        </header>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center min-h-[300px]">
            <Loader2 size={48} className="text-gold animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-16 px-4">
            <p className="text-muted-text mb-4">Не удалось загрузить услуги. Попробуйте позже.</p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-card border border-hairline-dark text-body-text rounded-lg hover:border-gold hover:text-gold transition-colors cursor-pointer"
            >
              <RefreshCw size={18} />
              <span>Попробовать снова</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && services.length === 0 && (
          <div className="text-center py-16 px-4">
            <p className="text-muted-text">На данный момент услуги не добавлены.</p>
          </div>
        )}

        {/* Services Grid */}
        {!isLoading && !error && services.length > 0 && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
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
        {!isLoading && !error && services.length > 0 && (
          <section className="mt-20">
            <div className="bg-surface-card rounded-xl border border-hairline-dark p-8 md:p-10">
              <h2 className="text-xl font-semibold text-body-text mb-8">Почему выбирают нас</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {benefits.map((benefit) => {
                  const IconComponent = benefit.icon;
                  return (
                    <div key={benefit.id} className="flex items-start gap-4">
                      <div className="w-10 h-10 flex items-center justify-center bg-gold/10 text-gold rounded-lg shrink-0">
                        <IconComponent size={20} />
                      </div>
                      <div>
                        <h4 className="text-body-text font-semibold text-sm mb-1">{benefit.title}</h4>
                        <p className="text-sm text-muted-text leading-relaxed">{benefit.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="mt-20">
          <div className="bg-surface-card rounded-xl border border-hairline-dark p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] bg-gold/5 rounded-full blur-[60px]" />
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-bold text-body-text mb-3">Нужна консультация?</h2>
              <p className="text-muted-text mb-6 max-w-md mx-auto">
                Оставьте заявку и наш специалист свяжется с вами в течение 15 минут
              </p>
              <Link
                to="/service-request"
                className="inline-flex items-center gap-2.5 px-6 py-3 bg-gold text-gold-ink font-semibold rounded-lg hover:bg-gold-active transition-all hover:-translate-y-0.5"
              >
                Оставить заявку
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
