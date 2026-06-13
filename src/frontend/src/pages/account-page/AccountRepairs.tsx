import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useServiceTickets } from '@/hooks/useServiceTickets';
import { TICKET_STATUSES } from '@/api/services';
import type { ServiceRequestDto } from '@/api/services';
import { Wrench, Clock, CheckCircle, AlertCircle, Plus, RefreshCw } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { StatusVariant } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';

// ═══════════════════════════════════════════════════════════════════
//  Stagger entrance animation
// ═══════════════════════════════════════════════════════════════════

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const } },
};

// ═══════════════════════════════════════════════════════════════════
//  Status helpers
// ═══════════════════════════════════════════════════════════════════

const statusVariantMap: Record<string, StatusVariant> = {
  blue: 'info',
  yellow: 'warning',
  orange: 'warning',
  purple: 'info',
  cyan: 'info',
  green: 'neutral',
  gray: 'neutral',
  red: 'warning',
};

function getStatusLabel(status: string): string {
  const statusItem = TICKET_STATUSES.find(s => s.key === status);
  return statusItem?.label || status;
}

function getStatusVariant(status: string): StatusVariant {
  const statusItem = TICKET_STATUSES.find(s => s.key === status);
  return statusVariantMap[statusItem?.color || 'gray'];
}

// ═══════════════════════════════════════════════════════════════════
//  Timeline steps for active repairs
// ═══════════════════════════════════════════════════════════════════

const TIMELINE_STEPS = [
  { key: 'Submitted', label: 'Создана' },
  { key: 'InProgress', label: 'Диагностика' },
  { key: 'PartsPending', label: 'Ремонт' },
  { key: 'ReadyForPickup', label: 'Готов' },
  { key: 'Completed', label: 'Завершён' },
] as const;

const STATUS_ORDER: string[] = TIMELINE_STEPS.map(s => s.key);
const TERMINAL_STATUSES = new Set(['Completed', 'Cancelled']);

function getCurrentStepIndex(status: string): number {
  const idx = STATUS_ORDER.indexOf(status);
  return idx >= 0 ? idx : -1;
}

/**
 * ActiveRepairTimeline — горизонтальный таймлайн для активных заявок.
 * Показывает 5 шагов: Создана → Диагностика → Ремонт → Готов → Завершён.
 * Текущий шаг выделен, пройденные — приглушены, будущие — полупрозрачны.
 */
