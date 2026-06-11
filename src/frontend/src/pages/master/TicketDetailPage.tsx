/**
 * Детальная страница заявки для мастера
 * Использует реальное API: servicesApi, useTicketChat (SignalR)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { servicesApi, TICKET_STATUSES } from '@/api/services';
import type { ServiceRequestDto, TicketStatus, ServicePartDto } from '@/api/services';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { useTicketChat } from '@/hooks/useTicketChat';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';

// ─── Статус-бейджи Tailwind ─────────────────────────────────────────────────

const STATUS_TAILWIND: Record<string, string> = {
  Submitted: 'bg-blue-100 text-blue-800',
  InProgress: 'bg-yellow-100 text-yellow-800',
  PartsPending: 'bg-purple-100 text-purple-800',
  ReadyForPickup: 'bg-green-100 text-green-800',
  Completed: 'bg-gray-100 text-gray-800',
  Cancelled: 'bg-red-100 text-red-800',
};

// ─── Вспомогательные функции ────────────────────────────────────────────────

function getStatusLabel(key: string): string {
  const found = TICKET_STATUSES.find((s) => s.key === key);
  return found?.label ?? key;
}

/** Разрешённые переходы статуса для мастера */
function getAllowedStatuses(current: TicketStatus): { value: TicketStatus; label: string }[] {
  const map: Record<string, { value: TicketStatus; label: string }[]> = {
    Submitted: [{ value: 'InProgress', label: 'В работе' }],
    InProgress: [{ value: 'PartsPending', label: 'Ожидание запчастей' }],
    PartsPending: [{ value: 'InProgress', label: 'В работе' }],
    ReadyForPickup: [],
    Completed: [],
    Cancelled: [],
  };
  return map[current] ?? [];
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'BYN',
    minimumFractionDigits: 2,
  }).format(value);
}

function getInitials(id: string): string {
  return (id?.charAt(0) ?? '?').toUpperCase();
}

/** Проверяет, можно ли переходить к статусу (не Cancelled/Completed) */
function isTerminal(status: TicketStatus): boolean {
  return status === 'Completed' || status === 'Cancelled';
}

// ─── Компонент ──────────────────────────────────────────────────────────────

