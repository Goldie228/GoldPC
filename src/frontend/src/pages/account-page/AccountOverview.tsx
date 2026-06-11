import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package,
  Wrench,
  Cpu,
  ShieldCheck,
  ChevronRight,
  Heart,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useOrders } from '@/hooks/useOrders';
import { useServiceTickets } from '@/hooks/useServiceTickets';
import { TICKET_STATUSES } from '@/api/services';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import type { StatusVariant } from '@/components/ui/StatusBadge';
import type { Order } from '@/api/orders';
import type { ServiceRequestDto } from '@/api/services';

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
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const } },
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

function PcIllustration() {
  return (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-48 h-36 md:w-64 md:h-48"
      aria-hidden="true"
    >
      {/* Monitor */}
      <rect x="50" y="10" width="140" height="95" rx="8" fill="#1e2329" stroke="#2b3139" strokeWidth="2" />
      <rect x="58" y="18" width="124" height="74" rx="4" fill="#0b0e11" />
      {/* Screen glow */}
      <rect x="58" y="18" width="124" height="74" rx="4" fill="url(#screenGlow)" opacity="0.4" />
      {/* Stand */}
      <rect x="105" y="105" width="30" height="12" rx="2" fill="#2b3139" />
      <rect x="95" y="117" width="50" height="6" rx="3" fill="#2b3139" />
      {/* CPU chip */}
      <rect x="80" y="36" width="36" height="36" rx="4" fill="#2b3139" stroke="#FCD535" strokeWidth="1" opacity="0.7" />
      <rect x="88" y="44" width="20" height="20" rx="2" fill="#FCD535" opacity="0.15" />
      {/* Chip pins */}
      <rect x="76" y="42" width="4" height="3" rx="1" fill="#FCD535" opacity="0.4" />
      <rect x="76" y="50" width="4" height="3" rx="1" fill="#FCD535" opacity="0.4" />
      <rect x="76" y="58" width="4" height="3" rx="1" fill="#FCD535" opacity="0.4" />
      <rect x="116" y="42" width="4" height="3" rx="1" fill="#FCD535" opacity="0.4" />
      <rect x="116" y="50" width="4" height="3" rx="1" fill="#FCD535" opacity="0.4" />
      <rect x="116" y="58" width="4" height="3" rx="1" fill="#FCD535" opacity="0.4" />
      {/* RAM sticks */}
      <rect x="130" y="40" width="6" height="28" rx="2" fill="#3b82f6" opacity="0.5" />
      <rect x="140" y="40" width="6" height="28" rx="2" fill="#3b82f6" opacity="0.35" />
      <rect x="150" y="40" width="6" height="28" rx="2" fill="#3b82f6" opacity="0.25" />
      {/* Floating particles */}
      <circle cx="42" cy="30" r="2" fill="#FCD535" opacity="0.5" />
      <circle cx="200" cy="50" r="1.5" fill="#FCD535" opacity="0.4" />
      <circle cx="35" cy="70" r="1" fill="#3b82f6" opacity="0.3" />
      <circle cx="210" cy="25" r="1.5" fill="#2dbdb6" opacity="0.3" />
      <defs>
        <linearGradient id="screenGlow" x1="58" y1="18" x2="182" y2="92" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FCD535" stopOpacity="0.1" />
          <stop offset="0.5" stopColor="#3b82f6" stopOpacity="0.05" />
          <stop offset="1" stopColor="#FCD535" stopOpacity="0.08" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function GuestWelcome() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1280px] mx-auto px-6 py-16 md:py-24">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="text-center"
        >
          {/* Hero illustration */}
          <motion.div variants={fadeInUp} className="flex justify-center mb-8">
            <PcIllustration />
          </motion.div>

          {/* Hero text */}
          <motion.h1
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-bold text-foreground mb-4"
          >
            Добро пожаловать в{' '}
            <span className="text-gold">GoldPC</span>
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            className="text-muted-foreground max-w-lg mx-auto mb-10 text-base md:text-lg leading-relaxed"
          >
            Управляйте заказами, отслеживайте ремонты и собирайте идеальный
            ПК с нашим конструктором.
          </motion.p>

          {/* CTA buttons */}
          <motion.div variants={fadeInUp} className="flex justify-center gap-4 mb-20">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-gold text-gold-ink px-7 py-3.5 rounded-lg font-semibold hover:bg-gold-active transition-all duration-200 hover:shadow-[0_0_24px_rgba(252,213,53,0.25)]"
            >
              Войти в аккаунт
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 border border-border text-foreground px-7 py-3.5 rounded-lg font-semibold hover:bg-card transition-all duration-200"
            >
              Зарегистрироваться
            </Link>
          </motion.div>

          {/* Quick actions for guests */}
          <motion.div variants={fadeInUp}>
            <h2 className="text-lg font-semibold text-foreground mb-5">
              Уже можете начать
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="group flex items-center gap-4 p-5 bg-card border border-border rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:bg-elevated hover:border-border/60"
                  >
                    <div className="w-12 h-12 rounded-xl bg-elevated text-muted-foreground flex items-center justify-center flex-shrink-0 transition-colors duration-200 group-hover:text-gold">
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
          </motion.div>
        </motion.div>
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
 * - Гостевой режим с иллюстрацией и login/register
 * - Welcome hero с gradient glow
 * - Stats grid (заказы, ремонты, сборки, избранное)
 * - Быстрые действия
 * - Последние заказы
 * - Активные ремонты
 * - Сохранённые сборки с CTA
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
    loading: ticketsLoading,
    getMyServices,
  } = useServiceTickets();
  const [tickets, setTickets] = useState<ServiceRequestDto[]>([]);
  const [ticketsTotal, setTicketsTotal] = useState(0);

  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setInitialLoading(false);
      return;
    }
    Promise.allSettled([
      getMyOrders(1, 5),
      getMyServices(1, 5).then(result => {
        if (result) {
          setTickets(result.items);
          setTicketsTotal(result.total);
        }
      }),
    ]).finally(() => setInitialLoading(false));
  }, [getMyOrders, getMyServices, isAuthenticated]);

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
            WELCOME HERO — gradient glow border
           ════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative rounded-xl p-[1px] mb-6 overflow-hidden"
        >
          {/* Gradient border layer */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-gold/20 via-gold/5 to-info-blue/10" />
          {/* Glow accent */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-gold/8 rounded-full blur-3xl pointer-events-none" />
          {/* Content */}
          <div className="relative bg-card rounded-xl p-6">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.35 }}
                className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center shrink-0"
              >
                <Sparkles size={24} className="text-gold" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Привет, {userName}!
                </h1>
                <p className="text-muted-foreground mt-1">
                  Управляйте заказами, отслеживайте ремонты, собирайте ПК
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ════════════════════════════════════
            STATS GRID — 4 mini-cards
           ════════════════════════════════════ */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex md:grid md:grid-cols-4 gap-4 overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden md:overflow-visible pb-2 md:pb-0 mb-6"
        >
          <motion.div variants={itemVariants} className="snap-start shrink-0 w-[72vw] md:w-auto">
            <StatCard
              label="Заказов"
              value={isLoading ? '...' : totalCount}
              icon={Package}
            />
          </motion.div>
          <motion.div variants={itemVariants} className="snap-start shrink-0 w-[72vw] md:w-auto">
            <StatCard
              label="Ремонтов"
              value={isLoading ? '...' : ticketsTotal}
              icon={Wrench}
            />
          </motion.div>
          <motion.div variants={itemVariants} className="snap-start shrink-0 w-[72vw] md:w-auto">
            <StatCard
              label="Сборки ПК"
              value="—"
              icon={Cpu}
            />
          </motion.div>
          <motion.div variants={itemVariants} className="snap-start shrink-0 w-[72vw] md:w-auto">
            <StatCard
              label="Избранное"
              value="—"
              icon={Heart}
            />
          </motion.div>
        </motion.div>

        {/* ════════════════════════════════════
            QUICK ACTIONS
           ════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          className="mb-6"
        >
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
                  className="group flex items-center gap-4 p-5 bg-card border border-border rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:bg-elevated hover:border-border/60"
                >
                  <div className="w-12 h-12 rounded-xl bg-elevated text-muted-foreground flex items-center justify-center flex-shrink-0 transition-colors duration-200 group-hover:text-gold">
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
        </motion.section>

        {/* ════════════════════════════════════
            ORDERS + REPAIRS
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
                    {tickets.slice(0, 5).map((ticket: ServiceRequestDto) => {
                      const { label, variant } = getTicketStatusInfo(ticket.status);
                      return (
                        <tr key={ticket.id}>
                          <td className="py-3 pr-2 text-sm text-foreground whitespace-nowrap">
                            #{ticket.requestNumber}
                          </td>
                          <td className="py-3 pr-2 text-sm text-foreground truncate max-w-[140px]">
                            <span className="block leading-tight">{ticket.serviceTypeName}</span>
                            {ticket.deviceModel && (
                              <span className="block text-muted-foreground text-xs">
                                {ticket.deviceModel}
                              </span>
                            )}
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
              SAVED BUILDS — with CTA
             ════════════════════════════════════ */}
          <motion.div variants={itemVariants}>
            <section className="bg-card rounded-xl border border-border p-6 mb-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-foreground">
                  Сохранённые сборки
                </h2>
                <Link
                  to="/pc-builder"
                  className="flex items-center gap-1 text-sm text-info-blue hover:opacity-80 transition-opacity"
                >
                  Конструктор
                  <ChevronRight size={16} />
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-5 py-8 text-center sm:text-left">
                <div className="w-16 h-16 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                  <Cpu size={32} className="text-gold" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground font-medium mb-1">
                    Пока нет сохранённых сборок
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Создайте конфигурацию в конструкторе и сохраните её для повторного использования
                  </p>
                  <Link
                    to="/pc-builder"
                    className="inline-flex items-center gap-2 bg-gold text-gold-ink px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gold-active transition-all duration-200 hover:shadow-[0_0_20px_rgba(252,213,53,0.2)]"
                  >
                    <Cpu size={16} />
                    Собрать ПК
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </section>
          </motion.div>
        </motion.div>{/* end sections container */}

      </div>
    </div>
  );
}
