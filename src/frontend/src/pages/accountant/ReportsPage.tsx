/**
 * Страница финансовых отчётов для бухгалтера
 * Подключена к реальному API ReportingService
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { accountantApi } from '@/api/accountant';
import type { FinancialSummary } from '@/api/accountant';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { formatPrice } from '@/utils/format';

/* ─── Вспомогательные функции ─── */

/** Форматирование даты в формат YYYY-MM-DD для input[type=date] */
function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/** Форматирование даты для отображения */
function formatDateDisplay(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU');
}

/* ─── Скелетон загрузки ─── */

function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <Skeleton width={280} height={32} className="mb-2" />
        <Skeleton width={400} height={18} />
      </div>

      {/* Карточки статистики */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={100} borderRadius="lg" />
        ))}
      </div>

      {/* Форма выбора периода */}
      <Skeleton height={280} borderRadius="lg" />
    </div>
  );
}

/* ─── Состояние ошибки ─── */

function ReportsError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Финансовые отчёты</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Формирование отчётов за выбранный период
        </p>
      </div>
      <div className="bg-surface-card border border-hairline-dark rounded-lg p-8 text-center">
        <AlertCircle size={32} className="mx-auto text-price-rise mb-3" />
        <p className="text-price-rise font-medium">{message}</p>
        <p className="text-muted-foreground text-sm mt-1">
          Попробуйте обновить страницу
        </p>
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 text-sm font-medium text-foreground bg-surface-card border border-hairline-dark rounded-lg hover:bg-surface-elevated transition-colors"
        >
          Обновить
        </button>
      </div>
    </div>
  );
}

/* ─── Основной компонент ─── */

export function ReportsPage() {
  const today = useMemo(() => new Date(), []);
  const firstDayOfMonth = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
    [today]
  );

  const [dateFrom, setDateFrom] = useState(toISODate(firstDayOfMonth));
  const [dateTo, setDateTo] = useState(toISODate(today));

  // Запрос финансового отчёта (по умолчанию — текущий месяц)
  const {
    data: summary,
    isLoading,
    error,
    refetch,
  } = useQuery<FinancialSummary>({
    queryKey: ['accountant', 'financial-summary', dateFrom, dateTo],
    queryFn: () => accountantApi.getFinancialSummary(dateFrom, dateTo),
    // Не загружать автоматически, если даты пустые
    enabled: Boolean(dateFrom && dateTo && dateFrom < dateTo),
    staleTime: 60_000, // Кешируем на минуту
  });

  if (isLoading) {
    return <ReportsSkeleton />;
  }

  if (error) {
    return (
      <ReportsError
        message={error instanceof Error ? error.message : 'Ошибка загрузки данных'}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Финансовые отчёты</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Формирование отчётов за выбранный период
        </p>
      </div>

      {/* Карточки статистики */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-card border border-hairline-dark rounded-lg p-5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            Выручка за период
          </div>
          <div className="font-mono text-2xl font-medium text-gold">
            {summary ? formatPrice(summary.revenue) : '--'}
          </div>
        </div>
        <div className="bg-surface-card border border-hairline-dark rounded-lg p-5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            Заказов
          </div>
          <div className="font-mono text-2xl font-medium text-foreground">
            {summary?.ordersCount ?? '--'}
          </div>
        </div>
        <div className="bg-surface-card border border-hairline-dark rounded-lg p-5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            Средний чек
          </div>
          <div className="font-mono text-2xl font-medium text-foreground">
            {summary ? formatPrice(summary.averageCheck) : '--'}
          </div>
        </div>
        <div className="bg-surface-card border border-hairline-dark rounded-lg p-5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            Услуг оказано
          </div>
          <div className="font-mono text-2xl font-medium text-foreground">
            {summary?.servicesCount ?? '--'}
          </div>
        </div>
      </div>

      {/* Карточка периода отчёта */}
      <div className="bg-surface-card border border-hairline-dark rounded-lg p-6">
        <div className="text-sm font-semibold mb-5 flex items-center gap-3 pb-4 border-b border-hairline-dark">
          <svg
            className="w-[18px] h-[18px] text-gold"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Период отчёта
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              Дата начала
            </label>
            <input
              type="date"
              className="w-full p-3 bg-surface-elevated border border-hairline-dark rounded-lg text-foreground font-mono text-sm transition-colors focus:outline-none focus:border-gold [color-scheme:dark]"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              Дата окончания
            </label>
            <input
              type="date"
              className="w-full p-3 bg-surface-elevated border border-hairline-dark rounded-lg text-foreground font-mono text-sm transition-colors focus:outline-none focus:border-gold [color-scheme:dark]"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            className="inline-flex items-center gap-2.5 px-6 py-3 text-sm font-semibold rounded-lg border-none cursor-pointer transition-all bg-gold text-gold-ink hover:bg-gold-active disabled:opacity-70 disabled:cursor-not-allowed"
            onClick={() => void refetch()}
            disabled={!dateFrom || !dateTo || dateFrom >= dateTo}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Сформировать отчёт
          </button>
        </div>
      </div>

      {/* Результаты сформированного отчёта */}
      {summary && (
        <div className="bg-surface-card border border-gold/30 rounded-lg p-6">
          <div className="text-sm font-semibold mb-5 flex items-center gap-3 pb-4 border-b border-hairline-dark">
            <svg
              className="w-[18px] h-[18px] text-gold"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            Результаты отчёта
          </div>

          <div className="flex flex-col gap-0">
            <div className="flex justify-between items-center py-3 border-b border-hairline-dark">
              <span className="text-sm text-muted-foreground">Период:</span>
              <span className="font-mono text-sm font-medium text-foreground">
                {formatDateDisplay(dateFrom)} — {formatDateDisplay(dateTo)}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-hairline-dark">
              <span className="text-sm text-muted-foreground">Выручка:</span>
              <span className="font-mono text-sm font-medium text-gold">
                {formatPrice(summary.revenue)}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-hairline-dark">
              <span className="text-sm text-muted-foreground">Прибыль:</span>
              <span className="font-mono text-sm font-medium text-price-drop">
                {formatPrice(summary.profit)}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-hairline-dark">
              <span className="text-sm text-muted-foreground">Рентабельность:</span>
              <span className="font-mono text-sm font-medium text-foreground">
                {summary.revenue > 0
                  ? ((summary.profit / summary.revenue) * 100).toFixed(1)
                  : '0.0'}%
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-hairline-dark">
              <span className="text-sm text-muted-foreground">Количество заказов:</span>
              <span className="font-mono text-sm font-medium text-foreground">
                {summary.ordersCount}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-hairline-dark">
              <span className="text-sm text-muted-foreground">Оказано услуг:</span>
              <span className="font-mono text-sm font-medium text-foreground">
                {summary.servicesCount}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 last:border-b-0">
              <span className="text-sm text-muted-foreground">Маржа:</span>
              <span className="font-mono text-sm font-medium text-foreground">
                {summary.marginPercent}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsPage;
