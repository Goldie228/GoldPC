import { type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { Tag, Percent, Gift, Star, ArrowRight } from 'lucide-react';

type Promotion = {
  title: string;
  description: string;
  details: string;
  icon: React.ComponentType<{ size?: number }>;
  badge: string;
  linkTo: string;
  linkLabel: string;
};

const promotions: Promotion[] = [
  {
    title: 'Сборка ПК — бесплатно',
    description: 'При покупке всех комплектующих в GoldPC сборка и настройка вашего нового компьютера — бесплатно.',
    details: 'Предложение действует при покупке полного набора комплектующих: процессор, материнская плата, оперативная память, видеокарта, накопитель, блок питания, корпус.',
    icon: Star,
    badge: 'Выгода до 100 BYN',
    linkTo: '/pc-builder',
    linkLabel: 'Собрать ПК',
  },
  {
    title: 'Рассрочка 0% на 6 месяцев',
    description: 'Оформите рассрочку на любой товар от 300 BYN без переплат и первого взноса.',
    details: 'Рассрочка предоставляется банками-партнёрами. Срок — 6 месяцев. Без первоначального взноса и без процентной переплаты.',
    icon: Percent,
    badge: '0% переплаты',
    linkTo: '/payment',
    linkLabel: 'Условия оплаты',
  },
  {
    title: 'Trade-in: старая техника в зачёт',
    description: 'Обменяйте вашу старую видеокарту или процессор на новый со скидкой до 30%.',
    details: 'Принимаем технику любого состояния. Размер скидки зависит от модели, состояния и рыночной стоимости вашего устройства.',
    icon: Gift,
    badge: 'Скидка до 30%',
    linkTo: '/contacts',
    linkLabel: 'Связаться с нами',
  },
  {
    title: 'Дарим термопасту с каждой сборкой',
    description: 'При заказе профессиональной сборки ПК — качественная термопаста Arctic MX-6 в подарок.',
    details: 'Акция действует при заказе услуги «Сборка ПК» в сервисном центре GoldPC. Подарок выдаётся вместе с готовым компьютером.',
    icon: Tag,
    badge: 'Подарок',
    linkTo: '/service-request',
    linkLabel: 'Оставить заявку',
  },
];

export function PromotionsPage(): ReactElement {
  return (
    <main className="min-h-screen bg-canvas-dark pt-24 md:pt-28 pb-20">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-text mb-8">
          <Link to="/" className="hover:text-gold transition-colors">Главная</Link>
          <span className="text-muted-text">/</span>
          <span className="text-body-text">Акции</span>
        </nav>

        {/* Hero */}
        <section className="mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-body-text mb-4 tracking-[-0.02em]">
            Акции и скидки
          </h1>
          <p className="text-lg text-muted-text max-w-[600px] leading-relaxed">
            Специальные предложения, выгодные акции и сезонные скидки. Следите за обновлениями!
          </p>
        </section>

        {/* Promotions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {promotions.map((promo) => {
            const Icon = promo.icon;
            return (
              <article
                key={promo.title}
                className="bg-surface-card rounded-xl border border-hairline-dark p-6 md:p-8 flex flex-col"
              >
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-12 h-12 flex items-center justify-center bg-gold/10 text-gold rounded-lg shrink-0">
                    <Icon size={24} />
                  </div>
                  <div>
                    <span className="inline-block text-xs font-semibold uppercase tracking-wider text-gold mb-1">
                      {promo.badge}
                    </span>
                    <h3 className="text-lg font-semibold text-body-text">{promo.title}</h3>
                  </div>
                </div>
                <p className="text-muted-text text-sm leading-relaxed mb-4">
                  {promo.description}
                </p>
                <p className="text-muted-text text-xs leading-relaxed mb-6 flex-grow border-t border-hairline-dark pt-4">
                  {promo.details}
                </p>
                <Link
                  to={promo.linkTo}
                  className="inline-flex items-center justify-center gap-2.5 font-semibold tracking-wider whitespace-nowrap rounded-md transition-all bg-gold text-gold-ink border border-gold/10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),0_2px_8px_rgba(252,213,53,0.25)] hover:bg-gold-active active:translate-y-[0.5px] h-10 px-6 text-sm self-start no-underline"
                >
                  {promo.linkLabel}
                  <ArrowRight size={16} />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
