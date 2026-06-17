/**
 * Manager Service Request Detail Page
 * Страница детального просмотра и управления сервисной заявкой
 * Назначение мастера, смена статуса, просмотр сообщений
 */

import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Monitor,
  Wrench,
  MessageSquare,
  Clock,
} from 'lucide-react';
import { managerApi } from '@/api/manager';
import { usersAdminApi } from '@/api/admin';
import { formatPrice, formatDateTime } from '@/utils/format';
import type { ServiceRequestItem } from '@/api/manager';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { getServiceStatusConfig, SERVICE_STATUS_OPTIONS } from '@/utils/service-status';
import { useToast } from '@/hooks/useToast';
import { useTicketChat } from '@/hooks/useTicketChat';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';

/* ─── Скелетон загрузки ─── */

function ServiceRequestDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton width={200} height={20} />
      <Skeleton width={300} height={36} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton height={200} borderRadius="lg" />
          <Skeleton height={150} borderRadius="lg" />
        </div>
        <div className="space-y-4">
          <Skeleton height={160} borderRadius="lg" />
          <Skeleton height={200} borderRadius="lg" />
        </div>
      </div>
    </div>
  );
}

/* ─── Основной компонент ─── */

export function ServiceRequestDetailPage() {
  const { id: serviceId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [selectedMasterId, setSelectedMasterId] = useState('');
  const [confirmClose, setConfirmClose] = useState(false);

  /* ── Chat ──────────────────────────────────────────────────────── */
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    loading: messagesLoading,
    error: chatError,
    typingUserId,
    connectionStatus,
    sendMessage,
  } = useTicketChat({ ticketId: serviceId });

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Запрос мастеров из API
  const { data: mastersData } = useQuery({
    queryKey: ['admin', 'masters'],
    queryFn: async () => {
      const response = await usersAdminApi.getUsers({ page: 1, pageSize: 100, role: 'Master' as any });
      return response.data;
    },
  });

  // Запрос данных заявки
  const { data: request, isLoading, error } = useQuery({
    queryKey: ['manager', 'serviceRequest', serviceId],
    queryFn: () => managerApi.getServiceRequestById(serviceId!),
    enabled: !!serviceId,
  });

  // Мутация назначения мастера
  const assignMasterMutation = useMutation({
    mutationFn: ({ serviceId: sId, masterId }: { serviceId: string; masterId: string }) =>
      managerApi.assignMaster(sId, masterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager', 'serviceRequest', serviceId] });
      queryClient.invalidateQueries({ queryKey: ['manager', 'serviceRequests'] });
      setSelectedMasterId('');
      showToast('Мастер назначен', 'success');
    },
    onError: () => {
      // Ошибка обрабатывается через UI
    },
  });

  // Мутация смены статуса
  const statusMutation = useMutation({
    mutationFn: ({ serviceId: sId, status }: { serviceId: string; status: string }) =>
      managerApi.updateServiceStatus(sId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager', 'serviceRequest', serviceId] });
      queryClient.invalidateQueries({ queryKey: ['manager', 'serviceRequests'] });
      showToast('Статус обновлён', 'success');
    },
    onError: () => {
      // Ошибка обрабатывается через UI
    },
  });

  // Мутация закрытия заявки
  const closeMutation = useMutation({
    mutationFn: (sId: string) => managerApi.closeServiceRequest(sId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager', 'serviceRequest', serviceId] });
      queryClient.invalidateQueries({ queryKey: ['manager', 'serviceRequests'] });
      setConfirmClose(false);
      showToast('Заявка закрыта', 'success');
    },
    onError: () => {
      // Ошибка обрабатывается через UI
    },
  });

  if (isLoading) {
    return <ServiceRequestDetailSkeleton />;
  }

  if (error || !request) {
    return (
      <div className="space-y-4">
        <Link
          to="/manager/services"
          className="inline-flex items-center gap-1.5 text-gold hover:text-gold-active text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} />
          Назад к заявкам
        </Link>
        <div className="bg-surface-card border border-hairline-dark rounded-lg p-8 text-center">
          <p className="text-price-rise font-medium">Заявка не найдена</p>
          <p className="text-muted-foreground text-sm mt-1">
            Заявка #{serviceId} не существует или была удалена
          </p>
        </div>
      </div>
    );
  }

  const status = getServiceStatusConfig(request.status);
  const currentStatus = String(request.status ?? '');

  // Определяем доступные действия
  const canStartWork = currentStatus === '0' || currentStatus === 'new';
  const canComplete = currentStatus === '1' || currentStatus === 'inprogress' || currentStatus === 'in_progress';
  const canClose = currentStatus === '3' || currentStatus === 'completed';

  const isUpdating = assignMasterMutation.isPending || statusMutation.isPending || closeMutation.isPending;

  // Обработчики действий
  const handleAssignMaster = () => {
    if (!selectedMasterId || !serviceId) return;
    assignMasterMutation.mutate({ serviceId, masterId: selectedMasterId });
  };

  const handleStartWork = () => {
    statusMutation.mutate({ serviceId: serviceId!, status: '1' });
  };

  const handleComplete = () => {
    statusMutation.mutate({ serviceId: serviceId!, status: '3' });
  };

  const handleClose = () => {
    closeMutation.mutate(serviceId!);
  };

  // Устройство
  const device = [request.deviceBrand, request.deviceModel].filter(Boolean).join(' ') || request.deviceType || '--';

  return (
    <div className="space-y-6">
      {/* Навигация назад */}
      <Link
        to="/manager/services"
        className="inline-flex items-center gap-1.5 text-gold hover:text-gold-active text-sm font-medium transition-colors"
      >
        <ArrowLeft size={16} />
        Назад к заявкам
      </Link>

      {/* Заголовок заявки */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <h1 className="text-2xl font-bold text-foreground">
          Заявка №{request.ticketNumber ?? request.id}
        </h1>
        <StatusBadge variant={status.variant} label={status.label} />
      </div>

      {/* Основной контент: 2 колонки */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Левая колонка: информация */}
        <div className="lg:col-span-2 space-y-4">
          {/* Информация о клиенте */}
          <div className="bg-surface-card border border-hairline-dark rounded-lg p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Информация о клиенте</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-2.5">
                <User size={16} className="text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Клиент</div>
                  <div className="text-sm text-foreground">{request.clientName ?? 'Не указан'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail size={16} className="text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div className="text-sm text-foreground">{request.clientEmail ?? '--'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone size={16} className="text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Телефон</div>
                  <div className="text-sm text-foreground font-mono">{request.clientPhone ?? '--'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Информация об устройстве */}
          <div className="bg-surface-card border border-hairline-dark rounded-lg p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Устройство</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-2.5">
                <Monitor size={16} className="text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Тип</div>
                  <div className="text-sm text-foreground">{request.deviceType ?? '--'}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Бренд</div>
                <div className="text-sm text-foreground">{request.deviceBrand ?? '--'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Модель</div>
                <div className="text-sm text-foreground">{request.deviceModel ?? '--'}</div>
              </div>
            </div>
          </div>

          {/* Описание проблемы */}
          <div className="bg-surface-card border border-hairline-dark rounded-lg p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Описание проблемы</h3>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {request.problemDescription ?? 'Описание не указано'}
            </p>
          </div>

          {/* Информация о заявке */}
          <div className="bg-surface-card border border-hairline-dark rounded-lg p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Детали заявки</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Тип услуги</div>
                <div className="text-sm text-foreground">{request.serviceTypeName ?? '--'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Приоритет</div>
                <div className="text-sm text-foreground">{request.priority ?? '--'}</div>
              </div>
              {request.estimatedCost != null && (
                <div>
                  <div className="text-xs text-muted-foreground">Примерная стоимость</div>
                  <div className="text-sm text-foreground font-medium">{formatPrice(request.estimatedCost)}</div>
                </div>
              )}
              <div className="flex items-center gap-2.5">
                <Clock size={16} className="text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Создано</div>
                  <div className="text-sm text-foreground">{formatDateTime(request.createdAt)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Чат с клиентом */}
          <div className="bg-surface-card rounded-xl border border-hairline-dark p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={18} className="text-gold" />
              <h3 className="text-sm font-semibold text-foreground">Чат с клиентом</h3>
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
                  <ChatMessage key={msg.id} message={msg} isOwn={msg.authorRole === 'Manager'} />
                ))
              )}
              {typingUserId && <TypingIndicator who="Клиент" />}
              <div ref={chatBottomRef} />
            </div>

            <ChatInput
              onSend={sendMessage}
              disabled={false}
              placeholder="Сообщение клиенту..."
            />
          </div>
        </div>

        {/* Правая колонка: действия + мастер */}
        <div className="space-y-4">
          {/* Назначение мастера */}
          <div className="bg-surface-card border border-hairline-dark rounded-lg p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Мастер</h3>
            {request.assignedMasterName ? (
              <div className="flex items-center gap-2.5">
                <Wrench size={16} className="text-gold shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Назначен</div>
                  <div className="text-sm text-foreground font-medium">{request.assignedMasterName}</div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Мастер не назначен</p>
                <select
                  className="w-full px-3 py-2 bg-surface-card border border-hairline-dark rounded-lg text-sm text-foreground focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors cursor-pointer"
                  value={selectedMasterId}
                  onChange={(e) => setSelectedMasterId(e.target.value)}
                  aria-label="Выбрать мастера"
                >
                  <option value="">Выберите мастера</option>
                  {(mastersData ?? []).map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name ?? m.email ?? m.id}</option>
                  ))}
                </select>
                <Button
                  variant="primary"
                  fullWidth
                  leftIcon={<Wrench size={16} />}
                  onClick={handleAssignMaster}
                  disabled={!selectedMasterId || isUpdating}
                  aria-busy={isUpdating}
                  aria-label="Назначить мастера"
                >
                  Назначить мастера
                </Button>
              </div>
            )}
          </div>

          {/* Действия */}
          <div className="bg-surface-card border border-hairline-dark rounded-lg p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Действия</h3>
            <div className="space-y-2">
              {canStartWork && (
                <Button
                  variant="primary"
                  fullWidth
                  leftIcon={<Wrench size={16} />}
                  onClick={handleStartWork}
                  disabled={isUpdating}
                  aria-busy={isUpdating}
                  aria-label="Перевести в работу"
                >
                  В работу
                </Button>
              )}
              {canComplete && (
                <Button
                  variant="primary"
                  fullWidth
                  leftIcon={<MessageSquare size={16} />}
                  onClick={handleComplete}
                  disabled={isUpdating}
                  aria-busy={isUpdating}
                  aria-label="Завершить заявку"
                >
                  Завершить
                </Button>
              )}
              {canClose && (
                confirmClose ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleClose}
                      disabled={isUpdating}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-price-rise rounded-lg hover:bg-price-rise/90 transition-colors disabled:opacity-50"
                    >
                      Да, закрыть
                    </button>
                    <button
                      onClick={() => setConfirmClose(false)}
                      className="px-3 py-1.5 text-sm font-medium text-foreground bg-surface-card border border-hairline-dark rounded-lg hover:bg-surface-elevated transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="danger"
                    fullWidth
                    leftIcon={<ArrowLeft size={16} />}
                    onClick={() => setConfirmClose(true)}
                    disabled={isUpdating}
                    aria-busy={isUpdating}
                    aria-label="Закрыть заявку"
                  >
                    Закрыть заявку
                  </Button>
                )
              )}
              {!canStartWork && !canComplete && !canClose && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Заявка завершена или закрыта
                </p>
              )}

              {/* Сообщения об ошибках мутаций */}
              {assignMasterMutation.isError && (
                <p className="text-sm text-price-rise">Ошибка назначения мастера. Попробуйте ещё раз.</p>
              )}
              {statusMutation.isError && (
                <p className="text-sm text-price-rise">Ошибка смены статуса. Попробуйте ещё раз.</p>
              )}
              {closeMutation.isError && (
                <p className="text-sm text-price-rise">Ошибка закрытия заявки. Попробуйте ещё раз.</p>
              )}
            </div>
          </div>

          {/* Информация о мастере (если назначен) */}
          {request.assignedMasterName && (
            <div className="bg-surface-card border border-hairline-dark rounded-lg p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Назначенный мастер</h3>
              <div className="flex items-center gap-2.5">
                <Wrench size={16} className="text-gold shrink-0" />
                <div>
                  <div className="text-sm text-foreground font-medium">{request.assignedMasterName}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">ID: {request.assignedMasterId ?? '--'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ServiceRequestDetailPage;
