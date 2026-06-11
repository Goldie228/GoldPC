import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  Check, Package, ChevronRight, ShoppingCart,
  AlertCircle, XCircle, Clock, MapPin, CreditCard, Truck,
} from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { Button } from '@/components/ui/Button';
import type { Order } from '@/api/orders';

// ── Константы ──────────────────────────────────────────

const STATUS_FLOW = [
  { key: 'New', label: 'Новый' },
  { key: 'Processing', label: 'В обработке' },
  { key: 'Paid', label: 'Оплачен' },
  { key: 'InProgress', label: 'В пути' },
  { key: 'Ready', label: 'Готов к получению' },
  { key: 'Completed', label: 'Доставлен' },
] as const;

const STATUS_LABELS: Record<string, string> = {
  New: 'Новый',
  Processing: 'В обработке',
  Paid: 'Оплачен',
  InProgress: 'В пути',
  Ready: 'Готов к получению',
  Completed: 'Доставлен',
  Cancelled: 'Отменён',
};

const DELIVERY_MAP: Record<string, string> = {
  Pickup: 'Самовывоз',
  Delivery: 'Доставка',
};

const PAYMENT_MAP: Record<string, string> = {
  Online: 'Онлайн',
  OnReceipt: 'При получении',
};

// ── Вспомогательные функции ────────────────────────────

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function formatPrice(price: number): string {
  return `${price.toFixed(2)} BYN`;
}

// ── Компонент ──────────────────────────────────────────

