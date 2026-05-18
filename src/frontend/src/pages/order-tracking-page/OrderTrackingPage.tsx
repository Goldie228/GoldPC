import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  Check, Package, ChevronRight, ShoppingCart,
  AlertCircle, XCircle, Clock, MapPin, CreditCard, Truck,
} from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { Button } from '../../components/ui/Button';
import type { Order } from '../../api/orders';

// ── Constants ──────────────────────────────────────────

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

// ── Helpers ────────────────────────────────────────────

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

// ── Component ──────────────────────────────────────────

export function OrderTrackingPage() {
  // ── URL params ────────────────────────────────────────
  const [searchParams] = useSearchParams();
  const { orderNumber: routeOrderNumber } = useParams<{ orderNumber: string }>();
  const orderNumber = searchParams.get('number') || routeOrderNumber || '';

  // ── State ─────────────────────────────────────────────
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

  // ── Render states ─────────────────────────────────────

  // Loading skeleton
  if (!hasFetched) {
    return <SkeletonView />;
  }

  // No order number provided
  if (!orderNumber) {
    return (
      <main className="min-h-screen bg-[#0b0e11] pt-[100px] px-6 pb-15">
        <div className="max-w-[620px] mx-auto">
          <div className="bg-[#1e2329] border border-[#2b3139] rounded-xl p-12 text-center">
            <Package size={48} className="text-[#707a8a] mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-[#eaecef] mb-2">Номер заказа не указан</h1>
            <p className="text-sm text-[#707a8a] mb-6">
              Укажите номер заказа в параметре <code className="text-[#fcd535]">?number=ORD-XXXXX</code>
            </p>
            <Link to="/">
              <Button variant="outline">На главную</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Not found / error
  if (order == null) {
    return (
      <main className="min-h-screen bg-[#0b0e11] pt-[100px] px-6 pb-15">
        <div className="max-w-[620px] mx-auto">
          <div className="bg-[#1e2329] border border-[#2b3139] rounded-xl p-12 text-center">
            <AlertCircle size={48} className="text-[#707a8a] mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-[#eaecef] mb-2">Заказ не найден</h1>
            <p className="text-sm text-[#707a8a] mb-6">
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
      </main>
    );
  }

  // ── Success: show order data ─────────────────────────
  const isCancelled = order.status === 'Cancelled';
  const items = order.items ?? [];

  // Build timeline
  const timelineSteps = isCancelled
    ? [...STATUS_FLOW, { key: 'Cancelled', label: 'Отменён' }]
    : STATUS_FLOW;

  let currentStepIdx: number;
  if (isCancelled) {
    currentStepIdx = -2; // sentinel — render cancelled timeline
  } else {
    currentStepIdx = timelineSteps.findIndex((s) => s.key === order.status);
  }

  return (
    <main className="min-h-screen bg-[#0b0e11] pt-[100px] px-6 pb-15">
      <div className="max-w-[1000px] mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[#707a8a] mb-6">
          <Link
            to="/"
            className="text-[#707a8a] no-underline hover:text-[#fcd535] transition-colors"
          >
            Главная
          </Link>
          <span>/</span>
          <Link
            to="/account"
            className="text-[#707a8a] no-underline hover:text-[#fcd535] transition-colors"
          >
            Мои заказы
          </Link>
          <span>/</span>
          <span className="text-[#eaecef]">Заказ #{order.orderNumber}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[#eaecef] mb-1">
              Отслеживание заказа #{order.orderNumber}
            </h1>
            <p className="text-sm text-[#707a8a]">от {formatDate(order.createdAt)}</p>
          </div>
          <StatusBadge status={order.status} isCancelled={isCancelled} />
        </div>

        {/* Timeline */}
        <div className="bg-[#1e2329] border border-[#2b3139] rounded-xl p-8 mb-6">
          <div className="relative">
            {/* Progress rail (only when not cancelled) */}
            {!isCancelled && currentStepIdx >= 0 && (
              <>
                <div className="absolute top-5 left-[30px] right-[30px] h-0.5 bg-[#2b3139]" />
                <div
                  className="absolute top-5 left-[30px] h-0.5 bg-[#fcd535] transition-all duration-500"
                  style={{
                    width:
                      currentStepIdx === timelineSteps.length - 1
                        ? 'calc(100% - 60px)'
                        : `calc((100% - 60px) * ${currentStepIdx / (timelineSteps.length - 1)})`,
                  }}
                />
              </>
            )}

            {/* Steps */}
            <div className="flex justify-between relative">
              {timelineSteps.map((step, index) => {
                const isCancelledStep = isCancelled && step.key === 'Cancelled';
                const isCompleted = !isCancelled && index < currentStepIdx;
                const isCurrent = !isCancelled && index === currentStepIdx;
                const isPending = !isCancelled && index > currentStepIdx;

                let circleBg: string;
                let circleContent: React.ReactNode;

                if (isCancelledStep) {
                  circleBg = 'bg-[#f6465d]';
                  circleContent = <XCircle size={18} className="text-white" />;
                } else if (isCompleted) {
                  circleBg = 'bg-[#fcd535]';
                  circleContent = <Check size={18} className="text-[#181a20]" />;
                } else if (isCurrent) {
                  circleBg = 'bg-[#fcd535]';
                  circleContent = <div className="w-3 h-3 rounded-full bg-[#181a20]" />;
                } else if (isCancelled) {
                  circleBg = 'bg-[#2b3139]';
                  circleContent = <div className="w-3 h-3 rounded-full bg-[#707a8a]" />;
                } else {
                  circleBg = 'bg-[#2b3139]';
                  circleContent = <div className="w-3 h-3 rounded-full bg-[#707a8a]" />;
                }

                const labelClass =
                  isCancelledStep
                    ? 'text-[#f6465d]'
                    : isCompleted || isCurrent
                      ? 'text-[#eaecef]'
                      : 'text-[#707a8a]';

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

        {/* Order Details */}
        <div className="bg-[#1e2329] border border-[#2b3139] rounded-xl p-6 mb-6">
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

        {/* Items */}
        <div className="bg-[#1e2329] border border-[#2b3139] rounded-xl p-6 mb-8">
          <SectionTitle title={`Товары (${items.length})`} />
          <div className="flex flex-col gap-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center py-2.5 border-b border-[#2b3139]/50 last:border-b-0"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-[#eaecef]">{item.productName}</span>
                  <span className="text-xs text-[#707a8a] ml-2">×{item.quantity}</span>
                </div>
                <span className="font-mono text-sm text-[#eaecef] whitespace-nowrap ml-4">
                  {formatPrice(item.totalPrice)}
                </span>
              </div>
            ))}
          </div>
          {/* Totals */}
          <div className="mt-4 pt-4 border-t border-[#2b3139] space-y-1.5">
            <TotalRow label="Сумма" value={formatPrice(order.subtotal)} />
            {order.deliveryCost > 0 && (
              <TotalRow label="Доставка" value={formatPrice(order.deliveryCost)} />
            )}
            {order.discountAmount > 0 && (
              <TotalRow
                label="Скидка"
                value={`-${formatPrice(order.discountAmount)}`}
                className="text-[#0ecb81]"
              />
            )}
            <TotalRow label="Итого" value={formatPrice(order.total)} bold />
          </div>
        </div>

        {/* Actions */}
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
            className="inline-flex items-center gap-1 text-sm text-[#fcd535] no-underline hover:text-[#f0b90b] transition-colors"
          >
            <ChevronRight size={16} className="rotate-180" />
            Вернуться к заказам
          </Link>
        </div>
      </div>
    </main>
  );
}

export default OrderTrackingPage;

// ── Internal sub-components ────────────────────────────

function StatusBadge({ status, isCancelled }: { status: string; isCancelled: boolean }) {
  const bg = isCancelled
    ? 'bg-[#f6465d]/10 text-[#f6465d] border-[#f6465d]/20'
    : 'bg-[#0ecb81]/10 text-[#0ecb81] border-[#0ecb81]/20';
  return (
    <span className={`px-3 py-1.5 rounded-md text-sm font-semibold border ${bg}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-[0.05em] text-[#eaecef] mb-4 pb-3 border-b border-[#2b3139]">
      {title}
    </h2>
  );
}

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-[#707a8a]">{label}:</span>
      <span className={`text-[#eaecef] ml-2 ${mono ? 'font-mono' : ''}`}>{value}</span>
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
      <span className="text-[#707a8a]">{label}</span>
      <span className={`font-mono ${bold ? 'font-semibold text-[#eaecef]' : 'text-[#929aa5]'} ${className}`}>
        {value}
      </span>
    </div>
  );
}

function SkeletonView() {
  return (
    <main className="min-h-screen bg-[#0b0e11] pt-[100px] px-6 pb-15">
      <div className="max-w-[1000px] mx-auto">
        {/* Breadcrumb */}
        <div className="flex gap-2 items-center mb-6">
          <div className="h-4 w-16 bg-[#2b3139] rounded animate-pulse" />
          <span className="text-[#707a8a]">/</span>
          <div className="h-4 w-24 bg-[#2b3139] rounded animate-pulse" />
          <span className="text-[#707a8a]">/</span>
          <div className="h-4 w-28 bg-[#2b3139] rounded animate-pulse" />
        </div>
        {/* Title */}
        <div className="h-8 w-64 bg-[#2b3139] rounded animate-pulse mb-8" />
        {/* Timeline */}
        <div className="bg-[#1e2329] border border-[#2b3139] rounded-xl p-8 mb-6">
          <div className="flex justify-between">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-1">
                <div className="w-10 h-10 rounded-full bg-[#2b3139] animate-pulse" />
                <div className="w-14 h-3 rounded bg-[#2b3139] animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        {/* Details */}
        <div className="bg-[#1e2329] border border-[#2b3139] rounded-xl p-6 mb-6">
          <div className="h-4 w-28 bg-[#2b3139] rounded animate-pulse mb-4" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-5 bg-[#2b3139] rounded animate-pulse" />
            ))}
          </div>
        </div>
        {/* Items */}
        <div className="bg-[#1e2329] border border-[#2b3139] rounded-xl p-6">
          <div className="h-4 w-20 bg-[#2b3139] rounded animate-pulse mb-4" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-5 bg-[#2b3139] rounded animate-pulse mb-3" />
          ))}
        </div>
      </div>
    </main>
  );
}
