import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { Button } from '@/components/ui/Button';
import type { Order } from '@/api/orders';

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
    <div className="min-h-[calc(100vh-200px)] bg-background py-5 text-foreground">
      <div className="w-full max-w-[var(--layout-page-wide)] mx-auto px-[var(--layout-page-pad-x)]">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link to="/" className="text-muted-foreground no-underline transition-colors hover:text-gold">Главная</Link>
          <span>/</span>
          <Link to="/catalog" className="text-muted-foreground no-underline transition-colors hover:text-gold">Каталог</Link>
          <span>/</span>
          <span className="text-foreground">Заказ оформлен</span>
        </nav>

        <div className="flex flex-col gap-7 text-center p-12 bg-card border border-border rounded-xl max-w-[620px] mx-auto shadow-lg">
          <div className="flex flex-col items-center gap-4">
            <div className="w-[72px] h-[72px] rounded-full inline-flex items-center justify-center text-gold bg-border-muted border border-border-muted">
              <Check size={32} />
            </div>
            <h1 className="m-0 text-2xl font-semibold text-foreground">Заказ оформлен!</h1>
          </div>
          <div className="grid gap-2.5 p-5 bg-border-muted border border-border-muted rounded-lg">
            <p className="m-0 text-sm leading-normal text-muted-foreground">
              Номер вашего заказа:{' '}
              <span className="inline-flex items-center ml-1.5 px-2.5 py-1 rounded-full bg-elevated border border-border-muted text-gold font-mono text-sm font-bold">
                #{order?.orderNumber || orderNumber}
              </span>
            </p>
            {order && (
              <p className="m-0 text-sm leading-normal text-muted-foreground">
                Мы отправили подтверждение на email: {order.customerEmail}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            <Link to="/catalog">
              <Button variant="primary" size="lg" fullWidth>
                Продолжить покупки
              </Button>
            </Link>
            <Link to="/account">
              <Button variant="secondary" size="lg" fullWidth>
                Мои заказы
              </Button>
            </Link>
            {orderNumber && (
              <Link to={`/orders/${orderNumber}/tracking`}>
                <Button variant="ghost" size="lg" fullWidth>
                  Отследить заказ
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
