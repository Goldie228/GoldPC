/**
 * Manager Dashboard Page
 * Главная панель менеджера — статистика, товары с низким остатком,
 * ожидающие заказы.
 *
 * Использует целевые запросы вместо bulk-загрузки 1000+ элементов.
 */

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingCart,
  Clock,
  AlertTriangle,
  DollarSign,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { managerApi } from '@/api/manager';
import { StatCard } from '@/components/ui/StatCard';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { formatPrice } from '@/utils/format';

/* ─── Скелетон загрузки ─── */

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton width={280} height={32} className="mb-2" />
        <Skeleton width={400} height={18} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={100} borderRadius="lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton height={240} borderRadius="lg" />
        <Skeleton height={240} borderRadius="lg" />
      </div>
    </div>
  );
}

/* ─── Основной компонент ─── */

export function ManagerDashboard() {
  // Целевой запрос: заказы за сегодня (вместо загрузки всех 1000)
  const { data: todayOrders, isLoading: loadingToday, error: errorToday } = useQuery({
    queryKey: ['manager', 'dashboard', 'today-orders'],
    queryFn: () => managerApi.getTodayOrders(),
  });

  // Целевой запрос: ожидающие заказы (вместо загрузки всех 1000)
  const { data: pendingOrders, isLoading: loadingPending, error: errorPending } = useQuery({
    queryKey: ['manager', 'dashboard', 'pending-orders'],
    queryFn: () => managerApi.getPendingOrders(10),
  });

  // Целевой запрос: товары с низким остатком (вместо загрузки всех 1000 товаров)
  const { data: lowStockProducts, isLoading: loadingLowStock, error: errorLowStock } = useQuery({
    queryKey: ['manager', 'dashboard', 'low-stock'],
    queryFn: () => managerApi.getLowStockProducts(8),
  });

  // Целевой запрос: выручка за месяц (вместо загрузки всех 1000 заказов)
  const { data: monthlyRevenue, isLoading: loadingRevenue, error: errorRevenue } = useQuery({
    queryKey: ['manager', 'dashboard', 'monthly-revenue'],
    queryFn: () => managerApi.getMonthlyRevenue(),
  });

  const isLoading = loadingToday || loadingPending || loadingLowStock || loadingRevenue;
  const hasError = errorToday || errorPending || errorLowStock || errorRevenue;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (hasError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Панель менеджера</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Обзор ключевых показателей и актуальных задач
          </p>
        </div>
        <div className="bg-surface-card border border-hairline-dark rounded-lg p-8 text-center">
          <AlertCircle size={32} className="mx-auto text-price-rise mb-3" />
          <p className="text-price-rise font-medium">Ошибка загрузки данных панели</p>
          <p className="text-muted-foreground text-sm mt-1">
            Попробуйте обновить страницу
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 text-sm font-medium text-foreground bg-surface-card border border-hairline-dark rounded-lg hover:bg-surface-elevated transition-colors"
          >
            Обновить
          </button>
        </div>
      </div>
    );
  }

  // Значения для карточек статистики
  const todayCount = todayOrders?.length ?? 0;
  const pendingCount = pendingOrders?.length ?? 0;
  const lowStockCount = lowStockProducts?.length ?? 0;
  const revenue = monthlyRevenue?.revenue ?? 0;

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Панель менеджера</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Обзор ключевых показателей и актуальных задач
        </p>
      </div>

      {/* Карточки статистики */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div aria-label="Заказы сегодня">
          <StatCard
            label="Заказы сегодня"
            value={todayCount}
            icon={ShoppingCart}
          />
        </div>
        <div aria-label="Ожидают обработки">
          <StatCard
            label="Ожидают обработки"
            value={pendingCount}
            icon={Clock}
            variant={pendingCount > 0 ? 'callout' : 'default'}
          />
        </div>
        <div aria-label="Товары с низким остатком">
          <StatCard
            label="Низкий остаток"
            value={lowStockCount}
            icon={AlertTriangle}
            variant={lowStockCount > 0 ? 'callout' : 'default'}
          />
        </div>
        <div aria-label="Выручка за месяц">
          <StatCard
            label="Выручка за месяц"
            value={formatPrice(revenue)}
            icon={DollarSign}
          />
        </div>
      </div>

      {/* Нижняя секция: два блока */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Товары с низким остатком */}
        <div className="bg-surface-card border border-hairline-dark rounded-lg">
          <div className="flex items-center justify-between px-5 py-4 border-b border-hairline-dark">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle size={16} className="text-gold" />
              Товары с низким остатком
            </h3>
            <Link
              to="/manager/inventory"
              className="text-xs text-gold hover:text-gold-active transition-colors flex items-center gap-1"
            >
              Все товары
              <ArrowRight size={12} />
            </Link>
          </div>
          <div className="p-5">
            {lowStockProducts == null || lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Все товары в достаточном количестве
              </p>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-2 border-b border-hairline-dark last:border-0"
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-foreground truncate">
                        {p.name}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gold ml-4 shrink-0">
                      {p.stock} шт.
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ожидающие заказы */}
        <div className="bg-surface-card border border-hairline-dark rounded-lg">
          <div className="flex items-center justify-between px-5 py-4 border-b border-hairline-dark">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock size={16} className="text-gold" />
              Ожидающие заказы
            </h3>
            <Link
              to="/manager/orders"
              className="text-xs text-gold hover:text-gold-active transition-colors flex items-center gap-1"
            >
              Все заказы
              <ArrowRight size={12} />
            </Link>
          </div>
          <div className="p-5">
            {pendingOrders == null || pendingOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Нет ожидающих заказов
              </p>
            ) : (
              <div className="space-y-2">
                {pendingOrders.map((o) => (
                  <Link
                    key={o.id}
                    to={`/manager/orders/${o.id}`}
                    className="flex items-center justify-between py-2 border-b border-hairline-dark last:border-0 hover:bg-surface-elevated rounded px-2 -mx-2 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-foreground font-medium">
                        #{o.id}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {o.customerName ?? 'Клиент'}
                      </div>
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <div className="text-sm font-medium text-foreground">
                        {formatPrice(o.total ?? 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {o.createdAt
                          ? new Date(o.createdAt).toLocaleDateString('ru-BY')
                          : '--'}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManagerDashboard;
