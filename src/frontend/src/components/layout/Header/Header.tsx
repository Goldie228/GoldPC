import { useState, useRef, useEffect, useCallback, type ReactElement } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  User,
  Menu,
  X,
  LogOut,
  ShoppingBag,
  Heart,
  GitCompare,
  LayoutDashboard,
  Settings,
} from 'lucide-react';
import { useCart } from '../../../hooks/useCart';
import { useWishlistStore } from '../../../store/wishlistStore';
import { useComparisonStore } from '../../../store/comparisonStore';
import { useAuthStore } from '../../../store/authStore';
import { useModal } from '../../../hooks/useModal';
import { LoginModal } from '../../auth/LoginModal';
import { RegisterModal } from '../../auth/RegisterModal';
import { decodeHtmlEntities } from '../../../utils/decodeHtml';
import { CATEGORY_LABELS_RU } from '../../../utils/categoryLabels';
import styles from './Header.module.css';

const NAV_ITEMS = [
  { to: '/catalog', label: 'Каталог' },
  { to: '/pc-builder', label: 'Конструктор' },
  { to: '/services', label: 'Сервис' },
  { to: '/about', label: 'О нас' },
];

const RU_FORMS = ['роль', 'роли', 'ролей'] as const;

function formatCountRu(count: number, forms: readonly [string, string, string]): string {
  const abs = Math.abs(count) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return `${count} ${forms[2]}`;
  if (last === 1) return `${count} ${forms[0]}`;
  if (last >= 2 && last <= 4) return `${count} ${forms[1]}`;
  return `${count} ${forms[2]}`;
}

