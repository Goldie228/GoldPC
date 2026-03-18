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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
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
              <li><Link to="/builder" className={styles.link}>Конструктор ПК</Link></li>
              <li><Link to="/services/assembly" className={styles.link}>Сборка</Link></li>
              <li><Link to="/services/delivery" className={styles.link}>Доставка</Link></li>
              <li><Link to="/services/warranty" className={styles.link}>Гарантия</Link></li>
            </ul>
          </div>

          {/* Contacts Column */}
          <div>
            <h4 className={styles.title}>Контакты</h4>
            <ul className={styles.links}>
              <li><a href="tel:+375291234567" className={styles.link}>+375 (29) 123-45-67</a></li>
              <li><a href="mailto:hi@goldpc.by" className={styles.link}>hi@goldpc.by</a></li>
              <li><a href="#" className={styles.link}>Минск, ул. Примерная, 1</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className={styles.bottom}>
          <span className={styles.copyright}>{currentYear} GoldPC. All rights reserved.</span>
          <div className={styles.socialLinks}>
            <a href="#" className={styles.socialLink} aria-label="Telegram">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
            </a>
            <a href="#" className={styles.socialLink} aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}