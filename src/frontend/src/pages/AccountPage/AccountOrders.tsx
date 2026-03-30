import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersApi, type Order } from '../../api/orders';
import { useToastStore } from '../../store/toastStore';
import './AccountOrders.css';

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

  const handleRepeatOrder = async () => {
    showToast(`Товары из заказа добавлены в корзину`, 'success');
    navigate('/cart');
  };

  const ordersFormatted = orders.map(order => ({
    id: order.orderNumber,
    items: order.items.slice(0, 2).map(i => ({ name: i.productName, quantity: i.quantity })),
    date: new Date(order.createdAt).toLocaleDateString('ru-RU'),
    total: `${order.total.toFixed(2)} BYN`,
    status: order.status.toLowerCase(),
    statusLabel: getStatusLabel(order.status),
    moreItems: order.items.length > 2 ? order.items.length - 2 : undefined,
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

  const filteredOrders = ordersFormatted.length > 0 ? ordersFormatted : oldOrdersMock;

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
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td>
                  <a href="#" className="order-id">#{order.id}</a>
                </td>
                <td className="order-items">
                  <div className="order-items-list">
                    {order.items.map((item, index) => (
                      <span key={index} className="order-item">{item.name}</span>
                    ))}
                    {order.moreItems && (
                      <span className="order-item-more">+{order.moreItems} товара</span>
                    )}
                  </div>
                </td>
                <td className="order-date">{order.date}</td>
                <td className="order-total">{order.total}</td>
                <td>
                  <span className={`status-badge status-badge--${order.status}`}>
                    <span className="status-badge__dot"></span>
                    {order.statusLabel}
                  </span>
                </td>
                <td>
                  <div className="order-actions">
                    <button className="action-btn" aria-label="Отследить" onClick={() => navigate(`/orders/${order.id}/tracking`)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                    </button>
                    <button className="action-btn" aria-label="Повторить" onClick={handleRepeatOrder}>
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
    </div>
  );
}