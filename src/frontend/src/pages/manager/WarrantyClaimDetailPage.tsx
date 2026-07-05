/**
 * Manager Warranty Claim Detail Страница
 * Страница детального просмотра и управления гарантийной претензией
 * Смена статуса, просмотр информации о клиенте и товаре
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Shield,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { managerApi } from '@/api/manager';
import type { WarrantyClaimItem } from '@/api/manager';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { getWarrantyStatusConfig } from '@/utils/warranty-status';
import { formatDateTime } from '@/utils/format';
import { useToast } from '@/hooks/useToast';

/* ─── Скелетон загрузки ─── */

function WarrantyClaimDetailSkeleton() {
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

export function WarrantyClaimDetailPage() {
  const { id: claimId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [confirmReject, setConfirmReject] = useState(false);

  // Запрос данных претензии
  const { data: claim, isLoading, error } = useQuery({
    queryKey: ['manager', 'warrantyClaim', claimId],
    queryFn: () => managerApi.getWarrantyClaimById(claimId!),
    enabled: !!claimId,
  });

  // Мутация смены статуса
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      managerApi.updateWarrantyClaimStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager', 'warrantyClaim', claimId] });
      queryClient.invalidateQueries({ queryKey: ['manager', 'warrantyClaims'] });
      setConfirmReject(false);
      showToast('Статус обновлён', 'success');
    },
    onError: () => {
      // Ошибка обрабатывается через UI
    },
  });

  // Мутация завершения претензии
  const resolveMutation = useMutation({
    mutationFn: (id: string) => managerApi.resolveWarrantyClaim(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager', 'warrantyClaim', claimId] });
      queryClient.invalidateQueries({ queryKey: ['manager', 'warrantyClaims'] });
      showToast('Претензия завершена', 'success');
    },
    onError: () => {
      // Ошибка обрабатывается через UI
    },
  });

  if (isLoading) {
    return <WarrantyClaimDetailSkeleton />;
  }

  if (error || !claim) {
    return (
      <div className="space-y-4">
        <Link
          to="/manager/warranty"
          className="inline-flex items-center gap-1.5 text-gold hover:text-gold-active text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} />
          Назад к претензиям
        </Link>
        <div className="bg-surface-card border border-hairline-dark rounded-lg p-8 text-center">
          <p className="text-price-rise font-medium">Претензия не найдена</p>
          <p className="text-muted-foreground text-sm mt-1">
            Претензия #{claimId} не существует или была удалена
          </p>
        </div>
      </div>
    );
  }

  const status = getWarrantyStatusConfig(claim.status);
  const currentStatus = String(claim.status ?? '');

  // Определяем доступные действия
  const canStartWork = currentStatus === '0' || currentStatus === 'new';
  const canApprove = currentStatus === '1' || currentStatus === 'inprogress' || currentStatus === 'in_progress';
  const canReject = currentStatus === '0' || currentStatus === '1' || currentStatus === 'new' || currentStatus === 'inprogress' || currentStatus === 'in_progress';
  const canComplete = currentStatus === '2' || currentStatus === 'approved';

  const isUpdating = statusMutation.isPending || resolveMutation.isPending;

  // Обработчики действий
  const handleStartWork = () => {
    statusMutation.mutate({ id: claimId!, status: '1' });
  };

  const handleApprove = () => {
    statusMutation.mutate({ id: claimId!, status: '2' });
  };

  const handleReject = () => {
    statusMutation.mutate({ id: claimId!, status: '3' });
  };

  const handleComplete = () => {
    resolveMutation.mutate(claimId!);
  };

  return (
    <div className="space-y-6">
      {/* Навигация назад */}
      <Link
        to="/manager/warranty"
        className="inline-flex items-center gap-1.5 text-gold hover:text-gold-active text-sm font-medium transition-colors"
      >
        <ArrowLeft size={16} />
        Назад к претензиям
      </Link>

      {/* Заголовок претензии */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <h1 className="text-2xl font-bold text-foreground">
          Претензия №{claim.claimNumber ?? claim.id}
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
                  <div className="text-sm text-foreground">{claim.clientName ?? 'Не указан'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail size={16} className="text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div className="text-sm text-foreground">{claim.clientEmail ?? '--'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone size={16} className="text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Телефон</div>
                  <div className="text-sm text-foreground font-mono">{claim.clientPhone ?? '--'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Информация о товаре */}
          <div className="bg-surface-card border border-hairline-dark rounded-lg p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Товар</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2.5">
                <Package size={16} className="text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Товар</div>
                  <div className="text-sm text-foreground">{claim.productName ?? '--'}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Серийный номер</div>
                <div className="text-sm text-foreground font-mono">{claim.serialNumber ?? '--'}</div>
              </div>
            </div>
          </div>

          {/* Описание проблемы */}
          <div className="bg-surface-card border border-hairline-dark rounded-lg p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Описание проблемы</h3>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {claim.issueDescription ?? 'Описание не указано'}
            </p>
          </div>

          {/* Таймлайн статуса */}
          <div className="bg-surface-card border border-hairline-dark rounded-lg p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">История статусов</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-info-blue shrink-0" />
                <div>
                  <div className="text-sm text-foreground">Создана</div>
                  <div className="text-xs text-muted-foreground">{formatDateTime(claim.createdAt)}</div>
                </div>
              </div>
              {claim.updatedAt && claim.updatedAt !== claim.createdAt && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-warning shrink-0" />
                  <div>
                    <div className="text-sm text-foreground">Обновлена</div>
                    <div className="text-xs text-muted-foreground">{formatDateTime(claim.updatedAt)}</div>
                  </div>
                </div>
              )}
              {claim.resolvedAt && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-price-drop shrink-0" />
                  <div>
                    <div className="text-sm text-foreground">Завершена</div>
                    <div className="text-xs text-muted-foreground">{formatDateTime(claim.resolvedAt)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Правая колонка: действия */}
        <div className="space-y-4">
          {/* Действия */}
          <div className="bg-surface-card border border-hairline-dark rounded-lg p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Действия</h3>
            <div className="space-y-2">
              {canStartWork && (
                <Button
                  variant="primary"
                  fullWidth
                  leftIcon={<Play size={16} />}
                  onClick={handleStartWork}
                  disabled={isUpdating}
                  aria-busy={isUpdating}
                  aria-label="Взять в обработку"
                >
                  В обработку
                </Button>
              )}
              {canApprove && (
                <Button
                  variant="primary"
                  fullWidth
                  leftIcon={<CheckCircle size={16} />}
                  onClick={handleApprove}
                  disabled={isUpdating}
                  aria-busy={isUpdating}
                  aria-label="Одобрить претензию"
                >
                  Одобрить
                </Button>
              )}
              {canReject && (
                confirmReject ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => statusMutation.mutate({ id: claimId!, status: '3' })}
                      disabled={isUpdating}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-price-rise rounded-lg hover:bg-price-rise/90 transition-colors disabled:opacity-50"
                    >
                      Да, отклонить
                    </button>
                    <button
                      onClick={() => setConfirmReject(false)}
                      className="px-3 py-1.5 text-sm font-medium text-foreground bg-surface-card border border-hairline-dark rounded-lg hover:bg-surface-elevated transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    fullWidth
                    leftIcon={<XCircle size={16} />}
                    onClick={() => setConfirmReject(true)}
                    disabled={isUpdating}
                    aria-busy={isUpdating}
                    aria-label="Отклонить претензию"
                    className="text-price-rise border border-price-rise/30 hover:bg-price-rise/10"
                  >
                    Отклонить
                  </Button>
                )
              )}
              {canComplete && (
                <Button
                  variant="primary"
                  fullWidth
                  leftIcon={<RotateCcw size={16} />}
                  onClick={handleComplete}
                  disabled={isUpdating}
                  aria-busy={isUpdating}
                  aria-label="Завершить претензию"
                >
                  Завершить
                </Button>
              )}
              {!canStartWork && !canApprove && !canReject && !canComplete && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Претензия завершена или закрыта
                </p>
              )}

              {/* Сообщения об ошибках мутаций */}
              {statusMutation.isError && (
                <p className="text-sm text-price-rise">Ошибка смены статуса. Попробуйте ещё раз.</p>
              )}
              {resolveMutation.isError && (
                <p className="text-sm text-price-rise">Ошибка завершения претензии. Попробуйте ещё раз.</p>
              )}
            </div>
          </div>

          {/* Информация о гарантийной карте */}
          {claim.warrantyCardId && (
            <div className="bg-surface-card border border-hairline-dark rounded-lg p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Гарантийная карта</h3>
              <div className="flex items-center gap-2.5">
                <Shield size={16} className="text-gold shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">ID гарантийной карты</div>
                  <div className="text-sm text-foreground font-mono">{claim.warrantyCardId}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WarrantyClaimDetailPage;
