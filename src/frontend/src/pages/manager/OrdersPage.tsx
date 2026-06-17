/**
 * Manager Orders Page
 * Страница управления заказами для менеджеров
 * Таблица с поиском, фильтрацией по статусу, пагинацией
 */

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Eye } from 'lucide-react';
import { managerApi } from '@/api/manager';
import type { RawOrderItem } from '@/api/manager';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { PagePagination } from '@/components/ui/PagePagination';
import { getStatusConfig } from '@/utils/order-status';
import { formatPrice, formatDate } from '@/utils/format';

/* ─── Типы ─── */

type OrderStatusFilter = '' | '0' | '1' | '2' | '3' | '4' | '5' | '6';

/* ─── Скелетон таблицы ─── */

function OrdersTableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton height={48} borderRadius="lg" />
      <Skeleton height={400} borderRadius="lg" />
      <Skeleton height={48} borderRadius="lg" />
    </div>
  );
}

/* ─── Константы ─── */

const STATUS_FILTER_OPTIONS: { value: OrderStatusFilter; label: string }[] = [
  { value: '', label: 'Все статусы' },
  { value: '0', label: 'Новый' },
  { value: '1', label: 'В обработке' },
  { value: '2', label: 'Оплачен' },
  { value: '3', label: 'В сборке' },
  { value: '4', label: 'Готов' },
  { value: '5', label: 'Выдан' },
  { value: '6', label: 'Отменён' },
];

const PAGE_SIZE = 20;

/* ─── Основной компонент ─── */

export function OrdersPage() {
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('');
  const [currentPage, setCurrentPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(searchInput);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  // Серверная фильтрация по статусу и поиску
  const { data, isLoading, error } = useQuery({
    queryKey: ['manager', 'orders', currentPage, PAGE_SIZE, statusFilter, searchQuery],
    queryFn: () => managerApi.getOrders(currentPage, PAGE_SIZE, statusFilter || undefined, searchQuery || undefined),
  });

  const allOrders: RawOrderItem[] = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (isLoading) {
    return <OrdersTableSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-surface-card border border-hairline-dark rounded-lg p-8 text-center">
        <p className="text-price-rise font-medium">Ошибка загрузки заказов</p>
        <p className="text-muted-foreground text-sm mt-1">
          Попробуйте обновить страницу
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Управление заказами</h1>
        <p className="text-sm text-muted-foreground mt-1">Все заказы магазина</p>
      </div>

      {/* Панель фильтров */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Поиск */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2.5 bg-surface-card border border-hairline-dark rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors"
            placeholder="Поиск по номеру, клиенту..."
            aria-label="Поиск заказов"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        {/* Фильтр по статусу */}
        <select
          className="px-4 py-2.5 bg-surface-card border border-hairline-dark rounded-lg text-sm text-foreground focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors cursor-pointer"
          aria-label="Фильтр по статусу"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as OrderStatusFilter);
            setCurrentPage(1);
          }}
        >
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Таблица заказов */}
      <div className="bg-surface-card border border-hairline-dark rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
           <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-hairline-dark">
                <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Номер
                </th>
                <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Клиент
                </th>
                <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Сумма
                </th>
                <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Статус
                </th>
                <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Дата
                </th>
                <th scope="col" className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {allOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    Заказы не найдены
                  </td>
                </tr>
              ) : (
                allOrders.map((order) => {
                  const status = getStatusConfig(order.status);
                  return (
                    <tr
                      key={order.id}
                      className="border-b border-hairline-dark last:border-0 hover:bg-surface-elevated/50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <span className="font-medium text-foreground">
                          #{order.id}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-foreground">
                          {order.customerName ?? 'Клиент'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.customerEmail ?? ''}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-tabular-nums text-foreground">
                          {formatPrice(order.total ?? 0)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge variant={status.variant} label={status.label} />
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          to={`/manager/orders/${order.id}`}
                          className="inline-flex items-center gap-1.5 text-gold hover:text-gold-active text-sm font-medium transition-colors"
                        >
                          <Eye size={14} />
                          Подробнее
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Пагинация */}
      <PagePagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
    </div>
  );
}

export default OrdersPage;
