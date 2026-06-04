import { type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Banknote, Building2, Shield, Smartphone, CheckCircle } from 'lucide-react';

const paymentMethods = [
  {
    title: 'Онлайн-оплата банковской картой',
    description: 'Visa, Mastercard, МИР. Платежи проходят через защищённый TLS-протокол.',
    icon: CreditCard,
  },
  {
    title: 'Наличными курьеру',
    description: 'Оплата при получении заказа наличными в белорусских рублях.',
    icon: Banknote,
  },
  {
    title: 'Картой курьеру',
    description: 'Оплата банковской картой через терминал при получении.',
    icon: Smartphone,
  },
  {
    title: 'Оплата по ЕРИП',
    description: 'Для заказов по Беларуси. Система ЕРИП доступна во всех отделениях банков и интернет-банкинге.',
    icon: Building2,
  },
];

export function PaymentPage(): ReactElement {
  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-text mb-8">
        <Link to="/" className="hover:text-gold transition-colors">Главная</Link>
        <span className="text-muted-text">/</span>
        <span className="text-body-text">Оплата</span>
      </nav>

        {/* Hero */}
        <section className="mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-body-text mb-4 tracking-[-0.02em]">
            Оплата
          </h1>
          <p className="text-lg text-muted-text max-w-[600px] leading-relaxed">
            Удобные и безопасные способы оплаты для вашего заказа.
          </p>
        </section>

        {/* Payment Methods */}
        <section className="mb-16">
          <h2 className="text-xl md:text-2xl font-semibold text-body-text mb-8 flex items-center gap-3">
            <CreditCard size={24} className="text-gold" />
            Доступные способы оплаты
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <article
                  key={method.title}
                  className="bg-surface-card rounded-xl border border-hairline-dark p-6 flex items-start gap-4"
                >
                  <div className="w-12 h-12 flex items-center justify-center bg-gold/10 text-gold rounded-lg shrink-0">
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-body-text mb-1">{method.title}</h3>
                    <p className="text-sm text-muted-text leading-relaxed">{method.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Security */}
        <section>
          <h2 className="text-xl md:text-2xl font-semibold text-body-text mb-8 flex items-center gap-3">
            <Shield size={24} className="text-gold" />
            Безопасность платежей
          </h2>
          <div className="bg-surface-card rounded-xl border border-hairline-dark p-6 md:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 flex items-center justify-center bg-gold/10 text-gold rounded-lg shrink-0">
                <Shield size={24} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-body-text mb-2">Защищённые транзакции</h3>
                <p className="text-muted-text text-sm leading-relaxed">
                  Все платежи проходят по защищённому TLS-соединению. Данные вашей карты не хранятся
                  в системе магазина и недоступны третьим лицам.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 flex items-center justify-center bg-gold/10 text-gold rounded-lg shrink-0">
                <CheckCircle size={24} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-body-text mb-2">Подтверждение оплаты</h3>
                <p className="text-muted-text text-sm leading-relaxed">
                  После успешной оплаты вы получите подтверждение на email и в личном кабинете.
                  Чек и гарантийные документы прилагаются к заказу.
                </p>
              </div>
            </div>
          </div>
</section>
      </div>
  );
}
