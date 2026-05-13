import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, Package, ChevronRight } from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { Button } from '../../components/ui/Button';
import type { Order } from '../../api/orders';

const STATUS_STEPS = [
  { key: 'New', label: 'Новый' },
  { key: 'Processing', label: 'В обработке' },
  { key: 'Paid', label: 'Оплачен' },
  { key: 'InProgress', label: 'Собирается' },
  { key: 'Ready', label: 'Готов к отправке' },
  { key: 'Completed', label: 'Доставлен' },
];

export function OrderTrackingPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { getOrderByNumber } = useOrders();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderNumber) {
      getOrderByNumber(orderNumber)
        .then((result) => setOrder(result))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [orderNumber, getOrderByNumber]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-200px)] bg-background py-5 text-foreground">
        <div className="w-full max-w-[var(--layout-page-wide)] mx-auto px-[var(--layout-page-pad-x)]">
          <div className="flex items-center justify-center py-20">
            <div className="text-muted-foreground">Загрузка...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[calc(100vh-200px)] bg-background py-5 text-foreground">
        <div className="w-full max-w-[var(--layout-page-wide)] mx-auto px-[var(--layout-page-pad-x)]">
          <div className="flex flex-col gap-6 text-center p-12 bg-card border border-border rounded-xl max-w-[620px] mx-auto">
            <Package size={48} className="text-muted-foreground mx-auto" />
            <h1 className="text-xl font-semibold text-foreground m-0">Заказ не найден</h1>
            <p className="text-sm text-muted-foreground m-0">
              Заказ с номером #{orderNumber} не существует или был удалён.
            </p>
            <div>
              <Link to="/account">
                <Button variant="primary" size="md">
                  Вернуться к заказам
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === order.status);

  return (
    <div className="min-h-[calc(100vh-200px)] bg-background py-5 text-foreground">
      <div className="w-full max-w-[var(--layout-page-wide)] mx-auto px-[var(--layout-page-pad-x)]">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="text-muted-foreground no-underline transition-colors hover:text-gold">Главная</Link>
          <span>/</span>
          <Link to="/account" className="text-muted-foreground no-underline transition-colors hover:text-gold">Мои заказы</Link>
          <span>/</span>
          <span className="text-foreground">Заказ #{order.orderNumber}</span>
        </nav>

        <h1 className="text-2xl font-semibold text-foreground mb-8">Отслеживание заказа #{order.orderNumber}</h1>

        {/* Timeline */}
        <div className="bg-card border border-border rounded-xl p-8 mb-6">
          <div className="flex justify-between relative">
            {STATUS_STEPS.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div key={step.key} className="flex flex-col items-center flex-1 relative">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${
                      isCompleted
                        ? 'bg-gold text-gold-ink border-2 border-gold'
                        : isCurrent
                        ? 'bg-surface-elevated border-2 border-gold'
                        : 'bg-surface-elevated border-2 border-border'
                    }`}
                  >
                    {isCompleted && <Check size={18} />}
                  </div>
                  <div
                    className={`mt-2 text-xs text-center font-medium ${
                      isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </div>
                  {index < STATUS_STEPS.length - 1 && (
                    <div
                      className={`absolute top-5 left-[60%] right-[-40%] h-0.5 z-0 ${
                        isCompleted ? 'bg-gold' : 'bg-border'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.05em] text-foreground mb-4 pb-3 border-b border-border">
            Детали заказа
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Покупатель:</span>
              <span className="text-foreground ml-2">{order.customerFirstName} {order.customerLastName}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Телефон:</span>
              <span className="text-foreground ml-2">{order.customerPhone}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span>
              <span className="text-foreground ml-2">{order.customerEmail}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Адрес:</span>
              <span className="text-foreground ml-2">{order.address || 'Самовывоз'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Сумма:</span>
              <span className="font-mono font-semibold text-body-text ml-2">{order.total.toFixed(2)} BYN</span>
            </div>
            {order.trackingNumber && (
              <div>
                <span className="text-muted-foreground">Трек-номер:</span>
                <span className="font-mono text-foreground ml-2">{order.trackingNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-[0.05em] text-foreground mb-4 pb-3 border-b border-border">
            Товары
          </h2>
          <div className="flex flex-col gap-2">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center py-3 border-b border-border last:border-b-0"
              >
                <span className="text-sm text-foreground">{item.productName}</span>
                <span className="font-mono text-sm text-body-text">
                  {item.quantity} × {item.unitPrice.toFixed(2)} BYN
                </span>
              </div>
            ))}
          </div>
        </div>

        <Link
          to="/account"
          className="inline-flex items-center gap-1 text-sm text-gold no-underline hover:text-gold-active transition-colors"
        >
          <ChevronRight size={16} className="rotate-180" />
          Вернуться к заказам
        </Link>
      </div>
    </div>
  );
}
