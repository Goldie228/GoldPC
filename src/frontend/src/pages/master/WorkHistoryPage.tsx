/**
 * История работ — панель мастера
 *
 * Архив выполненных/отменённых заявок с фильтрацией по статусу и дате.
 * Серверная пагинация, TanStack Query.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { History, Search, Eye, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import { servicesApi } from '@/api/services';
import type { ServiceRequestDto } from '@/api/services';

/* */
/*  Константы                                                          */
/* */

const PAGE_SIZE = 15;

const HISTORY_STATUSES = [
  { key: 'Completed', label: 'Завершена', icon: CheckCircle2, className: 'text-price-drop' },
  { key: 'Cancelled', label: 'Отменена', icon: XCircle, className: 'text-price-rise' },
  { key: 'ReadyForPickup', label: 'Готова к выдаче', icon: Eye, className: 'text-gold' },
] as const;

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  Completed: { label: 'Завершена', className: 'bg-surface-elevated text-muted-foreground' },
  Cancelled: { label: 'Отменена', className: 'bg-price-rise/15 text-price-rise' },
  ReadyForPickup: { label: 'Готова к выдаче', className: 'bg-price-drop/15 text-price-drop' },
};

/* */
/*  Helpers                                                            */
/* */

function formatDateTime(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncate(text: string, max: number): string {
  if (!text) return '—';
  return text.length > max ? text.slice(0, max) + '…' : text;
}

/* */
/*  Компонент                                                          */
/* */

export function WorkHistoryPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['master', 'history', page, PAGE_SIZE, statusFilter],
    queryFn: () => servicesApi.getMasterServices(page, PAGE_SIZE, statusFilter || undefined),
    placeholderData: (prev) => prev,
  });

  const tickets = data?.items ?? [];
  const total = data?.totalCount ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const filteredTickets = searchQuery.trim()
    ? tickets.filter((t) => {
        const q = searchQuery.toLowerCase();
        return (
          t.requestNumber.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          (t.deviceModel ?? '').toLowerCase().includes(q) ||
          t.serviceTypeName.toLowerCase().includes(q)
        );
      })
    : tickets;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <History size={24} className="text-gold" />
            История работ
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Завершённые и отменённые заявки
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors"
        >
          Обновить
        </button>
      </div>

      {/* ── Filters ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            className="w-full pl-9 pr-3 py-2.5 border border-hairline-dark rounded-lg text-sm bg-surface-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/40"
            placeholder="Поиск по номеру, описанию, устройству..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="border border-hairline-dark rounded-lg px-3 py-2 text-sm bg-surface-card text-foreground focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/40"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Все статусы</option>
          {HISTORY_STATUSES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── Loading ─────────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            <span>Загрузка истории...</span>
          </div>
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────── */}
      {isError && (
        <div className="bg-price-rise/10 border border-price-rise/20 rounded-lg p-4 text-center">
          <p className="text-sm text-price-rise">
            Ошибка загрузки: {(error as Error)?.message ?? 'Неизвестная ошибка'}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-2 px-3 py-1.5 text-sm text-price-rise hover:text-price-rise/80 underline transition-colors"
          >
            Повторить
          </button>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────── */}
      {!isLoading && !isError && (
        <div className="bg-surface-card rounded-xl border border-hairline-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline-dark bg-surface-elevated">
                  <th scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground">№ заявки</th>
                  <th scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground">Услуга</th>
                  <th scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground">Устройство</th>
                  <th scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground">Описание</th>
                  <th scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground">Статус</th>
                  <th scope="col" className="text-right px-4 py-3 font-medium text-muted-foreground">Стоимость</th>
                  <th scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground">Завершена</th>
                  <th scope="col" className="text-center px-4 py-3 font-medium text-muted-foreground">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-muted-foreground">
                      <History size={40} className="mx-auto mb-3 opacity-30" />
                      <p>История работ пуста</p>
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => {
                    const badge = STATUS_BADGE[ticket.status] ?? STATUS_BADGE.Completed;
                    return (
                      <tr
                        key={ticket.id}
                        className="border-b border-hairline-dark last:border-b-0 hover:bg-surface-elevated/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <Link
                            to={`/master/tickets/${ticket.id}`}
                            className="font-mono text-xs font-medium text-gold hover:underline"
                          >
                            #{ticket.requestNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-foreground">{ticket.serviceTypeName}</td>
                        <td className="px-4 py-3 text-foreground">{ticket.deviceModel ?? '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate" title={ticket.description}>
                          {truncate(ticket.description, 50)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-medium ${badge.className}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-foreground whitespace-nowrap">
                          {ticket.actualCost > 0
                            ? `${ticket.actualCost.toLocaleString('ru-RU')} BYN`
                            : `${ticket.estimatedCost.toLocaleString('ru-RU')} BYN`}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {ticket.completedAt ? formatDateTime(ticket.completedAt) : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Link
                            to={`/master/tickets/${ticket.id}`}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-gold hover:bg-gold/10 transition-colors"
                            title="Просмотреть"
                          >
                            <Eye size={16} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ──────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-hairline-dark">
              <span className="text-sm text-muted-foreground">
                Страница {page} из {totalPages} ({total} записей)
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-elevated disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (page <= 4) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = page - 3 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        pageNum === page
                          ? 'bg-gold text-gold-ink'
                          : 'text-muted-foreground hover:text-foreground hover:bg-surface-elevated'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-elevated disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default WorkHistoryPage;
