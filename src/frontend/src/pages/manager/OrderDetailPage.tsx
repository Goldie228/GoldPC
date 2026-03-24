/**
 * Manager Order Detail Page
 * Страница детального просмотра и управления заказом
 * Основано на prototypes/manager-order-detail.html
 */

import { useState } from 'react';
import './OrderDetailPage.css';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';

interface OrderItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  total: number;
}

interface Order {
  id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  status: OrderStatus;
  date: string;
  paymentMethod: string;
  deliveryMethod: string;
  deliveryAddress: string;
  deliveryComment?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCost: number;
  total: number;
  timeline: TimelineItem[];
}

interface TimelineItem {
  status: string;
  date: string;
  active?: boolean;
}

// Моковые данные для демонстрации
const MOCK_ORDER: Order = {
  id: 'ORD-2025-001',
  customer: {
    name: 'Александр Петров',
    email: 'alex@example.com',
    phone: '+375 (29) 123-45-67',
  },
  status: 'processing',
  date: '2025-03-17T14:32:00',
  paymentMethod: 'Картой онлайн',
  deliveryMethod: 'Курьером по Минску',
  deliveryAddress: 'г. Минск, ул. Примерная, д. 10, кв. 25',
  deliveryComment: 'Домофон не работает, позвонить за 15 минут',
  items: [
    {
      id: '1',
      name: 'AMD Ryzen 7 7800X3D',
      sku: 'CPU-AMD-7800X3D',
      quantity: 1,
      price: 1450,
      total: 1450,
    },
    {
      id: '2',
      name: 'NVIDIA RTX 4070 Ti Super 16GB',
      sku: 'GPU-NV-4070TIS',
      quantity: 1,
      price: 3200,
      total: 3200,
    },
    {
      id: '3',
      name: 'G.Skill Trident Z5 32GB DDR5',
      sku: 'RAM-GSK-TZ5-32',
      quantity: 1,
      price: 650,
      total: 650,
    },
    {
      id: '4',
      name: 'Samsung 990 Pro 2TB NVMe',
      sku: 'SSD-SAM-990P-2T',
      quantity: 1,
      price: 380,
      total: 380,
    },
  ],
  subtotal: 5680,
  deliveryCost: 0,
  total: 5430,
  timeline: [
    { status: 'В обработке', date: '2025-03-17T14:45:00', active: true },
    { status: 'Оплата подтверждена', date: '2025-03-17T14:33:00' },
    { status: 'Заказ создан', date: '2025-03-17T14:32:00' },
  ],
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Ожидает',
  processing: 'В обработке',
  shipped: 'Отправлен',
  completed: 'Завершён',
  cancelled: 'Отменён',
};

const STATUS_CLASSES: Record<OrderStatus, string> = {
  pending: 'status-badge--pending',
  processing: 'status-badge--processing',
  shipped: 'status-badge--shipped',
  completed: 'status-badge--completed',
  cancelled: 'status-badge--cancelled',
};

function formatPrice(price: number): string {
  return price.toLocaleString('ru-BY') + ' BYN';
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateTimeShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).replace(',', '');
}

