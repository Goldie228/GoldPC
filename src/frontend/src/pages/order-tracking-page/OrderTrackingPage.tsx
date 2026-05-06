import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOrders } from '../../hooks/useOrders';
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
    return <div className="max-w-[900px] mx-auto my-8 p-8">Загрузка...</div>;
  }

  if (!order) {
    return (
      <div className="max-w-[900px] mx-auto my-8 p-8">
        <h1>Заказ не найден</h1>
        <Link to="/account">Вернуться к заказам</Link>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === order.status);

  return (
    <div className="max-w-[900px] mx-auto my-8 p-8">
      <h1 className="text-2xl mb-8 text-[var(--color-text)]">Отслеживание заказа #{order.orderNumber}</h1>

      {/* Timeline */}
      <div className="flex justify-between my-12 relative">
        {STATUS_STEPS.map((step, index) => {
          const isCompleted = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <div key={step.key} className="flex flex-col items-center flex-1 relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center z-2 ${
                isCompleted
                  ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white border-2'
                  : isCurrent
                  ? 'bg-[var(--color-bg-secondary)] border-[var(--color-accent)] border-[3px]'
                  : 'bg-[var(--color-bg-secondary)] border-2 border-[var(--color-border)]'
              }`}>
                {isCompleted && <span>✓</span>}
              </div>
              <div className="mt-2 text-sm text-center">{step.label}</div>
              {index < STATUS_STEPS.length - 1 && (
                <div className={`absolute top-5 left-1/2 right-[-50%] h-0.5 z-1 ${
                  isCompleted ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Order Details */}
      <div className="bg-[var(--color-bg-secondary)] p-6 rounded-lg my-6">
        <h2 className="mb-4">Детали заказа</h2>
        <p className="my-2"><strong>Покупатель:</strong> {order.customerFirstName} {order.customerLastName}</p>
        <p className="my-2"><strong>Телефон:</strong> {order.customerPhone}</p>
        <p className="my-2"><strong>Email:</strong> {order.customerEmail}</p>
        <p className="my-2"><strong>Адрес:</strong> {order.address || 'Самовывоз'}</p>
        <p className="my-2"><strong>Сумма:</strong> {order.total.toFixed(2)} BYN</p>
        {order.trackingNumber && (
          <p className="my-2"><strong>Трек-номер:</strong> {order.trackingNumber}</p>
        )}
      </div>

      {/* Items */}
      <div className="bg-[var(--color-bg-secondary)] p-6 rounded-lg my-6">
        <h2 className="mb-4">Товары</h2>
        {order.items.map(item => (
          <div key={item.id} className="flex justify-between py-3 border-b border-[var(--color-border)] last:border-b-0">
            <span>{item.productName}</span>
            <span>{item.quantity} × {item.unitPrice.toFixed(2)} BYN</span>
          </div>
        ))}
      </div>

      <Link to="/account" className="inline-block mt-8 text-[var(--color-accent)] no-underline hover:underline">← Вернуться к заказам</Link>
    </div>
  );
}
