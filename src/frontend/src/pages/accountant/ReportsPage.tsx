/**
 * Accountant Reports Page
 * Страница финансовых отчётов для бухгалтера
 * Основано на prototypes/accountant-reports.html
 */

import { useState } from 'react';

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
    <div className="pt-[100px] px-[var(--space-md)] pb-12 mx-auto min-h-screen bg-[var(--bg)] text-[var(--fg)] max-w-[1400px]">
      <header className="flex items-center justify-between gap-[var(--space-md)] mb-[var(--space-lg)] flex-wrap">
        <div>
          <h1 className="font-[var(--font-display)] text-[var(--text-3xl)] font-[var(--font-semibold)] tracking-[-0.02em] mb-1 text-[var(--fg)]">
            Финансовые отчёты
          </h1>
          <p className="text-[var(--text-sm)] text-[var(--fg-muted)] m-0">
            Формирование отчётов за выбранный период
          </p>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-5">
          <div className="text-[0.7rem] text-[var(--fg-dim)] uppercase tracking-[0.08em] mb-2">Выручка за месяц</div>
          <div className="font-[var(--font-mono)] text-2xl font-medium text-[var(--accent)]">
            {stats ? formatPrice(stats.monthlyRevenue) : formatPrice(MOCK_STATS.monthlyRevenue)}
          </div>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-5">
          <div className="text-[0.7rem] text-[var(--fg-dim)] uppercase tracking-[0.08em] mb-2">Заказов</div>
          <div className="font-[var(--font-mono)] text-2xl font-medium">
            {stats ? stats.ordersCount : MOCK_STATS.ordersCount}
          </div>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-5">
          <div className="text-[0.7rem] text-[var(--fg-dim)] uppercase tracking-[0.08em] mb-2">Средний чек</div>
          <div className="font-[var(--font-mono)] text-2xl font-medium">{MOCK_STATS.averageCheck} BYN</div>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-5">
          <div className="text-[0.7rem] text-[var(--fg-dim)] uppercase tracking-[0.08em] mb-2">Услуг оказано</div>
          <div className="font-[var(--font-mono)] text-2xl font-medium">
            {stats ? stats.servicesCount : MOCK_STATS.servicesCount}
          </div>
        </div>
      </div>

      {/* Report Period Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 mb-6">
        <div className="text-[0.9rem] font-semibold mb-5 flex items-center gap-2.5 pb-4 border-b border-[var(--border)]">
          <svg
            className="w-[18px] h-[18px] text-[var(--accent)]"
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

        <div className="grid grid-cols-2 gap-4">
          <div className="mb-5">
            <label className="block text-[0.75rem] font-medium text-[var(--fg-muted)] mb-2 uppercase tracking-[0.05em]">Дата начала</label>
            <input
              type="date"
              className="w-full p-3 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--fg)] font-[var(--font-mono)] text-[0.85rem] transition-colors duration-[var(--transition-base)] focus:outline-none focus:border-[var(--accent)]"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="mb-5">
            <label className="block text-[0.75rem] font-medium text-[var(--fg-muted)] mb-2 uppercase tracking-[0.05em]">Дата окончания</label>
            <input
              type="date"
              className="w-full p-3 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--fg)] font-[var(--font-mono)] text-[0.85rem] transition-colors duration-[var(--transition-base)] focus:outline-none focus:border-[var(--accent)]"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            className="inline-flex items-center gap-2.5 px-6 py-3.5 font-[var(--font-sans)] text-[0.85rem] font-semibold border-none cursor-pointer transition-all duration-[var(--transition-base)] bg-[var(--accent)] text-[var(--bg)] hover:bg-[var(--accent-bright)] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0"
            onClick={() => void handleGenerateReport()}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <span className="w-4 h-4 border-2 border-[var(--bg)] border-t-transparent rounded-full animate-spin"></span>
                Генерация...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Сформировать отчёт
              </>
            )}
          </button>
          <button className="inline-flex items-center gap-2.5 px-6 py-3.5 font-[var(--font-sans)] text-[0.85rem] font-semibold border-none cursor-pointer transition-all duration-[var(--transition-base)] bg-transparent text-[var(--fg)] border border-[var(--border)] hover:border-[var(--fg-dim)] hover:bg-[var(--bg-card)]">
            Предпросмотр
          </button>
        </div>
      </div>

      {/* Generated Report Results */}
      {stats && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-accent)] p-6 mb-6">
          <div className="text-[0.9rem] font-semibold mb-5 flex items-center gap-2.5 pb-4 border-b border-[var(--border)]">
            <svg
              className="w-[18px] h-[18px] text-[var(--accent)]"
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

          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center py-3 border-b border-[var(--border)]">
              <span className="text-[0.85rem] text-[var(--fg-muted)]">Период:</span>
              <span className="font-[var(--font-mono)] text-[0.95rem] font-medium">
                {new Date(dateFrom).toLocaleDateString('ru-RU')} —{' '}
                {new Date(dateTo).toLocaleDateString('ru-RU')}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-[var(--border)]">
              <span className="text-[0.85rem] text-[var(--fg-muted)]">Выручка:</span>
              <span className="font-[var(--font-mono)] text-[0.95rem] font-medium text-[var(--accent)]">
                {formatPrice(stats.monthlyRevenue)}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-[var(--border)]">
              <span className="text-[0.85rem] text-[var(--fg-muted)]">Прибыль:</span>
              <span className="font-[var(--font-mono)] text-[0.95rem] font-medium text-green-500">
                {formatPrice(stats.profit)}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-[var(--border)]">
              <span className="text-[0.85rem] text-[var(--fg-muted)]">Рентабельность:</span>
              <span className="font-[var(--font-mono)] text-[0.95rem] font-medium">
                {((stats.profit / stats.monthlyRevenue) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-[var(--border)]">
              <span className="text-[0.85rem] text-[var(--fg-muted)]">Количество заказов:</span>
              <span className="font-[var(--font-mono)] text-[0.95rem] font-medium">{stats.ordersCount}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-[var(--border)] last:border-b-0">
              <span className="text-[0.85rem] text-[var(--fg-muted)]">Оказано услуг:</span>
              <span className="font-[var(--font-mono)] text-[0.95rem] font-medium">{stats.servicesCount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsPage;