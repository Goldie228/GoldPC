/**
 * Manager Service Requests Страница
 * Страница управления сервисными заявками для менеджеров
 * Таблица с фильтрацией по статусу и пагинацией
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Eye, Wrench } from 'lucide-react';
import { managerApi } from '@/api/manager';
import type { ServiceRequestItem } from '@/api/manager';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { PagePagination } from '@/components/ui/PagePagination';
import { getServiceStatusConfig, SERVICE_STATUS_OPTIONS } from '@/utils/service-status';
import { formatDate } from '@/utils/format';

/* ─── Скелетон таблицы ─── */

function ServiceRequestsTableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton height={48} borderRadius="lg" />
      <Skeleton height={400} borderRadius="lg" />
      <Skeleton height={48} borderRadius="lg" />
    </div>
  );
}

/* ─── Константы ─── */

const PAGE_SIZE = 20;

/* ─── Основной компонент ─── */

export function ServiceRequestsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Получение списка сервисных заявок
  const { data, isLoading, error } = useQuery({
    queryKey: ['manager', 'serviceRequests', currentPage, PAGE_SIZE, statusFilter],
    queryFn: () => managerApi.getServiceRequests(currentPage, PAGE_SIZE, statusFilter || undefined),
  });

  const allRequests: ServiceRequestItem[] = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (isLoading) {
    return <ServiceRequestsTableSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-surface-card border border-hairline-dark rounded-lg p-8 text-center">
        <p className="text-price-rise font-medium">Ошибка загрузки сервисных заявок</p>
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
        <h1 className="text-2xl font-bold text-foreground">Сервисные заявки</h1>
        <p className="text-sm text-muted-foreground mt-1">Управление заявками на ремонт</p>
      </div>

      {/* Панель фильтров */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Фильтр по статусу */}
        <select
          className="px-4 py-2.5 bg-surface-card border border-hairline-dark rounded-lg text-sm text-foreground focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors cursor-pointer"
          aria-label="Фильтр по статусу"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          {SERVICE_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Таблица заявок */}
      <div className="bg-surface-card border border-hairline-dark rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-hairline-dark">
                <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  №
                </th>
                <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Клиент
                </th>
                <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Устройство
                </th>
                <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Статус
                </th>
                <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Мастер
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
              {allRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                    Сервисные заявки не найдены
                  </td>
                </tr>
              ) : (
                allRequests.map((request) => {
                  const status = getServiceStatusConfig(request.status);
                  const device = [request.deviceBrand, request.deviceModel].filter(Boolean).join(' ') || request.deviceType || '--';
                  return (
                    <tr
                      key={request.id}
                      className="border-b border-hairline-dark last:border-0 hover:bg-surface-elevated/50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <span className="font-medium text-foreground">
                          {request.ticketNumber ?? request.id}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-foreground">
                          {request.clientName ?? 'Клиент'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {request.clientEmail ?? ''}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Wrench size={14} className="text-muted-foreground shrink-0" />
                          <span className="text-foreground">{device}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge variant={status.variant} label={status.label} />
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {request.assignedMasterName ?? 'Не назначен'}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {formatDate(request.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          to={`/manager/services/${request.id}`}
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

export default ServiceRequestsPage;
