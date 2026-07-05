import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Info, RefreshCw, Search, X, Package, Truck, Clock, CheckCircle } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { useToast } from '@/hooks/useToast';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { ordersApi } from '@/api/orders';
import type { Order, OrderItem } from '@/api/orders';
import type { ProductSummary } from '@/api/types';
import { useCartStore } from '@/store/cartStore';
import { Modal } from '@/components/ui/Modal';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { StatusVariant } from '@/components/ui/StatusBadge';

/**
 * Сопоставляет статус заказа с вариантом StatusBadge
 */
const STATUS_VARIANT: Record<string, StatusVariant> = {
  Completed: 'neutral',
  Processing: 'info',
  InProgress: 'warning',
  Ready: 'info',
  Cancelled: 'neutral',
  New: 'neutral',
};

const STATUS_PROGRESS: Record<string, number> = {
  New: 0,
  Processing: 33,
  Paid: 50,
  InProgress: 75,
  Ready: 85,
  Completed: 100,
  Cancelled: 0,
};

const STATUS_LABELS: Record<string, string> = {
  New: 'Новый',
  Processing: 'В обработке',
  Paid: 'Оплачен',
  InProgress: 'В пути',
  Ready: 'Готов к получению',
  Completed: 'Доставлен',
  Cancelled: 'Отменён',
};

const TIMELINE_STEPS = [
  { status: 'New', label: 'Создан' },
  { status: 'Processing', label: 'В обработке' },
  { status: 'Paid', label: 'Оплачен' },
  { status: 'InProgress', label: 'В пути' },
  { status: 'Ready', label: 'Готов к выдаче' },
  { status: 'Completed', label: 'Получен' },
] as const;

const FILTERS = [
  { id: 'all', label: 'Все' },
  { id: 'Completed', label: 'Доставленные' },
  { id: 'InProgress', label: 'В пути' },
  { id: 'Processing', label: 'В обработке' },
  { id: 'Cancelled', label: 'Отменённые' },
] as const;

const PAGE_SIZE = 10;

/* ─── Анимация входа с задержкой ─── */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const } },
};

function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}

function getStatusVariant(status: string): StatusVariant {
  return STATUS_VARIANT[status] || 'neutral';
}

function getStatusProgress(status: string): number {
  return STATUS_PROGRESS[status] ?? 0;
}

/**
 * AccountOrders — Страница с историей заказов, поиском, фильтрами и деталями заказа
 *
 * Возможности:
 * - Карточки статистики заказов
 * - Поиск по номеру заказа
 * - Фильтрация по статусу
 * - Десктоп: табличный макет / Мобильный: макет карточек
 * - Бесконечная прокрутка с кнопкой "Загрузить ещё" + IntersectionObserver
 * - Цели касания >= 44px
 * - Детали заказа: bottom sheet на мобильных, модалка на десктопе
 */
