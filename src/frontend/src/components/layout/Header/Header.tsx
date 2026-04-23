import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, User, Menu, X, LogOut, ShoppingBag, Heart, GitCompare, LayoutDashboard, Bell, Moon, Settings } from 'lucide-react';
import { useCartTotalItems } from '../../../store/cartStore';
import { useWishlistCount } from '../../../store/wishlistStore';
import { useComparisonCount } from '../../../store/comparisonStore';
import { useAuthStore } from '../../../store/authStore';
import { useAuthModalStore } from '../../../store/authModalStore';
import { MiniCart } from './MiniCart';
import { SearchDropdown } from './SearchDropdown';
import { formatCountRu, RU_FORMS } from '../../../utils/pluralizeRu';
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
  const comparisonCount = useComparisonCount();
  const prevCartCountRef = useRef(cartCount);
  const { user, logout, currentRole, switchRole } = useAuthStore();
  const isAuthenticated = !!user;
  const { openLoginModal, openRegisterModal } = useAuthModalStore();
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileDrawerRef = useRef<HTMLDivElement>(null);

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
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
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

  // Фокус при открытии мобильного меню, ловушка Tab, возврат фокуса на кнопку при закрытии
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const container = mobileDrawerRef.current;
    if (!container) return;

    const getFocusable = (): HTMLElement[] => {
      const selector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
      return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => el.tabIndex !== -1 && !el.hasAttribute('disabled')
      );
    };

    const focusables = getFocusable();
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    const raf = requestAnimationFrame(() => {
      first?.focus();
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || focusables.length === 0) return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKeyDown, true);
      menuButtonRef.current?.focus();
    };
  }, [isMobileMenuOpen]);

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
            aria-label={`Избранное: ${formatCountRu(wishlistCount, RU_FORMS.tovar)}`}
            title="Избранное"
          >
            <Heart />
            {wishlistCount > 0 && <span className={styles.cartBadge}>{wishlistCount}</span>}
          </Link>

          {/* Comparison Button */}
          <Link
            to="/comparison"
            className={styles.iconBtn}
            aria-label={`Сравнение: ${formatCountRu(comparisonCount, RU_FORMS.tovar)}`}
            title="Сравнение"
          >
            <GitCompare />
            {comparisonCount > 0 && <span className={styles.cartBadge}>{comparisonCount}</span>}
          </Link>

          {/* Cart Button */}
          <motion.button
            className={styles.iconBtn}
            aria-label={`Корзина: ${formatCountRu(cartCount, RU_FORMS.tovar)}`}
            onClick={handleCartToggle}
            type="button"
            animate={cartFlash ? {
              scale: [1, 1.2, 1],
              color: ['var(--fg-muted)', 'var(--accent)', 'var(--fg-muted)']
            } : {}}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <ShoppingCart />
            {cartCount > 0 && (
              <span className={styles.cartBadge} aria-live="polite">
                {cartCount}
              </span>
            )}
          </motion.button>

          {/* Profile Button / Auth Dropdown */}
          <div className={styles.profileWrapper} ref={profileDropdownRef}>
            <button
              className={`${styles.iconBtn} ${isAuthenticated ? styles.iconBtnActive : ''}`}
              aria-label={isAuthenticated ? 'Профиль' : 'Войти'}
              onClick={handleProfileDropdownToggle}
              aria-expanded={isProfileDropdownOpen}
              type="button"
            >
              <User />
              {isAuthenticated && <span className={styles.authIndicator} />}
            </button>

            {/* Profile Dropdown */}
            {isProfileDropdownOpen && (
              <div className={styles.profileDropdown}>
                {!isAuthenticated ? (
                  // Not authenticated: Show Login and Register
                  <div className={styles.authButtons}>
                    <button
                      className={styles.authBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        openLoginModal();
                        handleProfileDropdownClose();
                      }}
                      type="button"
                    >
                      Войти
                    </button>
                    <button
                      className={`${styles.authBtn} ${styles.authBtnPrimary}`}
                      onClick={(e) => {
                        e.stopPropagation();
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

                    {/* Ролевой переключатель - показываем только если у пользователя больше одной роли */}
                    {user && (user.roles?.length > 1 || (user.role && user.roles === undefined)) && (
                      <div className={styles.roleSwitcher}>
                        <div className={styles.roleSwitcherLabel}>Текущая роль:</div>
                        <div className={styles.roleList}>
                          {(user.roles ?? [user.role]).map((role) => (
                            <button
                              key={role}
                              className={`${styles.roleOption} ${currentRole === role ? styles.roleOptionActive : ''}`}
                              onClick={() => {
                                switchRole(role);
                                // После переключения роли обновляем страницу без перезагрузки
                                window.dispatchEvent(new CustomEvent('roleChanged', { detail: role }));
                              }}
                              type="button"
                            >
                              {role}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className={styles.profileDivider} />
                    <nav className={styles.profileNav}>
                      <Link
                        to="/dashboard"
                        className={styles.profileNavLink}
                        onClick={handleProfileDropdownClose}
                      >
                        <LayoutDashboard />
                        <span>Панель управления</span>
                      </Link>
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
                        to="/notifications"
                        className={styles.profileNavLink}
                        onClick={handleProfileDropdownClose}
                      >
                        <Bell />
                        <span>Уведомления</span>
                      </Link>
                      <Link
                        to="/wishlist"
                        className={styles.profileNavLink}
                        onClick={handleProfileDropdownClose}
                      >
                        <Heart />
                        <span>Избранное</span>
                      </Link>
                      <button
                        className={styles.profileNavLink}
                        onClick={() => {
                          // Theme toggle will be implemented
                          // implemented here
                        }}
                        aria-label="Переключить тему"
                      >
                        <Moon />
                        <span>Тёмная тема</span>
                      </button>
                      <Link
                        to="/account/settings"
                        className={styles.profileNavLink}
                        onClick={handleProfileDropdownClose}
                      >
                        <Settings />
                        <span>Настройки</span>
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
            ref={menuButtonRef}
            className={styles.menuToggle}
            aria-label={isMobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
            type="button"
            onClick={handleMenuToggle}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Mobile Slide-out Menu Drawer */}
      <div
        ref={mobileDrawerRef}
        id="mobile-navigation-drawer"
        className={`${styles.mobileDrawer} ${isMobileMenuOpen ? styles.mobileDrawerOpen : ''}`}
        aria-hidden={!isMobileMenuOpen}
        inert={!isMobileMenuOpen ? true : undefined}
        role="dialog"
        aria-modal="true"
        aria-label="Мобильная навигация"
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
          <Link to="/comparison" className={styles.mobileActionBtn} onClick={handleCloseMenu}>
            <GitCompare />
            <span>Сравнение</span>
            {comparisonCount > 0 && <span className={styles.mobileBadge}>{comparisonCount}</span>}
          </Link>
          <Link to="/cart" className={styles.mobileActionBtn} onClick={handleCloseMenu}>
            <ShoppingCart />
            <span>Корзина</span>
            {cartCount > 0 && (
              <span className={styles.mobileBadge} aria-live="polite">
                {cartCount}
              </span>
            )}
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
