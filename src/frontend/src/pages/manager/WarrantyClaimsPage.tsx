/**
 * Manager Warranty Claims Страница
 * Страница управления гарантийными претензиями для менеджеров
 * Таблица с фильтрацией по статусу и пагинацией
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Eye, Shield } from 'lucide-react';
import { managerApi } from '@/api/manager';
import type { WarrantyClaimItem } from '@/api/manager';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { PagePagination } from '@/components/ui/PagePagination';
import { getWarrantyStatusConfig, WARRANTY_STATUS_OPTIONS } from '@/utils/warranty-status';
import { formatDate } from '@/utils/format';

/* ─── Скелетон таблицы ─── */

function WarrantyClaimsTableSkeleton() {
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

export function WarrantyClaimsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Получение списка гарантийных претензий
  const { data, isLoading, error } = useQuery({
    queryKey: ['manager', 'warrantyClaims', currentPage, PAGE_SIZE, statusFilter],
    queryFn: () => managerApi.getWarrantyClaims(currentPage, PAGE_SIZE, statusFilter || undefined),
  });

  const allClaims: WarrantyClaimItem[] = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (isLoading) {
    return <WarrantyClaimsTableSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-surface-card border border-hairline-dark rounded-lg p-8 text-center">
        <p className="text-price-rise font-medium">Ошибка загрузки гарантийных претензий</p>
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
        <h1 className="text-2xl font-bold text-foreground">Гарантийные претензии</h1>
        <p className="text-sm text-muted-foreground mt-1">Управление гарантийными случаями</p>
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
          {WARRANTY_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Таблица претензий */}
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
                  Товар
                </th>
                <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Статус
                </th>
                <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Дата создания
                </th>
                <th scope="col" className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {allClaims.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    Гарантийные претензии не найдены
                  </td>
                </tr>
              ) : (
                allClaims.map((claim) => {
                  const status = getWarrantyStatusConfig(claim.status);
                  return (
                    <tr
                      key={claim.id}
                      className="border-b border-hairline-dark last:border-0 hover:bg-surface-elevated/50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <span className="font-medium text-foreground">
                          {claim.claimNumber ?? claim.id}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-foreground">
                          {claim.clientName ?? 'Клиент'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {claim.clientEmail ?? ''}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Shield size={14} className="text-muted-foreground shrink-0" />
                          <span className="text-foreground">{claim.productName ?? '--'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge variant={status.variant} label={status.label} />
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {formatDate(claim.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          to={`/manager/warranty/${claim.id}`}
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

export default WarrantyClaimsPage;
