/**
 * ServiceSelector — сетка карточек услуг сервисного центра
 * Грузит данные через GET /api/v1/services/types (реальный бэкенд)
 * Поддерживает предварительный выбор через URL-параметр ?service=id.
 */
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { servicesApi, type ServiceType } from '@/api/services';
import { Button } from '@/components/ui';

export interface ServiceSelectorProps {
  selectedServiceId: string | null;
  onSelect: (serviceId: string, serviceSlug: string, serviceName: string) => void;
}

/**
 * Форматирует минуты в человекочитаемый вид
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
}

/**
 * Карточка одной услуги
 */
function ServiceCard({
  service,
  isSelected,
  onSelect,
}: {
  service: ServiceType;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`Выбрать услугу: ${service.name}`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`bg-surface-card border rounded-lg p-5 cursor-pointer transition-all ${
        isSelected
          ? 'border-gold shadow-[0_0_0_1px_#fcd535]'
          : 'border-border hover:border-muted-text'
      }`}
    >

      <div className="text-foreground font-semibold text-base mb-1">{service.name}</div>
      <div className="text-muted-text text-sm mb-3 line-clamp-2">{service.description}</div>
      <div className="flex items-center justify-between">
        <span className="text-gold font-medium">
          от {service.basePrice} BYN
        </span>
        <span className="text-muted-strong text-xs">
          {formatDuration(service.estimatedDurationMinutes)}
        </span>
      </div>
    </div>
  );
}

/**
 * Скелетон карточки для состояния загрузки
 */
function SkeletonCard() {
  return (
    <div className="bg-surface-card border border-border rounded-lg p-5 animate-pulse" aria-hidden>
      <div className="w-10 h-10 bg-surface-elevated rounded mb-3" />
      <div className="h-4 bg-surface-elevated rounded mb-2 w-3/4" />
      <div className="h-3 bg-surface-elevated rounded mb-1 w-full" />
      <div className="h-3 bg-surface-elevated rounded mb-3 w-2/3" />
      <div className="flex justify-between">
        <div className="h-4 bg-surface-elevated rounded w-20" />
        <div className="h-3 bg-surface-elevated rounded w-16" />
      </div>
    </div>
  );
}

/**
 * ServiceSelector
 * Отображает доступные услуги в виде сетки карточек.
 * Поддерживает предвыбор через URL-параметр ?service=id.
 */
export function ServiceSelector({ selectedServiceId, onSelect }: ServiceSelectorProps) {
  const [searchParams] = useSearchParams();
  const preSelectedId = searchParams.get('service');

  const [services, setServices] = useState<ServiceType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const loadServiceTypes = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const types = await servicesApi.getServiceTypes();
      setServices(types);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServiceTypes();
  }, []);

  // Pre-select service from URL query param ?service=slug
  useEffect(() => {
    if (preSelectedId && services.length > 0) {
      const found = services.find((s) => s.slug === preSelectedId);
      if (found) {
        onSelect(found.id, found.slug, found.name);
      }
    }
    // Только при первой загрузке списка
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services]);

  // --- Loading State ---
  if (isLoading) {
    return (
      <section>
        <h2 className="text-foreground text-lg font-semibold mb-4 flex items-center gap-2">
          Выберите услугу
        </h2>
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          aria-busy="true"
          aria-label="Загрузка услуг"
        >
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </section>
    );
  }

  // --- Error State ---
  if (isError) {
    return (
      <section>
        <h2 className="text-foreground text-lg font-semibold mb-4 flex items-center gap-2">
          Выберите услугу
        </h2>
        <div className="text-center py-10 px-4 bg-surface-card border border-border rounded-lg">
          <p className="text-muted-text mb-4">Не удалось загрузить список услуг</p>
          <Button variant="outline" onClick={loadServiceTypes}>
            Попробовать снова
          </Button>
        </div>
      </section>
    );
  }

  // --- Empty State ---
  if (services.length === 0) {
    return (
      <section>
        <h2 className="text-foreground text-lg font-semibold mb-4 flex items-center gap-2">
          Выберите услугу
        </h2>
        <div className="text-center py-10 px-4 bg-surface-card border border-border rounded-lg">
          <p className="text-muted-text">Услуги временно недоступны</p>
        </div>
      </section>
    );
  }

  // --- Normal State ---
  return (
    <section>
      <h2 className="text-foreground text-lg font-semibold mb-4 flex items-center gap-2">
        Выберите услугу
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            isSelected={selectedServiceId === service.id}
            onSelect={() => onSelect(service.id, service.slug, service.name)}
          />
        ))}
      </div>
    </section>
  );
}

export default ServiceSelector;