export function Header(): ReactElement {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [cartFlash, setCartFlash] = useState(false);
  const prevCartCountRef = useRef(0);

  const { itemCount: cartCount } = useCart();
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const comparisonCount = useComparisonStore((s) => s.items.length);
  const { isAuthenticated, user, logout, currentRole, switchRole } = useAuthStore();
  const { openModal, closeModal } = useModal();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const openLoginModal = () => setIsLoginModalOpen(true);
  const openRegisterModal = () => setIsRegisterModalOpen(true);

  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const mobileDrawerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Cart flash animation
  useEffect(() => {
    if (cartCount > prevCartCountRef.current) {
      setCartFlash(true);
      const timer = setTimeout(() => setCartFlash(false), 400);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  useEffect(() => {
    prevCartCountRef.current = cartCount;
  }, [cartCount]);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!isProfileDropdownOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isProfileDropdownOpen]);

  // Keyboard navigation for profile dropdown
  useEffect(() => {
    if (!isProfileDropdownOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsProfileDropdownOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isProfileDropdownOpen]);

  // Mobile menu keyboard navigation
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const container = mobileDrawerRef.current;
    if (!container) return;

    document.body.style.overflow = 'hidden';

    const getFocusable = (): HTMLElement[] => {
      const selector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
      return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => el.tabIndex !== -1 && !el.hasAttribute('disabled')
      );
    };

    requestAnimationFrame(() => {
      const focusablesList = getFocusable();
      focusablesList[0]?.focus();
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusablesList = getFocusable();
      if (focusablesList.length === 0) return;
      const first = focusablesList[0];
      const last = focusablesList[focusablesList.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeyDown, true);
      menuButtonRef.current?.focus();
    };
  }, [isMobileMenuOpen]);

  const handleProfileDropdownToggle = () => {
    setIsProfileDropdownOpen((prev) => !prev);
  };

  const handleProfileDropdownClose = () => {
    setIsProfileDropdownOpen(false);
  };

  const handleLogout = () => {
    logout();
    handleProfileDropdownClose();
    setIsMobileMenuOpen(false);
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const handleCloseMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className={styles.header}>
        {/* Logo */}
        <Link to="/" className={styles.logo}>
          <svg className={styles.logoIcon} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect width="32" height="32" rx="6" fill="var(--accent)" />
            <path
              d="M8,12h16v2H8z M8,15h16v2H8z M8,18h12v2H8z"
              fill="var(--bg)"
            />
          </svg>
          <span className={styles.logoText}>GoldPC</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Actions */}
        <div className={styles.actions}>
          <Link to="/catalog" className={`${styles.iconBtn} ${cartFlash ? styles.iconBtnFlash : ''}`} aria-label="Корзина">
            <ShoppingCart />
            {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
          </Link>

          <Link to="/wishlist" className={styles.iconBtn} aria-label="Избранное">
            <Heart />
            {wishlistCount > 0 && <span className={styles.cartBadge}>{wishlistCount}</span>}
          </Link>

          <Link to="/comparison" className={styles.iconBtn} aria-label="Сравнение">
            <GitCompare />
            {comparisonCount > 0 && <span className={styles.cartBadge}>{comparisonCount}</span>}
          </Link>

          {/* Profile / Auth */}
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
                  <>
                    <div className={styles.profileHeader}>
                      <div className={styles.profileAvatar}>
                        {((decodeHtmlEntities(user?.firstName) ?? '') || (decodeHtmlEntities(user?.email) ?? ''))?.charAt(0) || 'U'}
                      </div>
                      <div className={styles.profileInfo}>
                        <span className={styles.profileName}>
                          {(decodeHtmlEntities(user?.firstName) ?? '')} {(decodeHtmlEntities(user?.lastName) ?? '')}
                        </span>
                        <span className={styles.profileEmail}>{(decodeHtmlEntities(user?.email) ?? '')}</span>
                      </div>
                    </div>

                    {user && ((user.roles ?? []).length > 1 || (user.role && user.roles === undefined)) && (
                      <div className={styles.roleSwitcher}>
                        <div className={styles.roleSwitcherLabel}>Текущая роль:</div>
                        <div className={styles.roleList}>
                          {(user.roles ?? [user.role]).map((role) => (
                            <button
                              key={role}
                              className={`${styles.roleOption} ${currentRole === role ? styles.roleOptionActive : ''}`}
                              onClick={() => {
                                switchRole(role);
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
                      <Link to="/dashboard" className={styles.profileNavLink} onClick={handleProfileDropdownClose}>
                        <LayoutDashboard />
                        <span>Панель управления</span>
                      </Link>
                      <Link to="/account" className={styles.profileNavLink} onClick={handleProfileDropdownClose}>
                        <User />
                        <span>Профиль</span>
                      </Link>
                      <Link to="/account/orders" className={styles.profileNavLink} onClick={handleProfileDropdownClose}>
                        <ShoppingBag />
                        <span>Заказы</span>
                      </Link>
                      <Link to="/wishlist" className={styles.profileNavLink} onClick={handleProfileDropdownClose}>
                        <Heart />
                        <span>Избранное</span>
                      </Link>
                      <Link to="/account/settings" className={styles.profileNavLink} onClick={handleProfileDropdownClose}>
                        <Settings />
                        <span>Настройки</span>
                      </Link>
                    </nav>

                    <div className={styles.profileDivider} />
                    <button className={styles.logoutBtn} onClick={handleLogout} type="button">
                      <LogOut />
                      <span>Выйти</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            ref={menuButtonRef}
            className={styles.mobileToggle}
            onClick={handleMobileMenuToggle}
            aria-label={isMobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={isMobileMenuOpen}
            type="button"
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <div className={styles.mobileOverlay} onClick={handleCloseMenu} />
            <motion.div
              ref={mobileDrawerRef}
              className={styles.mobileDrawer}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label="Мобильное меню"
            >
              <div className={styles.mobileHeader}>
                <span className={styles.mobileTitle}>Меню</span>
                <button className={styles.mobileClose} onClick={handleCloseMenu} type="button" aria-label="Закрыть">
                  <X size={20} />
                </button>
              </div>

              <nav className={styles.mobileNav}>
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={styles.mobileNavLink}
                    onClick={handleCloseMenu}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div className={styles.mobileDivider} />

              <Link to="/catalog" className={styles.mobileActionBtn} onClick={handleCloseMenu}>
                <ShoppingCart size={18} />
                <span>Корзина</span>
                {cartCount > 0 && <span className={styles.mobileBadge}>{cartCount}</span>}
              </Link>
              <Link to="/wishlist" className={styles.mobileActionBtn} onClick={handleCloseMenu}>
                <Heart size={18} />
                <span>Избранное</span>
                {wishlistCount > 0 && <span className={styles.mobileBadge}>{wishlistCount}</span>}
              </Link>
              <Link to="/comparison" className={styles.mobileActionBtn} onClick={handleCloseMenu}>
                <GitCompare size={18} />
                <span>Сравнение</span>
                {comparisonCount > 0 && <span className={styles.mobileBadge}>{comparisonCount}</span>}
              </Link>

              {isAuthenticated ? (
                <>
                  <div className={styles.mobileDivider} />
                  <div className={styles.mobileProfileInfo}>
                    <div className={styles.profileAvatar}>
                      {((decodeHtmlEntities(user?.firstName) ?? '') || (decodeHtmlEntities(user?.email) ?? ''))?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className={styles.profileName}>
                        {(decodeHtmlEntities(user?.firstName) ?? '')} {(decodeHtmlEntities(user?.lastName) ?? '')}
                      </div>
                      <div className={styles.profileEmail}>{(decodeHtmlEntities(user?.email) ?? '')}</div>
                    </div>
                  </div>
                  <Link to="/dashboard" className={styles.mobileActionBtn} onClick={handleCloseMenu}>
                    <LayoutDashboard size={18} />
                    <span>Панель управления</span>
                  </Link>
                  <Link to="/account" className={styles.mobileActionBtn} onClick={handleCloseMenu}>
                    <User size={18} />
                    <span>Профиль</span>
                  </Link>
                  <Link to="/account/orders" className={styles.mobileActionBtn} onClick={handleCloseMenu}>
                    <ShoppingBag size={18} />
                    <span>Заказы</span>
                  </Link>
                  <Link to="/account/settings" className={styles.mobileActionBtn} onClick={handleCloseMenu}>
                    <Settings size={18} />
                    <span>Настройки</span>
                  </Link>
                  <button className={styles.mobileLogoutBtn} onClick={handleLogout} type="button">
                    <LogOut size={18} />
                    <span>Выйти</span>
                  </button>
                </>
              ) : (
                <>
                  <div className={styles.mobileDivider} />
                  <button
                    className={styles.mobileActionBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      openLoginModal();
                      handleCloseMenu();
                    }}
                    type="button"
                  >
                    <User size={18} />
                    <span>Войти</span>
                  </button>
                  <button
                    className={`${styles.mobileActionBtn} ${styles.mobileActionBtnPrimary}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      openRegisterModal();
                      handleCloseMenu();
                    }}
                    type="button"
                  >
                    <span>Регистрация</span>
                  </button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginModalOpen(false);
          setIsRegisterModalOpen(true);
        }}
      />
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
    </>
  );
}
