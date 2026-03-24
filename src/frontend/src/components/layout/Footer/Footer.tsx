import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

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
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Brand Column */}
          <div className={styles.brand}>
            <Link to="/" className={styles.logo}>
              <div className={styles.logoIcon}>
                <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M29,3H3C2.4,3,2,3.4,2,4v19c0,0.6,0.4,1,1,1h26c0.6,0,1-0.4,1-1V4C30,3.4,29.6,3,29,3z M18,21h-4c-0.6,0-1-0.4-1-1s0.4-1,1-1h4c0.6,0,1,0.4,1,1S18.6,21,18,21z"
                    fill="currentColor"
                  />
                  <path
                    d="M18,21h-4c-0.6,0-1-0.4-1-1s0.4-1,1-1h4c0.6,0,1,0.4,1,1S18.6,21,18,21z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M20.7,26.3C20.5,26.1,20.3,26,20,26h-8c-0.3,0-0.5,0.1-0.7,0.3l-2,2C9,28.6,8.9,29,9.1,29.4C9.2,29.8,9.6,30,10,30h12c0.4,0,0.8-0.2,0.9-0.6c0.2-0.4,0.1-0.8-0.2-1.1L20.7,26.3z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <span className={styles.logoText}>
                Gold<span className={styles.logoAccent}>PC</span>
              </span>
            </Link>
            <p className={styles.description}>
              Премиальный магазин компьютерных компонентов с профессиональной сборкой и гарантией качества.
            </p>
          </div>

          {/* Catalog Column */}
          <div>
            <h4 className={styles.title}>Каталог</h4>
            <ul className={styles.links}>
              <li><Link to="/catalog?category=cpu" className={styles.link}>Процессоры</Link></li>
              <li><Link to="/catalog?category=gpu" className={styles.link}>Видеокарты</Link></li>
              <li><Link to="/catalog?category=motherboard" className={styles.link}>Материнские платы</Link></li>
              <li><Link to="/catalog?category=ram" className={styles.link}>Память</Link></li>
              <li><Link to="/catalog?category=storage" className={styles.link}>Накопители</Link></li>
            </ul>
          </div>

          {/* Service Column */}
          <div>
            <h4 className={styles.title}>Сервис</h4>
            <ul className={styles.links}>
              <li><Link to="/pc-builder" className={styles.link}>Конструктор ПК</Link></li>
              <li><Link to="/services/assembly" className={styles.link}>Сборка</Link></li>
              <li><Link to="/delivery" className={styles.link}>Доставка</Link></li>
              <li><Link to="/payment" className={styles.link}>Оплата</Link></li>
              <li><Link to="/warranty" className={styles.link}>Гарантия</Link></li>
              <li><Link to="/returns" className={styles.link}>Возврат</Link></li>
              <li><Link to="/faq" className={styles.link}>FAQ</Link></li>
            </ul>
          </div>

          {/* Contacts Column */}
          <div>
            <h4 className={styles.title}>Контакты</h4>
            <ul className={styles.links}>
              <li><a href="tel:+375291234567" className={styles.link} aria-label="Позвонить нам">+375 (29) 123-45-67</a></li>
              <li><a href="mailto:hi@goldpc.by" className={styles.link} aria-label="Написать нам на email">hi@goldpc.by</a></li>
              <li><span className={styles.disabledLink} aria-label="Адрес магазина (скоро)">Минск, ул. Примерная, 1</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className={styles.bottom}>
          <span className={styles.copyright}>© {currentYear} GoldPC. Все права защищены.</span>
          <div className={styles.socialLinks}>
            <span className={styles.disabledSocialLink} aria-label="Telegram (скоро)">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
            </span>
            <span className={styles.disabledSocialLink} aria-label="Instagram (скоро)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}