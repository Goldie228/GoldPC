import { useState, type ReactElement } from 'react';
import { Button } from '../../../components/ui/Button';
import type { ProductReview, UpdateReviewRequest } from '../../../api/types';

export interface ProductReviewCardProps {
  review: ProductReview;
  productId: string;
  currentUserId?: string;
  onUpdate?: (reviewId: string, data: UpdateReviewRequest) => Promise<boolean>;
  onDelete?: (reviewId: string) => Promise<boolean>;
  onHelpful?: (reviewId: string) => Promise<{ helpful: number } | null>;
}

export function ProductReviewCard({
  review,
  productId,
  currentUserId,
  onUpdate,
  onDelete,
  onHelpful,
}: ProductReviewCardProps): ReactElement {
  const isOwn = review.userId === currentUserId;

  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpful ?? 0);
  const [helpfulLoading, setHelpfulLoading] = useState(false);

  const [editForm, setEditForm] = useState<UpdateReviewRequest>({
    rating: review.rating,
    comment: review.comment ?? '',
    pros: review.pros ?? '',
    cons: review.cons ?? '',
    title: review.title ?? '',
  });

  /* ---------- Helpful ---------- */
  const handleHelpful = async () => {
    if (helpfulLoading || !onHelpful) return;
    setHelpfulLoading(true);
    try {
      const result = await onHelpful(review.id);
      if (result != null) {
        setHelpfulCount(result.helpful);
      }
    } catch {
      // silently fail — helpful is non-critical
    } finally {
      setHelpfulLoading(false);
    }
  };

  /* ---------- Edit ---------- */
  const startEditing = () => {
    setEditForm({
      rating: review.rating,
      comment: review.comment ?? '',
      pros: review.pros ?? '',
      cons: review.cons ?? '',
      title: review.title ?? '',
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (saving || !onUpdate) return;
    setSaving(true);
    try {
      const success = await onUpdate(review.id, editForm);
      if (success) {
        setIsEditing(false);
      }
    } catch {
      // parent handles toast
    } finally {
      setSaving(false);
    }
  };

  const setEditRating = (next: number) => {
    setEditForm((f) => ({ ...f, rating: Math.max(1, Math.min(5, next)) }));
  };

  /* ---------- Delete ---------- */
  const handleDeleteConfirm = async () => {
    if (deleting || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(review.id);
      // parent removes review from list — no local state change needed
    } catch {
      setDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(false);
  };

  /* ---------- Star rating component (edit mode) ---------- */
  const editStarRating = (
    <div
      className="inline-flex items-center gap-1 p-1.5 rounded-lg bg-surface-elevated border border-border"
      role="radiogroup"
      aria-label="Оценка"
    >
      {Array.from({ length: 5 }, (_, i) => {
        const star = i + 1;
        const isActive = star <= editForm.rating;
        return (
          <button
            key={star}
            type="button"
            className={`w-8 h-8 inline-flex items-center justify-center border border-transparent bg-transparent rounded-lg cursor-pointer transition-all duration-150 hover:bg-primary/10 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
              isActive ? 'text-primary' : 'text-muted-foreground'
            }`}
            role="radio"
            aria-checked={editForm.rating === star}
            aria-label={`${star} из 5`}
            disabled={saving}
            onClick={() => setEditRating(star)}
          >
            <span aria-hidden>{isActive ? '★' : '☆'}</span>
          </button>
        );
      })}
      <span className="font-mono text-sm text-muted-foreground ml-2" aria-hidden>
        {editForm.rating}/5
      </span>
    </div>
  );

  return (
    <article className="bg-card border border-border rounded-xl p-6" aria-label={`Отзыв от ${review.userName}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">{review.userName}</span>
          {isOwn && (
            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-primary/15 text-primary">
              Вы
            </span>
          )}
          {review.isVerified && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-price-drop/10 text-price-drop">
              <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
              </svg>
              Подтверждённая покупка
            </span>
          )}
        </div>
        <time className="text-xs text-muted-foreground" dateTime={review.createdAt}>
          {new Date(review.createdAt).toLocaleDateString('ru-RU')}
        </time>
      </div>

      {/* Rating — static or editable */}
      {isEditing ? (
        <div className="mb-3">{editStarRating}</div>
      ) : (
        <div className="text-primary text-sm mb-3" aria-hidden>
          {'★'.repeat(review.rating)}
          {'☆'.repeat(5 - review.rating)}
        </div>
      )}

      {/* Comment — static or editable */}
      {isEditing ? (
        <textarea
          value={editForm.comment}
          onChange={(e) => setEditForm((f) => ({ ...f, comment: e.target.value }))}
          className="w-full h-[120px] bg-surface-elevated border border-border text-foreground p-3 rounded-lg resize-y focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(252,213,53,0.15)] mb-3"
          placeholder="Комментарий"
          disabled={saving}
        />
      ) : (
        review.comment?.trim() ? (
          <p className="mb-4 leading-relaxed text-foreground">{review.comment}</p>
        ) : null
      )}

      {/* Pros / Cons — static or editable */}
      {isEditing ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 mb-4">
          <input
            value={editForm.pros}
            onChange={(e) => setEditForm((f) => ({ ...f, pros: e.target.value }))}
            className="bg-surface-elevated border border-border text-foreground p-3 rounded-lg focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(252,213,53,0.15)]"
            placeholder="Достоинства"
            disabled={saving}
          />
          <input
            value={editForm.cons}
            onChange={(e) => setEditForm((f) => ({ ...f, cons: e.target.value }))}
            className="bg-surface-elevated border border-border text-foreground p-3 rounded-lg focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(252,213,53,0.15)]"
            placeholder="Недостатки"
            disabled={saving}
          />
        </div>
      ) : (review.pros || review.cons) ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 mb-4">
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
      ) : null}

      {/* Bottom row: helpful + actions */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
        {/* Helpful button */}
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0"
          onClick={() => void handleHelpful()}
          disabled={helpfulLoading || !onHelpful}
        >
          {helpfulLoading ? '...' : `Был полезен? (${helpfulCount})`}
        </button>

        {/* Own review actions */}
        {isOwn && !isEditing && !deleteConfirm && (
          <div className="flex items-center gap-2">
            {onUpdate && (
              <Button variant="outline" size="sm" onClick={startEditing}>
                Редактировать
              </Button>
            )}
            {onDelete && (
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(true)}>
                Удалить
              </Button>
            )}
          </div>
        )}

        {/* Delete confirmation */}
        {isOwn && deleteConfirm && !isEditing && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground">Удалить отзыв?</span>
            <Button variant="danger" size="sm" onClick={() => void handleDeleteConfirm()} disabled={deleting}>
              {deleting ? 'Удаление...' : 'Да, удалить'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeleteCancel} disabled={deleting}>
              Отмена
            </Button>
          </div>
        )}

        {/* Edit mode save/cancel */}
        {isOwn && isEditing && (
          <div className="flex items-center gap-2">
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
            <Button variant="outline" size="sm" onClick={cancelEditing} disabled={saving}>
              Отмена
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}