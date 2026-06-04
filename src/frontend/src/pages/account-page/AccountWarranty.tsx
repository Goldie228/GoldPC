import { useEffect, useMemo } from 'react';
import { ShieldCheck, ShieldAlert, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { useWarranty } from '../../hooks/useWarranty';
import type { WarrantyCard, WarrantyStatus } from '../../api/warranty';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatCard } from '../../components/ui/StatCard';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Маппинг статуса гарантии на variant для StatusBadge.
 * active → info, expired/annulled → neutral.
 */
function badgeVariant(status: WarrantyStatus): 'info' | 'neutral' {
  return status === 'active' ? 'info' : 'neutral';
}

/**
 * Локализованная метка статуса.
 */
function badgeLabel(status: WarrantyStatus): string {
  switch (status) {
    case 'active':   return 'Активна';
    case 'expired':  return 'Истекла';
    case 'annulled': return 'Аннулирована';
  }
}

/**
 * Вычисляет процент оставшегося срока гарантии для прогресс-бара.
 * Используется только для активных гарантий.
 */
function calcProgress(card: WarrantyCard): number {
  if (card.status !== 'active') return 0;
  const start = new Date(card.startDate).getTime();
  const end = new Date(card.endDate).getTime();
  const now = Date.now();
  if (start >= end || now >= end) return 0;
  const total = end - start;
  const remaining = end - now;
  return Math.min(100, Math.max(0, (remaining / total) * 100));
}

/**
 * Форматирует количество месяцев в читаемый срок гарантии.
 * Пример: 36 → "36 мес.", 1 → "1 мес."
 */
function formatPeriod(months: number): string {
  if (months <= 0) return '—';
  return `${months} мес.`;
}

/**
 * Форматирует ISO-дату в локализованный вид "15.03.2026".
 */
function formatDate(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('ru-RU');
  } catch {
    return iso;
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * AccountWarranty — страница «Мои гарантии» (/account/warranty)
 *
 * Получает данные из WarrantyService через useWarranty.
 * Отображает статистику, список карт, состояния загрузки / ошибки / пусто.
 */
export function AccountWarranty() {
  const { cards, totalCount, loading, error, getMyCards } = useWarranty();

  useEffect(() => {
    void getMyCards(1, 50);
  }, [getMyCards]);

  const stats = useMemo(() => {
    const list = cards ?? [];
    return {
      total: totalCount ?? list.length,
      active: list.filter((c) => c.status === 'active').length,
      expired: list.filter((c) => c.status === 'expired').length,
    };
  }, [cards, totalCount]);

  /* ---- Loading state ---- */
  if (loading && !cards) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[1280px] mx-auto flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 size={32} className="animate-spin" />
            <p className="text-sm">Загрузка гарантий...</p>
          </div>
        </div>
      </div>
    );
  }

  /* ---- Error state ---- */
  if (error && !cards) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[1280px] mx-auto flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle size={40} className="text-destructive" />
            <h3 className="text-lg font-semibold text-foreground">Ошибка загрузки</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Не удалось получить список гарантийных талонов. Попробуйте обновить страницу.
            </p>
            <button
              onClick={() => void getMyCards(1, 50)}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold text-gold-ink text-sm font-medium hover:bg-gold-active transition-colors"
            >
              Повторить
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---- Cards count ---- */
  const items: WarrantyCard[] = cards ?? [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Мои гарантии</h1>
          <p className="text-muted-foreground mt-1">Сроки гарантийного обслуживания</p>
        </div>

        {/* Stats row — StatCard вместо ручной вёрстки */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard label="Всего" value={stats.total} icon={ShieldCheck} />
          <StatCard label="Активных" value={stats.active} icon={ShieldAlert} variant="callout" />
          <StatCard label="Истекло" value={stats.expired} icon={Calendar} />
        </div>

        {/* Loading overlay (cards already loaded, background refresh) */}
        {loading && items.length > 0 && (
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <Loader2 size={14} className="animate-spin" />
            <span className="text-xs">Обновление...</span>
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShieldCheck size={64} className="text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              У вас пока нет гарантийных талонов
            </h3>
            <p className="text-sm text-muted-foreground">
              Гарантийные талоны появятся после покупки товаров
            </p>
          </div>
        ) : (
          /* Warranty cards */
          <div className="space-y-4">
            {items.map((card) => {
              const pct = calcProgress(card);
              return (
                <div
                  key={card.id}
                  className="bg-card rounded-xl border border-border p-5"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {card.productName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        {card.serialNumber && (
                          <span className="text-xs text-muted-foreground bg-border px-2 py-0.5 rounded">
                            SN: {card.serialNumber}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          №{card.warrantyNumber}
                        </span>
                      </div>
                    </div>
                    <StatusBadge
                      variant={badgeVariant(card.status)}
                      label={badgeLabel(card.status)}
                    />
                  </div>

                  {/* Progress bar — только для активных гарантий */}
                  {card.status === 'active' && (
                    <div className="mt-4">
                      <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
                        <div
                          className="h-full bg-info-blue rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block">Срок гарантии</span>
                      <span className="text-foreground">
                        {formatPeriod(card.warrantyMonths)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Начало</span>
                      <span className="text-foreground">{formatDate(card.startDate)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Действует до</span>
                      <span className="text-foreground">{formatDate(card.endDate)}</span>
                    </div>
                    <div className="flex items-end justify-end">
                      {/* Страница деталей гарантии пока не реализована — показываем только иконку */}
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar size={14} />
                        Подробнее
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