export function AccountOrders() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { getMyOrders } = useOrders();
  const isMobile = useMediaQuery('(max-width: 767px)');

  const [activeFilter, setActiveFilter] = useState('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // ── Получение данных ──────────────────────────────────────────────────

  const fetchOrders = useCallback(async (pageNum: number, replace: boolean) => {
    const result = await getMyOrders(pageNum, PAGE_SIZE, activeFilter === 'all' ? undefined : activeFilter);
    if (result != null) {
      setOrders(prev => replace ? result.items : [...prev, ...result.items]);
      setPage(pageNum);
      setTotalCount(result.totalCount);
    }
    return result;
  }, [activeFilter, getMyOrders]);

  // Сброс при изменении фильтра
  useEffect(() => {
    setLoading(true);
    setOrders([]);
    setPage(1);
    setSearchQuery('');
    fetchOrders(1, true)
      .catch(() => { /* silent */ })
      .finally(() => setLoading(false));
  }, [fetchOrders]);

  const hasMore = orders.length < totalCount;

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    fetchOrders(page + 1, false)
      .catch(() => { /* silent */ })
      .finally(() => setLoadingMore(false));
  }, [loadingMore, hasMore, page, fetchOrders]);

  // ── IntersectionObserver для бесконечной прокрутки ────────────────────────

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          void loadMore();
        }
      },
      { rootMargin: '200px 0px', threshold: 0.01 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, loadMore]);

  // ── Статистика ───────────────────────────────────────────────────────────

  const stats = {
    total: totalCount,
    delivered: orders.filter(o => o.status === 'Completed').length,
    shipped: orders.filter(o => o.status === 'InProgress' || o.status === 'Ready').length,
    processing: orders.filter(o => o.status === 'Processing').length,
  };

  // ── Детали заказа ───────────────────────────────────────────────────

  const handleViewDetails = async (order: Order) => {
    setSelectedOrder(order);
    setDetailsLoading(true);
    setShowDetailsModal(true);

    try {
      const details = await ordersApi.getOrder(order.id);
      setOrderDetails(details);
    } catch {
      // Тихий сбой — модалка показывает загрузку
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedOrder(null);
    setOrderDetails(null);
  };

  // Опрос для обновления статуса
  const refreshOrderStatus = useCallback(async () => {
    if (selectedOrder && showDetailsModal) {
      try {
        const details = await ordersApi.getOrder(selectedOrder.id);
        setOrderDetails(details);
        setOrders(prev => prev.map(o => o.id === details.id ? details : o));
      } catch {
        // Silent
      }
    }
  }, [selectedOrder, showDetailsModal]);

  useEffect(() => {
    if (!showDetailsModal) return;
    const interval = setInterval(() => { void refreshOrderStatus(); }, 30000);
    return () => clearInterval(interval);
  }, [showDetailsModal, refreshOrderStatus]);

  // ── Действия ─────────────────────────────────────────────────────────

  const handleRepeatOrder = async (orderNumber: string) => {
    const fullOrder = orders.find(o => o.orderNumber === orderNumber);
    if (!fullOrder) {
      showToast('Заказ не найден', 'error');
      return;
    }

    const addItem = useCartStore.getState().addItem;

    for (const item of fullOrder.items) {
      // Создаём минимальный ProductSummary из данных OrderItem.
      // Хранилище корзины использует только id, name, category, price, slug, mainImage — безопасные значения по умолчанию для остального.
      const product: ProductSummary = {
        id: item.productId,
        name: item.productName,
        sku: '',
        category: 'monitor', // placeholder — cart display does not depend on this
        price: item.unitPrice,
        stock: 0,
        isActive: true,
      };
      addItem(product, item.quantity);
    }

    showToast(`Товары из заказа #${orderNumber} добавлены в корзину`, 'success');
    void navigate('/cart');
  };

  // ── Форматирование ──────────────────────────────────────────────────────

  const ordersFormatted = orders.map(order => ({
    id: order.orderNumber,
    items: order.items.slice(0, 2).map(i => ({ name: i.productName, quantity: i.quantity })),
    date: new Date(order.createdAt).toLocaleDateString('ru-RU'),
    total: `${order.total.toFixed(2)} BYN`,
    status: order.status,
    statusLabel: getStatusLabel(order.status),
    moreItems: order.items.length > 2 ? order.items.length - 2 : undefined,
  }));

  const filteredOrders = ordersFormatted.filter(order =>
    !searchQuery || order.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // ── Пустые состояния / загрузка ──────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw size={24} className="text-muted-foreground animate-spin" />
          <div className="text-muted-foreground text-sm">Загрузка заказов...</div>
        </div>
      </div>
    );
  }

  // ── Содержимое деталей заказа (общее для мобильных и десктопа) ─────────

  const renderOrderDetails = () => {
    if (detailsLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Загрузка деталей заказа...</div>
        </div>
      );
    }

    if (!orderDetails) return null;

    return (
      <div>
        {/* Временная шкала статуса */}
        <div className="mb-8">
          <h4 className="text-base font-semibold text-foreground mb-4">Статус заказа</h4>
          <div className="flex items-start gap-0">
            {TIMELINE_STEPS.map((step, index, arr) => {
              const currentProgress = getStatusProgress(orderDetails.status);
              const stepProgress = getStatusProgress(step.status);
              const isCompleted = currentProgress >= stepProgress;
              const isActive = step.status === orderDetails.status;

              return (
                <div key={step.status} className="flex-1 flex flex-col items-center relative">
                  <div
                    className={`relative z-10 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isCompleted
                        ? 'border-primary bg-primary'
                        : isActive
                          ? 'border-primary bg-card'
                          : 'border-border bg-card'
                    }`}
                  >
                    {isCompleted && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3 text-gold-ink">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <div className={`text-xs mt-2 text-center ${
                    isActive ? 'text-primary font-medium' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </div>
                  {index < arr.length - 1 && (
                    <div className={`absolute top-2.5 left-1/2 right-0 h-0.5 -z-0 ${
                      currentProgress > stepProgress ? 'bg-primary' : 'bg-border'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Товары в заказе и информация о доставке */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-base font-semibold text-foreground mb-3">Состав заказа</h4>
            <div className="space-y-2">
              {orderDetails.items.map((item: OrderItem) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-foreground block truncate">{item.productName}</span>
                    <span className="text-xs text-muted-foreground">× {item.quantity}</span>
                  </div>
                  <span className="text-sm text-foreground font-medium ml-4">{item.totalPrice.toFixed(2)} BYN</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-sm font-semibold text-foreground">Итого</span>
                <span className="text-sm font-bold text-foreground font-tabular">{orderDetails.total.toFixed(2)} BYN</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-base font-semibold text-foreground mb-3">Данные доставки</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Метод доставки:</span>
                <span className="text-sm text-foreground">
                  {orderDetails.deliveryMethod === 'Delivery' ? 'Курьер' : 'Самовывоз'}
                </span>
              </div>
              {orderDetails.address && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Адрес:</span>
                  <span className="text-sm text-foreground text-right max-w-[200px]">{orderDetails.address}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Оплата:</span>
                <span className="text-sm text-foreground">
                  {orderDetails.paymentMethod === 'Online' ? 'Онлайн' : 'При получении'}
                </span>
              </div>
              {orderDetails.trackingNumber && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Трек номер:</span>
                  <span className="text-sm text-info-blue">{orderDetails.trackingNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Детали заказа: полноэкранный режим на мобильных vs модалка на десктопе ──────────────

  const renderOrderDetailsPanel = () => {
    if (!showDetailsModal) return null;

    if (isMobile) {
      return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
            <h3 className="text-lg font-semibold text-foreground">
              Заказ #{selectedOrder?.orderNumber}
            </h3>
            <button
              onClick={handleCloseDetails}
              className="w-11 h-11 flex items-center justify-center rounded-lg bg-elevated text-muted-foreground border border-border hover:text-foreground transition-colors"
              aria-label="Закрыть"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {renderOrderDetails()}
          </div>
        </div>
      );
    }

    return (
      <Modal
        isOpen={showDetailsModal}
        onClose={handleCloseDetails}
        title={`Заказ #${selectedOrder?.orderNumber}`}
        size="large"
      >
        {renderOrderDetails()}
      </Modal>
    );
  };

  // ── Отрисовка ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1280px] mx-auto">
        {/* Заголовок страницы */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">История заказов</h1>
            <p className="text-muted-foreground text-sm mt-1">Все ваши заказы и их статусы</p>
          </div>
        </div>

        {/* Карточки статистики */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6"
        >
          <motion.div variants={itemVariants}>
            <StatCard label="Всего заказов" value={stats.total} icon={Package} />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard label="Доставлено" value={stats.delivered} icon={CheckCircle} />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard label="В пути" value={stats.shipped} icon={Truck} />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard label="В обработке" value={stats.processing} icon={Clock} />
          </motion.div>
        </motion.div>

        {/* Фильтры · Мобильные: горизонтальная прокрутка с привязкой */}
        <div className="flex gap-2 mb-4 overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden pb-1">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === filter.id
                  ? 'bg-elevated text-foreground'
                  : 'bg-card text-muted-foreground border border-border hover:text-foreground hover:border-foreground/20'
              }`}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Поиск */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск по номеру заказа"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full md:max-w-sm pl-10 pr-4 py-3 rounded-lg bg-card border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-colors"
          />
        </div>

        {/* Список заказов */}
        {filteredOrders.length === 0 && !loading ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <div className="text-muted-foreground text-lg mb-2">Нет заказов</div>
            <p className="text-muted-foreground text-sm">
              {searchQuery
                ? 'Заказы с таким номером не найдены'
                : 'У вас пока нет заказов с выбранным статусом'}
            </p>
          </div>
        ) : (
          <>
            {/* Десктоп: Таблица */}
            <div className="hidden md:block bg-card rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-4">Заказ</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-4">Товары</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-4">Дата</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-4">Сумма</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-4">Статус</th>
                      <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-4" />
                    </tr>
                  </thead>
                  <motion.tbody
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="divide-y divide-border"
                  >
                    {filteredOrders.map((order) => {
                      const fullOrder = orders.find(o => o.orderNumber === order.id);
                      return (
                        <motion.tr key={order.id} variants={itemVariants} className="hover:bg-elevated/30 transition-colors">
                          <td className="px-5 py-4">
                            <button
                              className="text-info-blue text-sm font-medium hover:underline"
                              onClick={() => fullOrder && void handleViewDetails(fullOrder)}
                            >
                              #{order.id}
                            </button>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-0.5">
                              {order.items.map((item, index) => (
                                <span key={index} className="text-sm text-foreground">{item.name}</span>
                              ))}
                              {order.moreItems && (
                                <span className="text-sm text-muted-foreground">+{order.moreItems} товара</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-muted-foreground">{order.date}</td>
                          <td className="px-5 py-4 text-sm text-foreground font-medium">{order.total}</td>
                          <td className="px-5 py-4">
                            <StatusBadge variant={getStatusVariant(order.status)} label={order.statusLabel} />
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                className="flex items-center justify-center w-11 h-11 rounded-lg bg-elevated text-muted-foreground hover:text-info-blue hover:border-info-blue/40 border border-border transition-colors"
                                aria-label="Отследить"
                                onClick={() => void navigate(`/orders/${fullOrder?.orderNumber ?? order.id}/tracking`)}
                              >
                                <Info size={18} />
                              </button>
                              <button
                                className="flex items-center justify-center w-11 h-11 rounded-lg bg-elevated text-muted-foreground hover:text-info-blue hover:border-info-blue/40 border border-border transition-colors"
                                aria-label="Повторить"
                                onClick={() => handleRepeatOrder(order.id)}
                              >
                                <RefreshCw size={18} />
                              </button>
                            </div>
                          </td>
                          </motion.tr>
                        );
                      })}
                    </motion.tbody>
                </table>
              </div>
            </div>

            {/* Мобильные: Карточки */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="block md:hidden space-y-3"
            >
              {filteredOrders.map((order) => {
                const fullOrder = orders.find(o => o.orderNumber === order.id);
                return (
                  <motion.div key={order.id} variants={itemVariants} className="bg-card rounded-xl border border-border p-4">
                    {/* Строка заголовка */}
                    <div className="flex items-center justify-between mb-3">
                      <button
                        className="text-info-blue text-sm font-medium hover:underline"
                        onClick={() => fullOrder && void handleViewDetails(fullOrder)}
                      >
                        #{order.id}
                      </button>
                      <StatusBadge variant={getStatusVariant(order.status)} label={order.statusLabel} />
                    </div>

                    {/* Товары */}
                    <div className="text-sm text-foreground mb-2">
                      {order.items.map((item, index) => (
                        <span key={index} className="block">{item.name}</span>
                      ))}
                      {order.moreItems && (
                        <span className="text-sm text-muted-foreground">+{order.moreItems} товара</span>
                      )}
                    </div>

                    {/* Дата и Итого */}
                    <div className="flex items-center justify-between text-sm mb-3">
                      <span className="text-muted-foreground">{order.date}</span>
                      <span className="text-foreground font-medium">{order.total}</span>
                    </div>

                    {/* Действия */}
                    <div className="flex gap-2 pt-3 border-t border-border">
                      <button
                        className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg bg-elevated text-muted-foreground hover:text-info-blue hover:border-info-blue/40 border border-border transition-colors text-sm"
                        aria-label="Детали заказа"
                        onClick={() => fullOrder && void handleViewDetails(fullOrder)}
                      >
                        <Info size={16} />
                        Детали
                      </button>
                      <button
                        className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg bg-elevated text-muted-foreground hover:text-info-blue hover:border-info-blue/40 border border-border transition-colors text-sm"
                        aria-label="Повторить заказ"
                        onClick={() => handleRepeatOrder(order.id)}
                      >
                        <RefreshCw size={16} />
                        Повторить
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Загрузить ещё / Сторож бесконечной прокрутки */}
            {hasMore && (
              <div ref={sentinelRef} className="flex items-center justify-center py-6">
                {loadingMore ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <RefreshCw size={16} className="animate-spin text-muted-foreground" />
                    <span>Загрузка</span>
                  </div>
                ) : (
                  <button
                    onClick={loadMore}
                    className="px-6 py-3 rounded-lg bg-elevated text-foreground border border-border hover:border-foreground/20 transition-colors text-sm font-medium"
                  >
                    Загрузить ещё
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Панель деталей заказа */}
        {renderOrderDetailsPanel()}
      </div>
    </div>
  );
}
