import { Link } from 'react-router-dom';
import { Instagram, Facebook, Youtube } from 'lucide-react';

/**
 * Footer Component — Premium Dark Variant
 *
 * Design: footer-dark (DESIGN.md)
 * Background: #0b0e11 (canvas-dark, matching header)
 * Accent: muted brass #c9a84c (restrained, not neon)
 * Text hierarchy: title → link → copyright (descending contrast)
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
    { label: 'Частые вопросы', href: '/faq' },
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
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
        );
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
    <footer className="py-16 px-6 bg-[#0b0e11] border-t border-[#2b3139]">
      <div className="max-w-[1200px] mx-auto">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10 lg:gap-y-12">
          {/* Brand Column */}
          <div className="max-w-[260px]">
            <Link to="/" className="flex items-center gap-2.5 no-underline group">
              <span className="text-xl font-semibold text-[#c9a84c] tracking-tight transition-colors duration-300 group-hover:text-[#d4b86a]">
                Gold
                <span className="text-[#5a6270] transition-colors duration-300 group-hover:text-[#707a8a]">
                  PC
                </span>
              </span>
            </Link>
            <p className="text-sm text-[#5a6270] leading-relaxed mt-5">
              Премиальный магазин компьютерных компонентов с профессиональной сборкой и гарантией качества.
            </p>
          </div>

          {/* Catalog Column */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.14em] font-semibold text-[#929aa5] mb-5">
              Каталог
            </h4>
            <ul className="list-none p-0 m-0 flex flex-col gap-2">
              {catalogLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-[#5a6270] no-underline transition-colors duration-200 hover:text-[#c9a84c]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Service Column */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.14em] font-semibold text-[#929aa5] mb-5">
              Сервис
            </h4>
            <ul className="list-none p-0 m-0 flex flex-col gap-2">
              {serviceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-[#5a6270] no-underline transition-colors duration-200 hover:text-[#c9a84c]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacts Column */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.14em] font-semibold text-[#929aa5] mb-5">
              Контакты
            </h4>
            <ul className="list-none p-0 m-0 flex flex-col gap-2">
              {contactInfo.map((item, index) => (
                <li key={index}>
                  {item.type === 'address' ? (
                    <span className="text-sm text-[#5a6270]">{item.label}</span>
                  ) : (
                    <a
                      href={item.href}
                      className="text-sm text-[#5a6270] no-underline transition-colors duration-200 hover:text-[#c9a84c]"
                    >
                      {item.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-12 pt-6 border-t border-[#2b3139]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <span className="text-xs text-[#3d4450] tracking-wide">
              © {currentYear} GoldPC. Все права защищены.
            </span>

            {/* Social */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.icon}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-8 h-8 flex items-center justify-center bg-transparent border border-[#2a3040] text-[#5a6270] no-underline rounded transition-colors duration-200 hover:border-[#c9a84c] hover:text-[#c9a84c]"
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