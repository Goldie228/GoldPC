import { Link } from 'react-router-dom';
import './Footer.css';

/**
 * Footer Component - Dark Gold Theme
 * 
 * Features:
 * - Dark background with gold accents
 * - Multiple columns: Logo, Catalog, Services, Contacts
 * - Social media links
 * - Copyright notice
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__grid">
          {/* Brand Column */}
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              <div className="footer__logo-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <span>Gold<span className="footer__logo-accent">PC</span></span>
            </Link>
            <p className="footer__description">
              Компьютерный магазин с профессиональным сервисом. 
              Собираем ПК мечты с гарантией совместимости.
            </p>
          </div>

          {/* Catalog Column */}
          <div className="footer__column">
            <h4 className="footer__column-title">Каталог</h4>
            <nav className="footer__links">
              <Link to="/catalog?category=cpu" className="footer__link">Процессоры</Link>
              <Link to="/catalog?category=gpu" className="footer__link">Видеокарты</Link>
              <Link to="/catalog?category=motherboard" className="footer__link">Материнские платы</Link>
              <Link to="/catalog?category=ram" className="footer__link">Память</Link>
              <Link to="/catalog?category=storage" className="footer__link">Накопители</Link>
              <Link to="/catalog?category=psu" className="footer__link">Блоки питания</Link>
            </nav>
          </div>

          {/* Services Column */}
          <div className="footer__column">
            <h4 className="footer__column-title">Услуги</h4>
            <nav className="footer__links">
              <Link to="/builder" className="footer__link">Конструктор ПК</Link>
              <Link to="/services/assembly" className="footer__link">Сборка ПК</Link>
              <Link to="/services/repair" className="footer__link">Ремонт</Link>
              <Link to="/services/diagnostics" className="footer__link">Диагностика</Link>
              <Link to="/services/upgrade" className="footer__link">Апгрейд</Link>
            </nav>
          </div>

          {/* Contacts Column */}
          <div className="footer__column">
            <h4 className="footer__column-title">Контакты</h4>
            <div className="footer__contacts">
              <div className="footer__contact-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span>+375 (29) 123-45-67</span>
              </div>
              <div className="footer__contact-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span>info@goldpc.by</span>
              </div>
              <div className="footer__contact-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>Минск, ул. Примерная, 1</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="footer__bottom">
          <p className="footer__copyright">
            © {currentYear} GoldPC. Все права защищены.
          </p>
          <div className="footer__socials">
            <a href="https://t.me/goldpc" className="footer__social" aria-label="Telegram" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.121.1.154.234.169.327.015.093.034.304.019.469z" />
              </svg>
            </a>
            <a href="https://instagram.com/goldpc" className="footer__social" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a href="https://vk.com/goldpc" className="footer__social" aria-label="VK" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.02-1.304.587-1.496c.596-.19 1.358 1.259 2.168 1.815.613.42 1.078.328 1.078.328l2.165-.03s1.132-.07.595-.96c-.044-.073-.314-.663-1.616-1.877-1.363-1.27-1.18-1.064.461-3.262.998-1.336 1.397-2.152 1.272-2.5-.119-.329-.856-.242-.856-.242l-2.437.015s-.18-.025-.314.056c-.13.079-.214.262-.214.262s-.383 1.02-.893 1.888c-1.076 1.829-1.506 1.926-1.682 1.812-.409-.265-.307-1.065-.307-1.633 0-1.777.269-2.518-.526-2.71-.264-.064-.458-.107-1.134-.113-.867-.009-1.602.003-2.016.207-.276.136-.49.439-.36.456.16.021.524.099.716.362.248.339.24 1.1.24 1.1s.142 2.1-.332 2.361c-.326.178-.772-.185-1.73-1.844-.49-.849-.86-1.788-.86-1.788s-.072-.176-.2-.27c-.154-.114-.37-.15-.37-.15l-2.316.015s-.348.01-.476.161c-.114.135-.009.414-.009.414s1.814 4.251 3.866 6.395c1.883 1.964 4.023 1.835 4.023 1.835h.971z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}