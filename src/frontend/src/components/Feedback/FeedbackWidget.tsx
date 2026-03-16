import { useState } from 'react';
import api from '../../api';
import './FeedbackWidget.css';

/**
 * Тип обратной связи
 */
type FeedbackType = 'bug' | 'idea';

/**
 * Данные для отправки обратной связи
 */
interface FeedbackData {
  type: FeedbackType;
  rating: number;
  comment: string;
  page: string;
}

/**
 * Виджет для сбора обратной связи от пользователей
 * Плавающая кнопка, открывающая модальное окно
 */
export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [type, setType] = useState<FeedbackType>('bug');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Пожалуйста, поставьте оценку');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const feedbackData: FeedbackData = {
        type,
        rating,
        comment: comment.trim(),
        page: window.location.pathname,
      };

      await api.post('/feedback', feedbackData);
      
      setIsSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
        setIsOpen(false);
        setRating(0);
        setComment('');
        setType('bug');
        setIsSuccess(false);
      }, 2000);
    } catch (err) {
      setError('Не удалось отправить отзыв. Попробуйте позже.');
      console.error('Feedback submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setRating(0);
    setHoveredRating(0);
    setComment('');
    setType('bug');
    setError(null);
    setIsSuccess(false);
  };

  const getTypeLabel = (feedbackType: FeedbackType): string => {
    return feedbackType === 'bug' ? '🐛 Баг' : '💡 Идея';
  };

  const getTypeDescription = (feedbackType: FeedbackType): string => {
    return feedbackType === 'bug' 
      ? 'Сообщите о проблеме или ошибке' 
      : 'Предложите новую функцию или улучшение';
  };

  return (
    <div className="feedback-widget">
      {/* Floating button */}
      <button
        className="feedback-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Оставить обратную связь"
        title="Обратная связь"
      >
        💬
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div className="feedback-overlay" onClick={handleClose}>
          <div 
            className="feedback-modal" 
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="feedback-title"
          >
            {/* Header */}
            <div className="feedback-header">
              <h3 id="feedback-title">Обратная связь</h3>
              <button 
                className="feedback-close" 
                onClick={handleClose}
                aria-label="Закрыть"
              >
                ✕
              </button>
            </div>

            {/* Success state */}
            {isSuccess ? (
              <div className="feedback-success">
                <span className="success-icon">✅</span>
                <p>Спасибо за ваш отзыв!</p>
              </div>
            ) : (
              <>
                {/* Type selection */}
                <div className="feedback-section">
                  <label className="feedback-label">Тип обращения</label>
                  <div className="feedback-type-buttons">
                    <button
                      className={`feedback-type-btn ${type === 'bug' ? 'active' : ''}`}
                      onClick={() => setType('bug')}
                      type="button"
                    >
                      🐛 Баг
                    </button>
                    <button
                      className={`feedback-type-btn ${type === 'idea' ? 'active' : ''}`}
                      onClick={() => setType('idea')}
                      type="button"
                    >
                      💡 Идея
                    </button>
                  </div>
                  <p className="feedback-type-description">
                    {getTypeDescription(type)}
                  </p>
                </div>

                {/* Rating */}
                <div className="feedback-section">
                  <label className="feedback-label">Оценка</label>
                  <div className="feedback-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        className={`feedback-star ${
                          star <= (hoveredRating || rating) ? 'active' : ''
                        }`}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        type="button"
                        aria-label={`Оценка ${star} из 5`}
                      >
                        ⭐
                      </button>
                    ))}
                    <span className="feedback-rating-text">
                      {rating > 0 ? `${rating} из 5` : 'Выберите оценку'}
                    </span>
                  </div>
                </div>

                {/* Comment */}
                <div className="feedback-section">
                  <label className="feedback-label" htmlFor="feedback-comment">
                    Комментарий
                  </label>
                  <textarea
                    id="feedback-comment"
                    className="feedback-textarea"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={
                      type === 'bug'
                        ? 'Опишите, что произошло...'
                        : 'Опишите вашу идею...'
                    }
                    rows={4}
                    maxLength={1000}
                  />
                  <span className="feedback-char-count">
                    {comment.length}/1000
                  </span>
                </div>

                {/* Error message */}
                {error && (
                  <div className="feedback-error">
                    ⚠️ {error}
                  </div>
                )}

                {/* Submit button */}
                <div className="feedback-actions">
                  <button
                    className="feedback-submit"
                    onClick={handleSubmit}
                    disabled={isSubmitting || rating === 0}
                    type="button"
                  >
                    {isSubmitting ? 'Отправка...' : 'Отправить'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FeedbackWidget;