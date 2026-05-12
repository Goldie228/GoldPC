import { type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, ShoppingBag, Wrench, Info, User, Shield } from 'lucide-react';

type SitemapCategory = {
  title: string;
  icon: React.ComponentType<{ size?: number }>;
  links: { label: string; to: string }[];
};

const categories: SitemapCategory[] = [
  {
    title: 'Основные страницы',
    icon: LayoutGrid,
    links: [
      { label: 'Главная', to: '/' },
      { label: 'Каталог', to: '/catalog' },
      { label: 'Конструктор ПК', to: '/pc-builder' },
      { label: 'Акции', to: '/promotions' },
      { label: 'Бренды', to: '/brands' },
    ],
  },
  {
    title: 'Каталог и покупки',
    icon: ShoppingBag,
    links: [
      { label: 'Корзина', to: '/cart' },
      { label: 'Избранное', to: '/wishlist' },
      { label: 'Сравнение товаров', to: '/comparison' },
      { label: 'Оформление заказа', to: '/checkout' },
    ],
  },
  {
    title: 'Услуги',
    icon: Wrench,
    links: [
      { label: 'Все услуги', to: '/services' },
      { label: 'Заявка в сервисный центр', to: '/service-request' },
    ],
  },
  {
    title: 'Информация',
    icon: Info,
    links: [
      { label: 'О нас', to: '/about' },
      { label: 'Доставка', to: '/delivery' },
      { label: 'Оплата', to: '/payment' },
      { label: 'Гарантия', to: '/warranty' },
      { label: 'Возврат', to: '/returns' },
      { label: 'FAQ', to: '/faq' },
      { label: 'Контакты', to: '/contacts' },
    ],
  },
  {
    title: 'Личный кабинет',
    icon: User,
    links: [
      { label: 'Обзор', to: '/account' },
      { label: 'Профиль', to: '/account/profile' },
      { label: 'Заказы', to: '/account/orders' },
      { label: 'Ремонты', to: '/account/repairs' },
      { label: 'Настройки', to: '/account/settings' },
    ],
  },
  {
    title: 'Правовая информация',
    icon: Shield,
    links: [
      { label: 'Политика конфиденциальности', to: '/privacy' },
      { label: 'Пользовательское соглашение', to: '/terms' },
      { label: 'Карта сайта', to: '/sitemap' },
    ],
  },
];

export function SitemapPage(): ReactElement {
  return (
    <main className="min-h-screen bg-canvas-dark pt-24 md:pt-28 pb-20">
      <div className="max-w-[900px] mx-auto px-4 md:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-text mb-8">
          <Link to="/" className="hover:text-gold transition-colors">Главная</Link>
          <span className="text-muted-text">/</span>
          <span className="text-body-text">Карта сайта</span>
        </nav>

        {/* Hero */}
        <section className="mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-body-text mb-4 tracking-[-0.02em]">
            Карта сайта
          </h1>
          <p className="text-lg text-muted-text leading-relaxed">
            Все страницы сайта GoldPC. Используйте карту для быстрой навигации.
          </p>
        </section>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <section
                key={category.title}
                className="bg-surface-card rounded-xl border border-hairline-dark p-6"
              >
                <h2 className="text-lg font-semibold text-body-text mb-5 flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center bg-gold/10 text-gold rounded-lg shrink-0">
                    <Icon size={18} />
                  </div>
                  {category.title}
                </h2>
                <ul className="space-y-2">
                  {category.links.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="text-sm text-muted-text hover:text-gold transition-colors block py-1.5"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
