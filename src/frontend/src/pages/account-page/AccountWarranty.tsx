import { useEffect, useMemo } from 'react';
import { ShieldCheck, ShieldAlert, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { useWarranty } from '../../hooks/useWarranty';
import type { WarrantyCard, WarrantyStatus } from '../../api/warranty';

/* ------------------------------------------------------------------ */
/*  Status helpers                                                     */
/* ------------------------------------------------------------------ */

function statusConfig(status: WarrantyStatus): { label: string; className: string } {
  switch (status) {
    case 'active':
      return { label: 'Активна', className: 'bg-price-drop/10 text-price-drop' };
    case 'expired':
      return { label: 'Истекла', className: 'bg-price-rise/10 text-price-rise' };
    case 'annulled':
      return { label: 'Аннулирована', className: 'bg-muted/10 text-muted-foreground' };
  }
}

function statusIcon(status: WarrantyStatus) {
  if (status === 'active') return <ShieldCheck size={14} />;
  if (status === 'expired') return <ShieldAlert size={14} />;
  return null;
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
            <AlertCircle size={40} className="text-price-rise" />
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

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Всего</div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="text-2xl font-bold text-price-drop">{stats.active}</div>
            <div className="text-sm text-muted-foreground">Активных</div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="text-2xl font-bold text-price-rise">{stats.expired}</div>
            <div className="text-sm text-muted-foreground">Истекло</div>
          </div>
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
              const cfg = statusConfig(card.status);
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
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium shrink-0 ml-3 ${cfg.className}`}
                    >
                      {statusIcon(card.status)}
                      {cfg.label}
                    </span>
                  </div>

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
                      <a
                        href="#"
                        className="inline-flex items-center gap-1.5 text-sm text-info-blue hover:text-info-blue transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          // TODO: Navigate to warranty detail page
                        }}
                      >
                        <Calendar size={14} />
                        Подробнее
                      </a>
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
