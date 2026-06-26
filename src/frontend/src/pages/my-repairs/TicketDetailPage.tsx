import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { servicesApi, TICKET_STATUSES } from '@/api/services';
import type { ServiceRequestDto } from '@/api/services';
import { useTicketChat } from '@/hooks/useTicketChat';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft, Lock } from 'lucide-react';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import '../../components/chat/Chat.css';
import './TicketDetailPage.css';

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
 * - Real-time chat with technician (SignalR + REST)
 */
export function TicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { showToast } = useToast();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentUserId = useAuthStore((state) => state.user?.id);

  const [ticket, setTicket] = useState<ServiceRequestDto | null>(null);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Real-time chat via SignalR + REST fallback
  const {
    messages,
    loading: messagesLoading,
    error: chatError,
    uploading,
    typingUserId,
    connectionStatus,
    sendMessage,
    uploadFile,
  } = useTicketChat({ ticketId });

  // Load ticket data (once, no polling — messages come via SignalR)
  useEffect(() => {
    if (!ticketId) return;

    const load = async () => {
      try {
        const ticketData = await servicesApi.getServiceById(ticketId);
        if (ticketData != null) setTicket(ticketData);
      } catch {
        showToast('Ошибка загрузки данных заявки', 'error');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [ticketId, showToast]);

  // Auto-scroll to bottom ONLY if user is already near the bottom
  useEffect(() => {
    if (messages.length === 0) return;

    const messagesList = messagesEndRef.current?.closest('.messages-list');
    if (!messagesList) return;

    const threshold = 120;
    const distFromBottom = messagesList.scrollHeight - messagesList.scrollTop - messagesList.clientHeight;
    if (distFromBottom < threshold) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Show chat errors
  useEffect(() => {
    if (chatError) {
      showToast(chatError, 'error');
    }
  }, [chatError, showToast]);

  const whoIsTyping = typingUserId ? 'Техник' : null;

  const TIMELINE_STEPS = TICKET_STATUSES.filter(s => s.key !== 'Cancelled');
  const currentStepIndex = TIMELINE_STEPS.findIndex(s => s.key === ticket?.status);

  if (loading) {
    return <div className="ticket-detail">Загрузка...</div>;
  }

  if (ticket == null) {
    return (
      <div className="ticket-detail">
        <div className="not-found">
          {isAuthenticated ? (
            <>
              <h1>Заявка не найдена</h1>
              <p className="not-found__desc">
                Заявка с таким номером не существует или была удалена.
                Возможно, у вас нет доступа к этой заявке.
              </p>
            </>
          ) : (
            <>
              <Lock size={48} className="not-found__icon" />
              <h1>Требуется авторизация</h1>
              <p className="not-found__desc">
                Для просмотра заявки необходимо войти в аккаунт.
              </p>
            </>
          )}
          <Link to={isAuthenticated ? '/account/repairs' : '/'} className="btn btn-primary">
            {isAuthenticated ? 'Вернуться к моим ремонтам' : 'На главную'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ticket-detail">
      <div className="ticket-detail__header">
        <div className="ticket-detail__breadcrumb">
          <Link to="/my-repairs" className="back-link">
            <ArrowLeft size={16} />
            <span>Мои ремонты</span>
          </Link>
        </div>
        <div className="ticket-detail__title-row">
          <h1 className="ticket-detail__title">Заявка #{ticket.requestNumber}</h1>
          <div className={`status-badge status-badge--${ticket.status}`}>
            {getStatusLabel(ticket.status)}
          </div>
        </div>
      </div>

      <div className="ticket-detail__grid">
        {/* Dashboard Card — timeline, details, photos, notes */}
        <div className="card dashboard-card">
          {/* Timeline */}
          <div className="dashboard-section">
            <h2 className="section-title">Статус ремонта</h2>
            <div className="timeline-track">
              {TIMELINE_STEPS.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                  <div key={step.key} className="timeline-item">
                    <div className={`timeline-dot ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                      {isCompleted && <span>✓</span>}
                    </div>
                    <div className="timeline-label">{step.label}</div>
                    {index < TIMELINE_STEPS.length - 1 && (
                      <div className={`timeline-line ${isCompleted ? 'completed' : ''}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ticket Details + Problem Description */}
          <div className="dashboard-section">
            <h2 className="section-title">Детали заявки</h2>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Тип услуги:</span>
                <span className="detail-value">{ticket.serviceTypeName}</span>
              </div>
              {ticket.deviceModel && (
                <div className="detail-item">
                  <span className="detail-label">Устройство:</span>
                  <span className="detail-value">{ticket.deviceModel}</span>
                </div>
              )}
              <div className="detail-item">
                <span className="detail-label">Дата создания:</span>
                <span className="detail-value">
                  {new Date(ticket.createdAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
              {ticket.masterId && (
                <div className="detail-item">
                  <span className="detail-label">Техник:</span>
                  <span className="detail-value">{ticket.masterId}</span>
                </div>
              )}
            </div>

            <div className="problem-description">
              <h3 className="subtitle">Описание проблемы</h3>
              <p>{ticket.description}</p>
            </div>
          </div>

          {/* Technician Notes */}
          {ticket.masterComment && (
            <div className="dashboard-section">
              <h2 className="section-title">Примечания техника</h2>
              <div className="technician-notes">
                <p>{ticket.masterComment}</p>
              </div>
            </div>
          )}
        </div>

        {/* Chat Card */}
        <div className="card chat-card">
          <div className="chat-card__header">
            <h2 className="section-title">Чат с техником</h2>
            {connectionStatus === 'connected' && <span className="chat-status chat-status--online" title="Подключено" />}
            {connectionStatus === 'connecting' && <span className="chat-status chat-status--connecting" title="Подключение..." />}
            {connectionStatus === 'disconnected' && <span className="chat-status chat-status--offline" title="Нет подключения" />}
            {connectionStatus === 'error' && <span className="chat-status chat-status--error" title="Ошибка подключения" />}
          </div>

          <div className="messages-list">
            {messagesLoading && messages.length === 0 && (
              <div className="messages-list__empty">Загрузка сообщений...</div>
            )}
            {!messagesLoading && messages.length === 0 && (
              <div className="messages-list__empty">
                Нет сообщений. Напишите первое сообщение технику.
              </div>
            )}
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isOwn={msg.authorId === currentUserId}
              />
            ))}
            <TypingIndicator who={whoIsTyping ?? undefined} />
            <div ref={messagesEndRef} />
          </div>

          <ChatInput
            onSend={sendMessage}
            onUpload={uploadFile}
            uploading={uploading}
            disabled={connectionStatus === 'disconnected' || connectionStatus === 'error' || !ticketId}
          />
        </div>
      </div>
    </div>
  );
}
