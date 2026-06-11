/**
 * Master Tickets Page
 * Страница списка заявок на сервис для мастеров
 * Использует API servicesApi.getMasterServices + клиентскую фильтрацию
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { servicesApi, TICKET_STATUSES } from '@/api/services';
import type { ServiceRequestDto } from '@/api/services';
import { useToastStore } from '@/store/toastStore';

// ─── Константы ───────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

const STATUS_TAILWIND: Record<string, string> = {
  Submitted: 'bg-blue-100 text-blue-800',
  InProgress: 'bg-yellow-100 text-yellow-800',
  PartsPending: 'bg-purple-100 text-purple-800',
  ReadyForPickup: 'bg-green-100 text-green-800',
  Completed: 'bg-gray-100 text-gray-800',
  Cancelled: 'bg-red-100 text-red-800',
};

// ─── Вспомогательные функции ──────────────────────────────────────────────────

function getStatusDisplay(key: string): { label: string } {
  const found = TICKET_STATUSES.find((s) => s.key === key);
  return { label: found?.label ?? key };
}

function shortenId(id: string): string {
  if (!id) return '—';
  return id.length > 8 ? id.slice(0, 8) + '…' : id;
}

function truncate(text: string, max: number): string {
  if (!text) return '—';
  return text.length > max ? text.slice(0, max) + '…' : text;
}

// ─── Компонент ───────────────────────────────────────────────────────────────

export function TicketsPage() {
  const [tickets, setTickets] = useState<ServiceRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const showToast = useToastStore((s) => s.showToast);

  // ── Загрузка данных ─────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    servicesApi
      .getMasterServices(1, 1000)
      .then((data) => {
        if (cancelled) return;
        setTickets(data.items);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        showToast('Ошибка загрузки заявок', 'error');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [showToast]);

  // ── Клиентская фильтрация (поиск + статус) ──────────────────────────────

  const filteredTickets = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return tickets.filter((ticket) => {
      if (query) {
        const inNumber = ticket.requestNumber.toLowerCase().includes(query);
        const inDesc = ticket.description.toLowerCase().includes(query);
        const inDevice = (ticket.deviceModel ?? '').toLowerCase().includes(query);
        if (!inNumber && !inDesc && !inDevice) return false;
      }
      if (statusFilter && ticket.status !== statusFilter) return false;
      return true;
    });
  }, [tickets, searchQuery, statusFilter]);

  // ── Пагинация ───────────────────────────────────────────────────────────

  const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // ── Рендер ──────────────────────────────────────────────────────────────

  return (
    <div className="staff-page">
      <header className="staff-page__header">
        <div>
          <h1 className="staff-page__title">Заявки на сервис</h1>
          <p className="staff-page__subtitle">
            Управление заявками на ремонт и обслуживание
          </p>
        </div>
      </header>

      {/* Панель фильтров */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            width="16"
            height="16"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm bg-bg-card focus:outline-none focus:ring-2 focus:ring-gold/40"
            placeholder="Поиск по заявкам..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <select
          className="border border-border rounded-lg px-3 py-2 text-sm bg-bg-card focus:outline-none focus:ring-2 focus:ring-gold/40"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">Все статусы</option>
          {TICKET_STATUSES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Таблица */}
      <div className="staff-table-wrap">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <div className="flex items-center gap-3">
              <svg
                className="animate-spin h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span>Загрузка заявок...</span>
            </div>
          </div>
        ) : (
          <table className="staff-table">
            <thead>
              <tr>
                <th>№ заявки</th>
                <th>Клиент</th>
                <th>Устройство</th>
                <th>Описание</th>
                <th>Статус</th>
                <th>Стоимость</th>
                <th>Дата</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTickets.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-12 text-muted-foreground"
                  >
                    Заявки не найдены
                  </td>
                </tr>
              ) : (
                paginatedTickets.map((ticket) => {
                  const statusInfo = getStatusDisplay(ticket.status);
                  return (
                    <tr key={ticket.id}>
                      <td className="font-medium whitespace-nowrap font-mono text-xs">
                        #{ticket.requestNumber}
                      </td>
                      <td className="text-muted-foreground">
                        {shortenId(ticket.clientId)}
                      </td>
                      <td>{ticket.deviceModel ?? '—'}</td>
                      <td
                        className="max-w-[240px]"
                        title={ticket.description}
                      >
                        {truncate(ticket.description, 60)}
                      </td>
                      <td>
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            STATUS_TAILWIND[ticket.status] ??
                            STATUS_TAILWIND.Completed
                          }`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap font-medium">
                        {ticket.estimatedCost.toLocaleString()} ₽
                      </td>
                      <td className="text-muted-foreground whitespace-nowrap">
                        {new Date(ticket.createdAt).toLocaleDateString('ru-RU')}
                      </td>
                      <td>
                        <Link
                          to={`/master/tickets/${ticket.id}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-gold hover:bg-gold/10 transition-colors"
                          title="Просмотр заявки"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            width="18"
                            height="18"
                          >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Пагинация */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-muted-foreground">
            Показано {paginatedTickets.length} из {filteredTickets.length}{' '}
            заявок
          </span>
          <div className="flex items-center gap-1">
            <button
              className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              ←
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              return (
                <button
                  key={page}
                  className={`px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                    page === currentPage
                      ? 'bg-gold text-white border-gold'
                      : 'border-border hover:bg-elevated'
                  }`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              );
            })}
            <button
              className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TicketsPage;
