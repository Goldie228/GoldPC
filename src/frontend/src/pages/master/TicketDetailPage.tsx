/**
 * Master Ticket Detail Page
 * Страница детального просмотра заявки на сервис
 * Основано на prototypes/master-ticket-detail.html
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './TicketDetailPage.module.css';

type TicketPriority = 'high' | 'medium' | 'low';
type TicketStatus = 'new' | 'progress' | 'waiting' | 'done' | 'cancelled';

interface TimelineItem {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'created' | 'status' | 'comment' | 'priority';
}

interface TicketDetail {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deviceName: string;
  deviceSerial: string;
  deviceCategory: string;
  deviceManufacturer: string;
  warrantyEnd: string;
  purchaseDate: string;
  problem: string;
  preliminaryDiagnosis: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  deadline: string;
  assignedTo: string | null;
  timeline: TimelineItem[];
}

// Моковые данные для демонстрации
const MOCK_TICKET: TicketDetail = {
  id: 'TKT-1247',
  customerName: 'Алексей Петров',
  customerPhone: '+375 29 123-45-67',
  customerEmail: 'petrov@example.com',
  deviceName: 'Gigabyte RTX 4080 Gaming OC',
  deviceSerial: 'GV-N4080G-1792',
  deviceCategory: 'Видеокарта',
  deviceManufacturer: 'Gigabyte',
  warrantyEnd: '15.08.2027',
  purchaseDate: '15.08.2024',
  problem: 'Клиент сообщает о появлении артефактов на экране при высокой нагрузке на видеокарту. Проблема проявляется в 3D-играх и при рендеринге видео. Артефакты представляют собой цветные полосы и мерцание отдельных участков экрана. В обычном режиме работы (офисные задачи, просмотр видео) проблема не наблюдается. Температура GPU при нагрузке достигает 78-82°C, что в пределах нормы.',
  preliminaryDiagnosis: 'Возможен перегрев видеопамяти или повреждение чипа. Требуется диагностика.',
  priority: 'high',
  status: 'new',
  createdAt: '2026-03-17 14:32',
  deadline: '2026-03-20',
  assignedTo: null,
  timeline: [
    {
      id: '1',
      title: 'Заявка создана',
      description: 'Заявка создана через сайт клиентом',
      date: '17.03.2026 14:32',
      type: 'created',
    },
    {
      id: '2',
      title: 'Приоритет повышен',
      description: 'Приоритет изменен с «Средний» на «Высокий»',
      date: '17.03.2026 14:45',
      type: 'priority',
    },
    {
      id: '3',
      title: 'Клиент подтвердил актуальность',
      description: 'Клиент подтвердил актуальность проблемы по телефону',
      date: '17.03.2026 15:10',
      type: 'comment',
    },
  ],
};

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

// Моковые данные инженеров
const ENGINEERS = [
  { id: '1', name: 'Иванов Иван', role: 'инженер' },
  { id: '2', name: 'Петров Сергей', role: 'ст. инженер' },
  { id: '3', name: 'Сидоров Алексей', role: 'инженер' },
];

// Получение инициалов
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function TicketDetailPage() {
  const [ticket] = useState<TicketDetail>(MOCK_TICKET);
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [priority, setPriority] = useState<TicketPriority>(ticket.priority);
  const [assignedTo, setAssignedTo] = useState<string>(ticket.assignedTo || '');
  const [comment, setComment] = useState('');
  const [newComment, setNewComment] = useState('');

  const handleStatusUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    // Здесь будет логика обновления статуса
    console.log('Update status:', { status, priority, assignedTo, comment });
    setComment('');
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    // Здесь будет логика добавления комментария
    console.log('Add comment:', newComment);
    setNewComment('');
  };

  return (
    <div className="ticket-detail">
      {/* Header */}
      <header className="ticket-detail__header">
        <div className="ticket-detail__title-section">
          <Link to="/master/tickets" className="back-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Назад к списку
          </Link>
          <h1 className="ticket-detail__title">
            <span className="ticket-id">#{ticket.id}</span>
            <span className={'status-badge ' + STATUS_CLASSES[status]}>
              {STATUS_LABELS[status]}
            </span>
          </h1>
        </div>
        <div className="ticket-detail__actions">
          <button className="btn btn--danger">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Удалить
          </button>
          <button className="btn btn--primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Сохранить
          </button>
        </div>
      </header>

      {/* Content Grid */}
      <div className="ticket-detail__grid">
        {/* Left Column */}
        <div className="ticket-detail__main">
          {/* Main Info Card */}
          <div className="card">
            <div className="card__header">
              <span className="card__title">Основная информация</span>
            </div>
            <div className="card__body">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">ID заявки</span>
                  <span className="info-value info-value--accent">#{ticket.id}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Дата создания</span>
                  <span className="info-value info-value--mono">{ticket.createdAt}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Приоритет</span>
                  <span className="info-value">
                    <span className={'priority-badge ' + PRIORITY_CLASSES[priority]}>
                      {PRIORITY_LABELS[priority]}
                    </span>
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Статус</span>
                  <span className="info-value">
                    <span className={'status-badge ' + STATUS_CLASSES[status]}>
                      {STATUS_LABELS[status]}
                    </span>
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Назначена</span>
                  <span className="info-value">
                    {assignedTo
                      ? ENGINEERS.find((e) => e.id === assignedTo)?.name
                      : 'Не назначена'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Срок выполнения</span>
                  <span className="info-value info-value--warning">{ticket.deadline}</span>
                </div>
              </div>

              {/* Device Section */}
              <div className="device-section">
                <div className="device-header">
                  <div className="device-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                      <rect x="2" y="6" width="20" height="12" rx="2" />
                      <path d="M6 10h4v4H6z" />
                    </svg>
                  </div>
                  <div className="device-info">
                    <div className="device-name">{ticket.deviceName}</div>
                    <div className="device-serial">SN: {ticket.deviceSerial}</div>
                  </div>
                </div>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Категория</span>
                    <span className="info-value">{ticket.deviceCategory}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Производитель</span>
                    <span className="info-value">{ticket.deviceManufacturer}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Гарантия</span>
                    <span className="info-value info-value--success">До {ticket.warrantyEnd}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Дата покупки</span>
                    <span className="info-value info-value--mono">{ticket.purchaseDate}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Problem Description Card */}
          <div className="card">
            <div className="card__header">
              <span className="card__title">Описание проблемы</span>
            </div>
            <div className="card__body">
              <p className="problem-text">{ticket.problem}</p>
              <p className="problem-text problem-text--diagnosis">
                <strong>Предварительный диагноз:</strong> {ticket.preliminaryDiagnosis}
              </p>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="card">
            <div className="card__header">
              <span className="card__title">История заявки</span>
            </div>
            <div className="card__body">
              <div className="timeline">
                {ticket.timeline.map((item, index) => (
                  <div key={item.id} className="timeline-item">
                    <div className={'timeline-marker ' + (index === 0 ? 'timeline-marker--first' : '')}>
                      {item.type === 'created' && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      )}
                      {item.type === 'priority' && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      )}
                      {item.type === 'comment' && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72" />
                        </svg>
                      )}
                      {item.type === 'status' && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-title">{item.title}</div>
                      <div className="timeline-desc">{item.description}</div>
                      <div className="timeline-date">{item.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Add Comment Card */}
          <div className="card">
            <div className="card__header">
              <span className="card__title">Добавить комментарий</span>
            </div>
            <div className="card__body">
              <form onSubmit={handleAddComment}>
                <div className="form-group">
                  <textarea
                    className="form-textarea"
                    placeholder="Введите комментарий..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                </div>
                <button type="submit" className="btn btn--primary">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  Добавить комментарий
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="ticket-detail__sidebar">
          {/* Customer Card */}
          <div className="card">
            <div className="card__header">
              <span className="card__title">Клиент</span>
            </div>
            <div className="card__body">
              <div className="customer-card">
                <div className="customer-avatar">{getInitials(ticket.customerName)}</div>
                <div className="customer-info">
                  <div className="customer-name">{ticket.customerName}</div>
                  <div className="customer-contacts">
                    <a href={`tel:${ticket.customerPhone}`} className="customer-link">
                      {ticket.customerPhone}
                    </a>
                    <a href={`mailto:${ticket.customerEmail}`} className="customer-link">
                      {ticket.customerEmail}
                    </a>
                  </div>
                </div>
              </div>
              <div className="quick-actions">
                <a href="#" className="quick-action">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  История обращений (3)
                </a>
                <a href="#" className="quick-action">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  История покупок
                </a>
              </div>
            </div>
          </div>

          {/* Update Status Card */}
          <div className="card">
            <div className="card__header">
              <span className="card__title">Обновить статус</span>
            </div>
            <div className="card__body">
              <form onSubmit={handleStatusUpdate}>
                <div className="form-group">
                  <label className="form-label">Статус</label>
                  <select
                    className="form-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TicketStatus)}
                  >
                    <option value="new">Новая</option>
                    <option value="progress">В работе</option>
                    <option value="waiting">Ожидание</option>
                    <option value="done">Выполнено</option>
                    <option value="cancelled">Отменено</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Приоритет</label>
                  <select
                    className="form-select"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TicketPriority)}
                  >
                    <option value="low">Низкий</option>
                    <option value="medium">Средний</option>
                    <option value="high">Высокий</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Назначить</label>
                  <select
                    className="form-select"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                  >
                    <option value="">Не назначена</option>
                    {ENGINEERS.map((engineer) => (
                      <option key={engineer.id} value={engineer.id}>
                        {engineer.name} ({engineer.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Комментарий</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Добавьте комментарий к изменению..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                  />
                </div>
                <button type="submit" className="btn btn--primary btn--full">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Обновить
                </button>
              </form>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="card">
            <div className="card__header">
              <span className="card__title">Быстрые действия</span>
            </div>
            <div className="card__body">
              <div className="quick-actions">
                <a href="#" className="quick-action">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  Печать акта приёмки
                </a>
                <a href="#" className="quick-action">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Экспорт в PDF
                </a>
                <a href="#" className="quick-action">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  Создать копию заявки
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TicketDetailPage;