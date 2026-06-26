/**
 * Детальная страница заявки — панель мастера
 *
 * Полный функционал: информация, управление статусом, запчасти, чат (SignalR).
 * Дизайн-токены, TanStack Query, inline confirmation.
 */

import '../../components/chat/Chat.css';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  User,
  Wrench,
  Clock,
  MessageSquare,
  Package,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { servicesApi, TICKET_STATUSES } from '@/api/services';
import type { ServiceRequestDto, TicketStatus, ServicePartDto } from '@/api/services';
import { usersAdminApi } from '@/api/admin';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { useTicketChat } from '@/hooks/useTicketChat';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  Submitted:       { label: 'Подана', className: 'bg-gold/15 text-gold' },
  InProgress:      { label: 'В работе', className: 'bg-gold/25 text-gold' },
  PartsPending:    { label: 'Ожидание запчастей', className: 'bg-surface-elevated text-muted-strong' },
  ReadyForPickup:  { label: 'Готова к выдаче', className: 'bg-price-drop/15 text-price-drop' },
  Completed:       { label: 'Завершена', className: 'bg-surface-elevated text-muted-foreground' },
  Cancelled:       { label: 'Отменена', className: 'bg-price-rise/15 text-price-rise' },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getStatusBadge(status: string) {
    return STATUS_BADGE[status] ?? { label: status, className: 'bg-surface-elevated text-muted-foreground' };
}

function getAllowedStatuses(current: TicketStatus): { value: TicketStatus; label: string }[] {
  const map: Record<string, { value: TicketStatus; label: string }[]> = {
    Submitted: [{ value: 'InProgress', label: 'Взять в работу' }],
    InProgress: [
      { value: 'PartsPending', label: 'Ожидание запчастей' },
      { value: 'ReadyForPickup', label: 'Готова к выдаче' },
    ],
    PartsPending: [{ value: 'InProgress', label: 'В работу' }],
    ReadyForPickup: [],
    Completed: [],
    Cancelled: [],
  };
  return map[current] ?? [];
}

