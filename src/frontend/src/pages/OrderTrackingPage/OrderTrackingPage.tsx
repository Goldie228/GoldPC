import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ordersApi, type Order } from '../../api/orders';
import styles from './OrderTrackingPage.module.css';

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
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderNumber) {
      ordersApi.getOrderByNumber(orderNumber)
        .then(setOrder)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [orderNumber]);

  if (loading) {
    return <div className={styles.container}>Загрузка...</div>;
  }

  if (!order) {
    return (
      <div className={styles.container}>
        <h1>Заказ не найден</h1>
        <Link to="/account">Вернуться к заказам</Link>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === order.status);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Отслеживание заказа #{order.orderNumber}</h1>

      {/* Timeline */}
      <div className={styles.timeline}>
        {STATUS_STEPS.map((step, index) => {
          const isCompleted = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <div key={step.key} className={styles.timelineItem}>
              <div className={`${styles.timelineDot} ${isCompleted ? styles.completed : ''} ${isCurrent ? styles.current : ''}`}>
                {isCompleted && <span>✓</span>}
              </div>
              <div className={styles.timelineLabel}>{step.label}</div>
              {index < STATUS_STEPS.length - 1 && (
                <div className={`${styles.timelineLine} ${isCompleted ? styles.completed : ''}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Order Details */}
      <div className={styles.details}>
        <h2>Детали заказа</h2>
        <p><strong>Покупатель:</strong> {order.customerFirstName} {order.customerLastName}</p>
        <p><strong>Телефон:</strong> {order.customerPhone}</p>
        <p><strong>Email:</strong> {order.customerEmail}</p>
        <p><strong>Адрес:</strong> {order.address || 'Самовывоз'}</p>
        <p><strong>Сумма:</strong> {order.total.toFixed(2)} BYN</p>
        {order.trackingNumber && (
          <p><strong>Трек-номер:</strong> {order.trackingNumber}</p>
        )}
      </div>

      {/* Items */}
      <div className={styles.items}>
        <h2>Товары</h2>
        {order.items.map(item => (
          <div key={item.id} className={styles.item}>
            <span>{item.productName}</span>
            <span>{item.quantity} × {item.unitPrice.toFixed(2)} BYN</span>
          </div>
        ))}
      </div>

      <Link to="/account" className={styles.backLink}>← Вернуться к заказам</Link>
    </div>
  );
}
