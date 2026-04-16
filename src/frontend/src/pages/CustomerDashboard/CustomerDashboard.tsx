import { Link } from 'react-router-dom';
import {
  Package,
  Wrench,
  Cpu,
  ShieldCheck,
  Bell,
  Settings,
  ChevronRight,
  Clock
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import styles from './CustomerDashboard.module.css';

/**
 * Customer Dashboard Page
 *
 * Authenticated customer main dashboard with welcome message,
 * quick actions, and placeholder widgets for orders and repairs.
 */
export function CustomerDashboard() {
  const { user } = useAuthStore();

  const quickActions = [
    {
      to: '/orders/tracking',
      icon: <Package />,
      label: 'Отследить заказ',
      description: 'Статус и история доставки'
    },
    {
      to: '/service-request',
      icon: <Wrench />,
      label: 'Новый запрос на ремонт',
      description: 'Отправить устройство на диагностику'
    },
    {
      to: '/pc-builder',
      icon: <Cpu />,
      label: 'Конструктор ПК',
      description: 'Собрать индивидуальную конфигурацию'
    },
    {
      to: '/account/warranty',
      icon: <ShieldCheck />,
      label: 'Моя гарантия',
      description: 'Активные гарантийные обязательства'
    }
  ];

  return (
    <div className={styles.dashboard}>
      <div className={styles.container}>
        {/* Welcome Section */}
        <section className={styles.welcomeSection}>
          <div className={styles.welcomeContent}>
            <h1 className={styles.welcomeTitle}>
              Добро пожаловать, {user?.firstName || 'Пользователь'}! 👋
            </h1>
            <p className={styles.welcomeSubtitle}>
              Здесь вы можете управлять своими заказами, просматривать статус ремонтов
              и получить доступ ко всем сервисам GoldPC.
            </p>
          </div>

          <div className={styles.headerActions}>
            <button className={styles.iconBtn} aria-label="Уведомления">
              <Bell />
              <span className={styles.notificationBadge}>3</span>
            </button>
            <Link to="/account/settings" className={styles.iconBtn} aria-label="Настройки">
              <Settings />
            </Link>
          </div>
        </section>

        {/* Quick Actions Grid */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Быстрые действия</h2>

          <div className={styles.actionsGrid}>
            {quickActions.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className={styles.actionCard}
              >
                <div className={styles.actionIcon}>
                  {action.icon}
                </div>
                <div className={styles.actionContent}>
                  <h3 className={styles.actionLabel}>{action.label}</h3>
                  <p className={styles.actionDescription}>{action.description}</p>
                </div>
                <ChevronRight className={styles.actionArrow} />
              </Link>
            ))}
          </div>
        </section>

        {/* Dashboard Widgets */}
        <div className={styles.widgetsGrid}>
          {/* Recent Orders Widget */}
          <section className={`${styles.section} ${styles.widgetCard}`}>
            <div className={styles.widgetHeader}>
              <h2 className={styles.sectionTitle}>Последние заказы</h2>
              <Link to="/account/orders" className={styles.viewAllLink}>
                Все заказы
                <ChevronRight />
              </Link>
            </div>

            <div className={styles.placeholderList}>
              <div className={styles.placeholderItem}>
                <Package className={styles.placeholderIcon} />
                <div className={styles.placeholderContent}>
                  <div className={styles.placeholderLine} style={{ width: '60%' }} />
                  <div className={styles.placeholderLine} style={{ width: '40%', opacity: 0.6 }} />
                </div>
              </div>
              <div className={styles.placeholderItem}>
                <Package className={styles.placeholderIcon} />
                <div className={styles.placeholderContent}>
                  <div className={styles.placeholderLine} style={{ width: '70%' }} />
                  <div className={styles.placeholderLine} style={{ width: '50%', opacity: 0.6 }} />
                </div>
              </div>
              <div className={styles.placeholderItem}>
                <Package className={styles.placeholderIcon} />
                <div className={styles.placeholderContent}>
                  <div className={styles.placeholderLine} style={{ width: '55%' }} />
                  <div className={styles.placeholderLine} style={{ width: '35%', opacity: 0.6 }} />
                </div>
              </div>
            </div>

            <div className={styles.widgetNotice}>
              <Clock size={16} />
              <span>Данные будут загружены после интеграции с API</span>
            </div>
          </section>

          {/* Active Repairs Widget */}
          <section className={`${styles.section} ${styles.widgetCard}`}>
            <div className={styles.widgetHeader}>
              <h2 className={styles.sectionTitle}>Активные ремонты</h2>
              <Link to="/account/repairs" className={styles.viewAllLink}>
                Все запросы
                <ChevronRight />
              </Link>
            </div>

            <div className={styles.placeholderList}>
              <div className={styles.placeholderItem}>
                <Wrench className={styles.placeholderIcon} />
                <div className={styles.placeholderContent}>
                  <div className={styles.placeholderLine} style={{ width: '65%' }} />
                  <div className={styles.placeholderLine} style={{ width: '45%', opacity: 0.6 }} />
                </div>
              </div>
              <div className={styles.placeholderItem}>
                <Wrench className={styles.placeholderIcon} />
                <div className={styles.placeholderContent}>
                  <div className={styles.placeholderLine} style={{ width: '50%' }} />
                  <div className={styles.placeholderLine} style={{ width: '30%', opacity: 0.6 }} />
                </div>
              </div>
            </div>

            <div className={styles.widgetNotice}>
              <Clock size={16} />
              <span>Данные будут загружены после интеграции с API</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
