import { Outlet, NavLink } from 'react-router-dom';
import './AccountLayout.css';

/**
 * AccountLayout - Layout for account pages with sidebar navigation
 * 
 * Features:
 * - Fixed sidebar with user profile
 * - Navigation links: Overview, Profile, Orders, Wishlist
 * - Settings section at bottom
 */
export function AccountLayout() {
  // Mock user data - will be replaced with actual auth context
  const user = {
    name: 'Александр Иванов',
    email: 'alex.ivanov@email.com',
    initials: 'АИ',
  };

  const navItems = [
    {
      to: '/account',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      label: 'Обзор',
      end: true,
    },
    {
      to: '/account/profile',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      label: 'Профиль',
    },
    {
      to: '/account/orders',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
      label: 'Заказы',
    },
    {
      to: '/wishlist',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ),
      label: 'Избранное',
    },
  ];

  const settingsItems = [
    {
      to: '/account/settings',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
      label: 'Настройки',
    },
    {
      to: '/login',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      ),
      label: 'Выйти',
    },
  ];

  return (
    <div className="account-layout">
      {/* Sidebar */}
      <aside className="account-sidebar">
        <div className="account-sidebar__profile">
          <div className="account-sidebar__avatar">{user.initials}</div>
          <div className="account-sidebar__name">{user.name}</div>
          <div className="account-sidebar__email">{user.email}</div>
        </div>

        <nav className="account-sidebar__nav">
          <ul className="account-sidebar__list">
            {navItems.map((item) => (
              <li key={item.to} className="account-sidebar__item">
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `account-sidebar__link ${isActive ? 'account-sidebar__link--active' : ''}`
                  }
                >
                  <span className="account-sidebar__icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="account-sidebar__section">
          <div className="account-sidebar__section-title">Настройки</div>
          <ul className="account-sidebar__list">
            {settingsItems.map((item) => (
              <li key={item.to} className="account-sidebar__item">
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `account-sidebar__link ${isActive ? 'account-sidebar__link--active' : ''}`
                  }
                >
                  <span className="account-sidebar__icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <main className="account-main">
        <Outlet />
      </main>
    </div>
  );
}