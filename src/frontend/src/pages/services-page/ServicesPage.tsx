/**
 * ServicesPage — Страница услуг сервисного центра
 * Dark Gold theme, flat surfaces per DESIGN.md (no gradients, no blur)
 * API-driven via useServices hook
 */
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, Clock, Loader2, RefreshCw } from 'lucide-react';
import { useServices } from '../../hooks/useServices';

const benefits = [
  {
    title: 'Гарантия до 12 месяцев',
    description: 'На все виды работ и установленные запчасти',
  },
  {
    title: 'Быстрое выполнение',
    description: 'Большинство работ выполняется за 1–2 дня',
  },
  {
    title: 'Опытные специалисты',
    description: 'Сертифицированные инженеры с опытом 10+ лет',
  },
  {
    title: 'Честные цены',
    description: 'Фиксированные цены без скрытых платежей',
  },
];

export function ServicesPage() {
  const { data, isLoading, isError, refetch } = useServices();
  const services = data?.data ?? [];

  // Loading state
  if (isLoading) {
    return (
      <main className="min-h-screen bg-canvas-dark pt-24 md:pt-28 pb-20">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8">
          <div className="flex justify-center items-center min-h-[300px]">
            <Loader2 size={48} className="animate-spin text-gold" />
          </div>
        </div>
      </main>
    );
  }

  // Error state
  if (isError) {
    return (
      <main className="min-h-screen bg-canvas-dark pt-24 md:pt-28 pb-20">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8">
          <nav className="flex items-center gap-2 text-sm text-muted-text mb-8">
            <Link to="/" className="hover:text-gold transition-colors">Главная</Link>
            <span className="text-muted-text">/</span>
            <span className="text-body-text">Услуги</span>
          </nav>
          <div className="text-center py-20">
            <p className="text-lg text-muted-text mb-6">
              Не удалось загрузить список услуг. Попробуйте позже.
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
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-canvas-dark pt-24 md:pt-28 pb-20">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-text mb-8">
          <Link to="/" className="hover:text-gold transition-colors">Главная</Link>
          <span className="text-muted-text">/</span>
          <span className="text-body-text">Услуги</span>
        </nav>

        {/* Hero */}
        <section className="mb-16">
          <h1 className="text-display-sm md:text-display-md lg:text-display-lg font-bold text-body-text mb-4">
            Наши <span className="text-gold">услуги</span>
          </h1>
          <p className="text-lg text-muted-text max-w-[600px] leading-relaxed">
            Профессиональный сервис для вашего оборудования. Ремонт, модернизация и
            диагностика от сертифицированных специалистов.
          </p>
        </section>

        {/* Services Grid */}
        <section className="mb-20">
          {services.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-lg text-muted-text">
                На данный момент услуги не добавлены
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <article
                  key={service.id}
                  className="bg-surface-card rounded-xl border border-hairline-dark p-6 md:p-8 flex flex-col group transition-all duration-300 hover:border-gold/30"
                >
                  {/* Title */}
                  <h2 className="text-title-md font-semibold text-body-text mb-3">{service.name}</h2>

                  {/* Description */}
                  <p className="text-sm text-muted-text leading-relaxed mb-6 flex-grow">
                    {service.shortDescription || service.description}
                  </p>

                  {/* Duration */}
                  <p className="text-xs text-muted-text mb-4 flex items-center gap-1.5">
                    <Clock size={12} />
                    {service.duration}
                  </p>

                  {/* Footer: price + link */}
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
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Benefits */}
        <section className="mb-20">
          <div className="bg-surface-card rounded-xl border border-hairline-dark p-6 md:p-8">
            <h2 className="text-title-lg font-semibold text-body-text mb-8">
              Почему выбирают нас
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit) => (
                <div key={benefit.title}>
                  <h4 className="text-body-text font-semibold text-sm mb-1">{benefit.title}</h4>
                  <p className="text-sm text-muted-text leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA — flat, no gradients per DESIGN.md */}
        <section>
          <div className="bg-surface-card rounded-xl border border-hairline-dark p-8 md:p-12 text-center">
            <h2 className="text-display-sm font-bold text-body-text mb-3">
              Нужна <span className="text-gold">консультация</span>?
            </h2>
            <p className="text-muted-text mb-6 max-w-md mx-auto">
              Оставьте заявку и наш специалист свяжется с вами в течение 15 минут
            </p>
            <Link
              to="/service-request"
              className="inline-flex items-center gap-2.5 px-6 py-3 bg-gold text-gold-ink font-semibold rounded-md hover:bg-gold-active transition-colors h-10"
            >
              Оставить заявку
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
