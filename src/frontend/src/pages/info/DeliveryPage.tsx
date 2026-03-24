import { type ReactElement } from 'react';
import './InfoPage.css';

export function DeliveryPage(): ReactElement {
  return (
    <main className="info-page">
      <h1>Доставка</h1>
      <section>
        <h2>Сроки и способы</h2>
        <ul>
          <li>Самовывоз из магазина: бесплатно, в день подтверждения заказа.</li>
          <li>Курьер по Минску: 10 BYN, при заказе от 1500 BYN бесплатно.</li>
          <li>Доставка по Беларуси: 20 BYN, срок 1-3 рабочих дня.</li>
        </ul>
      </section>
      <section>
        <h2>Проверка товара</h2>
        <p>Перед передачей заказа можно проверить внешний вид, комплектацию и соответствие модели.</p>
      </section>
    </main>
  );
}
