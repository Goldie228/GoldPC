/**
 * Accountant Reports Page
 * Страница финансовых отчётов для бухгалтера
 * Основано на prototypes/accountant-reports.html
 */

import { useState } from 'react';
import './ReportsPage.css';

// Моковые данные финансовой статистики
const MOCK_STATS = {
  monthlyRevenue: 45230,
  ordersCount: 128,
  averageCheck: 353,
  servicesCount: 47,
};

interface FinancialStats {
  monthlyRevenue: number;
  ordersCount: number;
  averageCheck: number;
  servicesCount: number;
  profit: number;
}

function formatPrice(price: number): string {
  return price.toLocaleString('ru-BY') + ' BYN';
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function ReportsPage() {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [dateFrom, setDateFrom] = useState(formatDate(firstDayOfMonth));
  const [dateTo, setDateTo] = useState(formatDate(today));
  const [isGenerating, setIsGenerating] = useState(false);
  const [stats, setStats] = useState<FinancialStats | null>(null);

  const handleGenerateReport = async () => {
    setIsGenerating(true);

    // Имитация генерации отчёта
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Генерация демо-данных на основе выбранного периода
    const daysDiff = Math.ceil(
      (new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    const factor = daysDiff / 30; // Нормализация к месяцу

    const generatedStats: FinancialStats = {
      monthlyRevenue: Math.round(MOCK_STATS.monthlyRevenue * factor),
      ordersCount: Math.round(MOCK_STATS.ordersCount * factor),
      averageCheck: MOCK_STATS.averageCheck,
      servicesCount: Math.round(MOCK_STATS.servicesCount * factor),
      profit: Math.round(MOCK_STATS.monthlyRevenue * factor * 0.23), // 23% прибыль
    };

    setStats(generatedStats);
    setIsGenerating(false);
  };

  return (
    <div className="reports-page">
      <header className="reports-page__header">
        <div className="reports-page__title-section">
          <h1 className="reports-page__title">Финансовые отчёты</h1>
          <p className="reports-page__subtitle">
            Формирование отчётов за выбранный период
          </p>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card__label">Выручка за месяц</div>
          <div className="stat-card__value stat-card__value--accent">
            {stats ? formatPrice(stats.monthlyRevenue) : formatPrice(MOCK_STATS.monthlyRevenue)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Заказов</div>
          <div className="stat-card__value">
            {stats ? stats.ordersCount : MOCK_STATS.ordersCount}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Средний чек</div>
          <div className="stat-card__value">{MOCK_STATS.averageCheck} BYN</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Услуг оказано</div>
          <div className="stat-card__value">
            {stats ? stats.servicesCount : MOCK_STATS.servicesCount}
          </div>
        </div>
      </div>

      {/* Report Period Card */}
      <div className="reports-card">
        <div className="reports-card__title">
          <svg
            className="reports-card__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Период отчёта
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Дата начала</label>
            <input
              type="date"
              className="form-input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Дата окончания</label>
            <input
              type="date"
              className="form-input"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            className="btn btn--primary"
            onClick={handleGenerateReport}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <span className="loading-spinner"></span>
                Генерация...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Сформировать отчёт
              </>
            )}
          </button>
          <button className="btn btn--ghost">Предпросмотр</button>
        </div>
      </div>

      {/* Generated Report Results */}
      {stats && (
        <div className="reports-card reports-card--results">
          <div className="reports-card__title">
            <svg
              className="reports-card__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            Результаты отчёта
          </div>

          <div className="report-results">
            <div className="report-results__row">
              <span className="report-results__label">Период:</span>
              <span className="report-results__value">
                {new Date(dateFrom).toLocaleDateString('ru-RU')} —{' '}
                {new Date(dateTo).toLocaleDateString('ru-RU')}
              </span>
            </div>
            <div className="report-results__row">
              <span className="report-results__label">Выручка:</span>
              <span className="report-results__value report-results__value--accent">
                {formatPrice(stats.monthlyRevenue)}
              </span>
            </div>
            <div className="report-results__row">
              <span className="report-results__label">Прибыль:</span>
              <span className="report-results__value report-results__value--profit">
                {formatPrice(stats.profit)}
              </span>
            </div>
            <div className="report-results__row">
              <span className="report-results__label">Рентабельность:</span>
              <span className="report-results__value">
                {((stats.profit / stats.monthlyRevenue) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="report-results__row">
              <span className="report-results__label">Количество заказов:</span>
              <span className="report-results__value">{stats.ordersCount}</span>
            </div>
            <div className="report-results__row">
              <span className="report-results__label">Оказано услуг:</span>
              <span className="report-results__value">{stats.servicesCount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsPage;