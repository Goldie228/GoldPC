import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { StatCard } from '../../../components/admin';
import { statsApi } from '../../../api/admin';
import styles from './CoordinatorDashboard.module.css';

// ===== Types =====
type AgentTier = 'TIER-1' | 'TIER-2' | 'TIER-3';
type AgentStatusType = 'Active' | 'Idle' | 'Blocked' | 'Review';
type BlockerImpact = 'Low' | 'Medium' | 'High' | 'Critical';

interface Task {
  id: string;
  name: string;
  status: 'In Progress' | 'Review' | 'Blocked' | 'Done';
  progress: number;
}

interface AgentStatus {
  id: string;
  name: string;
  tier: AgentTier;
  currentModule: string;
  currentTasks: Task[];
  progress: number;
  status: AgentStatusType;
  lastUpdate: string;
  wipCount: number;
  wipLimit: number;
}

interface BlockerInfo {
  id: string;
  reporter: string;
  description: string;
  impact: BlockerImpact;
  affectedTasks: string[];
  assignedTo?: string;
  createdAt: string;
  resolvedAt?: string;
  eta?: string;
}

interface SprintMetrics {
  progress: number;
  startDate: string;
  endDate: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
}

interface CoordinatorDashboardData {
  agents: AgentStatus[];
  blockers: BlockerInfo[];
  metrics: SprintMetrics;
  lastUpdated: string;
  stats?: LocalDashboardStats;
}

// ===== Local Stats Types (для обратной совместимости) =====
interface LocalDashboardStats {
  totalSales: number;
  totalUsers: number;
  totalOrders: number;
  serviceTickets: number;
  salesChange: number;
  usersChange: number;
  ordersChange: number;
  ticketsChange: number;
}

const STATUS_COLORS: Record<AgentStatusType, string> = {
  Active: '🟢',
  Idle: '⚪',
  Blocked: '🔴',
  Review: '🟡',
};

const STATUS_LABELS: Record<AgentStatusType, string> = {
  Active: 'Активен',
  Idle: 'Ожидает',
  Blocked: 'Заблокирован',
  Review: 'На ревью',
};

const IMPACT_COLORS: Record<BlockerImpact, string> = {
  Low: 'blocker-impact--low',
  Medium: 'blocker-impact--medium',
  High: 'blocker-impact--high',
  Critical: 'blocker-impact--critical',
};

const IMPACT_LABELS: Record<BlockerImpact, string> = {
  Low: 'Низкий',
  Medium: 'Средний',
  High: 'Высокий',
  Critical: 'Критический',
};

// ===== Stats Grid Component with useQuery =====
function StatsGrid() {
  // Загрузка статистики через useQuery
  const { data, isLoading, error } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => statsApi.getStats(),
    refetchInterval: 60000, // Обновление каждую минуту
    staleTime: 30000, // Данные считаются свежими 30 секунд
  });

  // Состояние загрузки
  if (isLoading) {
    return (
      <div className="stats-grid stats-grid--loading">
        {[1, 2, 3].map((i) => (
          <div key={i} className="stat-card stat-card--skeleton">
            <div className="stat-card__skeleton-icon" />
            <div className="stat-card__skeleton-title" />
            <div className="stat-card__skeleton-value" />
          </div>
        ))}
      </div>
    );
  }

  // Состояние ошибки - показываем заглушку
  if (error || !data) {
    return (
      <div className="stats-grid stats-grid--error">
        <div className="stats-grid__error-message">
          <span>⚠️ Не удалось загрузить статистику</span>
        </div>
      </div>
    );
  }

  const { stats } = data;

  return (
    <div className="stats-grid">
      <StatCard
        title="Всего пользователей"
        value={stats.totalUsers.toLocaleString('ru-BY')}
        change={stats.usersChange}
        changeLabel="за месяц"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        }
      />
      <StatCard
        title="Всего заказов"
        value={stats.totalOrders.toLocaleString('ru-BY')}
        change={stats.ordersChange}
        changeLabel="за неделю"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        }
      />
      <StatCard
        title="Выручка (BYN)"
        value={stats.revenue.toLocaleString('ru-BY')}
        change={stats.revenueChange}
        changeLabel="за месяц"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        }
      />
    </div>
  );
}

