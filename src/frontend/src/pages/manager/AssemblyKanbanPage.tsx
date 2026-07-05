/**
 * Assembly Kanban Board
 * Доска управления сборкой ПК для менеджера/координатора.
 * Колонки по статусам, drag-and-drop для смены статуса/мастера.
 */

import { useState, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { servicesApi } from '@/api/services';
import type { ServiceRequestWithAssembly } from '@/api/types';
import { Loader2, RefreshCw, AlertCircle, Cpu } from 'lucide-react';

/* ─── Колонки ─── */

interface KanbanColumn {
  key: string;
  label: string;
  color: string;
}

const COLUMNS: KanbanColumn[] = [
  { key: 'Submitted', label: 'Подана', color: '#3b82f6' },
  { key: 'Assigned', label: 'Назначена', color: '#a855f7' },
  { key: 'InProgress', label: 'В работе', color: '#eab308' },
  { key: 'Assembled', label: 'Собрана', color: '#22c55e' },
  { key: 'ReadyForDelivery', label: 'Готова к доставке', color: '#06b6d4' },
  { key: 'InDelivery', label: 'В доставке', color: '#f97316' },
  { key: 'Delivered', label: 'Доставлена', color: '#22c55e' },
];

/* ─── Утилиты ─── */

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

function getComponentCount(ticket: ServiceRequestWithAssembly): number {
  if (Array.isArray(ticket.assemblyParts) && ticket.assemblyParts.length > 0) {
    return ticket.assemblyParts.length;
  }
  if (Array.isArray(ticket.serviceParts) && ticket.serviceParts.length > 0) {
    return ticket.serviceParts.length;
  }
  return 0;
}

/* ─── Карточка заявки ─── */

interface KanbanCardProps {
  ticket: ServiceRequestWithAssembly;
  onDragStart: (e: React.DragEvent, ticketId: string, sourceStatus: string) => void;
}

function KanbanCard({ ticket, onDragStart }: KanbanCardProps) {
  const components = getComponentCount(ticket);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, ticket.id, ticket.status)}
      className="group rounded-lg border border-[#2b3139] bg-[#1e2329] p-3 cursor-grab active:cursor-grabbing hover:border-[#FCD535]/40 transition-colors"
      style={{ userSelect: 'none' }}
    >
      {/* Номер заявки */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-[#eaecef]">
          #{ticket.requestNumber}
        </span>
        <span className="text-xs text-[#707a8a]">
          {formatDateShort(ticket.createdAt)}
        </span>
      </div>

      {/* Информация о клиенте */}
      <div className="text-xs text-[#929aa5] mb-1.5">
        {ticket.clientPhone && <div>{ticket.clientPhone}</div>}
        {ticket.clientEmail && <div className="truncate">{ticket.clientEmail}</div>}
      </div>

      {/* Мастер */}
      {ticket.masterName && (
        <div className="flex items-center gap-1 mb-1.5">
          <span className="text-xs px-1.5 py-0.5 rounded bg-[#a855f7]/15 text-[#a855f7] font-medium">
            {ticket.masterName}
          </span>
        </div>
      )}

      {/* Описание */}
      {ticket.description && (
        <p className="text-xs text-[#707a8a] line-clamp-2 mb-2">
          {ticket.description}
        </p>
      )}

      {/* Компоненты */}
      {components > 0 && (
        <div className="flex items-center gap-1 text-xs text-[#707a8a]">
          <Cpu size={12} />
          <span>{components} компонент{components % 10 === 1 && components % 100 !== 11 ? '' : components % 10 >= 2 && components % 10 <= 4 && (components % 100 < 10 || components % 100 >= 20) ? 'а' : 'ов'}</span>
        </div>
      )}
    </div>
  );
}

/* ─── Основной компонент ─── */

