import { Link } from 'react-router-dom';
import styles from "./AccountOverview.module.css";

/**
 * AccountOverview - Main dashboard page for account
 * 
 * Features:
 * - Welcome card with user stats
 * - Recent orders table
 * - Quick actions
 */
export function AccountOverview() {
  // Mock data - will be replaced with API calls
  const user = {
    name: 'Александр',
    stats: {
      orders: 12,
      wishlist: 8,
      bonuses: 4580,
    },
  };

  const recentOrders = [
    {
      id: 'ORD-2025-0847',
      items: 'RTX 4070 Ti Super, AMD Ryzen 7 7800X3D',
      date: '15.03.2026',
      total: '4 650 BYN',
      status: 'delivered',
      statusLabel: 'Доставлен',
    },
    {
      id: 'ORD-2025-0712',
      items: 'G.Skill Trident Z5 32GB DDR5',
      date: '02.03.2026',
      total: '650 BYN',
      status: 'delivered',
      statusLabel: 'Доставлен',
    },
    {
      id: 'ORD-2025-0698',
      items: 'Samsung 990 Pro 2TB, Corsair RM850x',
      date: '24.02.2026',
      total: '680 BYN',
      status: 'shipped',
      statusLabel: 'В пути',
    },
    {
      id: 'ORD-2025-0543',
      items: 'ASUS ROG Strix B650E-F',
      date: '10.02.2026',
      total: '520 BYN',
      status: 'processing',
      statusLabel: 'В обработке',
    },
  ];

  return (
    <div className="account-overview">
      {/* Page Header */}
      <div className="account-overview__header">
        <h1 className="account-overview__title">Личный кабинет</h1>
        <p className="account-overview__subtitle">Управляйте своим аккаунтом и заказами</p>
      </div>

      {/* Welcome Card */}
      <div className="welcome-card">
        <h2 className="welcome-card__title">
          Добро пожаловать, <span>{user.name}</span>!
        </h2>
        <p className="welcome-card__text">
          Рады видеть вас в GoldPC. Здесь вы можете отслеживать заказы, управлять профилем и просматривать
          избранные товары.
        </p>
        <div className="welcome-card__stats">
          <div className="welcome-stat">
            <span className="welcome-stat__value">{user.stats.orders}</span>
            <span className="welcome-stat__label">Заказов</span>
          </div>
          <div className="welcome-stat">
            <span className="welcome-stat__value">{user.stats.wishlist}</span>
            <span className="welcome-stat__label">Избранное</span>
          </div>
          <div className="welcome-stat">
            <span className="welcome-stat__value">{user.stats.bonuses.toLocaleString('ru-BY')}</span>
            <span className="welcome-stat__label">Бонусов</span>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <section className="recent-orders">
        <div className="recent-orders__header">
          <h2 className="recent-orders__title">Последние заказы</h2>
          <Link to="/account/orders" className="view-all-link">
            Все заказы
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>

        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Заказ</th>
                <th>Товары</th>
                <th>Дата</th>
                <th>Сумма</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <span className="order-id">#{order.id}</span>
                  </td>
                  <td className="order-items">{order.items}</td>
                  <td className="order-date">{order.date}</td>
                  <td className="order-total">{order.total}</td>
                  <td>
                    <span className={`status-badge status-badge--${order.status}`}>
                      <span className="status-badge__dot"></span>
                      {order.statusLabel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}