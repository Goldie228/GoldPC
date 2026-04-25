import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { serviceTicketsApi, type ServiceTicket, TICKET_STATUSES } from '../../api/service-tickets';
import { useToastStore } from '../../store/toastStore';
import { Wrench, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import styles from "./AccountRepairs.module.css";

function getStatusLabel(status: string): string {
  const statusItem = TICKET_STATUSES.find(s => s.key === status);
  return statusItem?.label || status;
}

function getStatusColor(status: string): string {
  const statusItem = TICKET_STATUSES.find(s => s.key === status);
  return statusItem?.color || 'gray';
}

/**
 * AccountRepairs - My Repairs page for customers
 *
 * Features:
 * - Repair ticket stats cards
 * - Filter buttons by status
 * - Tickets list with status badges
 * - Link to ticket detail page
 * - Real-time status updates via polling
 */
export function AccountRepairs() {
  const navigate = useNavigate();
  const showToast = useToastStore(state => state.showToast);

  const [activeFilter, setActiveFilter] = useState('all');
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [page] = useState(1);

  const pageSize = 10;

  useEffect(() => {
    loadTickets();

    // Poll for updates every 30 seconds
    const interval = setInterval(loadTickets, 30000);
    return () => clearInterval(interval);
  }, [page, activeFilter]);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const result = await serviceTicketsApi.getMyTickets(page, pageSize, activeFilter === 'all' ? undefined : activeFilter);
      setTickets(result.items);
    } catch {
      showToast('Ошибка загрузки списка ремонтов', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, activeFilter, showToast]);

  const stats = {
    total: tickets.length,
    active: tickets.filter(t => !['Completed', 'Cancelled'].includes(t.status)).length,
    completed: tickets.filter(t => t.status === 'Completed').length,
    urgent: tickets.filter(t => t.priority === 'urgent' || t.status === 'Ready').length,
  };

  const filterOptions = [
    { key: 'all', label: 'Все' },
    { key: 'New', label: 'Новые' },
    { key: 'Diagnosing', label: 'Диагностика' },
    { key: 'Repairing', label: 'В ремонте' },
    { key: 'Ready', label: 'Готовы' },
    { key: 'Completed', label: 'Завершённые' },
  ];

  if (loading && tickets.length === 0) {
    return (
      <div className="account-repairs">
        <div className="loading">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="account-repairs">
      <div className="account-repairs__header">
        <h1>Мои ремонты</h1>
        <Link to="/service-request" className="btn btn-primary">
          <Wrench size={18} />
          Новый запрос на ремонт
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="account-repairs__stats">
        <div className="stats-card">
          <div className="stats-card__icon blue">
            <Wrench />
          </div>
          <div className="stats-card__content">
            <div className="stats-card__value">{stats.total}</div>
            <div className="stats-card__label">Всего заявок</div>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-card__icon yellow">
            <Clock />
          </div>
          <div className="stats-card__content">
            <div className="stats-card__value">{stats.active}</div>
            <div className="stats-card__label">В работе</div>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-card__icon green">
            <CheckCircle />
          </div>
          <div className="stats-card__content">
            <div className="stats-card__value">{stats.completed}</div>
            <div className="stats-card__label">Завершено</div>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-card__icon red">
            <AlertCircle />
          </div>
          <div className="stats-card__content">
            <div className="stats-card__value">{stats.urgent}</div>
            <div className="stats-card__label">Требуют внимания</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="account-repairs__filters">
        {filterOptions.map(filter => (
          <button
            key={filter.key}
            className={`filter-btn ${activeFilter === filter.key ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter.key)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Tickets List */}
      <div className="account-repairs__list">
        {tickets.length === 0 ? (
          <div className="empty-state">
            <Wrench size={48} className="empty-state__icon" />
            <h3>У вас пока нет заявок на ремонт</h3>
            <p>Вы можете отправить устройство на диагностику и ремонт</p>
            <Link to="/service-request" className="btn btn-primary">
              Создать заявку
            </Link>
          </div>
        ) : (
          <div className="tickets-table">
            <div className="tickets-table__header">
              <div className="tickets-table__cell">Номер</div>
              <div className="tickets-table__cell">Устройство</div>
              <div className="tickets-table__cell">Статус</div>
              <div className="tickets-table__cell">Дата создания</div>
              <div className="tickets-table__cell">Действия</div>
            </div>

            {tickets.map(ticket => (
              <div key={ticket.id} className="tickets-table__row">
                <div className="tickets-table__cell">
                  <span className="ticket-number">#{ticket.ticketNumber}</span>
                </div>
                <div className="tickets-table__cell">
                  <div className="device-info">
                    <div className="device-type">{ticket.deviceType}</div>
                    <div className="device-model">{ticket.brand} {ticket.model}</div>
                  </div>
                </div>
                <div className="tickets-table__cell">
                  <span className={`status-badge status-badge--${getStatusColor(ticket.status)}`}>
                    {getStatusLabel(ticket.status)}
                  </span>
                </div>
                <div className="tickets-table__cell">
                  {new Date(ticket.createdAt).toLocaleDateString('ru-RU')}
                </div>
                <div className="tickets-table__cell">
                  <Link
                    to={`/my-repairs/${ticket.id}`}
                    className="btn btn-sm btn-outline"
                  >
                    Подробнее
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
