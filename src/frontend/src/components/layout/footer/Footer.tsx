import { Link } from 'react-router-dom';
import { Instagram } from 'lucide-react';

/**
 * Footer Component
 * 
 * Based on prototypes/home.html .footer structure
 * Features:
 * - Grid layout: Logo + Description, Links columns (Catalog, Service, Contacts)
 * - Social links with icons
 * - Copyright text
 * - Dark background styles
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-16 px-6 bg-[#0b0e11] border-t border-[#2b3139]">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-8 md:gap-12 mb-12">
          {/* Brand Column */}
          <div className="max-w-[300px]">
            <Link to="/" className="flex items-center gap-2.5 no-underline">
              <span className="text-xl font-bold text-[#fcd535] tracking-tight">Gold<span className="text-[#eaecef]">PC</span></span>
            </Link>
            <p className="text-sm text-[#707a8a] leading-relaxed mt-4 max-w-[300px]">
              Премиальный магазин компьютерных компонентов с профессиональной сборкой и гарантией качества.
            </p>
          </div>

          {/* Catalog Column */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-5 text-[#707a8a]">Каталог</h4>
            <ul className="list-none p-0 m-0 flex flex-col gap-3">
              <li><Link to="/catalog?category=cpu" className="text-sm text-[#eaecef] no-underline transition-colors hover:text-[#fcd535]">Процессоры</Link></li>
              <li><Link to="/catalog?category=gpu" className="text-sm text-[#eaecef] no-underline transition-colors hover:text-[#fcd535]">Видеокарты</Link></li>
              <li><Link to="/catalog?category=motherboard" className="text-sm text-[#eaecef] no-underline transition-colors hover:text-[#fcd535]">Мат. платы</Link></li>
              <li><Link to="/catalog?category=ram" className="text-sm text-[#eaecef] no-underline transition-colors hover:text-[#fcd535]">Память</Link></li>
              <li><Link to="/catalog?category=storage" className="text-sm text-[#eaecef] no-underline transition-colors hover:text-[#fcd535]">Накопители</Link></li>
              <li><Link to="/catalog?category=psu" className="text-sm text-[#eaecef] no-underline transition-colors hover:text-[#fcd535]">Блоки питания</Link></li>
              <li><Link to="/catalog?category=case" className="text-sm text-[#eaecef] no-underline transition-colors hover:text-[#fcd535]">Корпуса</Link></li>
              <li><Link to="/catalog?category=cooling" className="text-sm text-[#eaecef] no-underline transition-colors hover:text-[#fcd535]">Охлаждение</Link></li>
              <li><Link to="/catalog?category=monitor" className="text-sm text-[#eaecef] no-underline transition-colors hover:text-[#fcd535]">Мониторы</Link></li>
              <li><Link to="/catalog?category=keyboard" className="text-sm text-[#eaecef] no-underline transition-colors hover:text-[#fcd535]">Клавиатуры</Link></li>
              <li><Link to="/catalog?category=mouse" className="text-sm text-[#eaecef] no-underline transition-colors hover:text-[#fcd535]">Мыши</Link></li>
              <li><Link to="/catalog?category=headphones" className="text-sm text-[#eaecef] no-underline transition-colors hover:text-[#fcd535]">Наушники</Link></li>
            </ul>
          </div>

          {/* Service Column */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-5 text-[#707a8a]">Сервис</h4>
            <ul className="list-none p-0 m-0 flex flex-col gap-3">
              <li><Link to="/pc-builder" className="text-sm text-[#eaecef] no-underline transition-colors hover:text-[#fcd535]">Конструктор ПК</Link></li>
              <li><Link to="/services/assembly" className="text-sm text-[#eaecef] no-underline transition-colors hover:text-[#fcd535]">Сборка и настройка</Link></li>
              <li><Link to="/delivery" className="text-sm text-[#eaecef] no-underline transition-colors hover:text-[#fcd535]">Доставка по РБ</Link></li>
              <li><Link to="/payment" className="text-sm text-[#eaecef] no-underline transition-colors hover:text-[#fcd535]">Оплата и рассрочка</Link></li>
              <li><Link to="/warranty" className="text-sm text-[#eaecef] no-underline transition-colors hover:text-[#fcd535]">Гарантийное обслуживание</Link></li>
              <li><Link to="/faq" className="text-sm text-[#eaecef] no-underline transition-colors hover:text-[#fcd535]">Частые вопросы</Link></li>
            </ul>
          </div>

          {/* Contacts Column */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-5 text-[#707a8a]">Контакты</h4>
            <ul className="list-none p-0 m-0 flex flex-col gap-3">
              <li><a href="tel:+375333149283" className="text-sm text-[#eaecef] no-underline transition-colors hover:text-[#fcd535]" aria-label="Позвонить нам">+375 (33) 314-92-83</a></li>
              <li><a href="mailto:goldpc.team@gmail.com" className="text-sm text-[#eaecef] no-underline transition-colors hover:text-[#fcd535]" aria-label="Написать нам на email">goldpc.team@gmail.com</a></li>
              <li><span className="text-sm text-[#eaecef]" aria-label="Адрес магазина">Минск, Улица Казимировская 21</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-5 pt-10 border-t border-[#2b3139]">
          <span className="text-sm text-[#707a8a] leading-relaxed">© {currentYear} GoldPC. Все права защищены.</span>
          <div className="flex gap-2">
            <span className="w-9 h-9 flex items-center justify-center bg-transparent border border-[#2b3139] text-[#707a8a] cursor-not-allowed opacity-50" aria-label="Telegram (скоро)">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
            </span>
            <span className="w-9 h-9 flex items-center justify-center bg-transparent border border-[#2b3139] text-[#707a8a] cursor-not-allowed opacity-50" aria-label="Instagram (скоро)">
              <Instagram />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}