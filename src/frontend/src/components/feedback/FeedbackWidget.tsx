import { useState } from 'react';
import api from '@/api';

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
      
      // Сброс формы после успешной отправки
      setTimeout(() => {
        setIsOpen(false);
        setRating(0);
        setComment('');
        setType('bug');
        setIsSuccess(false);
      }, 2000);
    } catch (err) {
      setError('Не удалось отправить отзыв. Попробуйте позже.');
      console.error('Ошибка отправки обратной связи:', err);
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

  const getTypeDescription = (feedbackType: FeedbackType): string => {
    return feedbackType === 'bug' 
      ? 'Сообщите о проблеме или ошибке' 
      : 'Предложите новую функцию или улучшение';
  };

  return (
    <div className="fixed bottom-6 right-6 z-[1000]">
      {/* Плавающая кнопка */}
      <button
        className="w-14 h-14 rounded-full border-none bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-white text-2xl cursor-pointer shadow-[0_4px_12px_rgba(102,126,234,0.4)] transition-all duration-300 flex items-center justify-center hover:scale-110 hover:shadow-[0_6px_20px_rgba(102,126,234,0.5)] active:scale-95"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Оставить обратную связь"
        title="Обратная связь"
      >
        💬
      </button>

        {/* Затемнение модального окна */}
      {isOpen && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-[1001] animate-[fadeIn_0.2s_ease]" onClick={handleClose}>
          <div 
            className="bg-white rounded-2xl p-6 w-full max-w-[400px] mx-4 shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-[slideUp_0.3s_ease]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="feedback-title"
          >
            {/* Заголовок */}
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-hairline-dark">
              <h3 id="feedback-title" className="m-0 text-xl font-semibold text-body-text">Обратная связь</h3>
              <button 
                className="bg-none border-none text-lg text-muted-foreground cursor-pointer px-2 py-1 rounded transition-all duration-200 hover:bg-surface-elevated hover:text-body-text"
                onClick={handleClose}
                aria-label="Закрыть"
              >
                ✕
              </button>
            </div>

            {/* Состояние успеха */}
            {isSuccess ? (
              <div className="text-center py-8">
                <span className="text-4xl block mb-4 animate-[scaleIn_0.3s_ease]">✅</span>
                <p className="text-lg text-body-text m-0">Спасибо за ваш отзыв!</p>
              </div>
            ) : (
              <>
                {/* Выбор типа */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-body-text mb-2">Тип обращения</label>
                  <div className="flex gap-3">
                    <button
                      className={`flex-1 px-4 py-3 border-2 border-hairline-dark rounded-lg bg-white text-base cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 hover:border-info-blue hover:bg-surface-card ${type === 'bug' ? 'border-info-blue bg-[linear-gradient(135deg,rgba(102,126,234,0.08)_0%,rgba(118,75,162,0.08)_100%)] text-info-blue font-medium' : ''}`}
                      onClick={() => setType('bug')}
                      type="button"
                    >
                      🐛 Баг
                    </button>
                    <button
                      className={`flex-1 px-4 py-3 border-2 border-hairline-dark rounded-lg bg-white text-base cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 hover:border-info-blue hover:bg-surface-card ${type === 'idea' ? 'border-info-blue bg-[linear-gradient(135deg,rgba(102,126,234,0.08)_0%,rgba(118,75,162,0.08)_100%)] text-info-blue font-medium' : ''}`}
                      onClick={() => setType('idea')}
                      type="button"
                    >
                      💡 Идея
                    </button>
                  </div>
                  <p className="mt-2 mb-0 text-xs text-muted-foreground">{getTypeDescription(type)}</p>
                </div>

                {/* Оценка */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-body-text mb-2">Оценка</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        className={`bg-none border-none text-2xl cursor-pointer p-1 transition-all duration-150 filter ${star <= (hoveredRating || rating) ? 'grayscale-0 opacity-100' : 'grayscale opacity-40'} hover:scale-115`}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        type="button"
                        aria-label={`Оценка ${star} из 5`}
                      >
                        ⭐
                      </button>
                    ))}
                    <span className="ml-3 text-sm text-muted-foreground">
                      {rating > 0 ? `${rating} из 5` : 'Выберите оценку'}
                    </span>
                  </div>
                </div>

                {/* Комментарий */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-body-text mb-2" htmlFor="feedback-comment">
                    Комментарий
                  </label>
                  <textarea
                    id="feedback-comment"
                    className="w-full p-3 border-2 border-hairline-dark rounded-lg text-sm font-inherit resize-y min-h-[100px] transition-colors duration-200 box-border focus:outline-none focus:border-info-blue placeholder:text-muted-foreground"
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
                  <span className="block text-right text-xs text-muted-foreground mt-1">
                    {comment.length}/1000
                  </span>
                </div>

                {/* Сообщение об ошибке */}
                {error && (
                  <div className="bg-price-rise/10 border border-price-rise/30 text-price-rise p-3 rounded-lg text-sm mb-4">
                    ⚠️ {error}
                  </div>
                )}

                {/* Кнопка отправки */}
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    className="px-6 py-3 bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-white border-none rounded-lg text-base font-medium cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(102,126,234,0.4)] disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={() => void handleSubmit()}
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
