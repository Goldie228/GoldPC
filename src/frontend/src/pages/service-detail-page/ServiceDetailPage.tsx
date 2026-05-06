/**
 * ServiceDetailPage - Страница детали услуги
 * Dark Gold theme с описанием услуги и прайс-листом
 * Основано на прототипе service-detail.html
 */
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
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
import type { ServiceCategory, ServicePriceItem } from '../../api/types';

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
    <div className="aspect-[4/3] bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center p-12 relative overflow-hidden [&>svg]:max-w-[60%] [&>svg]:max-h-[60%] [&>svg]:relative [&>svg]:z-1 before:content-[''] before:absolute before:top-[-50%] before:right-[-50%] before:w-1/2 before:h-1/2 before:bg-[radial-gradient(circle,var(--accent-glow)_0%,transparent_70%)] before:blur-[40px]">
      {isPopular && <span className="absolute top-4 left-4 px-3 py-1.5 bg-[var(--accent)] text-[var(--bg)] font-[var(--font-sans)] text-[0.65rem] font-semibold uppercase tracking-[0.05em] z-2">Популярное</span>}
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
        <div className="text-[var(--fg)]">{item.name}</div>
        {item.description && (
          <div className="text-[0.8rem] text-[var(--fg-muted)] mt-1">{item.description}</div>
        )}
      </td>
      <td>
        <span className="font-[var(--font-sans)] text-[var(--accent)] font-medium">
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
    <div className="p-6 bg-[var(--bg-card)] border border-[var(--border)] transition-all hover:border-[var(--border-accent)]">
      <div className="w-12 h-12 flex items-center justify-center bg-[var(--bg-elevated)] mb-4 text-[var(--accent)]">{icon}</div>
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      <p className="text-[0.85rem] text-[var(--fg-muted)] leading-[1.6]">{description}</p>
    </div>
  );
}

export function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: service, isLoading, error, refetch } = useServiceBySlug(slug || '');

  if (isLoading) {
    return (
      <div className="relative z-1 max-w-[1400px] mx-auto p-6 md:p-8">
        <div className="flex justify-center items-center min-h-[300px]">
          <Loader2 size={48} className="animate-spin text-[var(--accent)]" />
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="relative z-1 max-w-[1400px] mx-auto p-6 md:p-8">
        <div className="text-center p-12 text-[var(--fg-muted)]">
          <p>Не удалось загрузить информацию об услуге.</p>
          <button onClick={() => refetch()} className="inline-flex items-center gap-2 px-6 py-3 mt-4 bg-[var(--bg-card)] border border-[var(--border)] text-[var(--fg)] cursor-pointer transition-all hover:border-[var(--accent)] hover:text-[var(--accent)]">
            <RefreshCw size={18} />
            <span>Попробовать снова</span>
          </button>
        </div>
      </div>
    );
  }

  // Преимущества услуги
  const features = service.features || [
    'Гарантия качества — все работы выполняются сертифицированными специалистами с гарантией до 12 месяцев',
    'Быстрое выполнение — большинство работ выполняется за 1-2 дня. Срочный ремонт в день обращения',
    'Честные цены — фиксированные цены без скрытых платежей. Бесплатная диагностика при ремонте',
  ];

  return (
    <div className="relative z-1 max-w-[1400px] mx-auto p-6 md:p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[var(--fg-dim)] mb-6">
        <Link to="/">Главная</Link>
        <span>/</span>
        <Link to="/services">Сервис</Link>
        <span>/</span>
        <span>{service.name}</span>
      </nav>

      {/* Service Layout */}
      <div className="grid grid-cols-1 gap-8 mb-16 md:grid-cols-2 md:gap-12">
        {/* Service Visual */}
        <div className="relative">
          <ServiceVisual
            category={service.category}
            isPopular={service.isPopular}
          />
        </div>

        {/* Service Info */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-[0.65rem] font-semibold text-[var(--fg-dim)] uppercase tracking-[0.1em]">
              {categoryNames[service.category]}
            </span>
            <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-[-0.02em] leading-[1.2]">{service.name}</h1>
            <p className="text-[0.95rem] leading-[1.7] text-[var(--fg-muted)]">{service.description}</p>
          </div>

          <div className="flex flex-wrap gap-6 p-5 bg-[var(--bg-card)] border border-[var(--border)]">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 flex items-center justify-center bg-[var(--bg-elevated)] text-[var(--accent)]">
                <Clock size={20} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[0.65rem] text-[var(--fg-dim)] uppercase tracking-[0.05em]">Срок</span>
                <span className="text-[0.9rem] font-medium">{service.duration}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 flex items-center justify-center bg-[var(--bg-elevated)] text-[var(--accent)]">
                <ShieldCheck size={20} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[0.65rem] text-[var(--fg-dim)] uppercase tracking-[0.05em]">Гарантия</span>
                <span className="text-[0.9rem] font-medium">
                  {service.warrantyMonths > 0
                    ? `${service.warrantyMonths} месяцев`
                    : 'По договорённости'}
                </span>
              </div>
            </div>
            {service.completedCount && (
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 flex items-center justify-center bg-[var(--bg-elevated)] text-[var(--accent)]">
                  <CheckCircle size={20} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[0.65rem] text-[var(--fg-dim)] uppercase tracking-[0.05em]">Выполнено</span>
                  <span className="text-[0.9rem] font-medium">
                    {service.completedCount.toLocaleString('ru-RU')}+
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 p-6 bg-[var(--bg-card)] border border-[var(--border)]">
            <div className="flex items-baseline gap-3">
              <span className="text-sm text-[var(--fg-muted)]">от</span>
              <span className="font-[var(--font-sans)] text-2xl font-semibold text-[var(--accent)]">{service.basePrice} BYN</span>
            </div>
            {service.priceNote && (
              <p className="text-[0.75rem] text-[var(--fg-dim)] pt-3 border-t border-[var(--border)]">{service.priceNote}</p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Link
              to={`/service-request?service=${service.slug}`}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 font-inherit text-[0.85rem] font-semibold border bg-[var(--accent)] border-[var(--accent)] text-[var(--bg)] no-underline w-full [&>svg]:w-[18px] [&>svg]:h-[18px]]"
            >
              <FileText size={18} />
              Заказать услугу
            </Link>
            <Link
              to="/services"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 font-inherit text-[0.85rem] font-semibold border border-[var(--border)] bg-transparent text-[var(--fg-muted)] no-underline w-full hover:border-[var(--fg-dim)] hover:text-[var(--fg)] [&>svg]:w-[18px] [&>svg]:h-[18px]]"
            >
              <ArrowLeft size={18} />
              Назад к услугам
            </Link>
          </div>
        </div>
      </div>

      {/* Price List */}
      {service.priceList && service.priceList.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold tracking-[-0.01em] mb-6">Прейскурант</h2>
          <table className="w-full border-collapse bg-[var(--bg-card)] border border-[var(--border)]">
            <thead>
              <tr>
                <th className="p-4 text-left border-b border-[var(--border)] text-[0.7rem] font-semibold text-[var(--fg-dim)] uppercase tracking-[0.1em] bg-[var(--bg-elevated)]">Услуга</th>
                <th className="p-4 text-left border-b border-[var(--border)] text-[0.7rem] font-semibold text-[var(--fg-dim)] uppercase tracking-[0.1em] bg-[var(--bg-elevated)]">Стоимость</th>
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
      <section className="mb-12">
        <h2 className="text-xl font-semibold tracking-[-0.01em] mb-6">Преимущества</h2>
        <div className="grid grid-cols-3 gap-4 md:grid-cols-1">
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