import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatCard } from '../../components/ui/StatCard';
import type { StatusVariant } from '../../components/ui/StatusBadge';
import type { Order } from '../../api/orders';
import type { ServiceTicket } from '../../api/services';

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

function getOrderStatusVariant(status: string): StatusVariant {
  const variants: Record<string, StatusVariant> = {
    New: 'neutral',
    Processing: 'info',
    Paid: 'info',
    InProgress: 'warning',
    Ready: 'info',
    Completed: 'neutral',
    Cancelled: 'neutral',
  };
  return variants[status] || 'neutral';
}

/* ─── Ticket status helpers ─── */

function getTicketStatusInfo(status: string): { label: string; variant: StatusVariant } {
  const item = TICKET_STATUSES.find((s) => s.key === status);
  const label = item?.label || status;
  const colorMap: Record<string, StatusVariant> = {
    blue: 'info',
    yellow: 'warning',
    orange: 'warning',
    purple: 'info',
    cyan: 'info',
    green: 'neutral',
    gray: 'neutral',
    red: 'warning',
  };
  const variant = colorMap[item?.color || 'gray'] || 'neutral';
  return { label, variant };
}

/* ─── Quick actions ─── */

const quickActions = [
  { to: '/account/orders', icon: Package, label: 'Отследить заказ' },
  { to: '/service-request', icon: Wrench, label: 'Новый запрос на ремонт' },
  { to: '/pc-builder', icon: Cpu, label: 'Конструктор ПК' },
  { to: '/account/warranty', icon: ShieldCheck, label: 'Моя гарантия' },
] as const;

/* ─── Stagger entrance animation ─── */

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

/* ─── Skeleton ─── */

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

/* ─── Guest view ─── */

function GuestWelcome() {
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
        {/* Quick actions for guests */}
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

/* ─── Main component ─── */

/**
 * AccountOverview — объединённый dashboard личного кабинета.
 * Заменяет CustomerDashboard + старый AccountOverview.
 *
 * Фичи:
 * - Гостевой режим с login/register
 * - Welcome hero с приветствием
 * - Stats grid (заказы, ремонты, сборки)
 * - Быстрые действия
 * - Последние заказы
 * - Активные ремонты
 * - Сохранённые сборки (placeholder)
 */
export function AccountOverview() {
  const { user, isAuthenticated } = useAuthStore();
  const {
    orders,
    totalCount,
    loading: ordersLoading,
    getMyOrders,
  } = useOrders();
  const {
    tickets,
    total: ticketsTotal,
    loading: ticketsLoading,
    getMyTickets,
  } = useServiceTickets();

  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setInitialLoading(false);
      return;
    }
    Promise.allSettled([getMyOrders(1, 5), getMyTickets(1, 5)]).finally(() =>
      setInitialLoading(false)
    );
  }, [getMyOrders, getMyTickets, isAuthenticated]);

  const isLoading = initialLoading;
  const userName = user?.firstName || 'Пользователь';

  /* ── Guest → показываем страницу приветствия ── */
  if (!isAuthenticated) {
    return <GuestWelcome />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1280px] mx-auto">
        {/* ════════════════════════════════════
            WELCOME HERO
           ════════════════════════════════════ */}
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Добро пожаловать, {userName}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Управляйте заказами, отслеживайте ремонты, собирайте ПК
          </p>
        </div>

        {/* ════════════════════════════════════
            STATS GRID
           ════════════════════════════════════ */}
        {/* Mobile: horizontal scroll snap · Desktop: grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex md:grid md:grid-cols-4 gap-4 overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden md:overflow-visible pb-2 md:pb-0 mb-6"
        >
          <motion.div variants={itemVariants} className="snap-start shrink-0 w-[75vw] md:w-auto">
            <StatCard
              label="Заказов"
              value={isLoading ? '...' : totalCount}
              icon={Package}
            />
          </motion.div>
          <motion.div variants={itemVariants} className="snap-start shrink-0 w-[75vw] md:w-auto">
            <StatCard
              label="Ремонтов"
              value={isLoading ? '...' : ticketsTotal}
              icon={Wrench}
            />
          </motion.div>
          <motion.div variants={itemVariants} className="snap-start shrink-0 w-[75vw] md:w-auto">
            <StatCard
              label="Сборки ПК"
              value="—"
              icon={Cpu}
            />
          </motion.div>
        </motion.div>

        {/* ════════════════════════════════════
            QUICK ACTIONS
           ════════════════════════════════════ */}
        <section className="mb-6">
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
        </section>

        {/* ════════════════════════════════════
            ORDERS + REPAIRS + SAVED BUILDS
           ════════════════════════════════════ */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* ── Recent Orders ── */}
          <section className="bg-card rounded-xl border border-border p-6">
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

            {isLoading && (
              <div className="divide-y divide-border">
                <SkeletonRows count={3} />
              </div>
            )}

            {!isLoading && (orders === null || orders.length === 0) && (
              <div className="text-sm text-muted-foreground py-6 text-center">
                У вас пока нет заказов.
              </div>
            )}

            {!isLoading && orders !== null && orders.length > 0 && (
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="text-left pb-3 pr-2 font-medium whitespace-nowrap">Заказ</th>
                    <th className="text-left pb-3 pr-2 font-medium whitespace-nowrap">Товары</th>
                    <th className="text-left pb-3 pr-2 font-medium whitespace-nowrap">Дата</th>
                    <th className="text-right pb-3 pl-2 font-medium whitespace-nowrap">Сумма</th>
                    <th className="text-right pb-3 pl-2 font-medium whitespace-nowrap">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.slice(0, 5).map((order: Order) => (
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
                        <StatusBadge
                          variant={getOrderStatusVariant(order.status)}
                          label={getOrderStatusLabel(order.status)}
                        />
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
          </section>

          {/* ── Active Repairs ── */}
          <section className="bg-card rounded-xl border border-border p-6">
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

            {isLoading && (
              <div className="divide-y divide-border">
                <SkeletonRows count={3} />
              </div>
            )}

            {!isLoading && tickets.length === 0 && (
              <div className="text-sm text-muted-foreground py-6 text-center">
                У вас пока нет запросов на ремонт.
              </div>
            )}

            {tickets.length > 0 && (
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="text-left pb-3 pr-2 font-medium whitespace-nowrap">Номер</th>
                    <th className="text-left pb-3 pr-2 font-medium whitespace-nowrap">Устройство</th>
                    <th className="text-left pb-3 pr-2 font-medium whitespace-nowrap">Статус</th>
                    <th className="text-right pb-3 pl-2 font-medium whitespace-nowrap">Дата</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tickets.slice(0, 5).map((ticket: ServiceTicket) => {
                    const { label, variant } = getTicketStatusInfo(ticket.status);
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
                          <StatusBadge variant={variant} label={label} />
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
          </section>
        </motion.div>{/* end grid */}

        {/* ════════════════════════════════════
            SAVED BUILDS (placeholder)
           ════════════════════════════════════ */}
        <motion.div variants={itemVariants}>
          <section className="bg-card rounded-xl border border-border p-6 mb-6">
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
          </section>
        </motion.div>
        </motion.div>{/* end sections container */}

      </div>
    </div>
  );
}
