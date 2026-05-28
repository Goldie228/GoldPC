import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, Cpu, ShieldCheck } from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { useServiceTickets } from '../../hooks/useServiceTickets';
import { useAuthStore } from '../../store/authStore';
import { TICKET_STATUSES } from '../../api/services';
import type { Order } from '../../api/orders';
import type { ServiceTicket } from '../../api/services';

/**
 * AccountOverview - Main dashboard page for account
 *
 * Features:
 * - Welcome card with user stats
 * - Recent orders table
 * - Quick actions
 */
export function AccountOverview() {
  const { user } = useAuthStore();
  const { getMyOrders, loading: ordersLoading } = useOrders();
  const { getMyTickets, loading: ticketsLoading } = useServiceTickets();

  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.allSettled([
      getMyOrders(1, 5).then((result) => {
        if (result != null) setOrders(result.items);
      }),
      getMyTickets(1, 5).then((result) => {
        if (result != null) setTickets(result.items);
      }),
    ]).finally(() => setLoading(false));
  }, [getMyOrders, getMyTickets]);

  const userName = user?.firstName || 'Пользователь';

  const statusBadgeClasses: Record<string, string> = {
    Completed: 'bg-muted/10 text-muted-foreground',
    InProgress: 'bg-warning/15 text-warning',
    Processing: 'bg-info-blue/10 text-info-blue',
    Cancelled: 'bg-destructive/10 text-destructive',
  };

  const getStatusLabel = (status: string): string => {
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
  };

  const getTicketStatusLabel = (status: string): string => {
    const item = TICKET_STATUSES.find((s) => s.key === status);
    return item?.label || status;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1280px] mx-auto">
        {/* Welcome Card */}
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <h1 className="text-2xl font-bold text-foreground">Личный кабинет</h1>
          <p className="text-muted-foreground mb-6">Управляйте своим аккаунтом и заказами</p>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-3xl font-bold text-foreground font-tabular">
                {loading ? '...' : orders.length}
              </div>
              <div className="text-sm text-muted-foreground">Заказов</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground font-tabular">
                {loading ? '...' : tickets.length}
              </div>
              <div className="text-sm text-muted-foreground">Ремонтов</div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <section className="bg-card rounded-xl border border-border p-6">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-foreground">Последние заказы</h2>
            <Link
              to="/account/orders"
              className="flex items-center gap-1 text-info-blue hover:opacity-80 transition-opacity text-sm font-medium"
            >
              Все заказы
              <ChevronRight size={16} />
            </Link>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-muted-foreground text-sm uppercase tracking-wider">
                  <th className="text-left pb-3 pr-4 font-medium">Заказ</th>
                  <th className="text-left pb-3 pr-4 font-medium">Товары</th>
                  <th className="text-left pb-3 pr-4 font-medium">Дата</th>
                  <th className="text-left pb-3 pr-4 font-medium">Сумма</th>
                  <th className="text-left pb-3 font-medium">Статус</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <p className="text-muted-foreground text-sm">Загрузка...</p>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <Package size={48} className="text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">У вас пока нет заказов</p>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="border-t border-border">
                      <td className="py-3 pr-4">
                        <span className="text-foreground font-medium text-sm">#{order.orderNumber}</span>
                      </td>
                      <td className="py-3 pr-4 text-foreground text-sm">
                        {order.items[0]?.productName}
                        {order.items.length > 1 && <span className="text-muted-foreground"> +{order.items.length - 1}</span>}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground text-sm">
                        {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="py-3 pr-4 text-foreground text-sm font-medium">
                        {order.total.toFixed(2)} BYN
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                            statusBadgeClasses[order.status] || 'bg-elevated text-muted-foreground'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              order.status === 'Completed'
                                ? 'bg-muted-foreground'
                                : order.status === 'InProgress'
                                  ? 'bg-warning'
                                  : order.status === 'Processing'
                                    ? 'bg-info-blue'
                                    : order.status === 'Cancelled'
                                      ? 'bg-destructive'
                                      : 'bg-muted-foreground'
                            }`}
                          />
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/account/saved-builds"
            className="bg-card rounded-xl border border-border p-5 hover:border-border transition-colors group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-elevated flex items-center justify-center">
                <Cpu size={20} className="text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Сохранённые сборки</h3>
            </div>
            <p className="text-sm text-muted-foreground">Ваши конфигурации ПК из конструктора</p>
            <div className="flex items-center gap-1 text-info-blue text-sm font-medium mt-3 group-hover:gap-2 transition-all">
              Открыть <ChevronRight size={16} />
            </div>
          </Link>

          <Link
            to="/account/warranty"
            className="bg-card rounded-xl border border-border p-5 hover:border-border transition-colors group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-elevated flex items-center justify-center">
                <ShieldCheck size={20} className="text-info-blue" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Гарантийные талоны</h3>
            </div>
            <p className="text-sm text-muted-foreground">Гарантия на товары и услуги</p>
            <div className="flex items-center gap-1 text-info-blue text-sm font-medium mt-3 group-hover:gap-2 transition-all">
              Открыть <ChevronRight size={16} />
            </div>
          </Link>
        </section>
      </div>
    </div>
  );
}
