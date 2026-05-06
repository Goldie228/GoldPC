import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useOrders } from '../../hooks/useOrders';
import type { Order } from '../../api/orders';

export function OrderSuccessPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { getOrderByNumber } = useOrders();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (orderNumber) {
      getOrderByNumber(orderNumber)
        .then((result) => result && setOrder(result))
        .catch(() => {});
    }
  }, [orderNumber, getOrderByNumber]);

  return (
    <div className="min-h-[calc(100vh-200px)] bg-[var(--bg)] pt-20 text-[var(--fg)]">
      <div className="w-full max-w-[1280px] mx-auto px-6">
        <nav className="flex items-center gap-2 text-xs text-[var(--fg-dim)] mb-2">
          <Link to="/">Главная</Link>
          <span>/</span>
          <Link to="/catalog">Каталог</Link>
          <span>/</span>
          <span>Заказ оформлен</span>
        </nav>

        <div className="flex flex-col gap-7 text-center p-12 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl max-w-[620px] mx-auto">
          <div className="flex flex-col items-center gap-4">
            <div className="w-[72px] h-[72px] rounded-full inline-flex items-center justify-center text-[var(--accent)] bg-[var(--border-muted)] border border-[var(--border-muted)]" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="m-0 text-[clamp(1.55rem,4vw,2rem)] font-semibold tracking-[-0.02em]">Заказ оформлен!</h1>
          </div>
          <div className="grid gap-2.5 p-5 bg-[var(--border-muted)] border border-[var(--border-muted)] rounded-lg">
            <p className="m-0 text-[0.95rem] leading-[1.6] text-[var(--fg-muted)]">
              Номер вашего заказа: <span className="inline-flex items-center ml-1.5 px-2.5 py-1 rounded-full bg-[var(--border-muted)] border border-[var(--border-muted)] text-[var(--accent)] font-mono text-[0.86rem] font-bold">#{order?.orderNumber || orderNumber}</span>
            </p>
            {order && (
              <p className="m-0 text-[0.9rem] leading-[1.55] text-[var(--fg-muted)]">
                Мы отправили подтверждение на email: {order.customerEmail}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            <Link to="/catalog" className="w-full min-h-[46px] inline-flex items-center justify-center rounded-lg border border-[var(--accent)] no-underline text-[0.85rem] font-semibold bg-[var(--accent)] border-[var(--accent)] text-[var(--bg)]">
              Продолжить покупки
            </Link>
            <Link to="/account" className="w-full min-h-[46px] inline-flex items-center justify-center rounded-lg border border-[var(--border)] no-underline text-[0.85rem] font-semibold bg-[var(--border-muted)] border-[var(--border)] text-[var(--fg)]">
              Мои заказы
            </Link>
            {orderNumber && (
              <Link to={`/orders/${orderNumber}/tracking`} className="w-full min-h-[46px] inline-flex items-center justify-center rounded-lg border border-[var(--border)] no-underline text-[0.85rem] font-semibold bg-[var(--border-muted)] border-[var(--border)] text-[var(--fg)]">
                Отследить заказ
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
