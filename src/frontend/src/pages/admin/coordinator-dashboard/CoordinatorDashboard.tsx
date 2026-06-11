import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { statsApi } from '@/api/admin';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  DollarSign,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertTriangle,
  Package,
  Eye,
  Star,
  UserPlus,
  ArrowRight,
  Calendar,
  BarChart3,
  Zap,
  Activity,
} from 'lucide-react';

// ===== Types =====

type Period = 'today' | 'week' | 'month' | 'year';

// ===== Helpers =====

function formatCurrency(value: number): string {
  return `${value.toLocaleString('ru-BY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} BYN`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ===== Sparkline SVG =====

function Sparkline({
  data,
  color = 'var(--color-gold)',
  width = 80,
  height = 32,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data
    .map((v, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((v - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-grad-${color.replace(/[^a-z0-9]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#spark-grad-${color.replace(/[^a-z0-9]/gi, '')})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ===== Mini Chart (bar chart for orders/revenue) =====

function MiniBarChart({
  data,
  color = 'var(--color-gold)',
  height = 120,
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => {
        const barHeight = (d.value / max) * (height - 20);
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <motion.div
              className="w-full rounded-t-sm min-h-[2px]"
              style={{ backgroundColor: color }}
              initial={{ height: 0 }}
              animate={{ height: barHeight }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: 'easeOut' }}
            />
            <span className="text-[10px] text-muted-text truncate w-full text-center">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ===== Animated Counter =====

function AnimatedNumber({ value, prefix = '', suffix = '' }: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <span className="font-tabular">
      {prefix}
      {value.toLocaleString('ru-BY')}
      {suffix}
    </span>
  );
}

// ===== Skeleton =====

function StatSkeleton() {
  return (
    <div className="bg-surface-card rounded-xl p-6 animate-pulse border border-hairline-dark">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface-elevated" />
          <div className="h-3 w-24 bg-surface-elevated rounded" />
        </div>
        <div className="h-4 w-16 bg-surface-elevated rounded" />
      </div>
      <div className="h-8 w-32 bg-surface-elevated rounded mb-2" />
      <div className="h-4 w-20 bg-surface-elevated rounded" />
    </div>
  );
}

// ===== Change Indicator =====

function ChangeIndicator({ change }: { change: number }) {
  if (change === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-muted-text">
        0%
      </span>
    );
  }

  const isPositive = change > 0;
  return (
    <motion.span
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      className={`inline-flex items-center gap-1 text-sm font-medium ${
        isPositive ? 'text-price-drop' : 'text-price-rise'
      }`}
    >
      {isPositive ? (
        <TrendingUp className="w-3.5 h-3.5" />
      ) : (
        <TrendingDown className="w-3.5 h-3.5" />
      )}
      {isPositive ? '+' : ''}
      {change}%
    </motion.span>
  );
}

// ===== Period Selector =====

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Сегодня' },
  { key: 'week', label: 'Неделя' },
  { key: 'month', label: 'Месяц' },
  { key: 'year', label: 'Год' },
];

function PeriodSelector({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  return (
    <div className="flex items-center gap-1 bg-surface-card rounded-lg p-1 border border-hairline-dark">
      {PERIODS.map((p) => (
        <button
          key={p.key}
          onClick={() => onChange(p.key)}
          className={`relative px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
            value === p.key
              ? 'text-gold-ink'
              : 'text-muted-text hover:text-body-text'
          }`}
        >
          {value === p.key && (
            <motion.div
              layoutId="period-bg"
              className="absolute inset-0 bg-gold rounded-md"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative z-10">{p.label}</span>
        </button>
      ))}
    </div>
  );
}

// ===== Icon Map (маппинг строковых имён иконок на React-компоненты) =====

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingCart,
  UserPlus,
  Star,
  Package,
  TrendingUp,
  Activity,
  DollarSign,
  AlertTriangle,
  Users,
  Zap,
};

// ===== Stat Card =====

function StatCard({
  icon,
  title,
  value,
  change,
  sparkData,
  sparkColor,
  index,
}: {
  icon: React.ReactNode;
  title: string;
  value: React.ReactNode;
  change?: number;
  sparkData: number[];
  sparkColor: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="bg-surface-card rounded-xl p-5 border border-hairline-dark hover:border-gold/20 transition-colors duration-200 group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center text-gold group-hover:bg-gold/15 transition-colors duration-200">
            {icon}
          </div>
          <span className="text-muted-text text-xs font-medium uppercase tracking-wider">
            {title}
          </span>
        </div>
        {sparkData.length > 0 && (
          <div className="opacity-60 group-hover:opacity-100 transition-opacity duration-200">
            <Sparkline data={sparkData} color={sparkColor} width={64} height={24} />
          </div>
        )}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xl font-bold text-body-text mb-1 font-tabular">
            {value}
          </div>
          {change !== undefined && <ChangeIndicator change={change} />}
        </div>
      </div>
    </motion.div>
  );
}

// ===== Stats Grid =====

function StatsGrid({ period }: { period: Period }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => statsApi.getStats(),
    staleTime: 30000,
  });

  // Получаем спарклайны из API
  const { data: sparklinesData } = useQuery({
    queryKey: ['adminSparklines', period],
    queryFn: () => statsApi.getSparklines(period),
    staleTime: 30000,
  });

  // Преобразуем спарклайны API в массив массивов для карточек
  const sparklines = useMemo(() => {
    if (sparklinesData) {
      return [
        sparklinesData.users,
        sparklinesData.orders,
        sparklinesData.revenue,
      ];
    }
    return [[], [], []];
  }, [sparklinesData]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-surface-card rounded-xl p-8 text-center border border-hairline-dark">
        <AlertTriangle className="w-10 h-10 text-price-rise mx-auto mb-3" />
        <p className="text-body-text text-sm mb-4">
          Не удалось загрузить статистику
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 bg-surface-elevated text-body-text hover:bg-surface-card rounded-md px-4 py-2 text-sm font-semibold border border-hairline-dark transition-colors duration-200"
        >
          <RefreshCw className="w-4 h-4" />
          Повторить
        </button>
      </div>
    );
  }

  const { stats, lastUpdated } = data;

  const cards = [
    {
      icon: <Users className="w-4.5 h-4.5" />,
      title: 'Пользователи',
      value: <AnimatedNumber value={stats.totalUsers} />,
      change: stats.usersChange,
      sparkData: sparklines[0],
      sparkColor: 'var(--color-gold)',
    },
    {
      icon: <ShoppingCart className="w-4.5 h-4.5" />,
      title: 'Заказы',
      value: <AnimatedNumber value={stats.totalOrders} />,
      change: stats.ordersChange,
      sparkData: sparklines[1],
      sparkColor: 'var(--color-info-blue)',
    },
    {
      icon: <DollarSign className="w-4.5 h-4.5" />,
      title: 'Выручка',
      value: formatCurrency(stats.revenue),
      change: stats.revenueChange,
      sparkData: sparklines[2],
      sparkColor: 'var(--color-price-drop)',
    },
    {
      icon: <Clock className="w-4.5 h-4.5" />,
      title: 'Обновлено',
      value: (
        <span className="text-sm font-normal text-muted-text">
          {formatDate(lastUpdated)}
        </span>
      ),
      change: undefined,
      sparkData: [],
      sparkColor: 'var(--color-muted-text)',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <StatCard key={card.title} {...card} index={i} />
      ))}
    </div>
  );
}

// ===== Activity Feed =====

function ActivityFeed() {
  // Получаем ленту активности из API
  const { data: activityData, isLoading, error } = useQuery({
    queryKey: ['adminActivity'],
    queryFn: () => statsApi.getActivity(),
    staleTime: 60000,
  });

  const activities = useMemo(() => {
    if (activityData?.items) {
      return activityData.items.map((item) => ({
        ...item,
        // Преобразуем строковую иконку в React-компонент
        icon: (() => {
          const IconComponent = ICON_MAP[item.icon];
          return IconComponent ? <IconComponent className="w-4 h-4" /> : <Activity className="w-4 h-4" />;
        })(),
      }));
    }
    return [];
  }, [activityData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
      className="bg-surface-card rounded-xl border border-hairline-dark overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-hairline-dark">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-gold" />
          <h3 className="text-sm font-semibold text-body-text">
            Последние действия
          </h3>
        </div>
        <span className="text-xs text-muted-text">
          {isLoading ? '...' : `${activities.length} событий`}
        </span>
      </div>
      <div className="divide-y divide-hairline-dark">
        {isLoading ? (
          // Скелетон загрузки
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-5 py-3 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 rounded bg-surface-elevated" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-surface-elevated rounded w-3/4" />
                  <div className="h-2 bg-surface-elevated rounded w-1/4" />
                </div>
              </div>
            </div>
          ))
        ) : error ? (
          <div className="px-5 py-6 text-center">
            <AlertTriangle className="w-6 h-6 text-price-rise mx-auto mb-2" />
            <p className="text-xs text-muted-text">Не удалось загрузить активность</p>
          </div>
        ) : (
          <AnimatePresence>
            {activities.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + i * 0.05 }}
                className="flex items-start gap-3 px-5 py-3 hover:bg-surface-elevated/50 transition-colors duration-150"
              >
                <div className={`mt-0.5 ${item.color}`}>{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-body-text leading-snug">
                    {item.text}
                  </p>
                  <p className="text-xs text-muted-text mt-0.5">{item.time}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}

// ===== Charts Section =====

function ChartsSection({ period }: { period: Period }) {
  // Получаем данные графиков из API
  const { data: chartData, isLoading, error } = useQuery({
    queryKey: ['adminCharts', period],
    queryFn: () => statsApi.getCharts(period),
    staleTime: 30000,
  });

  // Преобразуем данные API в формат для MiniBarChart
  const ordersData = useMemo(() => {
    if (chartData?.orders) {
      return chartData.orders.map((point) => ({
        label: point.label,
        value: Number(point.value),
      }));
    }
    return [];
  }, [chartData]);

  const revenueData = useMemo(() => {
    if (chartData?.revenue) {
      return chartData.revenue.map((point) => ({
        label: point.label,
        value: Number(point.value),
      }));
    }
    return [];
  }, [chartData]);

  const totalOrders = useMemo(() => ordersData.reduce((s, d) => s + d.value, 0), [ordersData]);
  const totalRevenue = useMemo(() => revenueData.reduce((s, d) => s + d.value, 0), [revenueData]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* График заказов */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="bg-surface-card rounded-xl border border-hairline-dark p-5"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-gold" />
            <h3 className="text-sm font-semibold text-body-text">
              Заказы по периоду
            </h3>
          </div>
          <span className="text-xs text-muted-text font-tabular">
            {isLoading ? '...' : `${totalOrders.toLocaleString('ru-BY')} всего`}
          </span>
        </div>
        {isLoading ? (
          <div className="h-[140px] bg-surface-elevated rounded animate-pulse" />
        ) : error ? (
          <div className="h-[140px] flex items-center justify-center">
            <p className="text-xs text-muted-text">Нет данных</p>
          </div>
        ) : (
          <MiniBarChart data={ordersData} color="var(--color-gold)" height={140} />
        )}
      </motion.div>

      {/* График выручки */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="bg-surface-card rounded-xl border border-hairline-dark p-5"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-price-drop" />
            <h3 className="text-sm font-semibold text-body-text">
              Выручка по периоду
            </h3>
          </div>
          <span className="text-xs text-muted-text font-tabular">
            {isLoading ? '...' : formatCurrency(totalRevenue)}
          </span>
        </div>
        {isLoading ? (
          <div className="h-[140px] bg-surface-elevated rounded animate-pulse" />
        ) : error ? (
          <div className="h-[140px] flex items-center justify-center">
            <p className="text-xs text-muted-text">Нет данных</p>
          </div>
        ) : (
          <MiniBarChart data={revenueData} color="var(--color-price-drop)" height={140} />
        )}
      </motion.div>
    </div>
  );
}

// ===== Quick Actions =====

function QuickActions() {
  const actions = [
    {
      label: 'Каталог товаров',
      icon: <Package className="w-4 h-4" />,
      to: '/admin/catalog',
      color: 'hover:border-gold/30 hover:bg-gold/5',
    },
    {
      label: 'Управление пользователями',
      icon: <Users className="w-4 h-4" />,
      to: '/admin/users',
      color: 'hover:border-info-blue/30 hover:bg-info-blue/5',
    },
    {
      label: 'Словари и атрибуты',
      icon: <Eye className="w-4 h-4" />,
      to: '/admin/dictionaries',
      color: 'hover:border-price-drop/30 hover:bg-price-drop/5',
    },
    {
      label: 'Настройки',
      icon: <Zap className="w-4 h-4" />,
      to: '/admin/settings',
      color: 'hover:border-accent-turquoise/30 hover:bg-accent-turquoise/5',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="bg-surface-card rounded-xl border border-hairline-dark p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-gold" />
        <h3 className="text-sm font-semibold text-body-text">
          Быстрые действия
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border border-hairline-dark bg-surface-elevated/50 text-body-text text-sm font-medium transition-all duration-200 group ${action.color}`}
          >
            <span className="text-muted-text group-hover:text-gold transition-colors duration-200">
              {action.icon}
            </span>
            <span className="flex-1">{action.label}</span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-text group-hover:text-gold group-hover:translate-x-0.5 transition-all duration-200" />
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

// ===== Page =====

export function CoordinatorDashboard() {
  const [period, setPeriod] = useState<Period>('month');

  return (
    <div className="bg-canvas-dark min-h-screen">
      <div className="max-w-7xl mx-auto p-6 space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-body-text">
                Панель координатора
              </h1>
              <p className="text-xs text-muted-text">
                Обзор активности и ключевых метрик
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <PeriodSelector value={period} onChange={setPeriod} />
            <div className="flex items-center gap-1.5 text-xs text-muted-text">
              <Calendar className="w-3.5 h-3.5" />
              <span className="font-tabular">
                {new Date().toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <StatsGrid period={period} />

        {/* Charts */}
        <ChartsSection period={period} />

        {/* Bottom Row: Activity + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <ActivityFeed />
          </div>
          <div className="lg:col-span-2">
            <QuickActions />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CoordinatorDashboard;
