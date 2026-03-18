/**
 * StatCard Component
 * Карточка статистики для административной панели
 * Стиль: тёмная карта, золотой текст значения (JetBrains Mono)
 */

import './StatCard.css';

export interface StatCardProps {
  /** Заголовок карточки */
  title: string;
  /** Значение статистики */
  value: string | number;
  /** Иконка (SVG элемент) */
  icon: React.ReactNode;
  /** Опциональное изменение значения (в процентах) */
  change?: number;
  /** Метка для изменения (например, "за месяц") */
  changeLabel?: string;
  /** Дополнительный CSS класс */
  className?: string;
}

/**
 * Компонент карточки статистики
 * Используется для отображения ключевых метрик в Admin Dashboard
 */
export function StatCard({
  title,
  value,
  icon,
  change,
  changeLabel,
  className = '',
}: StatCardProps) {
  const hasChange = change !== undefined;
  const isPositive = hasChange && change >= 0;

  return (
    <div className={`stat-card ${className}`}>
      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__title">{title}</div>
      <div className="stat-card__value">{value}</div>
      {hasChange && (
        <div
          className={`stat-card__change ${
            isPositive ? 'stat-card__change--positive' : 'stat-card__change--negative'
          }`}
        >
          {isPositive ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              width="14"
              height="14"
              aria-hidden="true"
            >
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              width="14"
              height="14"
              aria-hidden="true"
            >
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
              <polyline points="17 18 23 18 23 12" />
            </svg>
          )}
          <span className="stat-card__change-value">
            {isPositive ? '+' : ''}
            {change}%
          </span>
          {changeLabel && <span className="stat-card__change-label"> {changeLabel}</span>}
        </div>
      )}
    </div>
  );
}

export default StatCard;