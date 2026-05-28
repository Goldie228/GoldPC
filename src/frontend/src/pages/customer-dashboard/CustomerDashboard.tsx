import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Wrench,
  Cpu,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useOrders } from '../../hooks/useOrders';
import { useServiceTickets } from '../../hooks/useServiceTickets';
import { TICKET_STATUSES } from '../../api/services';

/* ─── Order status helpers ─── */

function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    New: 'Новый',
    Processing: 'В обработке',
    Paid: 'Оплачен',
    InProgress: 'В пути',
    Ready: 'Готов к получению',
    Completed: 'Доставлен',
    Cancelled: 'Отменён',
  };
  return labels[status] || status;
}

function getOrderStatusBadgeClass(status: string): string {
  const classes: Record<string, string> = {
    New: 'bg-muted/10 text-muted-foreground',
    Processing: 'bg-info-blue/10 text-info-blue',
    Paid: 'bg-info-blue/10 text-info-blue',
    InProgress: 'bg-warning/15 text-warning',
    Ready: 'bg-[#2dbdb6]/10 text-[#2dbdb6]',
    Completed: 'bg-muted/10 text-muted-foreground',
    Cancelled: 'bg-destructive/10 text-destructive',
  };
  return classes[status] || 'bg-muted/10 text-muted-foreground';
}

/* ─── Ticket status helpers ─── */

const TICKET_COLOR_MAP: Record<string, string> = {
  blue: 'bg-info-blue/10 text-info-blue',
  yellow: 'bg-warning/15 text-warning',
  orange: 'bg-destructive/10 text-destructive',
  purple: 'bg-purple-500/15 text-purple-500',
  cyan: 'bg-[#2dbdb6]/10 text-[#2dbdb6]',
  green: 'bg-muted/10 text-muted-foreground',
  gray: 'bg-muted/10 text-muted-foreground',
  red: 'bg-destructive/10 text-destructive',
};

function getTicketStatusInfo(status: string): { label: string; badgeClass: string } {
  const item = TICKET_STATUSES.find((s) => s.key === status);
  const color = item?.color || 'gray';
  return {
    label: item?.label || status,
    badgeClass: TICKET_COLOR_MAP[color] || 'bg-muted/10 text-muted-foreground',
  };
}

/* ─── Quick actions data ─── */

const quickActions = [
  { to: '/account/orders', icon: Package, label: 'Отследить заказ' },
  { to: '/service-request', icon: Wrench, label: 'Новый запрос на ремонт' },
  { to: '/pc-builder', icon: Cpu, label: 'Конструктор ПК' },
  { to: '/account/warranty', icon: ShieldCheck, label: 'Моя гарантия' },
] as const;

/* ─── Skeleton row ─── */

function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 py-3.5 border-b border-border last:border-b-0"
        >
          <div className="h-3 bg-elevated rounded w-16 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-elevated rounded w-3/5 animate-pulse" />
            <div className="h-2.5 bg-elevated rounded w-2/5 animate-pulse" />
          </div>
        </div>
      ))}
    </>
  );
}

/* ─── Component ─── */

