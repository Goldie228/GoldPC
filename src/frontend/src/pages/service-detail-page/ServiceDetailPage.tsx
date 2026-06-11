/**
 * ServiceDetailPage — Страница детали услуги
 * Dark Gold theme, flat surfaces per DESIGN.md (no gradients, no blur, no icons)
 */
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { useServiceBySlug } from '@/hooks/useServices';
import type { ServiceCategory, ServicePriceItem } from '@/api/types';

// Названия категорий
const categoryNames: Record<ServiceCategory, string> = {
  repair: 'Ремонт ПК',
  'laptop-repair': 'Ремонт ноутбуков',
  upgrade: 'Апгрейд',
  diagnostics: 'Диагностика',
  assembly: 'Сборка',
  'data-recovery': 'Восстановление данных',
  maintenance: 'Обслуживание',
  other: 'Прочая техника',
};

// Картинки для категорий
const categoryImages: Record<ServiceCategory, string> = {
  repair: '/placeholders/services/repair.jpg',
  'laptop-repair': '/placeholders/services/laptop-repair.jpg',
  upgrade: '/placeholders/services/upgrade.jpg',
  diagnostics: '/placeholders/services/diagnostics.jpg',
  assembly: '/placeholders/services/assembly.jpg',
  'data-recovery': '/placeholders/services/data-recovery.jpg',
  maintenance: '/placeholders/services/maintenance.jpg',
  other: '/placeholders/services/other.jpg',
};

// Форматирование цены
function formatPrice(price: number, priceMax?: number): string {
  if (priceMax && priceMax !== price) {
    return `${price}–${priceMax} BYN`;
  }
  return `${price} BYN`;
}

// Компонент элемента прайс-листа
function PriceItemRow({ item }: { item: ServicePriceItem }) {
  return (
    <tr className="border-b border-hairline-dark last:border-b-0">
      <td className="py-4 px-4 text-sm text-body-text">
        <div>{item.name}</div>
        {item.description && (
          <div className="text-xs text-muted-text mt-1">{item.description}</div>
        )}
      </td>
      <td className="py-4 px-4 text-sm text-right whitespace-nowrap">
        <span className="text-gold font-semibold">
          {formatPrice(item.price, item.priceMax)}
        </span>
      </td>
    </tr>
  );
}

export function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: service, isLoading, error, refetch } = useServiceBySlug(slug || '');

  if (isLoading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-8">
        <div className="flex justify-center items-center min-h-[300px]">
          <Loader2 size={48} className="animate-spin text-gold" />
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-8">
        <nav className="flex items-center gap-2 text-sm text-muted-text mb-8">
          <Link to="/" className="hover:text-gold transition-colors">Главная</Link>
          <span className="text-muted-text">/</span>
          <Link to="/services" className="hover:text-gold transition-colors">Сервис</Link>
        </nav>
        <div className="text-center py-20">
          <p className="text-lg text-muted-text mb-6">
            Не удалось загрузить информацию об услуге.
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-surface-card border border-hairline-dark text-body-text rounded-md hover:border-gold/30 hover:text-gold transition-colors"
          >
            <RefreshCw size={18} />
            <span>Попробовать снова</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-8 pb-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-text mb-8">
        <Link to="/" className="hover:text-gold transition-colors">Главная</Link>
        <span className="text-muted-text">/</span>
        <Link to="/services" className="hover:text-gold transition-colors">Сервис</Link>
        <span className="text-muted-text">/</span>
        <span className="text-body-text">{service.name}</span>
      </nav>

        {/* ---- Hero Image ---- */}
        <div className="rounded-xl overflow-hidden mb-8 border border-hairline-dark bg-surface-card">
          <img
            src={categoryImages[service.category]}
            alt={service.name}
            className="w-full h-[320px] md:h-[400px] object-cover"
          />
        </div>

        {/* ---- Main content ---- */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-16">
          {/* Left: description + info */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Category label */}
            <span className="text-xs font-semibold text-muted-text uppercase tracking-[0.1em]">
              {categoryNames[service.category]}
            </span>

            {/* Title */}
            <h1 className="text-display-sm md:text-display-md font-bold text-body-text">
              {service.name}
            </h1>

            {/* Description */}
            <p className="text-base text-muted-text leading-relaxed">
              {service.description}
            </p>

            {/* Info pills row */}
            <div className="flex flex-wrap gap-4">
              <div className="bg-surface-card border border-hairline-dark rounded-lg px-5 py-3">
                <span className="block text-xs text-muted-text uppercase tracking-[0.05em] mb-0.5">Срок</span>
                <span className="text-sm font-semibold text-body-text">{service.duration}</span>
              </div>
              <div className="bg-surface-card border border-hairline-dark rounded-lg px-5 py-3">
                <span className="block text-xs text-muted-text uppercase tracking-[0.05em] mb-0.5">Гарантия</span>
                <span className="text-sm font-semibold text-body-text">
                  {service.warrantyMonths > 0
                    ? `${service.warrantyMonths} месяцев`
                    : 'По договорённости'}
                </span>
              </div>
              {service.completedCount && (
                <div className="bg-surface-card border border-hairline-dark rounded-lg px-5 py-3">
                  <span className="block text-xs text-muted-text uppercase tracking-[0.05em] mb-0.5">Выполнено</span>
                  <span className="text-sm font-semibold text-body-text">
                    {service.completedCount.toLocaleString('ru-RU')}+
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: price + CTA sidebar */}
          <div className="lg:col-span-2">
            <div className="bg-surface-card border border-hairline-dark rounded-xl p-6 md:p-8 flex flex-col gap-6">
              {/* Price */}
              <div>
                <span className="text-sm text-muted-text">от</span>
                <div className="text-3xl font-bold text-gold mt-1">
                  {service.basePrice} <span className="text-sm font-normal text-muted-text">BYN</span>
                </div>
                {service.priceNote && (
                  <p className="text-xs text-muted-text mt-3 pt-3 border-t border-hairline-dark">
                    {service.priceNote}
                  </p>
                )}
              </div>

              {/* CTAs */}
              <Link
                to={`/service-request?service=${service.slug}`}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-gold text-gold-ink font-semibold rounded-md hover:bg-gold-active transition-colors h-10"
              >
                Заказать услугу
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-surface-card text-body-text border border-hairline-dark rounded-md hover:border-muted-text/50 hover:text-gold transition-colors h-10"
              >
                <ArrowLeft size={16} />
                Назад к услугам
              </Link>
            </div>
          </div>
        </div>

        {/* ---- Price List ---- */}
        {service.priceList && service.priceList.length > 0 && (
          <section className="mb-16">
            <h2 className="text-title-lg font-semibold text-body-text mb-6">Прейскурант</h2>
            <div className="bg-surface-card border border-hairline-dark rounded-xl overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-hairline-dark bg-surface-elevated">
                    <th className="py-3 px-4 text-left text-xs font-semibold text-muted-text uppercase tracking-[0.1em]">
                      Услуга
                    </th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-muted-text uppercase tracking-[0.1em]">
                      Стоимость
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {service.priceList.map((item) => (
                    <PriceItemRow key={item.id} item={item} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    );
  }
