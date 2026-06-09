import { useQuery } from '@tanstack/react-query';
import { statsApi } from '../../../api/admin';
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
} from 'lucide-react';

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

// ===== Skeleton =====

function StatSkeleton() {
  return (
    <div className="bg-surface-elevated rounded-xl p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-surface-card" />
        <div className="h-3 w-24 bg-surface-card rounded" />
      </div>
      <div className="h-8 w-32 bg-surface-card rounded mb-2" />
      <div className="h-4 w-20 bg-surface-card rounded" />
    </div>
  );
}

// ===== Change Indicator =====

function ChangeIndicator({ change }: { change: number }) {
  if (change === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        0%
      </span>
    );
  }

  const isPositive = change > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-sm ${
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
    </span>
  );
}

// ===== Stats Grid =====

function StatsGrid() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => statsApi.getStats(),
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
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
          className="inline-flex items-center gap-2 bg-surface-card text-body-text hover:bg-surface-elevated rounded-md px-4 py-2 text-sm font-semibold border border-hairline-dark"
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
      icon: <Users className="w-5 h-5" />,
      title: 'Пользователи',
      value: stats.totalUsers.toLocaleString('ru-BY'),
      valueColor: 'text-gold',
      change: stats.usersChange,
    },
    {
      icon: <ShoppingCart className="w-5 h-5" />,
      title: 'Заказы',
      value: stats.totalOrders.toLocaleString('ru-BY'),
      valueColor: 'text-body-text',
      change: stats.ordersChange,
    },
    {
      icon: <DollarSign className="w-5 h-5" />,
      title: 'Выручка',
      value: formatCurrency(stats.revenue),
      valueColor: 'text-gold',
      change: stats.revenueChange,
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: 'Обновлено',
      value: formatDate(lastUpdated),
      valueColor: 'text-body-text',
      change: undefined,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-surface-card rounded-xl p-6 border border-hairline-dark"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-gold">{card.icon}</span>
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
              {card.title}
            </span>
          </div>
          <div className={`text-2xl font-bold ${card.valueColor} mb-2`}>
            {card.value}
          </div>
          {card.change !== undefined && <ChangeIndicator change={card.change} />}
        </div>
      ))}
    </div>
  );
}

// ===== Page =====

export function CoordinatorDashboard() {
  return (
    <div className="bg-canvas-dark min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-gold" />
          <h1 className="text-lg font-semibold text-body-text">
            Панель координатора
          </h1>
        </div>
        <StatsGrid />
      </div>
    </div>
  );
}

export default CoordinatorDashboard;
