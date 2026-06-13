/**
 * Inventory Page for Manager
 * Страница управления запасами для менеджера
 * Реальные данные с API, без моков
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Package, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { managerApi } from '@/api/manager';
import type { RawProductItem } from '@/api/manager';
import { StockBadge } from '@/components/ui/StockBadge';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { PagePagination } from '@/components/ui/PagePagination';
import { formatPrice } from '@/utils/format';

/* ─── Маппинг категорий ─── */

const CATEGORY_LABELS: Record<string, string> = {
  cpu: 'Процессоры',
  gpu: 'Видеокарты',
  motherboard: 'Материнские платы',
  ram: 'Оперативная память',
  storage: 'Накопители',
  psu: 'Блоки питания',
  case: 'Корпуса',
  cooling: 'Охлаждение',
  fan: 'Вентиляторы',
  monitor: 'Мониторы',
  keyboard: 'Клавиатуры',
  mouse: 'Мыши',
  headphones: 'Наушники',
};

/* ─── Фильтры ─── */

const STOCK_FILTER_OPTIONS = [
  { value: '', label: 'Все статусы' },
  { value: 'in_stock', label: 'В наличии' },
  { value: 'low', label: 'Мало' },
  { value: 'out_of_stock', label: 'Нет в наличии' },
] as const;

/* ─── Скелетон ─── */

function InventorySkeleton() {
  return (
    <div className="space-y-4">
      {/* Скелетон статистики */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={72} borderRadius="lg" />
        ))}
      </div>
      <Skeleton height={48} borderRadius="lg" />
      <Skeleton height={400} borderRadius="lg" />
    </div>
  );
}

/* ─── Основной компонент ─── */

export function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  // Запрос товаров через API (без фильтрации по inStock -- показываем все для полной картины склада)
  const { data, isLoading, error } = useQuery({
    queryKey: ['manager', 'inventory', currentPage, PAGE_SIZE],
    queryFn: () => managerApi.getInventory(currentPage, PAGE_SIZE),
  });

  // Отдельный запрос ВСЕХ товаров для статистики (чтобы статистика не менялась при пагинации)
  const { data: allProductsData } = useQuery({
    queryKey: ['manager-inventory-all'],
    queryFn: () => managerApi.getInventory(1, 1000),
  });

  const allProducts: RawProductItem[] = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;

  // Клиентская фильтрация
  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      // Поиск по названию
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (p.name ?? '').toLowerCase().includes(q);
        const skuMatch = (p.sku ?? '').toLowerCase().includes(q);
        if (!nameMatch && !skuMatch) return false;
      }

      // Фильтр по категории
      if (categoryFilter && p.category !== categoryFilter) {
        return false;
      }

      // Фильтр по остатку
      if (stockFilter) {
        const stock = p.stock ?? 0;
        switch (stockFilter) {
          case 'in_stock':
            if (stock <= 3) return false;
            break;
          case 'low':
            if (stock === 0 || stock > 3) return false;
            break;
          case 'out_of_stock':
            if (stock !== 0) return false;
            break;
        }
      }

      return true;
    });
  }, [allProducts, searchQuery, categoryFilter, stockFilter]);

  // Статистика считается по всем товарам (все 1000), а не по текущей странице
  const stats = useMemo(() => {
    const allItems = allProductsData?.items ?? [];
    const inStock = allItems.filter((p) => (p.stock ?? 0) > 3).length;
    const lowStock = allItems.filter((p) => {
      const s = p.stock ?? 0;
      return s > 0 && s <= 3;
    }).length;
    const outOfStock = allItems.filter((p) => (p.stock ?? 0) === 0).length;
    return { total: allProductsData?.totalCount ?? allItems.length, inStock, lowStock, outOfStock };
  }, [allProductsData]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (isLoading) {
    return <InventorySkeleton />;
  }

  if (error) {
    return (
      <div className="bg-surface-card border border-hairline-dark rounded-lg p-8 text-center">
        <p className="text-price-rise font-medium">Ошибка загрузки данных склада</p>
        <p className="text-muted-foreground text-sm mt-1">
          Попробуйте обновить страницу
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Управление запасами</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Текущие остатки товаров на складе
        </p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-card border border-hairline-dark rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface-elevated flex items-center justify-center shrink-0">
            <Package size={20} className="text-muted-foreground" />
          </div>
          <div>
            <div className="text-lg font-bold font-tabular-nums text-foreground">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Всего товаров</div>
          </div>
        </div>
        <div className="bg-surface-card border border-hairline-dark rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface-elevated flex items-center justify-center shrink-0">
            <CheckCircle size={20} className="text-price-drop" />
          </div>
          <div>
            <div className="text-lg font-bold font-tabular-nums text-foreground">{stats.inStock}</div>
            <div className="text-xs text-muted-foreground">В наличии</div>
          </div>
        </div>
        <div className="bg-surface-card border border-hairline-dark rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface-elevated flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-gold" />
          </div>
          <div>
            <div className="text-lg font-bold font-tabular-nums text-foreground">{stats.lowStock}</div>
            <div className="text-xs text-muted-foreground">Мало остатков</div>
          </div>
        </div>
        <div className="bg-surface-card border border-hairline-dark rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface-elevated flex items-center justify-center shrink-0">
            <XCircle size={20} className="text-price-rise" />
          </div>
          <div>
            <div className="text-lg font-bold font-tabular-nums text-foreground">{stats.outOfStock}</div>
            <div className="text-xs text-muted-foreground">Нет в наличии</div>
          </div>
        </div>
      </div>

      {/* Фильтры */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Поиск */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2.5 bg-surface-card border border-hairline-dark rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors"
            placeholder="Поиск по названию или артикулу..."
            aria-label="Поиск товаров"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Фильтр категории */}
        <select
          className="px-4 py-2.5 bg-surface-card border border-hairline-dark rounded-lg text-sm text-foreground focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors cursor-pointer"
          aria-label="Фильтр по категории"
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

        {/* Фильтр остатка */}
        <select
          className="px-4 py-2.5 bg-surface-card border border-hairline-dark rounded-lg text-sm text-foreground focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors cursor-pointer"
          aria-label="Фильтр по остатку"
          value={stockFilter}
          onChange={(e) => {
            setStockFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          {STOCK_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Таблица */}
      <div className="bg-surface-card border border-hairline-dark rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
           <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-hairline-dark">
                <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Товар
                </th>
                <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Категория
                </th>
                <th scope="col" className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Остаток
                </th>
                <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Статус
                </th>
                <th scope="col" className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Цена
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                    Товары не найдены
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stock = product.stock ?? 0;
                  return (
                    <tr
                      key={product.id}
                      className="border-b border-hairline-dark last:border-0 hover:bg-surface-elevated/50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="text-sm font-medium">
                          {product.slug ? (
                            <Link
                              to={`/product/${product.slug}`}
                              className="text-foreground hover:text-gold transition-colors"
                            >
                              {product.name}
                            </Link>
                          ) : (
                            <span className="text-foreground">{product.name}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {product.sku}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-muted-foreground">
                          {CATEGORY_LABELS[product.category ?? ''] ?? product.category ?? '--'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-sm font-medium font-tabular-nums text-foreground">
                          {stock} шт.
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <StockBadge stock={stock} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-sm text-foreground font-tabular-nums">
                          {formatPrice(product.price ?? 0)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Пагинация */}
      <PagePagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
    </div>
  );
}

export default InventoryPage;
