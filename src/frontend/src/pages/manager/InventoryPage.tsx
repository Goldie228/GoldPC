/**
 * Inventory Page for Manager
 * Страница управления запасами для менеджера
 */

import { useState, useMemo } from 'react';
import './InventoryPage.css';

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

// Mock inventory data
const MOCK_INVENTORY: InventoryItem[] = [
  {
    id: '1',
    name: 'Процессор Intel Core i5-12400F',
    sku: 'CPU-INT-0012',
    category: 'cpu',
    price: 850,
    stock: 2,
    minStock: 5,
    reserved: 1,
    lastUpdated: '2025-03-17 08:30'
  },
  {
    id: '2',
    name: 'Видеокарта NVIDIA RTX 4060',
    sku: 'GPU-NVD-0042',
    category: 'gpu',
    price: 2100,
    stock: 1,
    minStock: 3,
    reserved: 0,
    lastUpdated: '2025-03-17 09:15'
  },
  {
    id: '3',
    name: 'Материнская плата MSI B760',
    sku: 'MB-MSI-0018',
    category: 'motherboard',
    price: 520,
    stock: 3,
    minStock: 5,
    reserved: 2,
    lastUpdated: '2025-03-16 14:45'
  },
  {
    id: '4',
    name: 'ОЗУ Corsair 16GB DDR4 3200MHz',
    sku: 'RAM-COR-0007',
    category: 'ram',
    price: 185,
    stock: 4,
    minStock: 10,
    reserved: 0,
    lastUpdated: '2025-03-17 07:20'
  },
  {
    id: '5',
    name: 'SSD Kingston NV2 1TB',
    sku: 'SSD-KIN-0023',
    category: 'storage',
    price: 145,
    stock: 12,
    minStock: 8,
    reserved: 3,
    lastUpdated: '2025-03-17 10:00'
  },
  {
    id: '6',
    name: 'Блок питания Corsair CX650M',
    sku: 'PSU-COR-0011',
    category: 'psu',
    price: 220,
    stock: 7,
    minStock: 5,
    reserved: 1,
    lastUpdated: '2025-03-16 16:30'
  },
  {
    id: '7',
    name: 'Корпус NZXT H5 Flow',
    sku: 'CASE-NZX-0004',
    category: 'case',
    price: 310,
    stock: 6,
    minStock: 4,
    reserved: 0,
    lastUpdated: '2025-03-15 11:20'
  },
  {
    id: '8',
    name: 'Процессор AMD Ryzen 5 7600X',
    sku: 'CPU-AMD-0009',
    category: 'cpu',
    price: 920,
    stock: 15,
    minStock: 5,
    reserved: 2,
    lastUpdated: '2025-03-17 09:45'
  },
  {
    id: '9',
    name: 'Видеокарта AMD RX 7600',
    sku: 'GPU-AMD-0015',
    category: 'gpu',
    price: 1650,
    stock: 8,
    minStock: 3,
    reserved: 1,
    lastUpdated: '2025-03-17 08:15'
  },
  {
    id: '10',
    name: 'Материнская плата ASUS B650',
    sku: 'MB-ASU-0021',
    category: 'motherboard',
    price: 610,
    stock: 0,
    minStock: 5,
    reserved: 0,
    lastUpdated: '2025-03-16 13:00'
  }
];

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
    const totalItems = MOCK_INVENTORY.length;
    const lowStockItems = MOCK_INVENTORY.filter(i => i.stock <= i.minStock).length;
    const outOfStockItems = MOCK_INVENTORY.filter(i => i.stock === 0).length;
    const totalValue = MOCK_INVENTORY.reduce((sum, item) => sum + (item.stock * item.price), 0);

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
