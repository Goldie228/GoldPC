import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, User, Menu, X, LogOut, ShoppingBag, Heart } from 'lucide-react';
import { useCartTotalItems } from '../../../store/cartStore';
import { useWishlistCount } from '../../../store/wishlistStore';
import { useAuthStore } from '../../../store/authStore';
import { useAuthModalStore } from '../../../store/authModalStore';
import { MiniCart } from './MiniCart';
import { SearchDropdown } from './SearchDropdown';
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

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [cartFlash, setCartFlash] = useState(false);
  const cartCount = useCartTotalItems();
  const wishlistCount = useWishlistCount();
  const prevCartCountRef = useRef(cartCount);
  const { isAuthenticated, user, logout } = useAuthStore();
  const { openLoginModal, openRegisterModal } = useAuthModalStore();
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Flash cart icon when items are added
  useEffect(() => {
    if (cartCount > prevCartCountRef.current) {
      setCartFlash(true);
      const timer = setTimeout(() => setCartFlash(false), 400);
      return () => clearTimeout(timer);
    }
    prevCartCountRef.current = cartCount;
  }, [cartCount]);

  const handleCartToggle = () => {
    setIsCartOpen((prev) => !prev);
  };

  const handleCartClose = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  const handleMenuToggle = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const handleCloseMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const handleProfileDropdownToggle = () => {
    setIsProfileDropdownOpen((prev) => !prev);
  };

  const handleProfileDropdownClose = useCallback(() => {
    setIsProfileDropdownOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    handleProfileDropdownClose();
  }, [logout]);

  // Close profile dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        handleProfileDropdownClose();
      }
    };

    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen, handleProfileDropdownClose]);

  // Close profile dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isProfileDropdownOpen) {
        handleProfileDropdownClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isProfileDropdownOpen, handleProfileDropdownClose]);

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
          {/* Search Dropdown */}
          <SearchDropdown />

          {/* Wishlist Button */}
          <Link
            to="/wishlist"
            className={styles.iconBtn}
            aria-label={`Избранное: ${wishlistCount} товаров`}
            title="Избранное"
          >
            <Heart />
            {wishlistCount > 0 && <span className={styles.cartBadge}>{wishlistCount}</span>}
          </Link>

          {/* Cart Button */}
          <motion.button
            className={styles.iconBtn}
            aria-label={`Корзина: ${cartCount} товаров`}
            onClick={handleCartToggle}
            type="button"
            animate={cartFlash ? {
              scale: [1, 1.2, 1],
              color: ['#a1a1aa', '#d4a574', '#a1a1aa']
            } : {}}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <ShoppingCart />
            {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
          </motion.button>

          {/* Profile Button / Auth Dropdown */}
          <div className={styles.profileWrapper} ref={profileDropdownRef}>
            <button
              className={styles.iconBtn}
              aria-label={isAuthenticated ? 'Профиль' : 'Войти'}
              onClick={handleProfileDropdownToggle}
              aria-expanded={isProfileDropdownOpen}
              type="button"
            >
              <User />
            </button>

            {/* Profile Dropdown */}
            {isProfileDropdownOpen && (
              <div className={styles.profileDropdown}>
                {!isAuthenticated ? (
                  // Not authenticated: Show Login and Register
                  <div className={styles.authButtons}>
                    <button
                      className={styles.authBtn}
                      onClick={() => {
                        openLoginModal();
                        handleProfileDropdownClose();
                      }}
                      type="button"
                    >
                      Войти
                    </button>
                    <button
                      className={`${styles.authBtn} ${styles.authBtnPrimary}`}
                      onClick={() => {
                        openRegisterModal();
                        handleProfileDropdownClose();
                      }}
                      type="button"
                    >
                      Регистрация
                    </button>
                  </div>
                ) : (
                  // Authenticated: Show user menu
                  <>
                    <div className={styles.profileHeader}>
                      <div className={styles.profileAvatar}>
                        {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </div>
                      <div className={styles.profileInfo}>
                        <span className={styles.profileName}>
                          {user?.firstName} {user?.lastName}
                        </span>
                        <span className={styles.profileEmail}>{user?.email}</span>
                      </div>
                    </div>
                    <div className={styles.profileDivider} />
                    <nav className={styles.profileNav}>
                      <Link
                        to="/account"
                        className={styles.profileNavLink}
                        onClick={handleProfileDropdownClose}
                      >
                        <User />
                        <span>Профиль</span>
                      </Link>
                      <Link
                        to="/account/orders"
                        className={styles.profileNavLink}
                        onClick={handleProfileDropdownClose}
                      >
                        <ShoppingBag />
                        <span>Заказы</span>
                      </Link>
                      <Link
                        to="/account/wishlist"
                        className={styles.profileNavLink}
                        onClick={handleProfileDropdownClose}
                      >
                        <Heart />
                        <span>Избранное</span>
                      </Link>
                    </nav>
                    <div className={styles.profileDivider} />
                    <button
                      className={styles.logoutBtn}
                      onClick={handleLogout}
                      type="button"
                    >
                      <LogOut />
                      <span>Выйти</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

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
          <Link to="/wishlist" className={styles.mobileActionBtn} onClick={handleCloseMenu}>
            <Heart />
            <span>Избранное</span>
            {wishlistCount > 0 && <span className={styles.mobileBadge}>{wishlistCount}</span>}
          </Link>
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

      {/* Mobile Overlay Background */}
      <div
        className={`${styles.overlay} ${isMobileMenuOpen ? styles.overlayVisible : ''}`}
        onClick={handleCloseMenu}
        aria-hidden="true"
      />

      {/* MiniCart Dropdown */}
      <MiniCart isOpen={isCartOpen} onClose={handleCartClose} />
    </>
  );
}
