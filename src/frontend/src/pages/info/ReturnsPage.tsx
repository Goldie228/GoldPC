import { type ReactElement } from 'react';
import './InfoPage.css';

export function ReturnsPage(): ReactElement {
  return (
    <main className="info-page">
      <h1>Возврат и обмен</h1>
      <section>
        <h2>Условия возврата</h2>
        <p>
          Возврат и обмен осуществляется в соответствии с законодательством Республики Беларусь и правилами продажи
          непродовольственных товаров.
        </p>
      </section>
      <section>
        <h2>Порядок действий</h2>
        <ul>
          <li>Свяжитесь с поддержкой и опишите причину возврата.</li>
          <li>Подготовьте товар в полной комплектации.</li>
          <li>После проверки мы оформим возврат средств или обмен.</li>
        </ul>
      </section>
    </main>
  );
}