export function OrderTrackingPage() {
  // ── URL параметры ────────────────────────────────────────
  const [searchParams] = useSearchParams();
  const { orderNumber: routeOrderNumber } = useParams<{ orderNumber: string }>();
  const orderNumber = searchParams.get('number') || routeOrderNumber || '';

  // ── Состояние ─────────────────────────────────────────────
  const { getOrderByNumber, loading } = useOrders();
  const [order, setOrder] = useState<Order | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!orderNumber) return;
    setHasFetched(false);
    const result = await getOrderByNumber(orderNumber);
    setOrder(result);
    setHasFetched(true);
  }, [orderNumber, getOrderByNumber]);

  useEffect(() => {
    void fetchOrder();
  }, [fetchOrder]);

  // ── Состояния рендера ─────────────────────────────────────

  // Скелет загрузки
  if (!hasFetched) {
    return <SkeletonView />;
  }

  // Номер заказа не указан
  if (!orderNumber) {
    return (
      <div className="min-h-screen bg-canvas-dark px-6 pb-15 pt-8">
        <div className="max-w-[620px] mx-auto">
          <div className="bg-surface-card border border-hairline-dark rounded-xl p-12 text-center">
            <Package size={48} className="text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-body-text mb-2">Номер заказа не указан</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Укажите номер заказа в параметре <code className="text-gold">?number=ORD-XXXXX</code>
            </p>
            <Link to="/">
              <Button variant="outline">На главную</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Не найден / ошибка
  if (order == null) {
    return (
      <div className="min-h-screen bg-canvas-dark px-6 pb-15 pt-8">
        <div className="max-w-[620px] mx-auto">
          <div className="bg-surface-card border border-hairline-dark rounded-xl p-12 text-center">
            <AlertCircle size={48} className="text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-body-text mb-2">Заказ не найден</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Заказ с номером #{orderNumber} не найден. Возможно, он был удалён
              или произошла ошибка соединения.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="primary" onClick={() => void fetchOrder()}>
                Повторить
              </Button>
              <Link to="/">
                <Button variant="outline">На главную</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Успех: отображение данных заказа ─────────────────────────
  const isCancelled = order.status === 'Cancelled';
  const items = order.items ?? [];

  // Построение таймлайна
  const timelineSteps = isCancelled
    ? [...STATUS_FLOW, { key: 'Cancelled', label: 'Отменён' }]
    : STATUS_FLOW;

  let currentStepIdx: number;
  if (isCancelled) {
    currentStepIdx = -2; // маркер — отрисовка отменённого таймлайна
  } else {
    currentStepIdx = timelineSteps.findIndex((s) => s.key === order.status);
  }

  return (
    <div className="min-h-screen bg-canvas-dark px-6 pb-15 pt-8">
      <div className="max-w-[1000px] mx-auto">
        {/* Хлебные крошки */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link
            to="/"
            className="text-muted-foreground no-underline hover:text-gold transition-colors"
          >
            Главная
          </Link>
          <span>/</span>
          <Link
            to="/account"
            className="text-muted-foreground no-underline hover:text-gold transition-colors"
          >
            Мои заказы
          </Link>
          <span>/</span>
          <span className="text-body-text">Заказ #{order.orderNumber}</span>
        </nav>

        {/* Заголовок */}
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-body-text mb-1">
              Отслеживание заказа #{order.orderNumber}
            </h1>
            <p className="text-sm text-muted-foreground">от {formatDate(order.createdAt)}</p>
          </div>
          <StatusBadge status={order.status} isCancelled={isCancelled} />
        </div>

        {/* Таймлайн */}
        <div className="bg-surface-card border border-hairline-dark rounded-xl p-8 mb-6">
          <div className="relative">
            {/* Рельс прогресса (только когда не отменён) */}
            {!isCancelled && currentStepIdx >= 0 && (
              <>
                <div className="absolute top-5 left-[30px] right-[30px] h-0.5 bg-surface-elevated" />
                <div
                  className="absolute top-5 left-[30px] h-0.5 bg-gold transition-all duration-500"
                  style={{
                    width:
                      currentStepIdx === timelineSteps.length - 1
                        ? 'calc(100% - 60px)'
                        : `calc((100% - 60px) * ${currentStepIdx / (timelineSteps.length - 1)})`,
                  }}
                />
              </>
            )}

            {/* Шаги */}
            <div className="flex justify-between relative">
              {timelineSteps.map((step, index) => {
                const isCancelledStep = isCancelled && step.key === 'Cancelled';
                const isCompleted = !isCancelled && index < currentStepIdx;
                const isCurrent = !isCancelled && index === currentStepIdx;
                const isPending = !isCancelled && index > currentStepIdx;

                let circleBg: string;
                let circleContent: React.ReactNode;

                if (isCancelledStep) {
                  circleBg = 'bg-price-rise';
                  circleContent = <XCircle size={18} className="text-white" />;
                } else if (isCompleted) {
                  circleBg = 'bg-gold';
                  circleContent = <Check size={18} className="text-gold-ink" />;
                } else if (isCurrent) {
                  circleBg = 'bg-gold';
                  circleContent = <div className="w-3 h-3 rounded-full bg-gold-ink" />;
                } else if (isCancelled) {
                  circleBg = 'bg-surface-elevated';
                  circleContent = <div className="w-3 h-3 rounded-full bg-muted-foreground" />;
                } else {
                  circleBg = 'bg-surface-elevated';
                  circleContent = <div className="w-3 h-3 rounded-full bg-muted-foreground" />;
                }

                const labelClass =
                  isCancelledStep
                    ? 'text-price-rise'
                    : isCompleted || isCurrent
                      ? 'text-body-text'
                      : 'text-muted-foreground';

                return (
                  <div key={step.key} className="flex flex-col items-center relative z-10 flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${circleBg}`}
                    >
                      {circleContent}
                    </div>
                    <span className={`mt-2 text-xs font-medium text-center leading-tight ${labelClass}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Детали заказа */}
        <div className="bg-surface-card border border-hairline-dark rounded-xl p-6 mb-6">
          <SectionTitle title="Детали заказа" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <DetailRow
              label="Покупатель"
              value={`${order.customerFirstName} ${order.customerLastName}`}
            />
            <DetailRow label="Телефон" value={order.customerPhone} />
            <DetailRow label="Email" value={order.customerEmail} />
            <DetailRow label="Адрес" value={order.address || 'Самовывоз'} />
            <DetailRow
              label="Доставка"
              value={DELIVERY_MAP[order.deliveryMethod] || order.deliveryMethod}
            />
            <DetailRow
              label="Оплата"
              value={PAYMENT_MAP[order.paymentMethod] || order.paymentMethod}
            />
            {order.trackingNumber && (
              <DetailRow label="Трек-номер" value={order.trackingNumber} mono />
            )}
            {order.deliveryDate && (
              <DetailRow label="Дата доставки" value={formatDate(order.deliveryDate)} />
            )}
          </div>
        </div>

        {/* Товары */}
        <div className="bg-surface-card border border-hairline-dark rounded-xl p-6 mb-8">
          <SectionTitle title={`Товары (${items.length})`} />
          <div className="flex flex-col gap-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center py-2.5 border-b border-hairline-dark/50 last:border-b-0"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-body-text">{item.productName}</span>
                  <span className="text-xs text-muted-foreground ml-2">×{item.quantity}</span>
                </div>
                <span className="font-mono text-sm text-body-text whitespace-nowrap ml-4">
                  {formatPrice(item.totalPrice)}
                </span>
              </div>
            ))}
          </div>
          {/* Итого */}
          <div className="mt-4 pt-4 border-t border-hairline-dark space-y-1.5">
            <TotalRow label="Сумма" value={formatPrice(order.subtotal)} />
            {order.deliveryCost > 0 && (
              <TotalRow label="Доставка" value={formatPrice(order.deliveryCost)} />
            )}
            {order.discountAmount > 0 && (
              <TotalRow
                label="Скидка"
                value={`-${formatPrice(order.discountAmount)}`}
                className="text-price-drop"
              />
            )}
            <TotalRow label="Итого" value={formatPrice(order.total)} bold />
          </div>
        </div>

        {/* Действия */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="primary"
            leftIcon={<ShoppingCart size={16} />}
            onClick={() => { window.location.href = '/catalog'; }}
          >
            Повторить заказ
          </Button>
          <Link
            to="/account"
            className="inline-flex items-center gap-1 text-sm text-gold no-underline hover:text-gold-active transition-colors"
          >
            <ChevronRight size={16} className="rotate-180" />
            Вернуться к заказам
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OrderTrackingPage;

// ── Внутренние подкомпоненты ────────────────────────────

function StatusBadge({ status, isCancelled }: { status: string; isCancelled: boolean }) {
  const bg = isCancelled
    ? 'bg-price-rise/10 text-price-rise border-price-rise/20'
    : 'bg-price-drop/10 text-price-drop border-price-drop/20';
  return (
    <span className={`px-3 py-1.5 rounded-md text-sm font-semibold border ${bg}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-[0.05em] text-body-text mb-4 pb-3 border-b border-hairline-dark">
      {title}
    </h2>
  );
}

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}:</span>
      <span className={`text-body-text ml-2 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

function TotalRow({
  label,
  value,
  bold = false,
  className = '',
}: {
  label: string;
  value: string;
  bold?: boolean;
  className?: string;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono ${bold ? 'font-semibold text-body-text' : 'text-muted-strong'} ${className}`}>
        {value}
      </span>
    </div>
  );
}

function SkeletonView() {
  return (
    <div className="min-h-screen bg-canvas-dark px-6 pb-15 pt-8">
      <div className="max-w-[1000px] mx-auto">
        {/* Хлебные крошки */}
        <div className="flex gap-2 items-center mb-6">
          <div className="h-4 w-16 bg-surface-elevated rounded animate-pulse" />
          <span className="text-muted-foreground">/</span>
          <div className="h-4 w-24 bg-surface-elevated rounded animate-pulse" />
          <span className="text-muted-foreground">/</span>
          <div className="h-4 w-28 bg-surface-elevated rounded animate-pulse" />
        </div>
        {/* Заголовок */}
        <div className="h-8 w-64 bg-surface-elevated rounded animate-pulse mb-8" />
        {/* Таймлайн */}
        <div className="bg-surface-card border border-hairline-dark rounded-xl p-8 mb-6">
          <div className="flex justify-between">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-1">
                <div className="w-10 h-10 rounded-full bg-surface-elevated animate-pulse" />
                <div className="w-14 h-3 rounded bg-surface-elevated animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        {/* Детали */}
        <div className="bg-surface-card border border-hairline-dark rounded-xl p-6 mb-6">
          <div className="h-4 w-28 bg-surface-elevated rounded animate-pulse mb-4" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-5 bg-surface-elevated rounded animate-pulse" />
            ))}
          </div>
        </div>
        {/* Товары */}
        <div className="bg-surface-card border border-hairline-dark rounded-xl p-6">
          <div className="h-4 w-20 bg-surface-elevated rounded animate-pulse mb-4" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-5 bg-surface-elevated rounded animate-pulse mb-3" />
          ))}
        </div>
      </div>
    </div>
  );
}
