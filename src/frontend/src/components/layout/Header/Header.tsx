import { useState, useEffect, useCallback } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X } from 'lucide-react';
import styles from './Header.module.css';

/**
 * Header Component
 *
 * Features:
 * - Fixed positioning with blur backdrop
 * - Logo "GoldPC" with gold accent on "PC"
 * - Navigation links (Catalog, Builder, Service, About)
 * - Action buttons (Search, Cart, Profile)
 * - Mobile slide-out menu drawer (dark background)
 * - Responsive padding adaptation
 *
 * Source: prototypes/home.html .header
 */

interface HeaderProps {
  cartCount?: number;
}

export function Header({ cartCount = 0 }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const handleCloseMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        handleCloseMenu();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen, handleCloseMenu]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { to: '/catalog', label: 'Каталог' },
    { to: '/pc-builder', label: 'Конструктор' },
    { to: '/services', label: 'Сервис' },
    { to: '/about', label: 'О нас' },
  ];

  return (
    <>
      <header className={styles.header}>
        {/* Logo */}
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

        {/* Desktop Navigation */}
        <nav className={styles.nav}>
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className={styles.actions}>
          {/* Search Button */}
          <button className={styles.iconBtn} aria-label="Поиск" type="button">
            <Search />
          </button>

          {/* Cart Button */}
          <Link to="/cart" className={styles.iconBtn} aria-label={`Корзина: ${cartCount} товаров`}>
            <ShoppingCart />
            {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
          </Link>

          {/* Profile Button */}
          <Link to="/account" className={styles.iconBtn} aria-label="Профиль">
            <User />
          </Link>

          {/* Mobile Menu Toggle - Hamburger Button */}
          <button
            className={styles.menuToggle}
            aria-label={isMobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={isMobileMenuOpen}
            type="button"
            onClick={handleMenuToggle}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Mobile Slide-out Menu Drawer */}
      <div
        className={`${styles.mobileDrawer} ${isMobileMenuOpen ? styles.mobileDrawerOpen : ''}`}
        aria-hidden={!isMobileMenuOpen}
      >
        {/* Close Button */}
        <button
          className={styles.drawerClose}
          onClick={handleCloseMenu}
          aria-label="Закрыть меню"
          type="button"
        >
          <X />
        </button>

        {/* Mobile Navigation Links */}
        <nav className={styles.mobileNav}>
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `${styles.mobileNavLink} ${isActive ? styles.mobileNavLinkActive : ''}`
              }
              onClick={handleCloseMenu}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Mobile Actions */}
        <div className={styles.mobileActions}>
          <Link to="/cart" className={styles.mobileActionBtn} onClick={handleCloseMenu}>
            <ShoppingCart />
            <span>Корзина</span>
            {cartCount > 0 && <span className={styles.mobileBadge}>{cartCount}</span>}
          </Link>
          <Link to="/account" className={styles.mobileActionBtn} onClick={handleCloseMenu}>
            <User />
            <span>Профиль</span>
          </Link>
        </div>
      </div>

      {/* Overlay Background */}
      <div
        className={`${styles.overlay} ${isMobileMenuOpen ? styles.overlayVisible : ''}`}
        onClick={handleCloseMenu}
        aria-hidden="true"
      />
    </>
  );
}
