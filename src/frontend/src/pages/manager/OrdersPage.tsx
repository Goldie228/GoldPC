/**
 * Manager Orders Page
 * Страница управления заказами для менеджеров
 * Основано на prototypes/manager-orders.html
 */

import { useState, useEffect, useMemo } from 'react';
import styles from './OrdersPage.module.css';
import { managerApi } from '../../api/manager';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: OrderStatus;
  date: string;
}


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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true);
      try {
        const data = await managerApi.getOrders(currentPage, itemsPerPage, statusFilter || undefined);
        setOrders(data.items || []);
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        setIsLoading(false);
      }
    };
    void loadOrders();
  }, [currentPage, statusFilter]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        order.id.toLowerCase().includes(searchLower) ||
        order.customerName.toLowerCase().includes(searchLower) ||
        order.customerEmail.toLowerCase().includes(searchLower);

      const matchesDateFrom = dateFrom === '' || order.date >= dateFrom;
      const matchesDateTo = dateTo === '' || order.date <= dateTo;

      return matchesSearch && matchesDateFrom && matchesDateTo;
    });
  }, [orders, searchQuery, dateFrom, dateTo]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="staff-page manager-orders">
      <header className="staff-page__header manager-orders__header">
        <div className="manager-orders__title-section">
          <h1 className="staff-page__title manager-orders__title">Управление заказами</h1>
          <p className="staff-page__subtitle manager-orders__subtitle">Все заказы магазина</p>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="filter-bar">
        <input
          type="text"
          className="filter-input"
          placeholder="Поиск по ID или клиенту..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
        />
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as OrderStatus | '');
            setCurrentPage(1);
          }}
        >
          <option value="">Все статусы</option>
          <option value="pending">Ожидает</option>
          <option value="processing">В обработке</option>
          <option value="shipped">Отправлен</option>
          <option value="completed">Завершён</option>
          <option value="cancelled">Отменён</option>
        </select>
        <input
          type="date"
          className="filter-input"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setCurrentPage(1);
          }}
          title="Дата от"
        />
        <input
          type="date"
          className="filter-input"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setCurrentPage(1);
          }}
          title="Дата до"
        />
      </div>

      {/* Orders Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID заказа</th>
              <th>Клиент</th>
              <th>Сумма</th>
              <th>Статус</th>
              <th>Дата</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="data-table__empty">
                  Заказы не найдены
                </td>
              </tr>
            ) : (
              paginatedOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <span className="order-id">#{order.id}</span>
                  </td>
                  <td>
                    <div className="customer-name">{order.customerName}</div>
                    <div className="customer-email">{order.customerEmail}</div>
                  </td>
                  <td>
                    <span className="order-total">{formatPrice(order.total)}</span>
                  </td>
                  <td>
                    <span className={'status-badge ' + STATUS_CLASSES[order.status as OrderStatus]}>
                      {STATUS_LABELS[order.status as OrderStatus]}
                    </span>
                  </td>
                  <td>{formatDate(order.date)}</td>
                  <td>
                    <a href={'/manager/orders/' + order.id} className="action-link">
                      Подробнее →
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ←
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={'pagination-btn ' + (page === currentPage ? 'pagination-btn--active' : '')}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          ))}
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}

export default OrdersPage;