/**
 * Manager Order Detail Страница
 * Страница детального просмотра и управления заказом
 * Реальные API-вызовы для смены статуса (без моков)
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CircleCheck,
  Truck,
  Check,
  AlertCircle,
  User,
  Mail,
  Phone,
  CreditCard,
  MapPin,
} from 'lucide-react';
import { managerApi } from '@/api/manager';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { getStatusConfig } from '@/utils/order-status';
import { formatPrice, formatDateTime } from '@/utils/format';
import { useToast } from '@/hooks/useToast';

/* ─── Маппинг методов оплаты ─── */

const PAYMENT_LABELS: Record<string, string> = {
  OnReceipt: 'При получении',
  Card: 'Карта',
  CardOnReceipt: 'Карта при получении',
  Transfer: 'Банковский перевод',
  Online: 'Онлайн-оплата',
};

/* ─── Скелетон загрузки ─── */

function OrderDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton width={200} height={20} />
      <Skeleton width={300} height={36} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton height={200} borderRadius="lg" />
          <Skeleton height={300} borderRadius="lg" />
        </div>
        <div className="space-y-4">
          <Skeleton height={160} borderRadius="lg" />
          <Skeleton height={200} borderRadius="lg" />
        </div>
      </div>
    </div>
  );
}

/* ─── Компонент таймлайна ─── */

