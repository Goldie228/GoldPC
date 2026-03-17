import './AccountPage.css';

/**
 * AccountPage - User Account Page
 * 
 * Features:
 * - User profile information
 * - Order history
 * - Saved configurations
 * - Account settings
 */
export function AccountPage() {
  const user = {
    name: 'Александр',
    email: 'alexander@example.com',
    phone: '+7 (999) 123-45-67',
    memberSince: 'Март 2024',
    totalOrders: 12,
    totalSpent: 485000,
    loyaltyPoints: 2425,
  };

  const recentOrders = [
    { id: 'ORD-2024-001', date: '15.03.2024', status: 'Доставлен', total: 89990 },
    { id: 'ORD-2024-002', date: '10.03.2024', status: 'В пути', total: 125990 },
    { id: 'ORD-2024-003', date: '05.03.2024', status: 'Доставлен', total: 45990 },
  ];

  const savedBuilds = [
    { name: 'Gaming RTX 4080 Build', price: 285000, date: '12.03.2024' },
    { name: 'Office Workstation', price: 95000, date: '08.03.2024' },
  ];

  return (
    <div className="account-page">
      <div className="account-page__container">
        <h1 className="account-page__title">👤 Личный кабинет</h1>

        <div className="account-page__content">
          {/* Sidebar */}
          <div className="account-page__sidebar">
            <div className="user-card">
              <div className="user-card__avatar">
                {user.name.charAt(0)}
              </div>
              <h2 className="user-card__name">{user.name}</h2>
              <p className="user-card__email">{user.email}</p>
              <p className="user-card__member">Клиент с {user.memberSince}</p>
            </div>

            <nav className="account-nav">
              <a href="#profile" className="account-nav__link account-nav__link--active">
                📋 Профиль
              </a>
              <a href="#orders" className="account-nav__link">
                📦 Заказы
              </a>
              <a href="#builds" className="account-nav__link">
                🖥️ Сборки
              </a>
              <a href="#favorites" className="account-nav__link">
                ❤️ Избранное
              </a>
              <a href="#settings" className="account-nav__link">
                ⚙️ Настройки
              </a>
              <a href="#logout" className="account-nav__link account-nav__link--logout">
                🚪 Выйти
              </a>
            </nav>
          </div>

          {/* Main Content */}
          <div className="account-page__main">
            {/* Stats */}
            <div className="account-stats">
              <div className="account-stats__item">
                <span className="account-stats__value">{user.totalOrders}</span>
                <span className="account-stats__label">Заказов</span>
              </div>
              <div className="account-stats__item">
                <span className="account-stats__value">
                  {user.totalSpent.toLocaleString('ru-RU')} ₽
                </span>
                <span className="account-stats__label">Потрачено</span>
              </div>
              <div className="account-stats__item account-stats__item--gold">
                <span className="account-stats__value">{user.loyaltyPoints}</span>
                <span className="account-stats__label">Бонусов</span>
              </div>
            </div>

            {/* Recent Orders */}
            <section className="account-section">
              <h3 className="account-section__title">Последние заказы</h3>
              <div className="orders-list">
                {recentOrders.map((order) => (
                  <div key={order.id} className="order-item">
                    <div className="order-item__info">
                      <span className="order-item__id">{order.id}</span>
                      <span className="order-item__date">{order.date}</span>
                    </div>
                    <span className={`order-item__status order-item__status--${order.status === 'Доставлен' ? 'delivered' : 'shipping'}`}>
                      {order.status}
                    </span>
                    <span className="order-item__total">
                      {order.total.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                ))}
              </div>
              <a href="#all-orders" className="account-section__link">
                Все заказы →
              </a>
            </section>

            {/* Saved Builds */}
            <section className="account-section">
              <h3 className="account-section__title">Сохранённые сборки</h3>
              <div className="builds-list">
                {savedBuilds.map((build, index) => (
                  <div key={index} className="build-item">
                    <div className="build-item__info">
                      <span className="build-item__name">{build.name}</span>
                      <span className="build-item__date">{build.date}</span>
                    </div>
                    <span className="build-item__price">
                      {build.price.toLocaleString('ru-RU')} ₽
                    </span>
                    <div className="build-item__actions">
                      <button className="build-item__btn">В корзину</button>
                      <button className="build-item__btn build-item__btn--edit">Изменить</button>
                    </div>
                  </div>
                ))}
              </div>
              <a href="/pc-builder" className="account-section__link">
                Создать новую сборку →
              </a>
            </section>

            {/* Profile Info */}
            <section className="account-section">
              <h3 className="account-section__title">Контактная информация</h3>
              <div className="profile-info">
                <div className="profile-info__row">
                  <span className="profile-info__label">Email:</span>
                  <span className="profile-info__value">{user.email}</span>
                </div>
                <div className="profile-info__row">
                  <span className="profile-info__label">Телефон:</span>
                  <span className="profile-info__value">{user.phone}</span>
                </div>
              </div>
              <button className="profile-edit-btn">Редактировать профиль</button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}