export function OrderDetailPage() {
  const [order, setOrder] = useState<Order>(MOCK_ORDER);
  const [isUpdating, setIsUpdating] = useState(false);

  // Обработчики действий
  const handleProcess = async () => {
    setIsUpdating(true);
    // Имитация API вызова
    await new Promise((resolve) => setTimeout(resolve, 500));
    setOrder((prev) => ({
      ...prev,
      status: 'processing',
      timeline: [
        { status: 'В обработке', date: new Date().toISOString(), active: true },
        ...prev.timeline.map((t) => ({ ...t, active: false })),
      ],
    }));
    setIsUpdating(false);
  };

  const handleShip = async () => {
    setIsUpdating(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setOrder((prev) => ({
      ...prev,
      status: 'shipped',
      timeline: [
        { status: 'Отправлен', date: new Date().toISOString(), active: true },
        ...prev.timeline.map((t) => ({ ...t, active: false })),
      ],
    }));
    setIsUpdating(false);
  };

  const handleComplete = async () => {
    setIsUpdating(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setOrder((prev) => ({
      ...prev,
      status: 'completed',
      timeline: [
        { status: 'Завершён', date: new Date().toISOString(), active: true },
        ...prev.timeline.map((t) => ({ ...t, active: false })),
      ],
    }));
    setIsUpdating(false);
  };

  const handleCancel = async () => {
    if (!window.confirm('Вы уверены, что хотите отменить заказ?')) {
      return;
    }
    setIsUpdating(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setOrder((prev) => ({
      ...prev,
      status: 'cancelled',
      timeline: [
        { status: 'Отменён', date: new Date().toISOString(), active: true },
        ...prev.timeline.map((t) => ({ ...t, active: false })),
      ],
    }));
    setIsUpdating(false);
  };

  // Определяем доступные действия на основе текущего статуса
  const availableActions = {
    canProcess: order.status === 'pending',
    canShip: order.status === 'processing',
    canComplete: order.status === 'shipped',
    canCancel: order.status !== 'completed' && order.status !== 'cancelled',
  };

  return (
    <div className="order-detail">
      {/* Header */}
      <header className="order-detail__header">
        <div className="order-detail__title-section">
          <a href="/manager/orders" className="back-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Назад к заказам
          </a>
          <h1 className="order-detail__title">#{order.id}</h1>
          <div className="order-detail__status">
            <span className={'status-badge ' + STATUS_CLASSES[order.status]}>
              {STATUS_LABELS[order.status]}
            </span>
          </div>
        </div>
      </header>

      <div className="order-detail__content">
        {/* Main Content */}
        <div className="order-detail__main">
          {/* Order Info Card */}
          <div className="card">
            <div className="card__header">
              <span className="card__title">Информация о заказе</span>
            </div>
            <div className="card__body">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-item__label">Клиент</span>
                  <span className="info-item__value">{order.customer.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-item__label">Email</span>
                  <span className="info-item__value">{order.customer.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-item__label">Телефон</span>
                  <span className="info-item__value info-item__value--mono">
                    {order.customer.phone}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-item__label">Дата заказа</span>
                  <span className="info-item__value info-item__value--mono">
                    {formatDateTime(order.date)}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-item__label">Способ оплаты</span>
                  <span className="info-item__value">{order.paymentMethod}</span>
                </div>
                <div className="info-item">
                  <span className="info-item__label">Доставка</span>
                  <span className="info-item__value">{order.deliveryMethod}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="card order-detail__items">
            <div className="card__header">
              <span className="card__title">Товары в заказе</span>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Товар</th>
                  <th>Кол-во</th>
                  <th>Цена</th>
                  <th>Сумма</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="item-name">{item.name}</div>
                      <div className="item-sku">SKU: {item.sku}</div>
                    </td>
                    <td>
                      <span className="item-qty">{item.quantity}</span>
                    </td>
                    <td>
                      <span className="item-price">{formatPrice(item.price)}</span>
                    </td>
                    <td>
                      <span className="item-total">{formatPrice(item.total)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="order-summary">
              <div className="summary-row">
                <span className="summary-label">Подытог</span>
                <span className="summary-value">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Доставка</span>
                <span className="summary-value">
                  {order.deliveryCost === 0 ? '0 BYN' : formatPrice(order.deliveryCost)}
                </span>
              </div>
              <div className="summary-row summary-row--total">
                <span className="summary-label">Итого</span>
                <span className="summary-value">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="order-detail__sidebar">
          {/* Timeline */}
          <div className="card">
            <div className="card__header">
              <span className="card__title">История статусов</span>
            </div>
            <div className="card__body">
              <div className="timeline">
                {order.timeline.map((item, index) => (
                  <div
                    key={index}
                    className={'timeline-item' + (item.active ? ' timeline-item--active' : '')}
                  >
                    <div className="timeline-item__marker"></div>
                    <div className="timeline-item__content">
                      <div className="timeline-item__title">{item.status}</div>
                      <div className="timeline-item__date">{formatDateTimeShort(item.date)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="card">
            <div className="card__header">
              <span className="card__title">Действия</span>
            </div>
            <div className="card__body">
              <div className="actions-group">
                {availableActions.canProcess && (
                  <button
                    className="btn btn--primary btn--full"
                    onClick={handleProcess}
                    disabled={isUpdating}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    Обработать
                  </button>
                )}
                {availableActions.canShip && (
                  <button
                    className="btn btn--primary btn--full"
                    onClick={handleShip}
                    disabled={isUpdating}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="3" width="15" height="13" />
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                    Отправить
                  </button>
                )}
                {availableActions.canComplete && (
                  <button
                    className="btn btn--primary btn--full"
                    onClick={handleComplete}
                    disabled={isUpdating}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Завершить
                  </button>
                )}
                {availableActions.canCancel && (
                  <button
                    className="btn btn--secondary btn--full"
                    onClick={handleCancel}
                    disabled={isUpdating}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    Отменить заказ
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="card">
            <div className="card__header">
              <span className="card__title">Доставка</span>
            </div>
            <div className="card__body">
              <div className="info-grid info-grid--single">
                <div className="info-item">
                  <span className="info-item__label">Адрес</span>
                  <span className="info-item__value">{order.deliveryAddress}</span>
                </div>
                {order.deliveryComment && (
                  <div className="info-item">
                    <span className="info-item__label">Комментарий</span>
                    <span className="info-item__value">{order.deliveryComment}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetailPage;