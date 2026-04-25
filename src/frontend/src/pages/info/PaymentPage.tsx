import { type ReactElement } from 'react';
import styles from './InfoPage.module.css';

export function PaymentPage(): ReactElement {
  return (
    <main className="info-page">
      <h1>Оплата</h1>
      <section>
        <h2>Доступные способы оплаты</h2>
        <ul>
          <li>Онлайн-оплата банковской картой (Visa, Mastercard, МИР).</li>
          <li>Оплата при получении (наличными или картой курьеру).</li>
          <li>Оплата по ЕРИП для заказов по Беларуси.</li>
        </ul>
      </section>
      <section>
        <h2>Безопасность платежей</h2>
        <p>Платежи проходят по защищенному TLS-соединению. Данные карты не хранятся в системе магазина.</p>
      </section>
    </main>
  );
}
