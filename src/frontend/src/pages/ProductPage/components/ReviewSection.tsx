import { useId, useState, useEffect, type KeyboardEvent, type ReactElement } from 'react';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { catalogApi } from '../../../api/catalog';
import type { Product, ProductReview } from '../../../api/types';
import { ProductReviewCard } from './ProductReviewCard';
import styles from '../ProductPage.module.css';

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
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ rating: 5, comment: '', pros: '', cons: '' });

  useEffect(() => {
    catalogApi
      .getProductReviews(productId, 1, 20)
      .then((res) => setReviews(res.data))
      .catch(() => {})
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
      const newReview = await catalogApi.addProductReview(productId, form);
      setReviews((prev) => [newReview, ...prev]);
      setForm({ rating: 5, comment: '', pros: '', cons: '' });
      showToast('Отзыв успешно добавлен', 'success');
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
    <div className={styles.reviews}>
      <div className={styles.reviewsHeader}>
        <div className={styles.ratingSummary}>
          <div className={styles.ratingValue}>
            {ratingValue > 0 ? ratingValue.toFixed(1) : 'Нет оценок'}
          </div>
          <div className={styles.ratingStars}>
            <div className={styles.stars} aria-hidden>
              {ratingValue > 0 ? (
                <>
                  {'★'.repeat(Math.round(ratingValue))}
                  {'☆'.repeat(5 - Math.round(ratingValue))}
                </>
              ) : (
                <span className={styles.starsMuted}>☆☆☆☆☆</span>
              )}
            </div>
            <span className={styles.reviewCount}>
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

      <div className={styles.reviewsList}>
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} height={150} borderRadius="md" />)
        ) : reviews.length === 0 ? (
          <div className={styles.reviewsEmptyInvite}>
            <p className={styles.reviewsEmptyTitle}>Станьте первым, кто оставит отзыв</p>
            <p className={styles.reviewsEmptyText}>
              Расскажите о впечатлениях — это поможет другим выбрать комплектующие увереннее.
            </p>
          </div>
        ) : (
          reviews.map((review) => <ProductReviewCard key={review.id} review={review} />)
        )}
      </div>

      <div id="review-form" className={styles.reviewItem}>
        <h3 className={styles.reviewFormTitle}>Ваш отзыв</h3>
        <div className={styles.reviewFormGrid}>
          <div className={styles.reviewFormRow}>
            <span className={styles.reviewFormLabel}>Ваша оценка:</span>
            <StarRatingInput
              value={form.rating}
              onChange={(rating) => setForm((f) => ({ ...f, rating }))}
              disabled={submitting}
            />
          </div>
          <textarea
            placeholder="Комментарий"
            value={form.comment}
            onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
            className={styles.reviewTextarea}
          />
          <div className={styles.reviewProsConsInputs}>
            <input
              placeholder="Достоинства"
              value={form.pros}
              onChange={(e) => setForm((f) => ({ ...f, pros: e.target.value }))}
              className={styles.reviewInput}
            />
            <input
              placeholder="Недостатки"
              value={form.cons}
              onChange={(e) => setForm((f) => ({ ...f, cons: e.target.value }))}
              className={styles.reviewInput}
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