function formatDateTime(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(value: number): string {
  return value.toLocaleString('ru-RU', { minimumFractionDigits: 0 }) + ' BYN';
}

function isTerminal(status: TicketStatus): boolean {
  return status === 'Completed' || status === 'Cancelled';
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function TicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const currentUserId = useAuthStore((state) => state.user?.id);

  /* ── Queries ──────────────────────────────────────────────────── */
  const { data: ticket, isLoading, isError, refetch } = useQuery({
    queryKey: ['master', 'ticket', ticketId],
    queryFn: () => servicesApi.getServiceById(ticketId!),
    enabled: !!ticketId,
  });

  const { data: clientUser } = useQuery({
    queryKey: ['admin', 'user', ticket?.clientId],
    queryFn: () => usersAdminApi.getUser(ticket!.clientId),
    enabled: !!ticket?.clientId,
  });

  /* ── Mutations ────────────────────────────────────────────────── */
  const statusMutation = useMutation({
    mutationFn: ({ status, comment }: { status: TicketStatus; comment?: string }) =>
      servicesApi.updateTicketStatus(ticketId!, status, comment),
    onSuccess: () => {
      showToast('Статус обновлён', 'success');
      queryClient.invalidateQueries({ queryKey: ['master', 'ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['master', 'tickets'] });
    },
    onError: () => showToast('Ошибка при обновлении статуса', 'error'),
  });

  const partMutation = useMutation({
    mutationFn: (dto: ServicePartDto) => servicesApi.addParts(ticketId!, dto),
    onSuccess: () => {
      showToast('Запчасть добавлена', 'success');
      queryClient.invalidateQueries({ queryKey: ['master', 'ticket', ticketId] });
    },
    onError: () => showToast('Ошибка при добавлении запчасти', 'error'),
  });

  /* ── Chat ──────────────────────────────────────────────────────── */
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    loading: messagesLoading,
    error: chatError,
    typingUserId,
    connectionStatus,
    sendMessage,
    uploadFile,
  } = useTicketChat({ ticketId });

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Form states ──────────────────────────────────────────────── */
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | ''>('');
  const [statusComment, setStatusComment] = useState('');
  const [partName, setPartName] = useState('');
  const [partQty, setPartQty] = useState('1');
  const [partPrice, setPartPrice] = useState('0');
  /* ── Loading state ────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 size={20} className="animate-spin" />
          <span>Загрузка заявки...</span>
        </div>
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="bg-price-rise/10 border border-price-rise/20 rounded-xl p-8 text-center">
        <AlertTriangle size={32} className="mx-auto mb-3 text-price-rise" />
        <p className="text-price-rise font-medium">Заявка не найдена</p>
        <Link
          to="/master/tickets"
          className="mt-3 inline-flex items-center gap-1 text-sm text-gold hover:underline"
        >
          <ArrowLeft size={14} />
          Вернуться к списку
        </Link>
      </div>
    );
  }

  const badge = getStatusBadge(ticket.status);
  const allowedStatuses = getAllowedStatuses(ticket.status);
  const terminal = isTerminal(ticket.status);
  const assignedToOther = ticket.masterId && ticket.masterId !== currentUserId;
  const totalPartsCost = (ticket.serviceParts ?? []).reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
  const displayCost = ticket.actualCost > 0 ? ticket.actualCost : ticket.estimatedCost + totalPartsCost;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            to="/master/tickets"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft size={14} />
            К списку заявок
          </Link>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <span className="font-mono text-gold">#{ticket.requestNumber}</span>
            <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-medium ${badge.className}`}>
              {badge.label}
            </span>
          </h1>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <p>{formatDateTime(ticket.createdAt)}</p>
          {ticket.completedAt && (
            <p className="text-price-drop">Завершена: {formatDateTime(ticket.completedAt)}</p>
          )}
        </div>
      </div>

      {/* ── Content Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ═══ LEFT COLUMN ═══════════════════════════════════════ */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── Информация о заявке ──────────────────────────────── */}
          <div className="bg-surface-card rounded-xl border border-hairline-dark p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Wrench size={18} className="text-gold" />
              Информация о заявке
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block mb-0.5">Тип услуги</span>
                <span className="font-medium text-foreground">{ticket.serviceTypeName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-0.5">Устройство</span>
                <span className="font-medium text-foreground">{ticket.deviceModel || '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-0.5">Серийный номер</span>
                <span className="font-medium text-foreground font-mono text-xs">{ticket.serialNumber || '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-0.5">Стоимость</span>
                <span className="font-semibold text-gold text-lg">{formatCurrency(displayCost)}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-hairline-dark">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Описание проблемы</h3>
              <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.description}</p>
            </div>

            {ticket.masterComment && (
              <div className="mt-4 pt-4 border-t border-hairline-dark">
                <h3 className="text-sm font-medium text-gold mb-1">Комментарий мастера</h3>
                <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.masterComment}</p>
              </div>
            )}
          </div>

          {/* ── Запчасти ─────────────────────────────────────────── */}
          <div className="bg-surface-card rounded-xl border border-hairline-dark p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Package size={18} className="text-gold" />
              Запчасти
              {totalPartsCost > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  (Итого: {formatCurrency(totalPartsCost)})
                </span>
              )}
            </h2>

            {(ticket.serviceParts ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Запчасти не добавлены
              </p>
            ) : (
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-hairline-dark">
                      <th scope="col" className="text-left py-2 pr-3 font-medium text-muted-foreground">Название</th>
                      <th scope="col" className="text-right py-2 px-3 font-medium text-muted-foreground">Кол-во</th>
                      <th scope="col" className="text-right py-2 px-3 font-medium text-muted-foreground">Цена</th>
                      <th scope="col" className="text-right py-2 pl-3 font-medium text-muted-foreground">Сумма</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(ticket.serviceParts ?? []).map((part, idx) => (
                      <tr key={`${part.productName}-${idx}`} className="border-b border-hairline-dark/50 last:border-b-0">
                        <td className="py-2 pr-3 text-foreground">{part.productName}</td>
                        <td className="text-right py-2 px-3 text-foreground">{part.quantity}</td>
                        <td className="text-right py-2 px-3 text-foreground">{formatCurrency(part.unitPrice)}</td>
                        <td className="text-right py-2 pl-3 text-foreground font-medium">
                          {formatCurrency(part.quantity * part.unitPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Форма добавления */}
            {!terminal && !assignedToOther && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!partName.trim()) return;
                  partMutation.mutate({
                    productId: crypto.randomUUID(),
                    productName: partName.trim(),
                    quantity: Number(partQty) || 1,
                    unitPrice: Number(partPrice) || 0,
                  });
                  setPartName('');
                  setPartQty('1');
                  setPartPrice('0');
                }}
                className="mt-4 pt-4 border-t border-hairline-dark space-y-3"
              >
                <h3 className="text-sm font-medium text-foreground">Добавить запчасть</h3>
                <div>
                  <label htmlFor="partName" className="block text-xs font-medium text-muted-foreground mb-1">
                    Название *
                  </label>
                  <input
                    id="partName"
                    className="w-full rounded-lg border border-hairline-dark px-3 py-2 text-sm bg-surface-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/40"
                    placeholder="Наименование запчасти"
                    value={partName}
                    onChange={(e) => setPartName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="partQty" className="block text-xs font-medium text-muted-foreground mb-1">
                      Кол-во
                    </label>
                    <input
                      id="partQty"
                      type="number"
                      min="1"
                      step="1"
                      className="w-full rounded-lg border border-hairline-dark px-3 py-2 text-sm bg-surface-card text-foreground focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/40"
                      value={partQty}
                      onChange={(e) => setPartQty(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="partPrice" className="block text-xs font-medium text-muted-foreground mb-1">
                      Цена за ед.
                    </label>
                    <input
                      id="partPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full rounded-lg border border-hairline-dark px-3 py-2 text-sm bg-surface-card text-foreground focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/40"
                      value={partPrice}
                      onChange={(e) => setPartPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={partMutation.isPending || !partName.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gold-ink bg-gold rounded-lg hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {partMutation.isPending ? (
                    <>
                      <Loader2 size={14} className="animate-spin border-gold-ink" />
                      Добавление...
                    </>
                  ) : (
                    'Добавить запчасть'
                  )}
                </button>
              </form>
            )}
          </div>

          {/* ── История изменений ────────────────────────────────── */}
          <div className="bg-surface-card rounded-xl border border-hairline-dark p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock size={18} className="text-gold" />
              История изменений
            </h2>
            {(ticket.workReports ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                История изменений отсутствует
              </p>
            ) : (
              <div className="space-y-0">
                {(ticket.workReports ?? []).map((report, idx) => {
                  const prevBadge = getStatusBadge(report.previousStatus);
                  const newBadge = getStatusBadge(report.newStatus);
                  return (
                    <div key={report.id} className="flex gap-3 pb-4 relative">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full border-2 mt-1 shrink-0 ${
                          idx === 0
                            ? 'bg-gold border-gold'
                            : 'bg-surface-card border-hairline-dark'
                        }`} />
                        {idx < (ticket.workReports ?? []).length - 1 && (
                          <div className="w-0.5 flex-1 bg-hairline-dark mt-1" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground">{formatDateTime(report.changedAt)}</div>
                        <div className="text-sm text-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${prevBadge.className}`}>
                            {prevBadge.label}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${newBadge.className}`}>
                            {newBadge.label}
                          </span>
                        </div>
                        {report.comment && (
                          <p className="text-sm text-muted-foreground mt-1">{report.comment}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Чат с клиентом ───────────────────────────────────── */}
          <div className="bg-surface-card rounded-xl border border-hairline-dark p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={18} className="text-gold" />
              <h2 className="text-lg font-semibold text-foreground">Чат с клиентом</h2>
              <span className={`w-2.5 h-2.5 rounded-full ${
                connectionStatus === 'connected' ? 'bg-price-drop' : 'bg-neutral-400'
              }`} />
            </div>

            {chatError && (
              <div className="bg-price-rise/10 border border-price-rise/20 rounded-lg p-3 mb-3 text-sm text-price-rise">
                {chatError}
              </div>
            )}

            <div className="max-h-[400px] overflow-y-auto space-y-1 mb-4">
              {messagesLoading && messages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Загрузка сообщений...</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
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
              onUpload={uploadFile}
              disabled={terminal || !!assignedToOther}
              placeholder="Введите сообщение..."
            />
          </div>
        </div>

        {/* ═══ RIGHT COLUMN ═══════════════════════════════════════ */}
        <div className="lg:col-span-1 space-y-4">

          {/* ── Клиент ───────────────────────────────────────────── */}
          <div className="bg-surface-card rounded-xl border border-hairline-dark p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <User size={16} className="text-gold" />
              Клиент
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold/10 text-gold flex items-center justify-center text-sm font-bold shrink-0">
                {clientUser?.firstName?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {clientUser
                    ? `${clientUser.firstName} ${clientUser.lastName}`.trim() || clientUser.email
                    : 'Загрузка...'}
                </p>
                <p className="text-xs text-muted-foreground truncate">{ticket.clientId}</p>
              </div>
            </div>
          </div>

          {/* ── Предупреждение ───────────────────────────────────── */}
          {assignedToOther && (
            <div className="bg-gold/10 border border-gold/20 rounded-xl p-4 text-sm text-gold flex items-center gap-2">
              <AlertTriangle size={16} />
              Заявка назначена другому мастеру
            </div>
          )}

          {/* ── Управление статусом ──────────────────────────────── */}
          {!terminal && !assignedToOther && allowedStatuses.length > 0 && (
            <div className="bg-surface-card rounded-xl border border-hairline-dark p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Управление статусом</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!selectedStatus) return;
                  statusMutation.mutate({
                    status: selectedStatus as TicketStatus,
                    comment: statusComment || undefined,
                  });
                  setSelectedStatus('');
                  setStatusComment('');
                }}
                className="space-y-3"
              >
                <div>
                  <label htmlFor="newStatus" className="block text-xs font-medium text-muted-foreground mb-1">
                    Новый статус
                  </label>
                  <select
                    id="newStatus"
                    className="w-full rounded-lg border border-hairline-dark px-3 py-2 text-sm bg-surface-card text-foreground focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/40"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as TicketStatus)}
                    required
                  >
                    <option value="" disabled>Выберите...</option>
                    {allowedStatuses.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="statusComment" className="block text-xs font-medium text-muted-foreground mb-1">
                    Комментарий
                  </label>
                  <textarea
                    id="statusComment"
                    className="w-full rounded-lg border border-hairline-dark px-3 py-2 text-sm bg-surface-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/40 resize-none"
                    rows={2}
                    placeholder="Комментарий к изменению..."
                    value={statusComment}
                    onChange={(e) => setStatusComment(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={statusMutation.isPending || !selectedStatus}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gold-ink bg-gold rounded-lg hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {statusMutation.isPending ? (
                    <>
                      <Loader2 size={14} className="animate-spin border-gold-ink" />
                      Обновление...
                    </>
                  ) : (
                    'Обновить статус'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ── Быстрое завершение / отмена ────────────────────────── */}
          {ticket.status === 'InProgress' && !assignedToOther && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => statusMutation.mutate('Completed')}
                disabled={statusMutation.isPending}
                className="flex-1 px-3 py-2 text-sm font-medium text-on-dark bg-price-drop rounded-lg hover:bg-price-drop/90 disabled:opacity-50 transition-colors"
              >
                {statusMutation.isPending ? 'Отправка...' : 'Завершить работу'}
              </button>
              <button
                type="button"
                onClick={() => statusMutation.mutate('Cancelled')}
                disabled={statusMutation.isPending}
                className="flex-1 px-3 py-2 text-sm font-medium text-price-rise border border-price-rise/30 rounded-lg hover:bg-price-rise/10 disabled:opacity-50 transition-colors"
              >
                Отменить заявку
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TicketDetailPage;