function ActiveRepairTimeline({ status }: { status: string }) {
  const currentIdx = getCurrentStepIndex(status);
  if (currentIdx < 0) return null;

  return (
    <div className="flex items-center gap-0 px-4 md:px-6 pb-4">
      {TIMELINE_STEPS.map((step, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isActive = isCompleted || isCurrent;

        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center">
              <div
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  isActive
                    ? 'bg-gold ring-2 ring-gold/30'
                    : 'bg-muted-foreground/20'
                }`}
              />
              <span
                className={`text-[10px] mt-1 leading-tight text-center ${
                  isCurrent
                    ? 'text-foreground font-medium'
                    : isCompleted
                      ? 'text-muted-foreground/60'
                      : 'text-muted-foreground/30'
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < TIMELINE_STEPS.length - 1 && (
              <div
                className={`flex-1 h-px mx-1 self-start mt-[5px] ${
                  idx < currentIdx ? 'bg-gold/40' : 'bg-border'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}



// ═══════════════════════════════════════════════════════════════════
//  AccountRepairs — My Repairs page
// ═══════════════════════════════════════════════════════════════════

export function AccountRepairs() {
  const { getMyServices } = useServiceTickets();

  const [activeFilter, setActiveFilter] = useState('all');
  const [tickets, setTickets] = useState<ServiceRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const pageSize = 10;
  const hasMore = tickets.length < totalCount;

  useEffect(() => {
    void loadTickets();

    // Poll for updates every 30 seconds (background refresh — no spinner)
    const interval = setInterval(() => { void loadTickets(true); }, 30000);
    return () => clearInterval(interval);
  }, [activeFilter]);

  const loadTickets = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const result = await getMyServices(1, pageSize, activeFilter === 'all' ? undefined : activeFilter);
      if (result != null) {
        setTickets(result.items);
        setTotalCount(result.total);
        setPage(1);
      }
    } catch {
      // Silent fail — show empty state instead
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [activeFilter, getMyServices]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const result = await getMyServices(page + 1, pageSize, activeFilter === 'all' ? undefined : activeFilter);
      if (result != null) {
        setTickets(prev => [...prev, ...result.items]);
        setTotalCount(result.total);
        setPage(prev => prev + 1);
      }
    } catch {
      // Silent
    } finally {
      setLoadingMore(false);
    }
  }, [page, pageSize, activeFilter, getMyServices, loadingMore, hasMore]);

  const stats = {
    total: tickets.length,
    active: tickets.filter(t => !TERMINAL_STATUSES.has(t.status)).length,
    completed: tickets.filter(t => t.status === 'Completed').length,
    urgent: tickets.filter(t => t.status === 'ReadyForPickup').length,
  };

  const filterOptions = [
    { key: 'all', label: 'Все' },
    { key: 'Submitted', label: 'Новые' },
    { key: 'InProgress', label: 'Диагностика' },
    { key: 'PartsPending', label: 'В ремонте' },
    { key: 'ReadyForPickup', label: 'Готовы' },
    { key: 'Completed', label: 'Завершённые' },
  ];

  if (loading && tickets.length === 0) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw size={24} className="text-muted-foreground animate-spin" />
          <div className="text-muted-foreground text-sm">Загрузка ремонтов...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-[1280px] mx-auto px-4 py-6">
        {/* ── Header ────────────────────────────────────────────── */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-foreground">Мои ремонты</h1>
          <Link
            to="/service-request"
            className="hidden md:inline-flex items-center gap-2 bg-gold text-gold-ink px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-gold-active transition-all"
          >
            <Wrench size={18} />
            Новый запрос на ремонт
          </Link>
        </div>

        {/* ── Stats Cards ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Всего заявок" value={stats.total} icon={Wrench} />
          <StatCard label="В работе" value={stats.active} icon={Clock} />
          <StatCard label="Завершено" value={stats.completed} icon={CheckCircle} />
          <StatCard label="Требуют внимания" value={stats.urgent} icon={AlertCircle} />
        </div>

        {/* ── Filters · Mobile: horizontal scroll snap ──────────── */}
        <div className="flex gap-2 mb-6 overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden pb-1">
          {filterOptions.map(filter => (
            <button
              key={filter.key}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeFilter === filter.key
                  ? 'bg-elevated text-foreground'
                  : 'bg-card text-muted-foreground border border-border hover:text-foreground hover:border-foreground/20'
              }`}
              onClick={() => setActiveFilter(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* ── Tickets List ──────────────────────────────────────── */}
        {tickets.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <div className="flex justify-center mb-4 text-muted-foreground">
              <Wrench size={48} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              У вас пока нет заявок на ремонт
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              Вы можете отправить устройство на диагностику и ремонт
            </p>
            <Link
              to="/service-request"
              className="inline-flex items-center gap-2 bg-gold text-gold-ink px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-gold-active transition-all"
            >
              Создать заявку
            </Link>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Table header — hidden on mobile */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-border text-sm font-medium text-muted-foreground">
              <div className="col-span-2">Номер</div>
              <div className="col-span-3">Устройство</div>
              <div className="col-span-2">Статус</div>
              <div className="col-span-3">Дата создания</div>
              <div className="col-span-2 text-right">Действия</div>
            </div>

            {/* Ticket rows */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
            {tickets.map(ticket => (
              <motion.div key={ticket.id} variants={itemVariants} className="border-b border-border last:border-b-0">
                {/* Main row — grid on desktop, block on mobile */}
                <div className="block md:grid md:grid-cols-12 md:gap-4 px-4 md:px-6 py-4">
                  {/* Ticket number */}
                  <div className="flex items-center justify-between mb-3 md:mb-0 md:col-span-2">
                    <span className="text-xs text-muted-foreground md:hidden shrink-0">Номер</span>
                    <span className="text-foreground font-mono text-sm">
                      #{ticket.requestNumber}
                    </span>
                  </div>

                  {/* Device info */}
                  <div className="flex flex-col items-end mb-3 md:mb-0 md:col-span-3 md:flex-row md:items-center">
                    <span className="text-xs text-muted-foreground md:hidden self-start">Устройство</span>
                    <div className="text-right md:text-left">
                      <div className="text-foreground text-sm font-medium">{ticket.serviceTypeName}</div>
                      {ticket.deviceModel && (
                        <div className="text-muted-foreground text-xs">{ticket.deviceModel}</div>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="flex items-center justify-between mb-3 md:mb-0 md:col-span-2">
                    <span className="text-xs text-muted-foreground md:hidden shrink-0">Статус</span>
                    <StatusBadge
                      variant={getStatusVariant(ticket.status)}
                      label={getStatusLabel(ticket.status)}
                      pulse={ticket.status === 'ReadyForPickup'}
                    />
                  </div>

                  {/* Date */}
                  <div className="flex items-center justify-between mb-3 md:mb-0 md:col-span-3">
                    <span className="text-xs text-muted-foreground md:hidden shrink-0">Дата создания</span>
                    <span className="text-muted-foreground text-sm">
                      {new Date(ticket.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between md:col-span-2 md:text-right">
                    <Link
                      to={`/my-repairs/${ticket.id}`}
                      className="inline-flex items-center gap-1.5 bg-elevated border border-border text-foreground text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-gold hover:text-gold-ink hover:border-gold transition-all"
                    >
                      Подробнее
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </Link>
                  </div>
                </div>

                {/* Timeline for active repairs */}
                {!TERMINAL_STATUSES.has(ticket.status) && (
                  <ActiveRepairTimeline status={ticket.status} />
                )}
              </motion.div>
            ))}
            </motion.div>
          </div>
        )}

        {/* ── Load more ──────────────────────────────────────────── */}
        {hasMore && (
          <div className="flex items-center justify-center py-6">
            {loadingMore ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <RefreshCw size={16} className="animate-spin" />
                <span>Загрузка</span>
              </div>
            ) : (
              <button
                onClick={loadMore}
                className="px-6 py-3 rounded-lg bg-elevated text-foreground border border-border hover:border-foreground/20 transition-colors text-sm font-medium"
              >
                Загрузить ещё
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Mobile FAB ──────────────────────────────────────────── */}
      <Link
        to="/service-request"
        className="fixed bottom-6 right-6 z-50 md:hidden w-14 h-14 rounded-full bg-gold text-gold-ink flex items-center justify-center shadow-lg hover:bg-gold-active transition-all"
        aria-label="Новый запрос на ремонт"
      >
        <Plus size={24} />
      </Link>
    </div>
  );
}
