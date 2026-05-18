import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useServiceTickets } from '../../hooks/useServiceTickets';
import { TICKET_STATUSES } from '../../api/services';
import type { ServiceTicket } from '../../api/services';
import { Wrench, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const statusColorMap: Record<string, string> = {
  blue: 'bg-[#3b82f6]/10 text-[#3b82f6]',
  yellow: 'bg-[#FCD535]/10 text-[#FCD535]',
  orange: 'bg-[#f97316]/10 text-[#f97316]',
  purple: 'bg-[#a855f7]/10 text-[#a855f7]',
  cyan: 'bg-[#06b6d4]/10 text-[#06b6d4]',
  green: 'bg-[#0ecb81]/10 text-[#0ecb81]',
  gray: 'bg-[#707a8a]/10 text-[#707a8a]',
  red: 'bg-[#f6465d]/10 text-[#f6465d]',
};

function getStatusLabel(status: string): string {
  const statusItem = TICKET_STATUSES.find(s => s.key === status);
  return statusItem?.label || status;
}

function getStatusColor(status: string): string {
  const statusItem = TICKET_STATUSES.find(s => s.key === status);
  return statusItem?.color || 'gray';
}

/**
 * AccountRepairs - My Repairs page for customers
 *
 * Features:
 * - Repair ticket stats cards
 * - Filter buttons by status
 * - Tickets list with status badges
 * - Link to ticket detail page
 * - Real-time status updates via polling
 */
export function AccountRepairs() {
  const { getMyTickets } = useServiceTickets();

  const [activeFilter, setActiveFilter] = useState('all');
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [page] = useState(1);

  const pageSize = 10;

  useEffect(() => {
    void loadTickets();

    // Poll for updates every 30 seconds
    const interval = setInterval(() => { void loadTickets(); }, 30000);
    return () => clearInterval(interval);
  }, [page, activeFilter]);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMyTickets(page, pageSize, activeFilter === 'all' ? undefined : activeFilter);
      if (result != null) {
        setTickets(result.items);
      }
    } catch {
      // Silent fail - show empty state instead
    } finally {
      setLoading(false);
    }
  }, [page, activeFilter, getMyTickets]);

  const stats = {
    total: tickets.length,
    active: tickets.filter(t => !['Completed', 'Cancelled'].includes(t.status)).length,
    completed: tickets.filter(t => t.status === 'Completed').length,
    urgent: tickets.filter(t => t.priority === 'urgent' || t.status === 'ReadyForPickup').length,
  };

  const filterOptions = [
    { key: 'all', label: 'Все' },
    { key: 'New', label: 'Новые' },
    { key: 'Diagnosing', label: 'Диагностика' },
    { key: 'Repairing', label: 'В ремонте' },
    { key: 'Ready', label: 'Готовы' },
    { key: 'Completed', label: 'Завершённые' },
  ];

  if (loading && tickets.length === 0) {
    return (
      <div className="bg-[#0b0e11] min-h-screen flex items-center justify-center">
        <div className="text-[#707a8a] text-lg">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="bg-[#0b0e11] min-h-screen">
      <div className="max-w-[1280px] mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#eaecef]">Мои ремонты</h1>
          <Link
            to="/service-request"
            className="inline-flex items-center gap-2 bg-[#FCD535] text-[#181a20] px-5 py-2.5 rounded-lg font-semibold text-sm hover:brightness-110 transition-all"
          >
            <Wrench size={18} />
            Новый запрос на ремонт
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1e2329] rounded-xl border border-[#2b3139] p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6] shrink-0">
              <Wrench size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#eaecef]">{stats.total}</div>
              <div className="text-sm text-[#707a8a]">Всего заявок</div>
            </div>
          </div>

          <div className="bg-[#1e2329] rounded-xl border border-[#2b3139] p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#FCD535]/10 flex items-center justify-center text-[#FCD535] shrink-0">
              <Clock size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#eaecef]">{stats.active}</div>
              <div className="text-sm text-[#707a8a]">В работе</div>
            </div>
          </div>

          <div className="bg-[#1e2329] rounded-xl border border-[#2b3139] p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#0ecb81]/10 flex items-center justify-center text-[#0ecb81] shrink-0">
              <CheckCircle size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#eaecef]">{stats.completed}</div>
              <div className="text-sm text-[#707a8a]">Завершено</div>
            </div>
          </div>

          <div className="bg-[#1e2329] rounded-xl border border-[#2b3139] p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#f6465d]/10 flex items-center justify-center text-[#f6465d] shrink-0">
              <AlertCircle size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#eaecef]">{stats.urgent}</div>
              <div className="text-sm text-[#707a8a]">Требуют внимания</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {filterOptions.map(filter => (
            <button
              key={filter.key}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeFilter === filter.key
                  ? 'bg-[#FCD535] text-[#181a20]'
                  : 'bg-[#1e2329] text-[#707a8a] border border-[#2b3139] hover:text-[#eaecef] hover:border-[#707a8a]'
              }`}
              onClick={() => setActiveFilter(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Tickets List */}
        {tickets.length === 0 ? (
          <div className="bg-[#1e2329] rounded-xl border border-[#2b3139] p-12 text-center">
            <div className="flex justify-center mb-4 text-[#707a8a]">
              <Wrench size={48} />
            </div>
            <h3 className="text-lg font-semibold text-[#eaecef] mb-2">
              У вас пока нет заявок на ремонт
            </h3>
            <p className="text-[#707a8a] text-sm mb-6">
              Вы можете отправить устройство на диагностику и ремонт
            </p>
            <Link
              to="/service-request"
              className="inline-flex items-center gap-2 bg-[#FCD535] text-[#181a20] px-5 py-2.5 rounded-lg font-semibold text-sm hover:brightness-110 transition-all"
            >
              Создать заявку
            </Link>
          </div>
        ) : (
          <div className="bg-[#1e2329] rounded-xl border border-[#2b3139] overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[#2b3139] text-sm font-medium text-[#707a8a]">
              <div className="col-span-2">Номер</div>
              <div className="col-span-3">Устройство</div>
              <div className="col-span-2">Статус</div>
              <div className="col-span-3">Дата создания</div>
              <div className="col-span-2 text-right">Действия</div>
            </div>

            {/* Table rows */}
            {tickets.map(ticket => (
              <div
                key={ticket.id}
                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[#2b3139] last:border-b-0 items-center hover:bg-white/[0.02] transition-colors"
              >
                <div className="col-span-2 text-[#FCD535] font-mono text-sm">
                  #{ticket.ticketNumber}
                </div>
                <div className="col-span-3">
                  <div className="text-[#eaecef] text-sm font-medium">{ticket.deviceType}</div>
                  <div className="text-[#707a8a] text-xs">{ticket.brand} {ticket.model}</div>
                </div>
                <div className="col-span-2">
                  <span
                    className={`inline-block px-3 py-1 rounded-lg text-xs font-medium ${
                      statusColorMap[getStatusColor(ticket.status)] || 'bg-[#707a8a]/10 text-[#707a8a]'
                    }`}
                  >
                    {getStatusLabel(ticket.status)}
                  </span>
                </div>
                <div className="col-span-3 text-[#707a8a] text-sm">
                  {new Date(ticket.createdAt).toLocaleDateString('ru-RU')}
                </div>
                <div className="col-span-2 text-right">
                  <Link
                    to={`/my-repairs/${ticket.id}`}
                    className="inline-flex items-center text-[#FCD535] text-sm font-medium hover:brightness-110 transition-all"
                  >
                    Подробнее
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
