import { useId, useState, useEffect, useCallback, useMemo, type KeyboardEvent, type ReactElement } from 'react';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useCatalog } from '../../../hooks/useCatalog';
import type { Product, ProductReview, UpdateReviewRequest, ProductReviewsResponse } from '../../../api/types';
import { ProductReviewCard } from './ProductReviewCard';

export interface ReviewSectionProps {
  productId: string;
  product: Product;
  isAuthenticated: boolean;
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  user?: { id: string } | null;
}

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Новые',
  oldest: 'Старые',
  highest: 'Высокий рейтинг',
  lowest: 'Низкий рейтинг',
};

const FILTER_OPTIONS = [
  { label: 'Все', value: null },
  { label: '5★', value: 5 },
  { label: '4★', value: 4 },
  { label: '3★', value: 3 },
  { label: '2★', value: 2 },
  { label: '1★', value: 1 },
] as const;

export function ReviewSection({
  productId,
  product,
  isAuthenticated,
  showToast,
  user,
}: ReviewSectionProps): ReactElement {
  const { getProductReviews, addProductReview, updateProductReview, deleteProductReview, toggleHelpful } = useCatalog();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [form, setForm] = useState({ rating: 5, comment: '', pros: '', cons: '' });
  const groupId = useId();

  /* ------ Fetch reviews on mount ------ */
  useEffect(() => {
    getProductReviews(productId, 1, 20)
      .then((res) => {
        if (res != null) {
          const paged = res as ProductReviewsResponse;
          setReviews(paged.data || []);
          setHasMore(paged.meta?.hasNext ?? false);
          setPage(1);
        }
      })
      .catch(() => {
        setReviews([]);
        console.warn('Reviews endpoint not available, showing empty state');
      })
      .finally(() => setLoading(false));
  }, [productId]);

  /* ------ Derived data ------ */
  const ratingValue =
    typeof product.rating === 'number'
      ? product.rating
      : (product.rating as { average?: number })?.average || 0;

  const reviewCount =
    product.reviewCount ?? (product.rating as { count?: number })?.count ?? 0;

  /* ------ Client-side sort ------ */
  const sortedReviews = useMemo<ProductReview[]>(() => {
    const sorted = [...reviews];
    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'highest':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        sorted.sort((a, b) => a.rating - b.rating);
        break;
    }
    return sorted;
  }, [reviews, sortBy]);

  /* ------ Client-side rating filter ------ */
  const filteredReviews = useMemo<ProductReview[]>(() => {
    if (filterRating === null) return sortedReviews;
    return sortedReviews.filter((r) => r.rating === filterRating);
  }, [sortedReviews, filterRating]);

  /* ------ Rating distribution ------ */
  const distribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) counts[r.rating - 1]++;
    });
    const max = Math.max(...counts, 1);
    // Show 5★ to 1★ (top to bottom)
    return [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: counts[stars - 1],
      pct: (counts[stars - 1] / max) * 100,
    }));
  }, [reviews]);

  /* ------ Load More (pagination) ------ */
  const handleLoadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await getProductReviews(productId, nextPage, 20);
      if (res != null) {
        const paged = res as ProductReviewsResponse;
        setReviews((prev) => [...prev, ...(paged.data || [])]);
        setPage(nextPage);
        setHasMore(paged.meta?.hasNext ?? false);
      }
    } catch {
      showToast('Не удалось загрузить ещё отзывы', 'error');
    } finally {
      setLoadingMore(false);
    }
  }, [page, productId, getProductReviews, showToast]);