export function CustomerDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const {
    orders,
    totalCount,
    loading: ordersLoading,
    error: ordersError,
    getMyOrders,
  } = useOrders();
  const {
    tickets,
    total: ticketsTotal,
    loading: ticketsLoading,
    error: ticketsError,
    getMyTickets,
  } = useServiceTickets();

  const [initialLoading, setInitialLoading] = useState(true);

  /* ── Load data on mount (only if authenticated) ── */
  useEffect(() => {
    if (!isAuthenticated) {
      setInitialLoading(false);
      return;
    }
    Promise.allSettled([getMyOrders(1, 5), getMyTickets(1, 5)]).finally(() =>
      setInitialLoading(false)
    );
  }, [getMyOrders, getMyTickets, isAuthenticated]);

  /* ── Silent fail - show empty state instead of error ── */

  const isLoading = initialLoading;
  const userName = user?.firstName || 'Пользователь';

  /* ── Guest welcome with login prompt ── */
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[1280px] mx-auto px-6 py-16 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Добро пожаловать в GoldPC!
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Войдите в аккаунт, чтобы управлять заказами, отслеживать ремонты
            и получать доступ ко всем сервисам.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-gold text-gold-ink px-6 py-3 rounded-lg font-semibold hover:bg-gold-active transition-all"
            >
              Войти
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 border border-border text-foreground px-6 py-3 rounded-lg font-semibold hover:bg-card transition-all"
            >
              Зарегистрироваться
            </Link>
          </div>
          {/* Quick actions for everyone */}
          <div className="mt-16">
            <h2 className="text-lg font-semibold text-foreground mb-4">Каталог</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="group flex items-center gap-4 p-5 bg-card border border-border rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:bg-elevated"
                  >
                    <div className="w-12 h-12 rounded-xl bg-elevated text-muted-foreground flex items-center justify-center flex-shrink-0">
                      <Icon size={22} />
                    </div>
                    <span className="flex-1 text-sm font-semibold text-foreground leading-tight">
                      {action.label}
                    </span>
                    <ChevronRight
                      size={18}
                      className="text-muted-foreground flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1280px] mx-auto px-6 py-8">
        {/* ════════════════════════════════════
            WELCOME HERO WITH STATS
           ════════════════════════════════════ */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            Добро пожаловать, {userName}!
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-[560px]">
            Здесь вы можете управлять заказами, отслеживать ремонты
            и получать доступ ко всем сервисам GoldPC.
          </p>

{/* Stats row */}
           <div className="grid grid-cols-3 gap-6 mt-6">
             <div className="bg-card rounded-xl border border-border p-5">
               <div className="text-3xl font-bold text-foreground font-tabular">
                 {isLoading ? '...' : totalCount}
               </div>
               <div className="text-sm text-muted-foreground mt-1">Заказов</div>
             </div>
             <div className="bg-card rounded-xl border border-border p-5">
               <div className="text-3xl font-bold text-foreground font-tabular">
                 {isLoading ? '...' : ticketsTotal}
               </div>
               <div className="text-sm text-muted-foreground mt-1">Ремонтов</div>
             </div>
             <div className="bg-card rounded-xl border border-border p-5">
               <div className="text-3xl font-bold text-foreground">
                 <Cpu size={24} />
               </div>
               <div className="text-sm text-muted-foreground mt-1">Сборки ПК</div>
             </div>
           </div>
        </div>

        {/* ════════════════════════════════════
            QUICK ACTIONS
           ════════════════════════════════════ */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Быстрые действия
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.to}
                  to={action.to}
                  className="group flex items-center gap-4 p-5 bg-card border border-border rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:bg-elevated"
                >
                  <div className="w-12 h-12 rounded-xl bg-elevated text-muted-foreground flex items-center justify-center flex-shrink-0">
                    <Icon size={22} />
                  </div>
                  <span className="flex-1 text-sm font-semibold text-foreground leading-tight">
                    {action.label}
                  </span>
                  <ChevronRight
                    size={18}
                    className="text-muted-foreground flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </Link>
              );
            })}
          </div>
        </div>

        {/* ════════════════════════════════════
            ORDERS + REPAIRS ROW
           ════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* ── Recent Orders ── */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-foreground">
                Последние заказы
              </h2>
              <Link
                to="/account/orders"
                className="flex items-center gap-1 text-sm text-info-blue hover:opacity-80 transition-opacity"
              >
                Все заказы
                <ChevronRight size={16} />
              </Link>
            </div>

            {/* Loading skeleton */}
            {isLoading && (
              <div className="divide-y divide-border">
                <SkeletonRows count={3} />
              </div>
            )}

            {/* Empty state - show when no orders or error (to avoid showing error to users) */}
            {!isLoading && (orders === null || orders.length === 0) && (
              <div className="text-sm text-muted-foreground py-6 text-center">
                У вас пока нет заказов.
              </div>
            )}

            {/* Data table */}
            {!isLoading && orders !== null && orders.length > 0 && (
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="text-left pb-3 pr-2 font-medium whitespace-nowrap">
                      Заказ
                    </th>
                    <th className="text-left pb-3 pr-2 font-medium whitespace-nowrap">
                      Товары
                    </th>
                    <th className="text-left pb-3 pr-2 font-medium whitespace-nowrap">
                      Дата
                    </th>
                    <th className="text-right pb-3 pl-2 font-medium whitespace-nowrap">
                      Сумма
                    </th>
                    <th className="text-right pb-3 pl-2 font-medium whitespace-nowrap">
                      Статус
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order.id}>
                      <td className="py-3 pr-2 text-sm text-foreground whitespace-nowrap">
                        #{order.orderNumber}
                      </td>
                      <td className="py-3 pr-2 text-sm text-foreground truncate max-w-[120px]">
                        {order.items[0]?.productName}
                        {order.items.length > 1 && (
                          <span className="text-muted-foreground ml-1">
                            +{order.items.length - 1}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-2 text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="py-3 pl-2 text-sm text-foreground text-right whitespace-nowrap">
                        {order.total.toFixed(2)} BYN
                      </td>
                      <td className="py-3 pl-2 text-right whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${getOrderStatusBadgeClass(order.status)}`}
                        >
                          {getOrderStatusLabel(order.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {!isLoading && orders !== null && orders.length > 0 && (
              <div className="mt-4 text-[10px] text-muted-foreground">
                Статусы обновляются в реальном времени
              </div>
            )}
          </div>

          {/* ── Active Repairs ── */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-foreground">
                Активные ремонты
              </h2>
              <Link
                to="/account/repairs"
                className="flex items-center gap-1 text-sm text-info-blue hover:opacity-80 transition-opacity"
              >
                Все запросы
                <ChevronRight size={16} />
              </Link>
            </div>

            {/* Loading skeleton */}
            {isLoading && (
              <div className="divide-y divide-border">
                <SkeletonRows count={3} />
              </div>
            )}

            {/* Empty state - show when no tickets or error */}
            {!isLoading && tickets.length === 0 && (
              <div className="text-sm text-muted-foreground py-6 text-center">
                У вас пока нет запросов на ремонт.
              </div>
            )}

            {/* Data table */}
            {tickets.length > 0 && (
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="text-left pb-3 pr-2 font-medium whitespace-nowrap">
                      Номер
                    </th>
                    <th className="text-left pb-3 pr-2 font-medium whitespace-nowrap">
                      Устройство
                    </th>
                    <th className="text-left pb-3 pr-2 font-medium whitespace-nowrap">
                      Статус
                    </th>
                    <th className="text-right pb-3 pl-2 font-medium whitespace-nowrap">
                      Дата
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tickets.slice(0, 5).map((ticket) => {
                    const { label, badgeClass } = getTicketStatusInfo(ticket.status);
                    return (
                      <tr key={ticket.id}>
                        <td className="py-3 pr-2 text-sm text-foreground whitespace-nowrap">
                          #{ticket.ticketNumber}
                        </td>
                        <td className="py-3 pr-2 text-sm text-foreground truncate max-w-[140px]">
                          <span className="block leading-tight">{ticket.deviceType}</span>
                          <span className="block text-muted-foreground text-xs">
                            {ticket.brand} {ticket.model}
                          </span>
                        </td>
                        <td className="py-3 pr-2 whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${badgeClass}`}
                          >
                            {label}
                          </span>
                        </td>
                        <td className="py-3 pl-2 text-sm text-muted-foreground text-right whitespace-nowrap">
                          {new Date(ticket.createdAt).toLocaleDateString('ru-RU')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {tickets.length > 0 && (
              <div className="mt-4 text-[10px] text-muted-foreground">
                Статусы обновляются в реальном времени
              </div>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════
            SAVED BUILDS (placeholder)
           ════════════════════════════════════ */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Сохранённые сборки
          </h2>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-xl bg-elevated text-muted-foreground flex items-center justify-center mb-4">
              <Cpu size={32} />
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              После интеграции с API здесь появятся ваши сохранённые
              конфигурации ПК
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