function OrderTimeline({ items }: { items: Array<{ status: string; date: string; active?: boolean }> }) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div
              className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${
                item.active ? 'bg-gold' : 'bg-muted-foreground/40'
              }`}
            />
            {index < items.length - 1 && (
              <div className="w-px flex-1 bg-hairline-dark mt-1" />
            )}
          </div>
          <div className="pb-4">
            <div className={`text-sm font-medium ${item.active ? 'text-foreground' : 'text-muted-foreground'}`}>
              {item.status}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {formatDateTime(item.date)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Основной компонент ─── */

export function OrderDetailPage() {
  const { id: orderId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Запрос данных заказа
  const { data: order, isLoading, error } = useQuery({
    queryKey: ['manager', 'order', orderId],
    queryFn: () => managerApi.getOrderById(orderId!),
    enabled: !!orderId,
  });

  // Мутация смены статуса
  const statusMutation = useMutation({
    mutationFn: ({ orderId: id, status }: { orderId: string; status: string }) =>
      managerApi.updateOrderStatus(id, status),
    onSuccess: () => {
      // Инвалидируем кэш заказов и конкретный заказ
      queryClient.invalidateQueries({ queryKey: ['manager', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['manager', 'order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['manager', 'dashboard'] });
      showToast('Статус обновлён', 'success');
    },
    onError: () => {
      // Ошибка обрабатывается через UI
    },
  });

  // Мутация отмены заказа
  const cancelMutation = useMutation({
    mutationFn: (id: string) => managerApi.cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['manager', 'order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['manager', 'dashboard'] });
      setShowCancelConfirm(false);
      showToast('Заказ отменён', 'success');
    },
    onError: () => {
      // Ошибка обрабатывается через UI
    },
  });

  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <Link
          to="/manager/orders"
          className="inline-flex items-center gap-1.5 text-gold hover:text-gold-active text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} />
          Назад к заказам
        </Link>
        <div className="bg-surface-card border border-hairline-dark rounded-lg p-8 text-center">
          <p className="text-price-rise font-medium">Заказ не найден</p>
          <p className="text-muted-foreground text-sm mt-1">
            Заказ #{orderId} не существует или был удалён
          </p>
        </div>
      </div>
    );
  }

  const status = getStatusConfig(order.status);
  const currentStatus = String(order.status ?? '');

  // Определяем доступные действия (числовые статусы из OrderStatus.cs)
  // 0=New, 1=Processing, 2=Paid, 3=InProgress, 4=Ready, 5=Completed, 6=Cancelled
  const canProcess = currentStatus === '0' || currentStatus === 'new';
  const canShip = currentStatus === '1' || currentStatus === 'processing';
  const canComplete = currentStatus === '3' || currentStatus === 'inprogress';
  const canCancel = currentStatus !== '5' && currentStatus !== 'completed' && currentStatus !== '6' && currentStatus !== 'cancelled';

  const isUpdating = statusMutation.isPending || cancelMutation.isPending;

  // Обработчики действий (отправляем числовые статусы)
  const handleProcess = () => {
    statusMutation.mutate({ orderId: orderId!, status: '1' }); // Processing
  };

  const handleShip = () => {
    statusMutation.mutate({ orderId: orderId!, status: '3' }); // InProgress (в сборку)
  };

  const handleComplete = () => {
    statusMutation.mutate({ orderId: orderId!, status: '5' }); // Completed (выдан)
  };

  // Парсим таймлайн из данных заказа
  const timeline = order.timeline ?? [];

  // Товары заказа
  const items = order.items ?? [];

  return (
    <div className="space-y-6">
      {/* Навигация назад */}
      <Link
        to="/manager/orders"
        className="inline-flex items-center gap-1.5 text-gold hover:text-gold-active text-sm font-medium transition-colors"
      >
        <ArrowLeft size={16} />
        Назад к заказам
      </Link>

      {/* Заголовок заказа */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <h1 className="text-2xl font-bold text-foreground">Заказ #{order.id}</h1>
        <StatusBadge variant={status.variant} label={status.label} />
      </div>

      {/* Основной контент: 2 колонки */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Левая колонка: информация + товары */}
        <div className="lg:col-span-2 space-y-4">
          {/* Информация о клиенте */}
          <div className="bg-surface-card border border-hairline-dark rounded-lg p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Информация о клиенте</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-2.5">
                <User size={16} className="text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Клиент</div>
                  <div className="text-sm text-foreground">{order.customerName ?? 'Не указан'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail size={16} className="text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div className="text-sm text-foreground">{order.customerEmail ?? '--'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone size={16} className="text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Телефон</div>
                  <div className="text-sm text-foreground font-mono">{order.customerPhone ?? '--'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Товары в заказе */}
          <div className="bg-surface-card border border-hairline-dark rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-hairline-dark">
              <h3 className="text-sm font-semibold text-foreground">Товары в заказе</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-hairline-dark">
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Товар
                    </th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Кол-во
                    </th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Цена
                    </th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Сумма
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id ?? idx} className="border-b border-hairline-dark last:border-0">
                      <td className="px-5 py-3">
                        <div className="text-sm text-foreground">{item.productName ?? 'Товар'}</div>
                      </td>
                      <td className="px-5 py-3 text-right text-sm text-foreground">
                        {item.quantity}
                      </td>
                      <td className="px-5 py-3 text-right text-sm text-foreground font-tabular-nums">
                        {formatPrice(item.price ?? 0)}
                      </td>
                      <td className="px-5 py-3 text-right text-sm text-foreground font-medium font-tabular-nums">
                        {formatPrice((item.price ?? 0) * (item.quantity ?? 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Итого */}
            <div className="px-5 py-4 border-t border-hairline-dark space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Подытог</span>
                <span className="text-foreground font-tabular-nums">
                  {formatPrice(items.reduce((sum, i) => sum + (i.price ?? 0) * (i.quantity ?? 0), 0))}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Доставка</span>
                <span className="text-foreground font-tabular-nums">
                  {formatPrice(0)}
                </span>
              </div>
              <div className="flex justify-between text-base font-semibold pt-2 border-t border-hairline-dark">
                <span className="text-foreground">Итого</span>
                <span className="text-gold font-tabular-nums">
                  {formatPrice(order.total ?? items.reduce((sum, i) => sum + (i.price ?? 0) * (i.quantity ?? 0), 0))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Правая колонка: таймлайн + действия + доставка */}
        <div className="space-y-4">
          {/* Таймлайн */}
          <div className="bg-surface-card border border-hairline-dark rounded-lg p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">История статусов</h3>
            {timeline.length > 0 ? (
              <OrderTimeline items={timeline} />
            ) : (
              <p className="text-sm text-muted-foreground">Нет данных об изменении статуса</p>
            )}
          </div>

          {/* Действия */}
          <div className="bg-surface-card border border-hairline-dark rounded-lg p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Действия</h3>
            <div className="space-y-2">
              {canProcess && (
                <Button
                  variant="primary"
                  fullWidth
                  leftIcon={<CircleCheck size={16} />}
                  onClick={handleProcess}
                  disabled={isUpdating}
                  aria-busy={isUpdating}
                  aria-label="Перевести в обработку"
                >
                  В обработку
                </Button>
              )}
              {canShip && (
                <Button
                  variant="primary"
                  fullWidth
                  leftIcon={<Truck size={16} />}
                  onClick={handleShip}
                  disabled={isUpdating}
                  aria-busy={isUpdating}
                  aria-label="Отметить как отправленный"
                >
                  Отправлен
                </Button>
              )}
              {canComplete && (
                <Button
                  variant="primary"
                  fullWidth
                  leftIcon={<Check size={16} />}
                  onClick={handleComplete}
                  disabled={isUpdating}
                  aria-busy={isUpdating}
                  aria-label="Отметить как доставленный"
                >
                  Доставлен
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="danger"
                  fullWidth
                  leftIcon={<AlertCircle size={16} />}
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={isUpdating}
                  aria-busy={isUpdating}
                  aria-label="Отменить заказ"
                >
                  Отменить заказ
                </Button>
              )}
              {!canProcess && !canShip && !canComplete && !canCancel && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Заказ завершён или отменён
                </p>
              )}

              {/* Сообщения об ошибках мутаций */}
              {statusMutation.isError && (
                <p className="text-sm text-price-rise">Ошибка смены статуса. Попробуйте ещё раз.</p>
              )}
              {cancelMutation.isError && (
                <p className="text-sm text-price-rise">Ошибка отмены заказа. Попробуйте ещё раз.</p>
              )}
            </div>

            {/* Инлайн-подтверждение отмены */}
            {showCancelConfirm && (
              <div className="bg-surface-elevated border border-hairline-dark rounded-lg p-4 space-y-3 mt-3">
                <p className="text-sm text-foreground">Вы уверены, что хотите отменить заказ?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => cancelMutation.mutate(orderId!)}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-price-rise rounded-lg hover:bg-price-rise/90"
                  >
                    Да, отменить
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="px-3 py-1.5 text-sm font-medium text-foreground bg-surface-card border border-hairline-dark rounded-lg hover:bg-surface-elevated"
                  >
                    Нет
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Доставка */}
          <div className="bg-surface-card border border-hairline-dark rounded-lg p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Доставка</h3>
            <div className="space-y-3">
              {order.deliveryAddress && (
                <div className="flex items-start gap-2.5">
                  <MapPin size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-muted-foreground">Адрес</div>
                    <div className="text-sm text-foreground">{order.deliveryAddress}</div>
                  </div>
                </div>
              )}
              {order.deliveryComment && (
                <div className="bg-surface-elevated rounded-md p-3">
                  <div className="text-xs text-muted-foreground mb-1">Комментарий</div>
                  <div className="text-sm text-foreground">{order.deliveryComment}</div>
                </div>
              )}
              {order.paymentMethod && (
                <div className="flex items-center gap-2.5">
                  <CreditCard size={16} className="text-muted-foreground shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Оплата</div>
                    <div className="text-sm text-foreground">
                      {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetailPage;
