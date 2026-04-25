import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ordersApi, type Order, type OrderItem } from '../../api/orders';
import { useToastStore } from '../../store/toastStore';
import { Modal } from '../../components/ui/Modal/Modal';
import styles from './AccountOrders.module.css';

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'New': 'Новый',
    'Processing': 'В обработке',
    'Paid': 'Оплачен',
    'InProgress': 'В пути',
    'Ready': 'Готов к получению',
    'Completed': 'Доставлен',
    'Cancelled': 'Отменён',
  };
  return labels[status] || status;
}

function getStatusProgress(status: string): number {
  const progress: Record<string, number> = {
    'New': 0,
    'Processing': 33,
    'Paid': 50,
    'InProgress': 75,
    'Ready': 85,
    'Completed': 100,
    'Cancelled': 0,
  };
  return progress[status] ?? 0;
}

/**
 * AccountOrders - Order history page
 * 
 * Features:
 * - Order stats cards
 * - Filter buttons
 * - Orders table with status badges
 * - Pagination
 */
export function AccountOrders() {
  const navigate = useNavigate();
  const showToast = useToastStore(state => state.showToast);
  
  const [activeFilter, setActiveFilter] = useState('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page] = useState(1);

  const pageSize = 10;

  useEffect(() => {
    setLoading(true);
    ordersApi.getMyOrders(page, pageSize, activeFilter === 'all' ? undefined : activeFilter)
      .then(result => {
        setOrders(result.items);
      })
      .catch(() => showToast('Ошибка загрузки заказов', 'error'))
      .finally(() => setLoading(false));
  }, [page, activeFilter, showToast]);

  const stats = {
    total: orders.length,
    delivered: orders.filter(o => o.status === 'Completed').length,
    shipped: orders.filter(o => o.status === 'InProgress' || o.status === 'Ready').length,
    processing: orders.filter(o => o.status === 'Processing').length,
  };

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handleViewDetails = async (currentOrderId: Order) => {
    setSelectedOrder(currentOrderId);
    setDetailsLoading(true);
    setShowDetailsModal(true);

    try {
      const details = await ordersApi.getOrder(currentOrderId.id);
      setOrderDetails(details);
    } catch {
      showToast('Ошибка загрузки деталей заказа', 'error');
    } finally {
      setDetailsLoading(false);
    }
  };

  // Simple polling for status updates (every 30 seconds)
  const refreshOrderStatus = useCallback(async () => {
    if (selectedOrder && showDetailsModal) {
      try {
        const details = await ordersApi.getOrder(selectedOrder.id);
        setOrderDetails(details);

        // Update currentOrderId in list
        setOrders(prev => prev.map(o => o.id === details.id ? details : o));
      } catch {
        // Silently fail on polling errors
      }
    }
  }, [selectedOrder, showDetailsModal]);

  useEffect(() => {
    if (!showDetailsModal) return;

    const interval = setInterval(refreshOrderStatus, 30000);
    return () => clearInterval(interval);
  }, [showDetailsModal, refreshOrderStatus]);

  const handleRepeatOrder = async (orderId: string) => {
    const currentOrderId = orderId;
    // TODO: Actual implementation to copy items to cart
    showToast(`Товары из заказа ${currentOrderId} добавлены в корзину`, 'success');
    navigate('/cart');
  };

  const ordersFormatted = orders.map(currentOrderId => ({
    id: currentOrderId.orderNumber,
    items: currentOrderId.items.slice(0, 2).map(i => ({ name: i.productName, quantity: i.quantity })),
    date: new Date(currentOrderId.createdAt).toLocaleDateString('ru-RU'),
    total: `${currentOrderId.total.toFixed(2)} BYN`,
    status: currentOrderId.status,
    statusLabel: getStatusLabel(currentOrderId.status),
    moreItems: currentOrderId.items.length > 2 ? currentOrderId.items.length - 2 : undefined,
  }));

  if (loading) {
    return <div className="account-orders">Загрузка...</div>;
  }

  const filters = [
    { id: 'all', label: 'Все' },
    { id: 'Completed', label: 'Доставленные' },
    { id: 'InProgress', label: 'В пути' },
    { id: 'Processing', label: 'В обработке' },
    { id: 'Cancelled', label: 'Отменённые' },
  ];

  // Old mock data kept for fallback (can be removed later)
  const oldOrdersMock = [
    {
      id: 'ORD-2025-0847',
      items: [
        { name: 'RTX 4070 Ti Super 16GB', quantity: 1 },
        { name: 'AMD Ryzen 7 7800X3D', quantity: 1 },
      ],
      date: '15.03.2026',
      total: '4 650 BYN',
      status: 'delivered',
      statusLabel: 'Доставлен',
    },
    {
      id: 'ORD-2025-0712',
      items: [{ name: 'G.Skill Trident Z5 32GB DDR5', quantity: 1 }],
      date: '02.03.2026',
      total: '650 BYN',
      status: 'delivered',
      statusLabel: 'Доставлен',
    },
    {
      id: 'ORD-2025-0698',
      items: [
        { name: 'Samsung 990 Pro 2TB NVMe', quantity: 1 },
        { name: 'Corsair RM850x PSU', quantity: 1 },
      ],
      date: '24.02.2026',
      total: '680 BYN',
      status: 'shipped',
      statusLabel: 'В пути',
    },
    {
      id: 'ORD-2025-0543',
      items: [{ name: 'ASUS ROG Strix B650E-F', quantity: 1 }],
      date: '10.02.2026',
      total: '520 BYN',
      status: 'processing',
      statusLabel: 'В обработке',
    },
    {
      id: 'ORD-2025-0421',
      items: [
        { name: 'NZXT H7 Flow Case', quantity: 1 },
        { name: 'Corsair iCUE H150i Elite', quantity: 1 },
      ],
      date: '28.01.2026',
      total: '1 240 BYN',
      status: 'delivered',
      statusLabel: 'Доставлен',
      moreItems: 2,
    },
    {
      id: 'ORD-2025-0315',
      items: [{ name: 'Logitech G Pro X Superlight', quantity: 1 }],
      date: '15.01.2026',
      total: '380 BYN',
      status: 'delivered',
      statusLabel: 'Доставлен',
    },
    {
      id: 'ORD-2025-0189',
      items: [
        { name: 'Intel Core i9-14900K', quantity: 1 },
        { name: 'ASUS RTX 4080 Super', quantity: 1 },
      ],
      date: '02.01.2026',
      total: '8 920 BYN',
      status: 'delivered',
      statusLabel: 'Доставлен',
      moreItems: 4,
    },
    {
      id: 'ORD-2024-0956',
      items: [{ name: 'WD Black SN850X 1TB', quantity: 1 }],
      date: '18.12.2025',
      total: '220 BYN',
      status: 'cancelled',
      statusLabel: 'Отменён',
    },
    {
      id: 'ORD-2024-0834',
      items: [{ name: 'Custom Gaming PC Build', quantity: 1 }],
      date: '05.12.2025',
      total: '6 480 BYN',
      status: 'delivered',
      statusLabel: 'Доставлен',
      moreItems: 8,
    },
    {
      id: 'ORD-2024-0712',
      items: [{ name: 'Keychron Q1 Pro Keyboard', quantity: 1 }],
      date: '20.11.2025',
      total: '340 BYN',
      status: 'delivered',
      statusLabel: 'Доставлен',
    },
  ];

  const filteredOrders = ordersFormatted.length > 0
    ? activeFilter === 'all'
      ? ordersFormatted
      : ordersFormatted.filter(currentOrderId => currentOrderId.status === activeFilter)
    : oldOrdersMock;

  return (
    <div className="account-orders">
      {/* Page Header */}
      <div className="account-orders__header">
        <div>
          <h1 className="account-orders__title">История заказов</h1>
          <p className="account-orders__subtitle">Все ваши заказы и их статусы</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="orders-stats">
        <div className="stat-card">
          <div className="stat-card__value">{stats.total}</div>
          <div className="stat-card__label">Всего заказов</div>
        </div>
        <div className="stat-card stat-card--delivered">
          <div className="stat-card__value">{stats.delivered}</div>
          <div className="stat-card__label">Доставлено</div>
        </div>
        <div className="stat-card stat-card--shipped">
          <div className="stat-card__value">{stats.shipped}</div>
          <div className="stat-card__label">В пути</div>
        </div>
        <div className="stat-card stat-card--processing">
          <div className="stat-card__value">{stats.processing}</div>
          <div className="stat-card__label">В обработке</div>
        </div>
      </div>

      {/* Filters */}
      <div className="orders-filters">
        {filters.map((filter) => (
          <button
            key={filter.id}
            className={`filter-btn ${activeFilter === filter.id ? 'filter-btn--active' : ''}`}
            onClick={() => setActiveFilter(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Заказ</th>
              <th>Товары</th>
              <th>Дата</th>
              <th>Сумма</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((currentOrderId) => (
              <tr key={currentOrderId.id}>
                <td>
                  <a href="#" className="currentOrderId-id">#{currentOrderId.id}</a>
                </td>
                <td className="currentOrderId-items">
                  <div className="currentOrderId-items-list">
                    {currentOrderId.items.map((item, index) => (
                      <span key={index} className="currentOrderId-item">{item.name}</span>
                    ))}
                    {currentOrderId.moreItems && (
                      <span className="currentOrderId-item-more">+{currentOrderId.moreItems} товара</span>
                    )}
                  </div>
                </td>
                <td className="currentOrderId-date">{currentOrderId.date}</td>
                <td className="currentOrderId-total">{currentOrderId.total}</td>
                <td>
                  <span className={`status-badge status-badge--${currentOrderId.status}`}>
                    <span className="status-badge__dot"></span>
                    {currentOrderId.statusLabel}
                  </span>
                </td>
                <td>
                  <div className="currentOrderId-actions">
                    <button className="action-btn" aria-label="Отследить" onClick={() => navigate(`/orders/${currentOrderId.id}/tracking`)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                    </button>
                    <button className="action-btn" aria-label="Повторить" onClick={() => void handleRepeatOrder(currentOrderId.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button className="pagination-btn" disabled aria-label="Назад">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button className="pagination-btn pagination-btn--active">1</button>
        <button className="pagination-btn">2</button>
        <button className="pagination-btn">3</button>
        <button className="pagination-btn" aria-label="Вперёд">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Order Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedOrder(null);
          setOrderDetails(null);
        }}
        title={`Заказ #${selectedOrder?.orderNumber}`}
        size="large"
      >
        {detailsLoading ? (
          <div className="modal-loading">Загрузка деталей заказа...</div>
        ) : orderDetails && (
          <div className="currentOrderId-details-modal">
            <div className="currentOrderId-details-section">
              <h4>Статус заказа</h4>
              <div className="currentOrderId-status-timeline">
                {[
                  { status: 'New', label: 'Создан' },
                  { status: 'Processing', label: 'В обработке' },
                  { status: 'Paid', label: 'Оплачен' },
                  { status: 'InProgress', label: 'В пути' },
                  { status: 'Ready', label: 'Готов к выдаче' },
                  { status: 'Completed', label: 'Получен' },
                ].map((step, index, arr) => (
                  <div key={step.status} className={`timeline-item ${
                    getStatusProgress(orderDetails.status) >= getStatusProgress(step.status) ? 'timeline-item--completed' : ''
                  } ${step.status === orderDetails.status ? 'timeline-item--active' : ''}`}>
                    <div className="timeline-dot"></div>
                    <div className="timeline-label">{step.label}</div>
                    {index < arr.length - 1 && <div className="timeline-line"></div>}
                  </div>
                ))}
              </div>
            </div>

            <div className="currentOrderId-details-grid">
              <div className="currentOrderId-details-col">
                <h4>Состав заказа</h4>
                <div className="currentOrderId-items-list">
                  {orderDetails.items.map((item: OrderItem) => (
                    <div key={item.id} className="currentOrderId-item-row">
                      <span className="item-name">{item.productName}</span>
                      <span className="item-quantity">× {item.quantity}</span>
                      <span className="item-price">{item.totalPrice.toFixed(2)} BYN</span>
                    </div>
                  ))}
                  <div className="currentOrderId-item-row currentOrderId-item-row--total">
                    <span>Итого</span>
                    <span></span>
                    <span>{orderDetails.total.toFixed(2)} BYN</span>
                  </div>
                </div>
              </div>

              <div className="currentOrderId-details-col">
                <h4>Данные доставки</h4>
                <div className="currentOrderId-info-list">
                  <div className="info-row">
                    <span className="info-label">Метод доставки:</span>
                    <span className="info-value">{orderDetails.deliveryMethod === 'Delivery' ? 'Курьер' : 'Самовывоз'}</span>
                  </div>
                  {orderDetails.address && (
                    <div className="info-row">
                      <span className="info-label">Адрес:</span>
                      <span className="info-value">{orderDetails.address}</span>
                    </div>
                  )}
                  <div className="info-row">
                    <span className="info-label">Оплата:</span>
                    <span className="info-value">{orderDetails.paymentMethod === 'Online' ? 'Онлайн' : 'При получении'}</span>
                  </div>
                  {orderDetails.trackingNumber && (
                    <div className="info-row">
                      <span className="info-label">Трек номер:</span>
                      <span className="info-value">{orderDetails.trackingNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}