export function TicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const currentUserId = useAuthStore((state) => state.user?.id);

  // ── Данные заявки ────────────────────────────────────────────────────────
  const [ticket, setTicket] = useState<ServiceRequestDto | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Форма статуса ────────────────────────────────────────────────────────
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | ''>('');
  const [statusComment, setStatusComment] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  // ── Форма завершения работы ──────────────────────────────────────────────
  const [completeComment, setCompleteComment] = useState('');
  const [completing, setCompleting] = useState(false);

  // ── Форма добавления запчасти ────────────────────────────────────────────
  const [partName, setPartName] = useState('');
  const [partQty, setPartQty] = useState('1');
  const [partPrice, setPartPrice] = useState('0');
  const [addingPart, setAddingPart] = useState(false);

  // ── Отмена ───────────────────────────────────────────────────────────────
  const [cancelling, setCancelling] = useState(false);

  // ── Чат ──────────────────────────────────────────────────────────────────
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    loading: messagesLoading,
    error: chatError,
    typingUserId,
    connectionStatus,
    sendMessage,
  } = useTicketChat({ ticketId });

  // ── Загрузка заявки ──────────────────────────────────────────────────────

  const loadTicket = useCallback(async () => {
    if (!ticketId) return;
    try {
      setLoading(true);
      const data = await servicesApi.getServiceById(ticketId);
      setTicket(data);
      setSelectedStatus('');
      setStatusComment('');
    } catch (err) {
      showToast('Ошибка загрузки заявки', 'error');
    } finally {
      setLoading(false);
    }
  }, [ticketId, showToast]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  // Автоскролл чата вниз при новых сообщениях
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Обработчики ──────────────────────────────────────────────────────────

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId || !selectedStatus) return;

    setStatusUpdating(true);
    try {
      await servicesApi.updateTicketStatus(ticketId, selectedStatus as TicketStatus, statusComment || undefined);
      showToast('Статус обновлён', 'success');
      await loadTicket();
    } catch {
      showToast('Ошибка при обновлении статуса', 'error');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleComplete = async () => {
    if (!ticketId) return;

    setCompleting(true);
    try {
      await servicesApi.completeTicket(ticketId, completeComment || undefined);
      showToast('Работа завершена', 'success');
      await loadTicket();
      setCompleteComment('');
    } catch {
      showToast('Ошибка при завершении работы', 'error');
    } finally {
      setCompleting(false);
    }
  };

  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId || !partName.trim()) return;

    setAddingPart(true);
    try {
      const dto: ServicePartDto = {
        productId: crypto.randomUUID(),
        productName: partName.trim(),
        quantity: Number(partQty) || 1,
        unitPrice: Number(partPrice) || 0,
      };
      await servicesApi.addServicePart(ticketId, dto);
      showToast('Запчасть добавлена', 'success');
      await loadTicket();
      setPartName('');
      setPartQty('1');
      setPartPrice('0');
    } catch {
      showToast('Ошибка при добавлении запчасти', 'error');
    } finally {
      setAddingPart(false);
    }
  };

  const handleCancel = async () => {
    if (!ticketId) return;
    if (!window.confirm('Вы уверены, что хотите отменить заявку?')) return;

    setCancelling(true);
    try {
      await servicesApi.cancelTicket(ticketId);
      showToast('Заявка отменена', 'success');
      navigate('/master/tickets');
    } catch {
      showToast('Ошибка при отмене заявки', 'error');
      setCancelling(false);
    }
  };

  // ── Состояние загрузки ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="staff-page">
        <p className="text-center py-12 text-gray-500">Загрузка заявки...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="staff-page">
        <p className="text-center py-12 text-gray-500">Заявка не найдена</p>
      </div>
    );
  }

  const allowedStatuses = getAllowedStatuses(ticket.status);
  const terminal = isTerminal(ticket.status);
  const assignedToOther = ticket.masterId && ticket.masterId !== currentUserId;

  // ── Рендер ───────────────────────────────────────────────────────────────

  return (
    <div className="staff-page">
      {/* Header */}
      <div className="staff-page__header">
        <div>
          <Link
            to="/master/tickets"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-body-text transition-colors mb-1"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Назад к списку
          </Link>
          <h1 className="staff-page__title">
            #{ticket.requestNumber}
            <span className={`ml-3 inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_TAILWIND[ticket.status] ?? 'bg-gray-100 text-gray-800'}`}>
              {getStatusLabel(ticket.status)}
            </span>
          </h1>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* ════════════════ LEFT COLUMN (lg:col-span-2) ════════════════ */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── Карточка "Информация о заявке" ─────────────────────────── */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="text-lg font-semibold text-body-text">Информация о заявке</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block">ID заявки</span>
                <span className="font-medium text-body-text">{ticket.id}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Тип услуги</span>
                <span className="font-medium text-body-text">{ticket.serviceTypeName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Устройство</span>
                <span className="font-medium text-body-text">{ticket.deviceModel || '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Серийный номер</span>
                <span className="font-medium text-body-text">{ticket.serialNumber || '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Стоимость</span>
                <span className="font-medium text-body-text">
                  {ticket.actualCost > 0 ? formatCurrency(ticket.actualCost) : formatCurrency(ticket.estimatedCost)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Дата создания</span>
                <span className="font-medium text-body-text">{formatDate(ticket.createdAt)}</span>
              </div>
            </div>

            {/* Описание проблемы */}
            <div>
              <h3 className="text-sm font-semibold text-body-text mb-1">Описание проблемы</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
            </div>

            {/* Комментарий мастера */}
            {ticket.masterComment && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <h3 className="text-sm font-semibold text-yellow-800 mb-1">Комментарий мастера</h3>
                <p className="text-sm text-yellow-700 whitespace-pre-wrap">{ticket.masterComment}</p>
              </div>
            )}
          </div>

          {/* ── Карточка "История изменений" ──────────────────────────── */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-body-text mb-4">История изменений</h2>
            {(ticket.workReports ?? []).length === 0 ? (
              <p className="text-sm text-gray-500">История изменений отсутствует</p>
            ) : (
              <div className="space-y-0">
                {(ticket.workReports ?? []).map((report, idx) => (
                  <div key={report.id} className="flex gap-3 pb-4 relative">
                    {/* Маркер-кружок */}
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full border-2 mt-1 ${
                        idx === 0
                          ? 'bg-blue-500 border-blue-500'
                          : 'bg-white border-gray-300'
                      }`} />
                      {idx < (ticket.workReports ?? []).length - 1 && (
                        <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
                      )}
                    </div>
                    {/* Контент */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500">{formatDate(report.changedAt)}</div>
                      <div className="text-sm font-medium text-body-text mt-0.5">
                        Статус изменён: {getStatusLabel(report.previousStatus)} → {getStatusLabel(report.newStatus)}
                      </div>
                      {report.comment && (
                        <p className="text-sm text-muted-foreground mt-1">{report.comment}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Карточка "Чат с клиентом" ─────────────────────────────── */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold text-body-text">Чат с клиентом</h2>
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 'bg-gray-400'
              }`} />
            </div>

            {chatError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3 text-sm text-red-700">
                {chatError}
              </div>
            )}

            <div className="max-h-[400px] overflow-y-auto space-y-1 mb-4">
              {messagesLoading && messages.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">Загрузка сообщений...</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Нет сообщений. Напишите первое сообщение клиенту.
                </p>
              ) : (
                messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} isOwn={msg.authorRole === 'Master'} />
                ))
              )}
              {typingUserId && <TypingIndicator who="Клиент" />}
              <div ref={chatBottomRef} />
            </div>

            <ChatInput
              onSend={sendMessage}
              disabled={terminal || !!assignedToOther}
              placeholder="Введите сообщение..."
            />
          </div>
        </div>

        {/* ════════════════ RIGHT COLUMN (lg:col-span-1) ════════════════ */}
        <div className="lg:col-span-1 space-y-4">

          {/* ── Карточка "Клиент" ──────────────────────────────────────── */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-sm font-semibold text-body-text mb-3">Клиент</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                {getInitials(ticket.clientId)}
              </div>
              <div>
                <p className="text-sm font-medium text-body-text">
                  ID: {ticket.clientId.length > 8 ? ticket.clientId.slice(0, 8) + '…' : ticket.clientId}
                </p>
                <p className="text-xs text-muted-foreground">
                  {ticket.clientId}
                </p>
              </div>
            </div>
          </div>

          {/* ── Баннер "Назначена другому мастеру" ─────────────────────── */}
          {assignedToOther && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm text-orange-800">
              Заявка назначена другому мастеру. Управление статусом недоступно.
            </div>
          )}

          {/* ── Карточка "Управление статусом" ─────────────────────────── */}
          {!terminal && !assignedToOther && (
            <div className="bg-white rounded-lg border p-4">
              <h3 className="text-sm font-semibold text-body-text mb-3">Управление статусом</h3>

              {allowedStatuses.length === 0 ? (
                <p className="text-xs text-gray-500">Нет доступных переходов для текущего статуса</p>
              ) : (
                <form onSubmit={handleUpdateStatus} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Новый статус</label>
                    <select
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as TicketStatus)}
                      required
                    >
                      <option value="" disabled>Выберите статус...</option>
                      {allowedStatuses.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Комментарий</label>
                    <textarea
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={2}
                      placeholder="Комментарий к изменению..."
                      value={statusComment}
                      onChange={(e) => setStatusComment(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={statusUpdating || !selectedStatus}
                    className="w-full rounded-md bg-blue-600 text-white py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {statusUpdating ? 'Обновление...' : 'Обновить статус'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ── Кнопка "Завершить работу" ───────────────────────────────── */}
          {ticket.status === 'InProgress' && !assignedToOther && (
            <div className="bg-white rounded-lg border p-4">
              <h3 className="text-sm font-semibold text-body-text mb-3">Завершить работу</h3>
              <div className="space-y-3">
                <textarea
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows={2}
                  placeholder="Финальный комментарий..."
                  value={completeComment}
                  onChange={(e) => setCompleteComment(e.target.value)}
                />
                <button
                  type="button"
                  disabled={completing}
                  onClick={handleComplete}
                  className="w-full rounded-md bg-green-600 text-white py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {completing ? 'Завершение...' : 'Завершить работу'}
                </button>
              </div>
            </div>
          )}

          {/* ── Карточка "Запчасти" ─────────────────────────────────────── */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-sm font-semibold text-body-text mb-3">Запчасти</h3>

            {/* Список запчастей */}
            {(ticket.serviceParts ?? []).length === 0 ? (
              <p className="text-xs text-gray-500 mb-3">Запчасти не добавлены</p>
            ) : (
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-1 pr-2 font-medium text-muted-foreground">Название</th>
                      <th className="text-right py-1 px-2 font-medium text-muted-foreground">Кол-во</th>
                      <th className="text-right py-1 px-2 font-medium text-muted-foreground">Цена</th>
                      <th className="text-right py-1 pl-2 font-medium text-muted-foreground">Сумма</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(ticket.serviceParts ?? []).map((part, idx) => (
                      <tr key={`${part.productId}-${idx}`} className="border-b border-gray-100">
                        <td className="py-1.5 pr-2 text-body-text">{part.productName}</td>
                        <td className="text-right py-1.5 px-2 text-body-text">{part.quantity}</td>
                        <td className="text-right py-1.5 px-2 text-body-text">{formatCurrency(part.unitPrice)}</td>
                        <td className="text-right py-1.5 pl-2 text-body-text font-medium">
                          {formatCurrency(part.quantity * part.unitPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Форма добавления запчасти */}
            {!terminal && !assignedToOther && (
              <form onSubmit={handleAddPart} className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-0.5">Название</label>
                  <input
                    className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Наименование запчасти"
                    value={partName}
                    onChange={(e) => setPartName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-0.5">Кол-во</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={partQty}
                      onChange={(e) => setPartQty(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-0.5">Цена за ед.</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={partPrice}
                      onChange={(e) => setPartPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={addingPart || !partName.trim()}
                  className="w-full rounded-md bg-blue-600 text-white py-1.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {addingPart ? 'Добавление...' : 'Добавить'}
                </button>
              </form>
            )}
          </div>

          {/* ── Быстрые действия ────────────────────────────────────────── */}
          {!terminal && !assignedToOther && (
            <div className="bg-white rounded-lg border p-4">
              <h3 className="text-sm font-semibold text-body-text mb-3">Быстрые действия</h3>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancel}
                className="w-full rounded-md border border-red-300 text-red-700 py-2 text-sm font-medium hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {cancelling ? 'Отмена...' : 'Отменить заявку'}
              </button>
            </div>
          )}

          {ticket.completedAt && (
            <div className="bg-white rounded-lg border p-4">
              <h3 className="text-sm font-semibold text-body-text mb-1">Дата завершения</h3>
              <p className="text-sm text-muted-foreground">{formatDate(ticket.completedAt)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TicketDetailPage;
