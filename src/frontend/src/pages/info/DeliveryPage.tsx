import { type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { Truck, MapPin, Package, Search, ShieldCheck } from 'lucide-react';

const deliveryOptions = [
  {
    title: 'Самовывоз из магазина',
    description: 'Бесплатно, в день подтверждения заказа. Вы можете самостоятельно забрать товар по адресу:',
    address: 'Минск, Улица Казимировская 21',
    price: 'Бесплатно',
    icon: MapPin,
  },
  {
    title: 'Курьер по Минску',
    description: 'Оперативная доставка курьером по городу. При заказе от 1 500 BYN — бесплатно.',
    price: '10 BYN',
    note: 'Бесплатно от 1 500 BYN',
    icon: Truck,
  },
  {
    title: 'Доставка по Беларуси',
    description: 'Доставка во все населённые пункты Республики Беларусь. Срок — 1–3 рабочих дня.',
    price: '20 BYN',
    icon: Package,
  },
];

const checkSteps = [
  {
    title: 'Проверка внешнего вида',
    description: 'Осмотрите товар на предмет повреждений и дефектов.',
    icon: Search,
  },
  {
    title: 'Проверка комплектации',
    description: 'Убедитесь, что все компоненты и аксессуары на месте.',
    icon: Package,
  },
  {
    title: 'Проверка соответствия',
    description: 'Сверьте модель и характеристики с заказом.',
    icon: ShieldCheck,
  },
];

export function DeliveryPage(): ReactElement {
  return (
    <main className="min-h-screen bg-canvas-dark pt-24 md:pt-28 pb-20">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-text mb-8">
          <Link to="/" className="hover:text-gold transition-colors">Главная</Link>
          <span className="text-muted-text">/</span>
          <span className="text-body-text">Доставка</span>
        </nav>

        {/* Hero */}
        <section className="mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-body-text mb-4 tracking-[-0.02em]">
            Доставка
          </h1>
          <p className="text-lg text-muted-text max-w-[600px] leading-relaxed">
            Быстрая и удобная доставка по Минску и всей Беларуси. Выбирайте удобный способ получения заказа.
          </p>
        </section>

        {/* Delivery Options */}
        <section className="mb-16">
          <h2 className="text-xl md:text-2xl font-semibold text-body-text mb-8 flex items-center gap-3">
            <Truck size={24} className="text-gold" />
            Способы доставки
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {deliveryOptions.map((option) => {
              const Icon = option.icon;
              return (
                <article
                  key={option.title}
                  className="bg-surface-card rounded-xl border border-hairline-dark p-6 md:p-8 flex flex-col"
                >
                  <div className="w-12 h-12 flex items-center justify-center bg-gold/10 text-gold rounded-lg mb-5">
                    <Icon size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-body-text mb-2">{option.title}</h3>
                  <p className="text-muted-text text-sm leading-relaxed mb-4 flex-grow">{option.description}</p>
                  {option.address && (
                    <p className="text-sm text-body-text mb-3 flex items-start gap-2">
                      <MapPin size={14} className="text-gold mt-0.5 shrink-0" />
                      <span>{option.address}</span>
                    </p>
                  )}
                  <div className="pt-4 border-t border-hairline-dark">
                    <span className="text-gold font-semibold text-lg">{option.price}</span>
                    {option.note && (
                      <p className="text-xs text-muted-text mt-1">{option.note}</p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Check before receiving */}
        <section>
          <h2 className="text-xl md:text-2xl font-semibold text-body-text mb-8 flex items-center gap-3">
            <ShieldCheck size={24} className="text-gold" />
            Проверка товара перед получением
          </h2>
          <div className="bg-surface-card rounded-xl border border-hairline-dark p-6 md:p-8">
            <p className="text-muted-text mb-6">
              Перед передачей заказа вы можете проверить внешний вид, комплектацию и соответствие модели.
              Рекомендуем проверить товар при курьере или в пункте самовывоза.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {checkSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="flex items-start gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-gold/10 text-gold rounded-lg shrink-0">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h4 className="text-body-text font-medium text-sm mb-1">{step.title}</h4>
                      <p className="text-muted-text text-xs">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
