/**
 * Доступные заявки — панель мастера
 *
 * Заявки со статусом "Submitted", доступные для назначения.
 * Мастер может взять заявку в работу (самоназначение).
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderOpen, Search, UserPlus, Clock, AlertTriangle } from 'lucide-react';
import { servicesApi } from '@/api/services';
import type { ServiceRequestDto } from '@/api/services';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AvailableTicketsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const currentUserId = useAuthStore((state) => state.user?.id);

  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const PAGE_SIZE = 15;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['master', 'available', page, PAGE_SIZE],
    queryFn: () => servicesApi.getAvailableServices(page, PAGE_SIZE),
    placeholderData: (prev) => prev,
  });

  const assignMutation = useMutation({
    mutationFn: (serviceId: string) =>
      servicesApi.assignMasterToService(serviceId, currentUserId!),
    onSuccess: () => {
      showToast('Заявка взята в работу', 'success');
      queryClient.invalidateQueries({ queryKey: ['master', 'available'] });
      queryClient.invalidateQueries({ queryKey: ['master', 'tickets'] });
      setConfirmId(null);
    },
    onError: () => {
      showToast('Ошибка при назначении заявки', 'error');
    },
  });

  const tickets = data?.items ?? [];
  const total = data?.total ?? 0;
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
            <FolderOpen size={24} className="text-gold" />
            Доступные заявки
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Заявки, ожидающие назначения мастера
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Доступно: <span className="font-semibold text-foreground">{total}</span>
          </span>
          <button
            onClick={() => refetch()}
            className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors"
          >
            Обновить
          </button>
        </div>
      </div>

      {/* ── Warning if no current user ──────────────────────────── */}
      {!currentUserId && (
        <div className="bg-gold/10 border border-gold/20 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-gold shrink-0" />
          <p className="text-sm text-gold">
            Не удалось определить текущего пользователя. Обновите страницу.
          </p>
        </div>
      )}

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
      </div>

      {/* ── Loading ─────────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            <span>Загрузка доступных заявок...</span>
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

      {/* ── Cards grid ──────────────────────────────────────────── */}
      {!isLoading && !isError && (
        <>
          {filteredTickets.length === 0 ? (
            <div className="bg-surface-card rounded-xl border border-hairline-dark p-12 text-center">
              <FolderOpen size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground">Нет доступных заявок</p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                Все заявки уже назначены на мастеров
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTickets.map((ticket) => (
                <AvailableTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  isConfirming={confirmId === ticket.id}
                  onConfirm={() => setConfirmId(ticket.id)}
                  onCancel={() => setConfirmId(null)}
                  onAssign={() => assignMutation.mutate(ticket.id)}
                  isAssigning={assignMutation.isPending && confirmId === ticket.id}
                />
              ))}
            </div>
          )}

          {/* ── Pagination ──────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-hairline-dark rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-elevated disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Назад
              </button>
              <span className="text-sm text-muted-foreground">
                Страница {page} из {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-hairline-dark rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-elevated disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Далее
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Available Ticket Card                                              */
/* ------------------------------------------------------------------ */

function AvailableTicketCard({
  ticket,
  isConfirming,
  onConfirm,
  onCancel,
  onAssign,
  isAssigning,
}: {
  ticket: ServiceRequestDto;
  isConfirming: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onAssign: () => void;
  isAssigning: boolean;
}) {
  return (
    <div className="bg-surface-card rounded-xl border border-hairline-dark p-4 hover:border-gold/30 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="font-mono text-xs font-medium text-gold">#{ticket.requestNumber}</span>
          <p className="text-sm font-medium text-foreground mt-0.5">{ticket.serviceTypeName}</p>
        </div>
        <span className="inline-block px-2 py-0.5 rounded-md text-xs font-medium bg-gold/15 text-gold">
          Подана
        </span>
      </div>

      {/* Device */}
      {ticket.deviceModel && (
        <p className="text-sm text-foreground mb-1">
          <span className="text-muted-foreground">Устройство:</span> {ticket.deviceModel}
        </p>
      )}

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-3 line-clamp-2" title={ticket.description}>
        {truncate(ticket.description, 120)}
      </p>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
        <span className="flex items-center gap-1">
          <Clock size={12} />
          {formatDateTime(ticket.createdAt)}
        </span>
        <span className="font-medium text-foreground">
          {ticket.estimatedCost.toLocaleString('ru-RU')} ₽
        </span>
      </div>

      {/* Action */}
      {isConfirming ? (
        <div className="flex items-center gap-2">
          <button
            onClick={onAssign}
            disabled={isAssigning}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gold-ink bg-gold rounded-lg hover:bg-gold/90 disabled:opacity-50 transition-colors"
          >
            {isAssigning ? (
              <>
                <div className="w-4 h-4 border-2 border-gold-ink border-t-transparent rounded-full animate-spin" />
                Назначение...
              </>
            ) : (
              <>
                <UserPlus size={14} />
                Взять в работу
              </>
            )}
          </button>
          <button
            onClick={onCancel}
            disabled={isAssigning}
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-hairline-dark rounded-lg hover:bg-surface-elevated disabled:opacity-50 transition-colors"
          >
            Отмена
          </button>
        </div>
      ) : (
        <button
          onClick={onConfirm}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gold bg-gold/10 rounded-lg hover:bg-gold/20 transition-colors"
        >
          <UserPlus size={14} />
          Взять в работу
        </button>
      )}
    </div>
  );
}

export default AvailableTicketsPage;
