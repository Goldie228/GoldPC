/**
 * Inventory Page for Manager
 * Страница управления запасами для менеджера
 */

import { useState, useEffect, useMemo } from 'react';
import styles from './InventoryPage.module.css';
import { managerApi } from '../../api/manager';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
  reserved: number;
  lastUpdated: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  cpu: 'Процессоры',
  gpu: 'Видеокарты',
  motherboard: 'Материнские платы',
  ram: 'Оперативная память',
  storage: 'Накопители',
  psu: 'Блоки питания',
  case: 'Корпуса'
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
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getStockStatus(stock: number, minStock: number): 'critical' | 'warning' | 'ok' | 'outofstock' {
  if (stock === 0) return 'outofstock';
  if (stock <= minStock / 2) return 'critical';
  if (stock <= minStock) return 'warning';
  return 'ok';
}

export function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredItems = useMemo(() => {
    return MOCK_INVENTORY.filter((item) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        item.name.toLowerCase().includes(searchLower) ||
        item.sku.toLowerCase().includes(searchLower);

      const matchesCategory = categoryFilter === '' || item.category === categoryFilter;

      let matchesStock = true;
      if (stockFilter === 'low') {
        matchesStock = item.stock <= item.minStock;
      } else if (stockFilter === 'outofstock') {
        matchesStock = item.stock === 0;
      } else if (stockFilter === 'ok') {
        matchesStock = item.stock > item.minStock;
      }

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [searchQuery, categoryFilter, stockFilter]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Stats calculation
  const stats = useMemo(() => {
    const totalItems = inventory.length;
    const lowStockItems = inventory.filter(i => i.stock <= i.minStock).length;
    const outOfStockItems = inventory.filter(i => i.stock === 0).length;
    const totalValue = inventory.reduce((sum, item) => sum + (item.stock * item.price), 0);

    return { totalItems, lowStockItems, outOfStockItems, totalValue };
  }, []);

  return (
    <div className="staff-page inventory-page">
      <header className="staff-page__header inventory-page__header">
        <div className="inventory-page__title-section">
          <h1 className="staff-page__title inventory-page__title">Управление запасами</h1>
          <p className="staff-page__subtitle inventory-page__subtitle">
            Текущие остатки товаров на складе
          </p>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="inventory-stats">
        <div className="inventory-stat">
          <div className="inventory-stat__value">{stats.totalItems}</div>
          <div className="inventory-stat__label">Всего товаров</div>
        </div>
        <div className="inventory-stat inventory-stat--warning">
          <div className="inventory-stat__value">{stats.lowStockItems}</div>
          <div className="inventory-stat__label">Низкий остаток</div>
        </div>
        <div className="inventory-stat inventory-stat--danger">
          <div className="inventory-stat__value">{stats.outOfStockItems}</div>
          <div className="inventory-stat__label">Нет в наличии</div>
        </div>
        <div className="inventory-stat inventory-stat--success">
          <div className="inventory-stat__value">{formatPrice(stats.totalValue)}</div>
          <div className="inventory-stat__label">Общая стоимость</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <input
          type="text"
          className="filter-input"
          placeholder="Поиск по названию или артикулу..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
        />
        <select
          className="filter-select"
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">Все категории</option>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={stockFilter}
          onChange={(e) => {
            setStockFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">Все статусы</option>
          <option value="low">Низкий остаток</option>
          <option value="outofstock">Нет в наличии</option>
          <option value="ok">В наличии</option>
        </select>
      </div>

      {/* Inventory Table */}
      <div className="table-container">
        <table className="data-table inventory-table">
          <thead>
            <tr>
              <th>Артикул</th>
              <th>Наименование</th>
              <th>Категория</th>
              <th>Цена</th>
              <th>В наличии</th>
              <th>Резерв</th>
              <th>Мин. остаток</th>
              <th>Статус</th>
              <th>Обновлено</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={9} className="data-table__empty">
                  Товары не найдены
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => {
                const stockStatus = getStockStatus(item.stock, item.minStock);
                return (
                  <tr key={item.id} className={`inventory-row--${stockStatus}`}>
                    <td>
                      <span className="inventory-sku">{item.sku}</span>
                    </td>
                    <td>
                      <div className="inventory-name">{item.name}</div>
                    </td>
                    <td>
                      <span className="inventory-category">{CATEGORY_LABELS[item.category]}</span>
                    </td>
                    <td>{formatPrice(item.price)}</td>
                    <td>
                      <span className={`inventory-stock inventory-stock--${stockStatus}`}>
                        {item.stock} шт.
                      </span>
                    </td>
                    <td>{item.reserved} шт.</td>
                    <td>{item.minStock} шт.</td>
                    <td>
                      <span className={`stock-status stock-status--${stockStatus}`}>
                        {stockStatus === 'outofstock' ? 'Нет в наличии' :
                         stockStatus === 'critical' ? 'Критически мало' :
                         stockStatus === 'warning' ? 'Мало' : 'В норме'}
                      </span>
                    </td>
                    <td>{formatDate(item.lastUpdated)}</td>
                  </tr>
                );
              })
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

export default InventoryPage;
