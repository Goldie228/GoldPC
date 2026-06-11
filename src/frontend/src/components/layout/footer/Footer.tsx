import { Link } from 'react-router-dom';
import { Instagram, Facebook, Youtube, Send } from 'lucide-react';

/**
 * Компонент футера — тёмный премиальный вариант
 *
 * Дизайн: footer-dark (DESIGN.md)
 * Фон: #0b0e11 (canvas-dark, совпадает с хедером)
 * Акцент: приглушённая латунь #c9a84c (сдержанная, не неоновая)
 * Иерархия текста: заголовок → ссылка → копирайт (убывающий контраст)
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  const catalogLinks = [
    { label: 'Процессоры', href: '/catalog?category=cpu' },
    { label: 'Видеокарты', href: '/catalog?category=gpu' },
    { label: 'Мат. платы', href: '/catalog?category=motherboard' },
    { label: 'Память', href: '/catalog?category=ram' },
    { label: 'Накопители', href: '/catalog?category=storage' },
    { label: 'Блоки питания', href: '/catalog?category=psu' },
    { label: 'Корпуса', href: '/catalog?category=case' },
    { label: 'Охлаждение', href: '/catalog?category=cooling' },
    { label: 'Мониторы', href: '/catalog?category=monitor' },
    { label: 'Клавиатуры', href: '/catalog?category=keyboard' },
    { label: 'Мыши', href: '/catalog?category=mouse' },
    { label: 'Наушники', href: '/catalog?category=headphones' },
  ];

  const serviceLinks = [
    { label: 'Конструктор ПК', href: '/pc-builder' },
    { label: 'Сборка и настройка', href: '/services/assembly' },
    { label: 'Доставка по РБ', href: '/delivery' },
    { label: 'Оплата и рассрочка', href: '/payment' },
    { label: 'Гарантийное обслуживание', href: '/warranty' },
    { label: 'Заявка в сервис', href: '/service-request' },
  ];

  const infoLinks = [
    { label: 'О нас', href: '/about' },
    { label: 'Контакты', href: '/contacts' },
    { label: 'Возврат товара', href: '/returns' },
    { label: 'Частые вопросы', href: '/faq' },
  ];

  const customerLinks = [
    { label: 'Бренды', href: '/brands' },
    { label: 'Политика конфиденциальности', href: '/privacy' },
    { label: 'Пользовательское соглашение', href: '/terms' },
  ];

  const contactInfo = [
    { label: '+375 (33) 314-92-83', href: 'tel:+375333149283', type: 'phone' },
    { label: 'goldpc.team@gmail.com', href: 'mailto:goldpc.team@gmail.com', type: 'email' },
    { label: 'Минск, Улица Казимировская 21', href: '#', type: 'address' },
  ];

  const socialLinks = [
    { icon: 'telegram', href: 'https://t.me/goldpc', label: 'Telegram' },
    { icon: 'instagram', href: 'https://instagram.com/goldpc', label: 'Instagram' },
    { icon: 'facebook', href: 'https://facebook.com/goldpc', label: 'Facebook' },
    { icon: 'youtube', href: 'https://youtube.com/goldpc', label: 'YouTube' },
  ];

  const renderSocialIcon = (icon: string) => {
    switch (icon) {
      case 'telegram':
        return <Send size={16} className="text-muted-foreground" />;
      case 'instagram':
        return <Instagram className="w-4 h-4" />;
      case 'facebook':
        return <Facebook className="w-4 h-4" />;
      case 'youtube':
        return <Youtube className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <footer className="py-16 px-6 bg-background border-t border-border">
      <div className="max-w-[1200px] mx-auto">
        {/* Основная сетка */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-x-6 gap-y-10 lg:gap-y-12">
          {/* Колонка бренда */}
          <div className="max-w-[220px] min-w-0">
            <Link to="/" className="flex items-center gap-2.5 no-underline group">
              <span className="footer__brand-logo text-xl font-semibold text-gold tracking-tight transition-colors duration-300 group-hover:text-gold-active">
                Gold
                <span className="text-muted-foreground transition-colors duration-300 group-hover:text-muted-foreground">
                  PC
                </span>
              </span>
            </Link>
            <p className="footer__brand-text text-sm text-muted-foreground leading-relaxed mt-5">
              Премиальный магазин компьютерных компонентов с профессиональной сборкой и гарантией качества.
            </p>
          </div>

          {/* Колонка каталога */}
          <div className="min-w-0">
            <h4 className="footer__title uppercase tracking-[0.14em] font-semibold text-muted-strong mb-5 w-fit">
              Каталог
            </h4>
            <ul className="list-none p-0 m-0 flex flex-col gap-2">
              {catalogLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="footer__link text-sm text-muted-foreground no-underline transition-colors duration-200 hover:text-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Колонка сервиса */}
          <div className="min-w-0">
            <h4 className="footer__title uppercase tracking-[0.14em] font-semibold text-muted-strong mb-5 w-fit">
              Сервис
            </h4>
            <ul className="list-none p-0 m-0 flex flex-col gap-2">
              {serviceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="footer__link text-sm text-muted-foreground no-underline transition-colors duration-200 hover:text-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Колонка информации */}
          <div className="min-w-0">
            <h4 className="footer__title uppercase tracking-[0.14em] font-semibold text-muted-strong mb-5 w-fit">
              Информация
            </h4>
            <ul className="list-none p-0 m-0 flex flex-col gap-2">
              {infoLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="footer__link text-sm text-muted-foreground no-underline transition-colors duration-200 hover:text-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Колонка покупателям */}
          <div className="min-w-0">
            <h4 className="footer__title uppercase tracking-[0.14em] font-semibold text-muted-strong mb-5 w-fit">
              Покупателям
            </h4>
            <ul className="list-none p-0 m-0 flex flex-col gap-2">
              {customerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="footer__link text-sm text-muted-foreground no-underline transition-colors duration-200 hover:text-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Колонка контактов */}
          <div className="min-w-0">
            <h4 className="footer__title uppercase tracking-[0.14em] font-semibold text-muted-strong mb-5 w-fit">
              Контакты
            </h4>
            <ul className="list-none p-0 m-0 flex flex-col gap-2">
              {contactInfo.map((item, index) => (
                <li key={index}>
                  {item.type === 'address' ? (
                    <span className="footer__link text-sm text-muted-foreground">{item.label}</span>
                  ) : (
                    <a
                      href={item.href}
                      className="footer__link text-sm text-muted-foreground no-underline transition-colors duration-200 hover:text-gold"
                    >
                      {item.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Низ футера */}
        <div className="mt-12 pt-6 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Копирайт */}
            <span className="footer__copyright text-xs text-muted-foreground tracking-wide">
              © {currentYear} GoldPC. Все права защищены.
            </span>

            {/* Соцсети */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.icon}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="footer__social-icon w-8 h-8 flex items-center justify-center bg-transparent border border-hairline-dark text-muted-foreground no-underline rounded transition-colors duration-200 hover:border-gold hover:text-gold"
                >
                  {renderSocialIcon(social.icon)}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}