/* ------ Review CRUD callbacks ------ */
const handleUpdate = useCallback(
    async (reviewId: string, data: UpdateReviewRequest): Promise<boolean> => {
      const updated = await updateProductReview(productId, reviewId, data);
      if (updated != null) {
        setReviews((prev) => prev.map((r) => (r.id === reviewId ? updated : r)));
        showToast('Отзыв обновлён', 'success');
        return true;
      } else {
        showToast('Не удалось обновить отзыв', 'error');
        return false;
      }
    },
    [productId, updateProductReview, showToast],
  );

  const handleDelete = useCallback(
    async (reviewId: string): Promise<boolean> => {
      const ok = await deleteProductReview(productId, reviewId);
      if (ok) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
        showToast('Отзыв удалён', 'success');
        return true;
      } else {
        showToast('Не удалось удалить отзыв', 'error');
        return false;
      }
    },
    [productId, deleteProductReview, showToast],
  );

  const handleHelpful = useCallback(
    async (reviewId: string): Promise<{ helpful: number } | null> => {
      const result = await toggleHelpful(productId, reviewId);
      if (result != null) {
        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? { ...r, helpful: result.helpful } : r)),
        );
        return result;
      } else {
        showToast('Не удалось отметить отзыв', 'error');
        return null;
      }
    },
    [productId, toggleHelpful, showToast],
  );

  const currentUserId = user?.id;

  const setRating = (next: number) => {
    setForm((f) => ({ ...f, rating: Math.max(1, Math.min(5, next)) }));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (submitting) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      setRating(form.rating - 1);
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      setRating(form.rating + 1);
      return;
    }
    if (e.key === 'Home') {
      e.preventDefault();
      setRating(1);
      return;
    }
    if (e.key === 'End') {
      e.preventDefault();
      setRating(5);
    }
  };

  const onChange = (star: number) => {
    if (submitting) return;
    setRating(star);
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      showToast('Пожалуйста, войдите, чтобы оставить отзыв', 'info');
      return;
    }
    if (!form.comment.trim()) {
      showToast('Напишите комментарий', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const newReview = await addProductReview(productId, form);
      if (newReview) {
        setReviews((prev) => [newReview, ...prev]);
        setForm({ rating: 5, comment: '', pros: '', cons: '' });
        showToast('Отзыв успешно добавлен', 'success');
      }
    } catch {
      showToast('Не удалось отправить отзыв', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Summary Bar — only shown when reviews exist */}
      {filteredReviews.length > 0 && (
        <div className="mb-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-foreground">
                {ratingValue.toFixed(1)}
              </div>
              <div className="flex flex-col">
                <div className="text-primary text-xl" aria-hidden>
                  {'★'.repeat(Math.round(ratingValue))}
                  {'☆'.repeat(5 - Math.round(ratingValue))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {reviewCount} {reviewCount === 1 ? 'отзыв' : 'отзывов'}
                </span>
              </div>
            </div>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-surface-elevated border border-border rounded-lg p-2 text-sm text-foreground cursor-pointer focus:outline-none focus:border-primary"
              aria-label="Сортировка отзывов"
            >
              {Object.entries(SORT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Rating Distribution */}
          <div className="grid gap-1.5 mb-4">
            {distribution.map(({ stars, count, pct }) => (
              <div key={stars} className="flex items-center gap-2 text-xs">
                <span className="w-6 text-right text-muted-foreground shrink-0">{stars}★</span>
                <div className="flex-1 h-2.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-6 text-left text-muted-foreground shrink-0">{count}</span>
              </div>
            ))}
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {FILTER_OPTIONS.map((opt) => {
              const isActive = filterRating === opt.value;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setFilterRating(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-sm cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-transparent border border-border text-muted-foreground hover:border-primary hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="grid gap-6 mb-12">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} height={150} borderRadius="md" />)
        ) : filteredReviews.length === 0 ? (
          <div className="p-8 text-center bg-card border border-dashed border-border/60 rounded-xl">
            <p className="m-0 mb-2.5 text-lg font-semibold text-foreground">
              {filterRating !== null
                ? `Нет отзывов с рейтингом ${filterRating}★`
                : 'Станьте первым, кто оставит отзыв'}
            </p>
            <p className="m-0 text-sm leading-relaxed text-muted-foreground max-w-[420px] mx-auto">
              {filterRating !== null
                ? 'Попробуйте изменить фильтр.'
                : 'Расскажите о впечатлениях — это поможет другим выбрать комплектующие увереннее.'}
            </p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <ProductReviewCard
              key={review.id}
              review={review}
              productId={productId}
              currentUserId={currentUserId}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onHelpful={handleHelpful}
            />
          ))
        )}

        {/* Load More */}
        {hasMore && filteredReviews.length > 0 && (
          <div className="flex justify-center">
            <Button variant="outline" className="px-8" onClick={() => void handleLoadMore()} disabled={loadingMore}>
              {loadingMore ? 'Загрузка...' : 'Загрузить ещё'}
            </Button>
          </div>
        )}
      </div>

      {/* Review Form */}
      <div id="review-form" className="bg-card border border-border rounded-xl p-6">
        <h3 className="mb-5 text-lg font-semibold text-foreground">Ваш отзыв</h3>
        <div className="grid gap-4">
          {/* Star Rating */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-foreground font-medium">Ваша оценка:</span>
            <div
              className="inline-flex items-center gap-1 p-1.5 rounded-lg bg-surface-elevated border border-border"
              role="radiogroup"
              aria-label="Ваша оценка"
              aria-disabled={submitting || undefined}
              tabIndex={submitting ? -1 : 0}
              onKeyDown={onKeyDown}
            >
              {Array.from({ length: 5 }, (_, i) => {
                const star = i + 1;
                const isActive = star <= form.rating;
                return (
                  <button
                    key={star}
                    type="button"
                    className={`w-8 h-8 inline-flex items-center justify-center border border-transparent bg-transparent rounded-lg cursor-pointer transition-all duration-150 hover:bg-primary/10 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    }`}
                    role="radio"
                    aria-checked={form.rating === star}
                    aria-label={`${star} из 5`}
                    disabled={submitting}
                    data-rating={star}
                    onClick={() => onChange(star)}
                  >
                    <span aria-hidden>{isActive ? '★' : '☆'}</span>
                  </button>
                );
              })}
              <span className="font-mono text-sm text-muted-foreground ml-2" aria-hidden>
                {form.rating}/5
              </span>
              <span className="sr-only" id={`${groupId}-value`}>
                Выбрано: {form.rating} из 5
              </span>
            </div>
          </div>

          {/* Comment */}
          <textarea
            placeholder="Комментарий"
            value={form.comment}
            onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
            className="w-full h-[120px] bg-surface-elevated border border-border text-foreground p-3 rounded-lg resize-y focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(252,213,53,0.15)]"
          />

          {/* Pros / Cons */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              placeholder="Достоинства"
              value={form.pros}
              onChange={(e) => setForm((f) => ({ ...f, pros: e.target.value }))}
              className="bg-surface-elevated border border-border text-foreground p-3 rounded-lg focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(252,213,53,0.15)]"
            />
            <input
              placeholder="Недостатки"
              value={form.cons}
              onChange={(e) => setForm((f) => ({ ...f, cons: e.target.value }))}
              className="bg-surface-elevated border border-border text-foreground p-3 rounded-lg focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(252,213,53,0.15)]"
            />
          </div>

          {/* Submit */}
          <Button onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? 'Отправка...' : 'Отправить отзыв'}
          </Button>
        </div>
      </div>
    </div>
  );
}