export default function AssemblyKanbanPage() {
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const draggedSourceRef = useRef<string | null>(null);

  /* ── Загрузка данных ── */

  const {
    data: tickets = [],
    isLoading: loading,
    error: queryError,
    refetch: fetchTickets,
  } = useQuery<ServiceRequestWithAssembly[]>({
    queryKey: ['assembly-kanban'],
    queryFn: async () => {
      // TODO: Client-side filtering by serviceTypeName is a known limitation.
      // The backend has no dedicated "get assembly kanban tickets" endpoint, so
      // we fetch 200 tickets and фильтр locally. This breaks пагинация and may
      // miss assembly tickets beyond страница 1. A proper fix requires a backend
      // endpoint like GET /admin/service-requests/assembly with status filters.
      const response = await servicesApi.getAllServiceRequests({ page: 1, pageSize: 200 });
      return (response.items as ServiceRequestWithAssembly[]).filter(
        (t) =>
          t.serviceTypeName?.toLowerCase().includes('сборк') ||
          t.serviceTypeName?.toLowerCase().includes('assembly'),
      );
    },
    refetchInterval: 30000,
  });

  const error = queryError instanceof Error ? queryError.message : null;

  /* ── Drag-and-Drop ── */

  const handleDragStart = useCallback(
    (e: React.DragEvent, ticketId: string, sourceStatus: string) => {
      setDraggedTicketId(ticketId);
      draggedSourceRef.current = sourceStatus;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', ticketId);
    },
    [],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, columnKey: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverColumn(columnKey);
    },
    [],
  );

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetStatus: string) => {
      e.preventDefault();
      setDragOverColumn(null);

      const ticketId = e.dataTransfer.getData('text/plain');
      if (!ticketId) return;

      const sourceStatus = draggedSourceRef.current;
      if (sourceStatus === targetStatus) {
        setDraggedTicketId(null);
        return;
      }

      try {
        await servicesApi.updateRequestStatus(ticketId, targetStatus);
        await fetchTickets();
      } catch (e) {
        console.error('Ошибка обновления статуса:', e);
      } finally {
        setDraggedTicketId(null);
        draggedSourceRef.current = null;
      }
    },
    [fetchTickets],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedTicketId(null);
    setDragOverColumn(null);
    draggedSourceRef.current = null;
  }, []);

  /* ── Рендер ── */

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 size={32} className="animate-spin text-[#FCD535]" />
        <span className="text-sm text-[#707a8a]">Загрузка доски...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle size={40} className="text-[#f6465d]" />
        <p className="text-[#eaecef] font-medium">Ошибка загрузки</p>
        <p className="text-sm text-[#707a8a]">{error}</p>
        <button
          onClick={fetchTickets}
          className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[#FCD535] px-4 py-2 text-sm font-semibold text-[#181a20] hover:bg-[#f0b90b] transition-colors"
        >
          <RefreshCw size={14} />
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#eaecef]">
            Сборка ПК — Доска управления
          </h1>
          <p className="text-sm text-[#707a8a] mt-1">
            Перетаскивайте заявки между колонками для смены статуса
          </p>
        </div>
        <button
          onClick={fetchTickets}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-[#2b3139] bg-[#1e2329] px-3 py-2 text-sm text-[#929aa5] hover:text-[#eaecef] hover:border-[#FCD535]/40 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Обновить
        </button>
      </div>

      {/* Доска */}
      <div
        className="flex gap-3 overflow-x-auto pb-4"
        onDragEnd={handleDragEnd}
      >
        {COLUMNS.map((col) => {
          const columnTickets = tickets.filter((t) => t.status === col.key);
          const isOver = dragOverColumn === col.key;

          return (
            <div
              key={col.key}
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.key)}
              className="flex-shrink-0 w-72 flex flex-col"
            >
              {/* Заголовок колонки */}
              <div
                className={`flex items-center gap-2 rounded-t-lg px-3 py-2 transition-colors ${
                  isOver ? 'bg-[#2b3139]/80' : 'bg-[#1e2329]'
                } border border-b-0 border-[#2b3139]`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: col.color }}
                />
                <span className="text-sm font-semibold text-[#eaecef]">
                  {col.label}
                </span>
                <span className="ml-auto text-xs font-medium text-[#707a8a] bg-[#2b3139] rounded-full px-2 py-0.5">
                  {columnTickets.length}
                </span>
              </div>

              {/* Список карточек */}
              <div
                className={`flex-1 flex flex-col gap-2 p-2 rounded-b-lg border border-t-0 border-[#2b3139] min-h-[200px] transition-colors ${
                  isOver ? 'bg-[#FCD535]/5' : 'bg-[#0b0e11]'
                }`}
              >
                {columnTickets.length === 0 ? (
                  <div className="flex items-center justify-center h-24 text-xs text-[#707a8a]">
                    Нет заявок
                  </div>
                ) : (
                  columnTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onDragEnd={handleDragEnd}
                      className={draggedTicketId === ticket.id ? 'opacity-40' : ''}
                    >
                      <KanbanCard
                        ticket={ticket}
                        onDragStart={handleDragStart}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
