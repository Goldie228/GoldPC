/**
 * Master Tickets Page
 * Страница списка заявок на сервис для мастеров
 * Основано на prototypes/master-tickets.html
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './TicketsPage.css';

type TicketPriority = 'high' | 'medium' | 'low';
type TicketStatus = 'new' | 'progress' | 'waiting' | 'done' | 'cancelled';

interface Ticket {
  id: string;
  customerName: string;
  customerPhone: string;
  deviceName: string;
  deviceSerial: string;
  problem: string;
  priority: TicketPriority;
  status: TicketStatus;
  date: string;
}

// Моковые данные для демонстрации
const MOCK_TICKETS: Ticket[] = [
  {
    id: 'TKT-1247',
    customerName: 'Алексей Петров',
    customerPhone: '+375 29 123-45-67',
    deviceName: 'Gigabyte RTX 4080 Gaming OC',
    deviceSerial: 'GV-N4080G-1792',
    problem: 'Артефакты на экране при нагрузке',
    priority: 'high',
    status: 'new',
    date: '2026-03-17',
  },
  {
    id: 'TKT-1246',
    customerName: 'Мария Иванова',
    customerPhone: '+375 44 987-65-43',
    deviceName: 'ASUS ROG Strix B650E-F',
    deviceSerial: 'MB-ASUS-B650-0891',
    problem: 'Не включается после обновления BIOS',
    priority: 'high',
    status: 'progress',
    date: '2026-03-16',
  },
  {
    id: 'TKT-1245',
    customerName: 'Дмитрий Козлов',
    customerPhone: '+375 33 555-44-33',
    deviceName: 'Corsair RM850x PSU',
    deviceSerial: 'CP-9020200-NA',
    problem: 'Шум вентилятора при нагрузке',
    priority: 'medium',
    status: 'waiting',
    date: '2026-03-15',
  },
  {
    id: 'TKT-1244',
    customerName: 'Елена Смирнова',
    customerPhone: '+375 29 777-88-99',
    deviceName: 'AMD Ryzen 9 7950X3D',
    deviceSerial: '100-000000904',
    problem: 'Перегрев под нагрузкой (>95°C)',
    priority: 'high',
    status: 'progress',
    date: '2026-03-14',
  },
  {
    id: 'TKT-1243',
    customerName: 'Игорь Волков',
    customerPhone: '+375 25 111-22-33',
    deviceName: 'Samsung 990 Pro 2TB',
    deviceSerial: 'MZ-V9P2T0B/AM',
    problem: 'Низкая скорость записи',
    priority: 'low',
    status: 'done',
    date: '2026-03-13',
  },
  {
    id: 'TKT-1242',
    customerName: 'Анна Ковалёва',
    customerPhone: '+375 44 333-44-55',
    deviceName: 'G.Skill Trident Z5 64GB DDR5',
    deviceSerial: 'F5-6000J3040G32GX2',
    problem: 'Система не определяет часть памяти',
    priority: 'medium',
    status: 'done',
    date: '2026-03-12',
  },
  {
    id: 'TKT-1241',
    customerName: 'Сергей Никитин',
    customerPhone: '+375 29 222-33-44',
    deviceName: 'Intel Core i9-14900K',
    deviceSerial: 'BX8071514900K',
    problem: 'Система перезагружается при нагрузке',
    priority: 'high',
    status: 'new',
    date: '2026-03-11',
  },
  {
    id: 'TKT-1240',
    customerName: 'Ольга Белова',
    customerPhone: '+375 44 666-77-88',
    deviceName: 'NZXT Kraken X73 RGB',
    deviceSerial: 'RL-KRX73-R1',
    problem: 'Подтекание жидкости из радиатора',
    priority: 'high',
    status: 'waiting',
    date: '2026-03-10',
  },
];

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
};

const PRIORITY_CLASSES: Record<TicketPriority, string> = {
  high: 'priority-badge--high',
  medium: 'priority-badge--medium',
  low: 'priority-badge--low',
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  new: 'Новая',
  progress: 'В работе',
  waiting: 'Ожидание',
  done: 'Выполнено',
  cancelled: 'Отменено',
};

const STATUS_CLASSES: Record<TicketStatus, string> = {
  new: 'status-badge--new',
  progress: 'status-badge--progress',
  waiting: 'status-badge--waiting',
  done: 'status-badge--done',
  cancelled: 'status-badge--cancelled',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

export function TicketsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredTickets = useMemo(() => {
    return MOCK_TICKETS.filter((ticket) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        ticket.id.toLowerCase().includes(searchLower) ||
        ticket.customerName.toLowerCase().includes(searchLower) ||
        ticket.deviceName.toLowerCase().includes(searchLower) ||
        ticket.problem.toLowerCase().includes(searchLower);

      const matchesStatus = statusFilter === '' || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === '' || ticket.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [searchQuery, statusFilter, priorityFilter]);

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="master-tickets">
      <header className="master-tickets__header">
        <div className="master-tickets__title-section">
          <h1 className="master-tickets__title">Заявки на сервис</h1>
          <p className="master-tickets__subtitle">
            Управление заявками на ремонт и обслуживание
          </p>
        </div>
        <div className="master-tickets__actions">
          <button className="btn btn--ghost">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Экспорт
          </button>
          <button className="btn btn--primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Новая заявка
          </button>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Поиск по заявкам..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="filter-group">
          <span className="filter-label">Статус</span>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as TicketStatus | '');
              setCurrentPage(1);
            }}
          >
            <option value="">Все</option>
            <option value="new">Новые</option>
            <option value="progress">В работе</option>
            <option value="waiting">Ожидание</option>
            <option value="done">Выполнено</option>
            <option value="cancelled">Отменено</option>
          </select>
        </div>
        <div className="filter-group">
          <span className="filter-label">Приоритет</span>
          <select
            className="filter-select"
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value as TicketPriority | '');
              setCurrentPage(1);
            }}
          >
            <option value="">Все</option>
            <option value="high">Высокий</option>
            <option value="medium">Средний</option>
            <option value="low">Низкий</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Клиент</th>
              <th>Устройство</th>
              <th>Проблема</th>
              <th>Приоритет</th>
              <th>Статус</th>
              <th>Дата</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paginatedTickets.length === 0 ? (
              <tr>
                <td colSpan={8} className="data-table__empty">
                  Заявки не найдены
                </td>
              </tr>
            ) : (
              paginatedTickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td>
                    <span className="ticket-id">#{ticket.id}</span>
                  </td>
                  <td>
                    <div className="ticket-customer">
                      <span className="customer-name">{ticket.customerName}</span>
                      <span className="customer-phone">{ticket.customerPhone}</span>
                    </div>
                  </td>
                  <td>
                    <div className="ticket-device">
                      <span className="device-name">{ticket.deviceName}</span>
                      <span className="device-serial">SN: {ticket.deviceSerial}</span>
                    </div>
                  </td>
                  <td className="ticket-problem">{ticket.problem}</td>
                  <td>
                    <span className={'priority-badge ' + PRIORITY_CLASSES[ticket.priority]}>
                      {PRIORITY_LABELS[ticket.priority]}
                    </span>
                  </td>
                  <td>
                    <span className={'status-badge ' + STATUS_CLASSES[ticket.status]}>
                      {STATUS_LABELS[ticket.status]}
                    </span>
                  </td>
                  <td>
                    <span className="ticket-date">{formatDate(ticket.date)}</span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link
                        to={`/master/tickets/${ticket.id}`}
                        className="table-btn"
                        title="Просмотр"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </Link>
                      <button className="table-btn" title="Редактировать">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="pagination">
          <span className="pagination__info">
            Показано {paginatedTickets.length} из {filteredTickets.length} заявок
          </span>
          {totalPages > 1 && (
            <div className="pagination__pages">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ←
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <button
                    key={page}
                    className={'pagination-btn ' + (page === currentPage ? 'pagination-btn--active' : '')}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TicketsPage;