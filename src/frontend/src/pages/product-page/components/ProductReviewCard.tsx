import type { ReactElement } from 'react';
import type { ProductReview } from '../../../api/types';

export interface ProductReviewCardProps {
  review: ProductReview;
}

export function ProductReviewCard({ review }: ProductReviewCardProps): ReactElement {
  return (
    <article className="bg-card border border-border rounded-xl p-6" aria-label={`Отзыв от ${review.userName}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <span className="font-semibold text-foreground">{review.userName}</span>
        <time className="text-xs text-muted-foreground" dateTime={review.createdAt}>
          {new Date(review.createdAt).toLocaleDateString('ru-RU')}
        </time>
      </div>

      {/* Rating */}
      <div className="text-primary text-sm mb-3" aria-hidden>
        {'★'.repeat(review.rating)}
        {'☆'.repeat(5 - review.rating)}
      </div>

      {/* Comment */}
      {review.comment?.trim() ? (
        <p className="mb-4 leading-relaxed text-foreground">{review.comment}</p>
      ) : null}

      {/* Pros / Cons */}
      {(review.pros || review.cons) && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {review.pros && (
            <div className="text-sm">
              <strong className="text-price-drop block text-xs font-bold uppercase tracking-wider mb-1">Достоинства</strong>
              <span className="text-foreground">{review.pros}</span>
            </div>
          )}
          {review.cons && (
            <div className="text-sm">
              <strong className="text-destructive block text-xs font-bold uppercase tracking-wider mb-1">Недостатки</strong>
              <span className="text-foreground">{review.cons}</span>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
