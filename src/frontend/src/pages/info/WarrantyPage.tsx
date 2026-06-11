import { type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Clock, FileText, Wrench, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

const warrantyHighlights = [
  {
    title: 'Гарантия производителя',
    description: 'На большинство товаров действует гарантия производителя от 12 до 36 месяцев.',
    icon: ShieldCheck,
  },
  {
    title: 'Гарантия на услуги',
    description: 'На услуги сервисного центра гарантия зависит от типа выполненных работ.',
    icon: Wrench,
  },
  {
    title: 'Срок диагностики',
    description: 'Диагностика устройства занимает до 14 календарных дней.',
    icon: Clock,
  },
];

const steps = [
  {
    title: 'Подготовьте документы',
    description: 'Возьмите товар, гарантийный талон и документ о покупке (чек или накладную).',
    icon: FileText,
  },
  {
    title: 'Обратитесь в сервисный центр',
    description: 'Передайте устройство в сервисный центр GoldPC по адресу: Минск, Улица Казимировская 21.',
    icon: Wrench,
  },
  {
    title: 'Дождитесь диагностики',
    description: 'Специалисты проведут диагностику и сообщат о результатах. Срок — до 14 календарных дней.',
    icon: Clock,
  },
  {
    title: 'Получите результат',
    description: 'После подтверждения мы выполним гарантийный ремонт или замену товара.',
    icon: CheckCircle,
  },
];

export function WarrantyPage(): ReactElement {
  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-8 pb-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-text mb-8">
        <Link to="/" className="hover:text-gold transition-colors">Главная</Link>
        <span className="text-muted-text">/</span>
        <span className="text-body-text">Гарантия</span>
      </nav>

        {/* Hero */}
        <section className="mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-body-text mb-4 tracking-[-0.02em]">
            Гарантия
          </h1>
          <p className="text-lg text-muted-text max-w-[600px] leading-relaxed">
            Мы гарантируем качество каждого товара и предоставляем надёжную гарантийную поддержку.
          </p>
        </section>

        {/* Highlights */}
        <section className="mb-16">
          <h2 className="text-xl md:text-2xl font-semibold text-body-text mb-8 flex items-center gap-3">
            <ShieldCheck size={24} className="text-gold" />
            Гарантийные обязательства
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {warrantyHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="bg-surface-card rounded-xl border border-hairline-dark p-6 md:p-8"
                >
                  <div className="w-12 h-12 flex items-center justify-center bg-gold/10 text-gold rounded-lg mb-5">
                    <Icon size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-body-text mb-2">{item.title}</h3>
                  <p className="text-muted-text text-sm leading-relaxed">{item.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* Steps */}
        <section>
          <h2 className="text-xl md:text-2xl font-semibold text-body-text mb-8 flex items-center gap-3">
            <AlertCircle size={24} className="text-gold" />
            Как обратиться по гарантии
          </h2>
          <div className="bg-surface-card rounded-xl border border-hairline-dark p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gold text-gold-ink text-sm font-bold shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="text-body-text font-semibold text-sm mb-1 flex items-center gap-2">
                        <Icon size={16} className="text-gold" />
                        {step.title}
                      </h4>
                      <p className="text-muted-text text-sm leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

{/* Service request link */}
        <section className="mt-16 text-center">
          <Link
            to="/service-request"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-gold-ink font-semibold rounded-lg hover:bg-gold-active transition-colors"
          >
            Подать заявку на ремонт
            <ArrowRight size={18} />
          </Link>
        </section>
      </div>
    );
  }
