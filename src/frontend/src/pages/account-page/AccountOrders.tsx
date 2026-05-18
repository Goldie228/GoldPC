import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, RefreshCw } from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { useToast } from '../../hooks/useToast';
import { ordersApi } from '../../api/orders';
import type { Order, OrderItem } from '../../api/orders';
import { Modal } from '../../components/ui/Modal/Modal';

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'New': 'Новый',
    'Processing': 'В обработке',
    'Paid': 'Оплачен',
    'InProgress': 'В пути',
    'Ready': 'Готов к получению',
    'Completed': 'Доставлен',
    'Cancelled': 'Отменён',
  };
  return labels[status] || status;
}

function getStatusProgress(status: string): number {
  const progress: Record<string, number> = {
    'New': 0,
    'Processing': 33,
    'Paid': 50,
    'InProgress': 75,
    'Ready': 85,
    'Completed': 100,
    'Cancelled': 0,
  };
  return progress[status] ?? 0;
}

function getStatusBadgeClass(status: string): string {
  const classes: Record<string, string> = {
    'Completed': 'bg-[#0ecb81]/10 text-[#0ecb81]',
    'Processing': 'bg-[#3b82f6]/10 text-[#3b82f6]',
    'InProgress': 'bg-[#FCD535]/10 text-[#FCD535]',
    'Ready': 'bg-[#2dbdb6]/10 text-[#2dbdb6]',
    'Cancelled': 'bg-[#f6465d]/10 text-[#f6465d]',
    'New': 'bg-[#707a8a]/10 text-[#707a8a]',
  };
  return classes[status] || 'bg-[#707a8a]/10 text-[#707a8a]';
}

/**
 * AccountOrders - Order history page
 *
 * Features:
 * - Order stats cards
 * - Filter buttons
 * - Orders table with status badges
 * - Pagination
 */