function SprintProgressBar({ metrics }: { metrics: SprintMetrics }): React.ReactElement {
  const daysLeft = useMemo(() => Math.ceil(
    (new Date(metrics.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  ), [metrics.endDate]);

  return (
    <div className="sprint-progress">
      <div className="sprint-progress__header">
        <h2 className="sprint-progress__title">📉 Sprint Progress</h2>
        <span className="sprint-progress__eta">
          ETA: {new Date(metrics.endDate).toLocaleDateString('ru-RU')}
          {daysLeft > 0 && <span className="sprint-progress__days-left"> ({daysLeft} дн.)</span>}
        </span>
      </div>
      <div className="sprint-progress__bar-container">
        <div className="sprint-progress__bar" style={{ width: metrics.progress + '%' }}>
          <span className="sprint-progress__percentage">{metrics.progress}%</span>
        </div>
      </div>
      <div className="sprint-progress__stats">
        <div className="sprint-progress__stat">
          <span className="sprint-progress__stat-value">{metrics.totalTasks}</span>
          <span className="sprint-progress__stat-label">Всего задач</span>
        </div>
        <div className="sprint-progress__stat sprint-progress__stat--completed">
          <span className="sprint-progress__stat-value">{metrics.completedTasks}</span>
          <span className="sprint-progress__stat-label">Завершено</span>
        </div>
        <div className="sprint-progress__stat sprint-progress__stat--progress">
          <span className="sprint-progress__stat-value">{metrics.inProgressTasks}</span>
          <span className="sprint-progress__stat-label">В работе</span>
        </div>
        <div className="sprint-progress__stat sprint-progress__stat--blocked">
          <span className="sprint-progress__stat-value">{metrics.blockedTasks}</span>
          <span className="sprint-progress__stat-label">Заблокировано</span>
        </div>
      </div>
    </div>
  );
}

function AgentRow({ agent }: { agent: AgentStatus }) {
  const progressColor = 
    agent.progress >= 80 ? 'agent-progress--high' :
    agent.progress >= 50 ? 'agent-progress--medium' :
    'agent-progress--low';

  return (
    <tr className={'agent-row agent-row--' + agent.status.toLowerCase()}>
      <td className="agent-row__cell agent-row__cell--name">
        <div className="agent-info">
          <span className="agent-info__indicator">{STATUS_COLORS[agent.status]}</span>
          <div className="agent-info__details">
            <span className="agent-info__name">{agent.name}</span>
            <span className="agent-info__tier">{agent.tier}</span>
          </div>
        </div>
      </td>
      <td className="agent-row__cell agent-row__cell--module">
        <span className="module-badge">{agent.currentModule}</span>
      </td>
      <td className="agent-row__cell agent-row__cell--progress">
        <div className="progress-cell">
          <div className="progress-cell__bar-container">
            <div className={'progress-cell__bar ' + progressColor} style={{ width: agent.progress + '%' }} />
          </div>
          <span className="progress-cell__value">{agent.progress}%</span>
        </div>
      </td>
      <td className="agent-row__cell agent-row__cell--status">
        <span className={'status-badge status-badge--' + agent.status.toLowerCase()}>
          {STATUS_LABELS[agent.status]}
        </span>
      </td>
      <td className="agent-row__cell agent-row__cell--wip">
        <span className={'wip-badge ' + (agent.wipCount >= agent.wipLimit ? 'wip-badge--limit' : '')}>
          {agent.wipCount}/{agent.wipLimit}
        </span>
      </td>
      <td className="agent-row__cell agent-row__cell--tasks">
        <div className="tasks-list">
          {agent.currentTasks.slice(0, 2).map((task) => (
            <span key={task.id} className={'task-badge task-badge--' + task.status.toLowerCase().replace(' ', '-')} title={task.name}>
              {task.id}
            </span>
          ))}
          {agent.currentTasks.length > 2 && (
            <span className="task-badge task-badge--more">+{agent.currentTasks.length - 2}</span>
          )}
        </div>
      </td>
    </tr>
  );
}

function AgentStatusTable({ agents }: { agents: AgentStatus[] }) {
  return (
    <div className="agent-status">
      <div className="agent-status__header">
        <h2 className="agent-status__title">👥 Agent Status</h2>
        <span className="agent-status__count">
          {agents.filter(a => a.status === 'Active').length}/{agents.length} активных
        </span>
      </div>
      <div className="agent-status__table-container">
        <table className="agent-status__table">
          <thead>
            <tr>
              <th>Агент</th>
              <th>Модуль</th>
              <th>Прогресс</th>
              <th>Статус</th>
              <th>WIP</th>
              <th>Задачи</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <AgentRow key={agent.id} agent={agent} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BlockerCard({ blocker }: { blocker: BlockerInfo }) {
  const [expanded, setExpanded] = useState(false);
  
  const createdDate = new Date(blocker.createdAt).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={'blocker-card ' + IMPACT_COLORS[blocker.impact]}>
      <div className="blocker-card__header">
        <span className="blocker-card__id">{blocker.id}</span>
        <span className={'blocker-card__impact ' + IMPACT_COLORS[blocker.impact]}>
          {IMPACT_LABELS[blocker.impact]}
        </span>
      </div>
      <p className="blocker-card__description">{blocker.description}</p>
      <div className="blocker-card__meta">
        <span className="blocker-card__reporter">📌 {blocker.reporter}</span>
        <span className="blocker-card__time">🕐 {createdDate}</span>
      </div>
      {blocker.assignedTo && (
        <div className="blocker-card__assigned">
          <span className="blocker-card__assigned-label">Назначено:</span>
          <span className="blocker-card__assigned-to">{blocker.assignedTo}</span>
          {blocker.eta && <span className="blocker-card__eta">ETA: {blocker.eta}</span>}
        </div>
      )}
      <button className="blocker-card__expand" onClick={() => setExpanded(!expanded)}>
        {expanded ? '▲ Свернуть' : '▼ Подробнее'}
      </button>
      {expanded && (
        <div className="blocker-card__details">
          <div className="blocker-card__affected">
            <span className="blocker-card__affected-label">Затронутые задачи:</span>
            <div className="blocker-card__affected-tasks">
              {blocker.affectedTasks.map((task) => (
                <span key={task} className="affected-task">{task}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BlockersSection({ blockers }: { blockers: BlockerInfo[] }) {
  const activeBlockers = blockers.filter(b => !b.resolvedAt);
  const resolvedBlockers = blockers.filter(b => b.resolvedAt);
  
  return (
    <div className="blockers-section">
      <div className="blockers-section__header">
        <h2 className="blockers-section__title">
          🚨 Blockers
          {activeBlockers.length > 0 && (
            <span className="blockers-section__count">{activeBlockers.length}</span>
          )}
        </h2>
      </div>
      {activeBlockers.length === 0 ? (
        <div className="blockers-section__empty">
          <span className="blockers-section__empty-icon">✅</span>
          <span className="blockers-section__empty-text">Нет активных блокеров</span>
        </div>
      ) : (
        <div className="blockers-section__list">
          {activeBlockers.map((blocker) => (
            <BlockerCard key={blocker.id} blocker={blocker} />
          ))}
        </div>
      )}
      {resolvedBlockers.length > 0 && (
        <details className="blockers-section__resolved">
          <summary>Недавно разрешённые ({resolvedBlockers.length})</summary>
          <div className="blockers-section__resolved-list">
            {resolvedBlockers.slice(0, 3).map((blocker) => (
              <div key={blocker.id} className="resolved-blocker">
                <span className="resolved-blocker__id">{blocker.id}</span>
                <span className="resolved-blocker__desc">{blocker.description}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

export function CoordinatorDashboard() {
  const [data, setData] = useState<CoordinatorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/internal/coordinator/status');
      if (!response.ok) {
        throw new Error('Ошибка загрузки: ' + response.status);
      }
      const result: CoordinatorDashboardData = await response.json();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      console.error('Ошибка при загрузке данных dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  if (loading) {
    return (
      <div className="coordinator-dashboard coordinator-dashboard--loading">
        <div className="coordinator-dashboard__spinner" />
        <p>Загрузка данных координатора...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="coordinator-dashboard coordinator-dashboard--error">
        <span className="coordinator-dashboard__error-icon">⚠️</span>
        <h2>Ошибка загрузки</h2>
        <p>{error}</p>
        <button className="btn btn--primary" onClick={fetchData}>
          Попробовать снова
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="coordinator-dashboard">
      <header className="coordinator-dashboard__header">
        <div className="coordinator-dashboard__title-section">
          <h1 className="coordinator-dashboard__title">📊 Coordinator Dashboard</h1>
          <p className="coordinator-dashboard__subtitle">
            Панель управления параллельной разработкой GoldPC
          </p>
        </div>
        <div className="coordinator-dashboard__controls">
          <label className="auto-refresh-toggle">
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
            <span>Автообновление</span>
          </label>
          <button className="btn btn--secondary" onClick={fetchData} title="Обновить данные">
            🔄 Обновить
          </button>
        </div>
      </header>

      {/* Stats Grid - использует useQuery для загрузки статистики */}
      <section className="coordinator-dashboard__section coordinator-dashboard__section--stats">
        <StatsGrid />
      </section>

      <div className="coordinator-dashboard__content">
        <div className="coordinator-dashboard__main">
          <section className="coordinator-dashboard__section">
            <SprintProgressBar metrics={data.metrics} />
          </section>
          <section className="coordinator-dashboard__section">
            <AgentStatusTable agents={data.agents} />
          </section>
        </div>
        <aside className="coordinator-dashboard__sidebar">
          <BlockersSection blockers={data.blockers} />
        </aside>
      </div>
      <footer className="coordinator-dashboard__footer">
        <span className="coordinator-dashboard__last-update">
          Последнее обновление: {new Date(data.lastUpdated).toLocaleString('ru-RU')}
        </span>
      </footer>
    </div>
  );
}

export default CoordinatorDashboard;