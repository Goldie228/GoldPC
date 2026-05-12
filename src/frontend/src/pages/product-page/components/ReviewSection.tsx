import { useId, useState, useEffect, type KeyboardEvent, type ReactElement } from 'react';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useCatalog } from '../../../hooks/useCatalog';
import type { Product, ProductReview } from '../../../api/types';
import { ProductReviewCard } from './ProductReviewCard';

export interface ReviewSectionProps {
  productId: string;
  product: Product;
  isAuthenticated: boolean;
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export function ReviewSection({
  productId,
  product,
  isAuthenticated,
  showToast,
}: ReviewSectionProps): ReactElement {
  const { getProductReviews, addProductReview } = useCatalog();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ rating: 5, comment: '', pros: '', cons: '' });
  const groupId = useId();

  useEffect(() => {
    getProductReviews(productId, 1, 20)
      .then((res) => {
        if (res) {
          setReviews(res.data || []);
        }
      })
      .catch(() => {
        setReviews([]);
        console.warn('Reviews endpoint not available, showing empty state');
      })
      .finally(() => setLoading(false));
  }, [productId]);

  const ratingValue =
    typeof product.rating === 'number'
      ? product.rating
      : (product.rating as { average?: number })?.average || 0;

  const reviewCount =
    product.reviewCount ?? (product.rating as { count?: number })?.count ?? 0;

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

  const scrollToForm = () => {
    document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div>
      {/* Summary Bar */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold text-foreground">
            {ratingValue > 0 ? ratingValue.toFixed(1) : '—'}
          </div>
          <div className="flex flex-col">
            <div className="text-primary text-xl" aria-hidden>
              {ratingValue > 0 ? (
                <>
                  {'★'.repeat(Math.round(ratingValue))}
                  {'☆'.repeat(5 - Math.round(ratingValue))}
                </>
              ) : (
                <span className="text-muted-foreground tracking-[0.12em]">☆☆☆☆☆</span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {reviewCount === 0
                ? 'пока без оценок'
                : `${reviewCount} ${reviewCount === 1 ? 'отзыв' : 'отзывов'}`}
            </span>
          </div>
        </div>
        <Button variant="outline" onClick={scrollToForm}>
          Оставить отзыв
        </Button>
      </div>

      {/* Reviews List */}
      <div className="grid gap-6 mb-12">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} height={150} borderRadius="md" />)
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center bg-card border border-dashed border-border/60 rounded-xl">
            <p className="m-0 mb-2.5 text-lg font-semibold text-foreground">Станьте первым, кто оставит отзыв</p>
            <p className="m-0 text-sm leading-relaxed text-muted-foreground max-w-[420px] mx-auto">
              Расскажите о впечатлениях — это поможет другим выбрать комплектующие увереннее.
            </p>
          </div>
        ) : (
          reviews.map((review) => <ProductReviewCard key={review.id} review={review} />)
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
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Отправка...' : 'Отправить отзыв'}
          </Button>
        </div>
      </div>
    </div>
  );
}
