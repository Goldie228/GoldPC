import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ordersApi, type Order } from '../../api/orders';
import styles from '../CheckoutPage/CheckoutPage.module.css';

export function OrderSuccessPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (orderNumber) {
      ordersApi.getOrderByNumber(orderNumber)
        .then(setOrder)
        .catch(() => {});
    }
  }, [orderNumber]);

  return (
    <div className={styles.checkoutPage}>
      <div className={styles.checkoutPageContainer}>
        <div className={styles.orderSuccess}>
          <div className={styles.orderSuccessIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className={styles.orderSuccessTitle}>Заказ оформлен!</h1>
          <p className={styles.orderSuccessText}>
            Номер вашего заказа: <span className={styles.orderSuccessNumber}>#{order?.orderNumber || orderNumber}</span>
          </p>
          {order && (
            <p className={styles.orderSuccessInfo}>
              Мы отправили подтверждение на email: {order.customerEmail}
            </p>
          )}
          <div className={styles.orderSuccessActions}>
            <Link to="/catalog" className={`${styles.checkoutBtn} ${styles.checkoutBtnPrimary}`}>
              Продолжить покупки
            </Link>
            <Link to="/account" className={`${styles.checkoutBtn} ${styles.checkoutBtnGhost}`}>
              Мои заказы
            </Link>
            {orderNumber && (
              <Link to={`/orders/${orderNumber}/tracking`} className={`${styles.checkoutBtn} ${styles.checkoutBtnGhost}`}>
                Отследить заказ
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
