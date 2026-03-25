import { useState, useEffect, type ReactElement } from 'react';
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
            {ratingValue > 0 ? ratingValue.toFixed(1) : '—'}
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
        <h3 style={{ marginBottom: '20px' }}>Ваш отзыв</h3>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>Ваша оценка:</span>
            <select
              value={form.rating}
              onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) }))}
              style={{
                background: '#121214',
                border: '1px solid #27272a',
                color: '#fff',
                padding: '4px 8px',
              }}
            >
              {[5, 4, 3, 2, 1].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <textarea
            placeholder="Комментарий"
            value={form.comment}
            onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
            style={{
              width: '100%',
              height: '100px',
              background: '#121214',
              border: '1px solid #27272a',
              color: '#fff',
              padding: '12px',
              borderRadius: '8px',
            }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <input
              placeholder="Достоинства"
              value={form.pros}
              onChange={(e) => setForm((f) => ({ ...f, pros: e.target.value }))}
              style={{
                background: '#121214',
                border: '1px solid #27272a',
                color: '#fff',
                padding: '12px',
                borderRadius: '8px',
              }}
            />
            <input
              placeholder="Недостатки"
              value={form.cons}
              onChange={(e) => setForm((f) => ({ ...f, cons: e.target.value }))}
              style={{
                background: '#121214',
                border: '1px solid #27272a',
                color: '#fff',
                padding: '12px',
                borderRadius: '8px',
              }}
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
