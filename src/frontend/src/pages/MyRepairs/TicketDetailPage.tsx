import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  serviceTicketsApi,
  type ServiceTicket,
  type TicketStatusHistory,
  type TicketMessage,
  TICKET_STATUSES
} from '../../api/service-tickets';
import { useToastStore } from '../../store/toastStore';
import { Button, Input } from '../../components/ui';
import { ArrowLeft, Send, Paperclip, Image } from 'lucide-react';
import styles from './TicketDetailPage.module.css';

function getStatusLabel(status: string): string {
  const statusItem = TICKET_STATUSES.find(s => s.key === status);
  return statusItem?.label || status;
}

/**
 * Ticket Detail Page - Customer view of service ticket
 *
 * Features:
 * - Status timeline
 * - Ticket details
 * - Technician notes
 * - Photo gallery
 * - Messaging with technician
 * - Real-time updates via polling
 */
export function TicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const showToast = useToastStore(state => state.showToast);

  const [ticket, setTicket] = useState<ServiceTicket | null>(null);
  const [history, setHistory] = useState<TicketStatusHistory[]>([]);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ticketId) {
      loadTicketData();

      // Poll for updates every 15 seconds
      const interval = setInterval(loadTicketData, 15000);
      return () => clearInterval(interval);
    }
  }, [ticketId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadTicketData = useCallback(async () => {
    if (!ticketId) return;

    try {
      const [ticketData, historyData, messagesData] = await Promise.all([
        serviceTicketsApi.getTicket(ticketId),
        serviceTicketsApi.getTicketHistory(ticketId),
        serviceTicketsApi.getTicketMessages(ticketId)
      ]);

      setTicket(ticketData);
      setHistory(historyData);
      setMessages(messagesData);
    } catch {
      showToast('Ошибка загрузки данных заявки', 'error');
    } finally {
      setLoading(false);
    }
  }, [ticketId, showToast]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !ticketId) return;

    setSendingMessage(true);
    try {
      const message = await serviceTicketsApi.sendMessage(ticketId, newMessage.trim());
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    } catch {
      showToast('Ошибка отправки сообщения', 'error');
    } finally {
      setSendingMessage(false);
    }
  };

  const currentStepIndex = TICKET_STATUSES.findIndex(s => s.key === ticket?.status);

  if (loading) {
    return <div className="ticket-detail">Загрузка...</div>;
  }

  if (!ticket) {
    return (
      <div className="ticket-detail">
        <div className="not-found">
          <h1>Заявка не найдена</h1>
          <Link to="/my-repairs" className="btn btn-primary">
            Вернуться к моим ремонтам
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ticket-detail">
      <div className="ticket-detail__header">
        <Link to="/my-repairs" className="back-link">
          <ArrowLeft size={20} />
          <span>Назад к списку</span>
        </Link>
        <h1 className="ticket-detail__title">Заявка #{ticket.ticketNumber}</h1>
        <div className={`status-badge status-badge--${ticket.status}`}>
          {getStatusLabel(ticket.status)}
        </div>
      </div>

      {/* Status Timeline */}
      <div className="ticket-detail__timeline">
        <h2 className="section-title">Статус ремонта</h2>
        <div className="timeline-track">
          {TICKET_STATUSES.slice(0, 7).map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;

            return (
              <div key={step.key} className="timeline-item">
                <div className={`timeline-dot ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                  {isCompleted && <span>✓</span>}
                </div>
                <div className="timeline-label">{step.label}</div>
                {index < 6 && (
                  <div className={`timeline-line ${isCompleted ? 'completed' : ''}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="ticket-detail__grid">
        {/* Ticket Details */}
        <div className="card details-card">
          <h2 className="section-title">Детали заявки</h2>

          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Тип устройства:</span>
              <span className="detail-value">{ticket.deviceType}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Бренд:</span>
              <span className="detail-value">{ticket.brand}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Модель:</span>
              <span className="detail-value">{ticket.model}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Дата создания:</span>
              <span className="detail-value">
                {new Date(ticket.createdAt).toLocaleDateString('ru-RU')}
              </span>
            </div>
            {ticket.technician && (
              <div className="detail-item">
                <span className="detail-label">Техник:</span>
                <span className="detail-value">{ticket.technician.name}</span>
              </div>
            )}
            {ticket.estimatedCompletion && (
              <div className="detail-item">
                <span className="detail-label">Ориентировочная готовность:</span>
                <span className="detail-value">
                  {new Date(ticket.estimatedCompletion).toLocaleDateString('ru-RU')}
                </span>
              </div>
            )}
          </div>

          <div className="problem-description">
            <h3 className="subtitle">Описание проблемы</h3>
            <p>{ticket.issueDescription}</p>
          </div>

          {ticket.notes && (
            <div className="technician-notes">
              <h3 className="subtitle">Примечания техника</h3>
              <p>{ticket.notes}</p>
            </div>
          )}
        </div>

        {/* Photo Gallery */}
        <div className="card gallery-card">
          <h2 className="section-title">Фото от техника</h2>
          <div className="photo-grid">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="photo-placeholder">
                <Image size={32} />
                <span>Фото {i}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Messaging Section */}
      <div className="card messages-card">
        <h2 className="section-title">Чат с техником</h2>

        <div className="messages-list">
          {messages.map(message => (
            <div
              key={message.id}
              className={`message ${message.author === 'customer' ? 'my-message' : ''}`}
            >
              <div className="message-header">
                <span className="message-author">
                  {message.authorName || (message.author === 'technician' ? 'Техник' : 'Вы')}
                </span>
                <span className="message-time">
                  {new Date(message.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="message-content">{message.content}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="message-form">
          <Input
            placeholder="Написать сообщение..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="message-input"
          />
          <Button
            type="button"
            variant="secondary"
            className="attach-btn"
          >
            <Paperclip size={18} />
          </Button>
          <Button
            type="submit"
            disabled={sendingMessage || !newMessage.trim()}
            className="send-btn"
          >
            <Send size={18} />
          </Button>
        </form>
      </div>
    </div>
  );
}
