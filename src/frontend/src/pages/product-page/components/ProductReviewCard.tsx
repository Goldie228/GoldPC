import type { ReactElement } from 'react';
import type { ProductReview } from '../../../api/types';

export interface ProductReviewCardProps {
  review: ProductReview;
}

export function ProductReviewCard({ review }: ProductReviewCardProps): ReactElement {
  return (
    <article className="p-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl" aria-label={`Отзыв от ${review.userName}`}>
      <div className="flex justify-between mb-4">
        <span className="font-semibold text-[var(--fg)]">{review.userName}</span>
        <time className="text-xs text-[var(--fg-dim)]" dateTime={review.createdAt}>
          {new Date(review.createdAt).toLocaleDateString('ru-RU')}
        </time>
      </div>
      <div className="text-[var(--accent)] text-sm mb-3" style={{ fontSize: '0.9rem', marginBottom: '12px' }} aria-hidden>
        {'★'.repeat(review.rating)}
        {'☆'.repeat(5 - review.rating)}
      </div>
      {review.comment?.trim() ? (
        <p className="mb-4 leading-6">{review.comment}</p>
      ) : null}
      {(review.pros || review.cons) && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {review.pros && (
            <div className="text-sm">
              <strong className="text-[var(--color-emerald-500)] block text-xs font-bold uppercase tracking-[0.05em] mb-1">Достоинства</strong>
              {review.pros}
            </div>
          )}
          {review.cons && (
            <div className="text-sm">
              <strong className="text-[var(--error)] block text-xs font-bold uppercase tracking-[0.05em] mb-1">Недостатки</strong>
              {review.cons}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
