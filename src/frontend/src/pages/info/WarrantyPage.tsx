import { type ReactElement } from 'react';
import './InfoPage.css';

export function WarrantyPage(): ReactElement {
  return (
    <main className="info-page">
      <h1>Гарантия</h1>
      <section>
        <h2>Гарантийные обязательства</h2>
        <p>
          На большинство товаров действует гарантия производителя от 12 до 36 месяцев. На услуги сервисного центра
          гарантия зависит от типа работ.
        </p>
      </section>
      <section>
        <h2>Как обратиться по гарантии</h2>
        <ul>
          <li>Подготовьте товар, гарантийный талон и документ о покупке.</li>
          <li>Передайте устройство в сервисный центр GoldPC.</li>
          <li>Срок диагностики обычно занимает до 14 календарных дней.</li>
        </ul>
      </section>
    </main>
  );
}