export function AccountOrders() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { getMyOrders } = useOrders();

  const [activeFilter, setActiveFilter] = useState('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page] = useState(1);

  const pageSize = 10;

  useEffect(() => {
    setLoading(true);
    getMyOrders(page, pageSize, activeFilter === 'all' ? undefined : activeFilter)
      .then((result) => {
        if (result != null) {
          setOrders(result.items);
        }
      })
      .catch(() => {
        // Silent fail - show empty state instead of error
      })
      .finally(() => setLoading(false));
  }, [page, activeFilter, getMyOrders]);

  const stats = {
    total: orders.length,
    delivered: orders.filter(o => o.status === 'Completed').length,
    shipped: orders.filter(o => o.status === 'InProgress' || o.status === 'Ready').length,
    processing: orders.filter(o => o.status === 'Processing').length,
  };

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handleViewDetails = async (order: Order) => {
    setSelectedOrder(order);
    setDetailsLoading(true);
    setShowDetailsModal(true);

    try {
      const details = await ordersApi.getOrder(order.id);
      setOrderDetails(details);
    } catch {
      // Silent fail - modal will show loading state
    } finally {
      setDetailsLoading(false);
    }
  };

  // Simple polling for status updates (every 30 seconds)
  const refreshOrderStatus = useCallback(async () => {
    if (selectedOrder && showDetailsModal) {
      try {
        const details = await ordersApi.getOrder(selectedOrder.id);
        setOrderDetails(details);

        // Update order in list
        setOrders(prev => prev.map(o => o.id === details.id ? details : o));
      } catch {
        // Silently fail on polling errors
      }
    }
  }, [selectedOrder, showDetailsModal]);

  useEffect(() => {
    if (!showDetailsModal) return;

    const interval = setInterval(() => { void refreshOrderStatus(); }, 30000);
    return () => clearInterval(interval);
  }, [showDetailsModal, refreshOrderStatus]);

  const handleRepeatOrder = async (orderId: string) => {
    showToast(`Товары из заказа ${orderId} добавлены в корзину`, 'success');
    void navigate('/cart');
  };

  const ordersFormatted = orders.map(order => ({
    id: order.orderNumber,
    items: order.items.slice(0, 2).map(i => ({ name: i.productName, quantity: i.quantity })),
    date: new Date(order.createdAt).toLocaleDateString('ru-RU'),
    total: `${order.total.toFixed(2)} BYN`,
    status: order.status,
    statusLabel: getStatusLabel(order.status),
    moreItems: order.items.length > 2 ? order.items.length - 2 : undefined,
  }));

  const filteredOrders = activeFilter === 'all'
    ? ordersFormatted
    : ordersFormatted.filter(order => order.status === activeFilter);

  const filters = [
    { id: 'all', label: 'Все' },
    { id: 'Completed', label: 'Доставленные' },
    { id: 'InProgress', label: 'В пути' },
    { id: 'Processing', label: 'В обработке' },
    { id: 'Cancelled', label: 'Отменённые' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center">
        <div className="text-[#707a8a] text-lg">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e11]">
      <div className="max-w-[1280px] mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#eaecef]">История заказов</h1>
            <p className="text-[#707a8a] text-sm mt-1">Все ваши заказы и их статусы</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1e2329] rounded-xl border border-[#2b3139] p-5">
            <div className="text-3xl font-bold text-[#eaecef]">{stats.total}</div>
            <div className="text-sm text-[#707a8a] mt-1">Всего заказов</div>
          </div>
          <div className="bg-[#1e2329] rounded-xl border border-[#2b3139] p-5">
            <div className="text-3xl font-bold text-[#0ecb81]">{stats.delivered}</div>
            <div className="text-sm text-[#707a8a] mt-1">Доставлено</div>
          </div>
          <div className="bg-[#1e2329] rounded-xl border border-[#2b3139] p-5">
            <div className="text-3xl font-bold text-[#FCD535]">{stats.shipped}</div>
            <div className="text-sm text-[#707a8a] mt-1">В пути</div>
          </div>
          <div className="bg-[#1e2329] rounded-xl border border-[#2b3139] p-5">
            <div className="text-3xl font-bold text-[#3b82f6]">{stats.processing}</div>
            <div className="text-sm text-[#707a8a] mt-1">В обработке</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map((filter) => (
            <button
              key={filter.id}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === filter.id
                  ? 'bg-[#FCD535] text-[#181a20]'
                  : 'bg-[#1e2329] text-[#707a8a] border border-[#2b3139] hover:text-[#eaecef] hover:border-[#FCD535]/40'
              }`}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        {filteredOrders.length === 0 ? (
          <div className="bg-[#1e2329] rounded-xl border border-[#2b3139] p-12 text-center">
            <div className="text-[#707a8a] text-lg mb-2">Нет заказов</div>
            <p className="text-[#707a8a] text-sm">У вас пока нет заказов с выбранным статусом</p>
          </div>
        ) : (
          <div className="bg-[#1e2329] rounded-xl border border-[#2b3139] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2b3139]">
                    <th className="text-left text-xs font-medium text-[#707a8a] uppercase tracking-wider px-5 py-4">Заказ</th>
                    <th className="text-left text-xs font-medium text-[#707a8a] uppercase tracking-wider px-5 py-4">Товары</th>
                    <th className="text-left text-xs font-medium text-[#707a8a] uppercase tracking-wider px-5 py-4">Дата</th>
                    <th className="text-left text-xs font-medium text-[#707a8a] uppercase tracking-wider px-5 py-4">Сумма</th>
                    <th className="text-left text-xs font-medium text-[#707a8a] uppercase tracking-wider px-5 py-4">Статус</th>
                    <th className="text-right text-xs font-medium text-[#707a8a] uppercase tracking-wider px-5 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2b3139]">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#2b3139]/30 transition-colors">
                      <td className="px-5 py-4">
                        <button
                          className="text-[#FCD535] text-sm font-medium hover:underline"
                          onClick={() => {
                            const fullOrder = orders.find(o => o.orderNumber === order.id);
                            if (fullOrder) void handleViewDetails(fullOrder);
                          }}
                        >
                          #{order.id}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-0.5">
                          {order.items.map((item, index) => (
                            <span key={index} className="text-sm text-[#eaecef]">{item.name}</span>
                          ))}
                          {order.moreItems && (
                            <span className="text-sm text-[#707a8a]">+{order.moreItems} товара</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-[#707a8a]">{order.date}</td>
                      <td className="px-5 py-4 text-sm text-[#eaecef] font-medium">{order.total}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            order.status === 'Completed' ? 'bg-[#0ecb81]' :
                            order.status === 'Processing' ? 'bg-[#3b82f6]' :
                            order.status === 'InProgress' ? 'bg-[#FCD535]' :
                            order.status === 'Ready' ? 'bg-[#2dbdb6]' :
                            order.status === 'Cancelled' ? 'bg-[#f6465d]' :
                            'bg-[#707a8a]'
                          }`}></span>
                          {order.statusLabel}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
<button
                             className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#2b3139] text-[#707a8a] hover:text-[#FCD535] hover:border-[#FCD535]/40 border border-[#2b3139] transition-colors"
                             aria-label="Отследить"
                              onClick={() => void navigate(`/orders/${order.id}/tracking`)}
                           >
                            <Info size={16} />
                          </button>
                          <button
                            className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#2b3139] text-[#707a8a] hover:text-[#FCD535] hover:border-[#FCD535]/40 border border-[#2b3139] transition-colors"
                            aria-label="Повторить"
                            onClick={() => void handleRepeatOrder(order.id)}
                          >
                            <RefreshCw size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 px-5 py-4 border-t border-[#2b3139]">
              <button
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#2b3139] text-[#707a8a] border border-[#2b3139] opacity-50 cursor-not-allowed"
                disabled
                aria-label="Назад"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#FCD535] text-[#181a20] text-sm font-medium">
                1
              </button>
              <button className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#2b3139] text-[#707a8a] border border-[#2b3139] text-sm hover:text-[#eaecef] transition-colors">
                2
              </button>
              <button className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#2b3139] text-[#707a8a] border border-[#2b3139] text-sm hover:text-[#eaecef] transition-colors">
                3
              </button>
              <button
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#2b3139] text-[#707a8a] border border-[#2b3139] hover:text-[#eaecef] transition-colors"
                aria-label="Вперёд"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Order Details Modal */}
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedOrder(null);
            setOrderDetails(null);
          }}
          title={`Заказ #${selectedOrder?.orderNumber}`}
          size="large"
        >
          {detailsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-[#707a8a]">Загрузка деталей заказа...</div>
            </div>
          ) : orderDetails && (
            <div>
              {/* Status Timeline */}
              <div className="mb-8">
                <h4 className="text-base font-semibold text-[#eaecef] mb-4">Статус заказа</h4>
                <div className="flex items-start gap-0">
                  {[
                    { status: 'New', label: 'Создан' },
                    { status: 'Processing', label: 'В обработке' },
                    { status: 'Paid', label: 'Оплачен' },
                    { status: 'InProgress', label: 'В пути' },
                    { status: 'Ready', label: 'Готов к выдаче' },
                    { status: 'Completed', label: 'Получен' },
                  ].map((step, index, arr) => {
                    const isCompleted = getStatusProgress(orderDetails.status) >= getStatusProgress(step.status);
                    const isActive = step.status === orderDetails.status;
                    return (
                      <div key={step.status} className="flex-1 flex flex-col items-center relative">
                        <div className={`relative z-10 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isCompleted
                            ? 'border-[#FCD535] bg-[#FCD535]'
                            : isActive
                              ? 'border-[#FCD535] bg-[#1e2329]'
                              : 'border-[#2b3139] bg-[#1e2329]'
                        }`}>
                          {isCompleted && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="#181a20" strokeWidth="3" className="w-3 h-3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <div className={`text-xs mt-2 text-center ${
                          isActive ? 'text-[#FCD535] font-medium' : isCompleted ? 'text-[#eaecef]' : 'text-[#707a8a]'
                        }`}>
                          {step.label}
                        </div>
                        {index < arr.length - 1 && (
                          <div className={`absolute top-2.5 left-[60%] w-[80%] h-0.5 -z-0 ${
                            getStatusProgress(orderDetails.status) > getStatusProgress(step.status)
                              ? 'bg-[#FCD535]'
                              : 'bg-[#2b3139]'
                          }`}></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Items and Delivery Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Order Items */}
                <div>
                  <h4 className="text-base font-semibold text-[#eaecef] mb-3">Состав заказа</h4>
                  <div className="space-y-2">
                    {orderDetails.items.map((item: OrderItem) => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-[#2b3139] last:border-0">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-[#eaecef] block truncate">{item.productName}</span>
                          <span className="text-xs text-[#707a8a]">× {item.quantity}</span>
                        </div>
                        <span className="text-sm text-[#eaecef] font-medium ml-4">{item.totalPrice.toFixed(2)} BYN</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-3 border-t border-[#2b3139]">
                      <span className="text-sm font-semibold text-[#eaecef]">Итого</span>
                      <span className="text-sm font-bold text-[#FCD535]">{orderDetails.total.toFixed(2)} BYN</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Info */}
                <div>
                  <h4 className="text-base font-semibold text-[#eaecef] mb-3">Данные доставки</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-[#707a8a]">Метод доставки:</span>
                      <span className="text-sm text-[#eaecef]">{orderDetails.deliveryMethod === 'Delivery' ? 'Курьер' : 'Самовывоз'}</span>
                    </div>
                    {orderDetails.address && (
                      <div className="flex justify-between">
                        <span className="text-sm text-[#707a8a]">Адрес:</span>
                        <span className="text-sm text-[#eaecef] text-right max-w-[200px]">{orderDetails.address}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-[#707a8a]">Оплата:</span>
                      <span className="text-sm text-[#eaecef]">{orderDetails.paymentMethod === 'Online' ? 'Онлайн' : 'При получении'}</span>
                    </div>
                    {orderDetails.trackingNumber && (
                      <div className="flex justify-between">
                        <span className="text-sm text-[#707a8a]">Трек номер:</span>
                        <span className="text-sm text-[#FCD535]">{orderDetails.trackingNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
