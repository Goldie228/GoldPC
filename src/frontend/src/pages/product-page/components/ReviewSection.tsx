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

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

function StarRatingInput({ value, onChange, disabled }: StarRatingInputProps): ReactElement {
  const groupId = useId();

  const setClamped = (next: number) => {
    const v = Math.max(1, Math.min(5, next));
    onChange(v);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      setClamped(value - 1);
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      setClamped(value + 1);
      return;
    }
    if (e.key === 'Home') {
      e.preventDefault();
      setClamped(1);
      return;
    }
    if (e.key === 'End') {
      e.preventDefault();
      setClamped(5);
    }
  };

  return (
    <div
      className={styles.ratingInput}
      role="radiogroup"
      aria-label="Ваша оценка"
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={onKeyDown}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const star = i + 1;
        const isActive = star <= value;
        return (
          <button
            key={star}
            type="button"
            className={`${styles.ratingStarBtn} ${isActive ? styles.ratingStarActive : ''}`}
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} из 5`}
            disabled={disabled}
            data-rating={star}
            onClick={() => onChange(star)}
          >
            <span aria-hidden>{isActive ? '★' : '☆'}</span>
          </button>
        );
      })}
      <span className={styles.ratingInputValue} aria-hidden>
        {value}/5
      </span>
      <span className="sr-only" id={`${groupId}-value`}>
        Выбрано: {value} из 5
      </span>
    </div>
  );
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

  useEffect(() => {
    getProductReviews(productId, 1, 20)
      .then((res) => {
        if (res) {
          setReviews(res.data || []);
        }
      })
      .catch(() => {
        // Gracefully handle missing reviews endpoint - default to empty list
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
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="text-4xl font-bold text-[var(--fg)] font-[var(--font-sans)]">
            {ratingValue > 0 ? ratingValue.toFixed(1) : 'Нет оценок'}
          </div>
          <div className="flex flex-col">
            <div className="text-[var(--accent)] text-xl" aria-hidden>
              {ratingValue > 0 ? (
                <>
                  {'★'.repeat(Math.round(ratingValue))}
                  {'☆'.repeat(5 - Math.round(ratingValue))}
                </>
              ) : (
                <span className="text-[var(--fg-dim)] letter-spacing-[0.12em]">☆☆☆☆☆</span>
              )}
            </div>
            <span className="text-xs text-[var(--fg-muted)]">
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

      <div className="grid gap-6 mb-12">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} height={150} borderRadius="md" />)
        ) : reviews.length === 0 ? (
          <div className="p-7 text-center bg-[linear-gradient(180deg,color-mix(in_srgb,var(--accent)_8%,transparent_100%)_0%,var(--bg-card)_100%)] border border-dashed border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] rounded-xl">
            <p className="m-0 mb-2.5 text-lg font-semibold text-[var(--fg)]">Станьте первым, кто оставит отзыв</p>
            <p className="m-0 text-sm leading-6 text-[var(--fg-muted)] max-w-[420px] mx-auto">
              Расскажите о впечатлениях — это поможет другим выбрать комплектующие увереннее.
            </p>
          </div>
        ) : (
          reviews.map((review) => <ProductReviewCard key={review.id} review={review} />)
        )}
      </div>

      <div id="review-form" className="p-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl">
        <h3 className="mb-5 text-lg font-semibold text-[var(--fg)]">Ваш отзыв</h3>
        <div className="grid gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[var(--fg)] font-medium">Ваша оценка:</span>
            <div
              className="inline-flex items-center gap-1.5 p-1.5 rounded-lg bg-[var(--border-muted)] border border-[var(--border)]"
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
                    className={`w-8 h-8 inline-flex items-center justify-center border border-transparent bg-transparent text-[var(--fg-dim)] rounded-lg cursor-pointer transition-[all] duration-150 hover:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] hover:text-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2 ${isActive ? 'text-[var(--accent)]' : ''}`}
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
              <span className="font-[var(--font-mono)] text-sm text-[var(--fg-muted)] ml-2" aria-hidden>
                {form.rating}/5
              </span>
              <span className="sr-only" id={`${groupId}-value`}>
                Выбрано: {form.rating} из 5
              </span>
            </div>
          </div>
          <textarea
            placeholder="Комментарий"
            value={form.comment}
            onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
            className="w-full h-[120px] bg-[var(--bg-elevated)] border border-[var(--border,#27272a)] text-[var(--fg,#fff)] p-3 rounded-lg resize-y focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)]"
          />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              placeholder="Достоинства"
              value={form.pros}
              onChange={(e) => setForm((f) => ({ ...f, pros: e.target.value }))}
              className="bg-[var(--bg-elevated)] border border-[var(--border,#27272a)] text-[var(--fg,#fff)] p-3 rounded-lg focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)]"
            />
            <input
              placeholder="Недостатки"
              value={form.cons}
              onChange={(e) => setForm((f) => ({ ...f, cons: e.target.value }))}
              className="bg-[var(--bg-elevated)] border border-[var(--border,#27272a)] text-[var(--fg,#fff)] p-3 rounded-lg focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)]"
            />
          </div>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Отправка...' : 'Отправить отзыв'}
          </Button>
        </div>
      </div>
    </div>
  );
}
