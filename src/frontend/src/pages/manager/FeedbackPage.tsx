/**
 * Manager Feedback Page
 * Страница просмотра отзывов и обратной связи клиентов
 * Таблица с пагинацией и удалением отзывов
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Trash2, AlertCircle } from 'lucide-react';
import { managerApi } from '@/api/manager';
import type { FeedbackItem } from '@/api/manager';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { PagePagination } from '@/components/ui/PagePagination';
import { Modal } from '@/components/ui/Modal/Modal';
import { formatDate } from '@/utils/format';
import { useToast } from '@/hooks/useToast';

/* ─── Константы ─── */

const PAGE_SIZE = 20;

/* ─── Скелетон таблицы ─── */

function FeedbackTableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton height={48} borderRadius="lg" />
      <Skeleton height={400} borderRadius="lg" />
      <Skeleton height={48} borderRadius="lg" />
    </div>
  );
}

/* ─── Компонент звёзд рейтинга ─── */

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={16}
          className={i < rating ? 'fill-gold text-gold' : 'text-muted-foreground/30'}
        />
      ))}
      <span className="ml-1.5 text-xs text-muted-foreground">{rating}/5</span>
    </div>
  );
}

/* ─── Основной компонент ─── */

export function FeedbackPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<FeedbackItem | null>(null);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ['manager', 'feedback', currentPage, PAGE_SIZE],
    queryFn: () => managerApi.getFeedback(currentPage, PAGE_SIZE),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => managerApi.deleteFeedback(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['manager', 'feedback'] });
      setDeleteTarget(null);
      showToast('Отзыв удалён', 'success');
    },
  });

  const allFeedback: FeedbackItem[] = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleConfirmDelete = () => {
    if (deleteTarget?.id) {
      deleteMutation.mutate(deleteTarget.id);
    }
  };

  if (isLoading) {
    return <FeedbackTableSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-surface-card border border-hairline-dark rounded-lg p-8 text-center">
        <AlertCircle size={32} className="mx-auto text-price-rise mb-3" />
        <p className="text-price-rise font-medium">Ошибка загрузки отзывов</p>
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
        <h1 className="text-2xl font-bold text-foreground">Отзывы и обратная связь</h1>
        <p className="text-sm text-muted-foreground mt-1">Просмотр отзывов клиентов</p>
      </div>

      {/* Таблица отзывов */}
      <div className="bg-surface-card border border-hairline-dark rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-hairline-dark">
                <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Пользователь
                </th>
                <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Товар
                </th>
                <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Оценка
                </th>
                <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Заголовок
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
              {allFeedback.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    Отзывы не найдены
                  </td>
                </tr>
              ) : (
                allFeedback.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-hairline-dark last:border-0 hover:bg-surface-elevated/50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="text-foreground font-medium">
                        {item.userName ?? 'Пользователь'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.userEmail ?? ''}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-foreground">
                        {item.productName ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <RatingStars rating={item.rating ?? 0} />
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-foreground">
                        {item.title ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(item)}
                        leftIcon={<Trash2 size={14} />}
                        className="text-price-rise hover:text-price-rise hover:bg-price-rise/10"
                      >
                        Удалить
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Пагинация */}
      <PagePagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />

      {/* Модальное подтверждение удаления */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Удаление отзыва"
        size="small"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Вы уверены, что хотите удалить отзыв
            {deleteTarget?.userName ? ` пользователя ${deleteTarget.userName}` : ''}?
            Это действие нельзя отменить.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeleteTarget(null)}
            >
              Отмена
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Удаление...' : 'Удалить'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default FeedbackPage;
