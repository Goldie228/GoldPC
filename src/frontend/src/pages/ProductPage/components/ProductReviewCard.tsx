import type { ReactElement } from 'react';
import type { ProductReview } from '../../../api/types';
import styles from '../ProductPage.module.css';

export interface ProductReviewCardProps {
  review: ProductReview;
}

export function ProductReviewCard({ review }: ProductReviewCardProps): ReactElement {
  return (
    <article className={styles.reviewItem} aria-label={`Отзыв от ${review.userName}`}>
      <div className={styles.reviewMeta}>
        <span className={styles.reviewer}>{review.userName}</span>
        <time className={styles.reviewDate} dateTime={review.createdAt}>
          {new Date(review.createdAt).toLocaleDateString('ru-RU')}
        </time>
      </div>
      <div className={styles.stars} style={{ fontSize: '0.9rem', marginBottom: '12px' }} aria-hidden>
        {'★'.repeat(review.rating)}
        {'☆'.repeat(5 - review.rating)}
      </div>
      {review.comment?.trim() ? (
        <p className={styles.reviewText}>{review.comment}</p>
      ) : null}
      {(review.pros || review.cons) && (
        <div className={styles.reviewProsCons}>
          {review.pros && (
            <div className={styles.pros}>
              <strong>Достоинства</strong>
              {review.pros}
            </div>
          )}
          {review.cons && (
            <div className={styles.cons}>
              <strong>Недостатки</strong>
              {review.cons}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
