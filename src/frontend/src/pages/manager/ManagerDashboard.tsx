/**
 * Manager Dashboard Page
 * Главная панель менеджера
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './ManagerDashboard.module.css';
import { managerApi } from '../../api/manager';

// Dashboard Widget Interface
interface DashboardWidget {
  id: string;
  title: string;
  value: string | number;
  change?: string;
  icon: string;
  trend?: 'up' | 'down' | 'neutral';
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  link?: string;
}

interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  threshold: number;
}

interface PendingTicket {
  id: string;
  customer: string;
  subject: string;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}




const PRIORITY_LABELS: Record<string, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий'
};

const PRIORITY_CLASSES: Record<string, string> = {
  low: 'priority-low',
  medium: 'priority-medium',
  high: 'priority-high'
};

export function ManagerDashboard() {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [pendingTickets, setPendingTickets] = useState<PendingTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const data = await managerApi.getDashboardData();
        setWidgets(data.widgets);
        setLowStock(data.lowStock);
        setPendingTickets(data.pendingTickets);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="staff-page manager-dashboard">
        <div className="manager-dashboard__loading">
          <div className="loading-spinner" />
          <p>Загрузка данных панели...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-page manager-dashboard">
      <header className="staff-page__header manager-dashboard__header">
        <div className="manager-dashboard__title-section">
          <h1 className="staff-page__title manager-dashboard__title">Панель менеджера</h1>
          <p className="staff-page__subtitle manager-dashboard__subtitle">
            Обзор ключевых показателей и актуальных задач
          </p>
        </div>
      </header>

      {/* Widget Grid */}
      <div className="dashboard-widgets">
        {widgets.map(widget => (
          <div
            key={widget.id}
            className={`dashboard-widget dashboard-widget--${widget.color}`}
          >
            <div className="dashboard-widget__content">
              <div className="dashboard-widget__icon">{widget.icon}</div>
              <div className="dashboard-widget__info">
                <div className="dashboard-widget__title">{widget.title}</div>
                <div className="dashboard-widget__value">{widget.value}</div>
                {widget.change && (
                  <div className={`dashboard-widget__change dashboard-widget__change--${widget.trend}`}>
                    {widget.change}
                  </div>
                )}
              </div>
            </div>
            {widget.link && (
              <Link to={widget.link} className="dashboard-widget__link">
                Подробнее →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Dashboard Content Grid */}
      <div className="dashboard-content-grid">
        {/* Low Stock Alerts */}
        <div className="dashboard-panel">
          <div className="dashboard-panel__header">
            <h3 className="dashboard-panel__title">⚠️ Товары с низким остатком</h3>
            <Link to="/manager/inventory" className="dashboard-panel__action">
              Все товары →
            </Link>
          </div>
          <div className="dashboard-panel__content">
            {lowStock.length === 0 ? (
              <div className="dashboard-panel__empty">
                Все товары в достаточном количестве
              </div>
            ) : (
              <div className="low-stock-list">
                {lowStock.map(item => (
                  <div key={item.id} className="low-stock-item">
                    <div className="low-stock-item__info">
                      <div className="low-stock-item__name">{item.name}</div>
                      <div className="low-stock-item__sku">{item.sku}</div>
                    </div>
                    <div className="low-stock-item__stock">
                      <span className="low-stock-item__stock-value low-stock-item__stock-value--critical">
                        {item.stock} шт.
                      </span>
                      <span className="low-stock-item__threshold">
                        (мин. {item.threshold})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pending Support Tickets */}
        <div className="dashboard-panel">
          <div className="dashboard-panel__header">
            <h3 className="dashboard-panel__title">🎫 Активные запросы в поддержку</h3>
            <Link to="/master/tickets" className="dashboard-panel__action">
              Все запросы →
            </Link>
          </div>
          <div className="dashboard-panel__content">
            {pendingTickets.length === 0 ? (
              <div className="dashboard-panel__empty">
                Нет ожидающих запросов
              </div>
            ) : (
              <div className="tickets-list">
                {pendingTickets.map(ticket => (
                  <div key={ticket.id} className="ticket-list-item">
                    <div className="ticket-list-item__info">
                      <div className="ticket-list-item__id">{ticket.id}</div>
                      <div className="ticket-list-item__subject">{ticket.subject}</div>
                      <div className="ticket-list-item__customer">{ticket.customer}</div>
                    </div>
                    <div className="ticket-list-item__meta">
                      <span className={`priority-badge ${PRIORITY_CLASSES[ticket.priority]}`}>
                        {PRIORITY_LABELS[ticket.priority]}
                      </span>
                      <span className="ticket-list-item__date">{ticket.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h3 className="dashboard-panel__title">⚡ Быстрые действия</h3>
        </div>
        <div className="dashboard-panel__content">
          <div className="quick-actions-grid">
            <Link to="/manager/orders" className="quick-action-btn">
              <span className="quick-action-btn__icon">📦</span>
              <span className="quick-action-btn__text">Управление заказами</span>
            </Link>
            <Link to="/manager/inventory" className="quick-action-btn">
              <span className="quick-action-btn__icon">📊</span>
              <span className="quick-action-btn__text">Инвентаризация</span>
            </Link>
            <Link to="/manager/orders?status=pending" className="quick-action-btn">
              <span className="quick-action-btn__icon">⏳</span>
              <span className="quick-action-btn__text">Ожидающие заказы</span>
            </Link>
            <Link to="/master/tickets" className="quick-action-btn">
              <span className="quick-action-btn__icon">🎫</span>
              <span className="quick-action-btn__text">Запросы поддержки</span>
            </Link>
            <Link to="/admin/catalog" className="quick-action-btn">
              <span className="quick-action-btn__icon">🏷️</span>
              <span className="quick-action-btn__text">Каталог товаров</span>
            </Link>
            <Link to="/accountant/reports" className="quick-action-btn">
              <span className="quick-action-btn__icon">📈</span>
              <span className="quick-action-btn__text">Отчеты</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManagerDashboard;
