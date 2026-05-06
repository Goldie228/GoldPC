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
import { useWishlist } from '../../../hooks/useWishlist';
import { useComparison } from '../../../hooks/useComparison';
import { useAuth } from '../../../hooks/useAuth';
import { useModal } from '../../../hooks/useModal';
import { LoginModal } from '../../auth/LoginModal';
import { RegisterModal } from '../../auth/RegisterModal';
import { decodeHtmlEntities } from '../../../utils/decodeHtml';
import { CATEGORY_LABELS_RU } from '../../../utils/categoryLabels';

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
  const { items: wishlistItems } = useWishlist();
  const { items: comparisonItems } = useComparison();
  const { isAuthenticated, user, logout } = useAuth();
  const { openModal, closeModal } = useModal();

  const wishlistCount = wishlistItems.length;
  const comparisonCount = comparisonItems.length;

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

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);
    if (newState) {
      setIsProfileDropdownOpen(false);
    }
  };

  const handleCloseMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-[100] bg-[#0b0e11] border-b border-[#2b3139] flex items-center justify-between px-6 h-16 gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 text-decoration-none flex-shrink-0">
            <span className="text-xl font-bold text-gold tracking-tight">Gold<span className="text-body-text">PC</span></span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                 `px-4 py-2 text-sm font-medium rounded-lg transition-colors no-underline ${
                   isActive
                     ? 'text-gold bg-gold/10'
                     : 'text-muted-text hover:bg-surface-elevated hover:text-body-text'
                 }`
               }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Link to="/catalog" className={`relative w-10 h-10 flex items-center justify-center bg-transparent border border-transparent rounded-xl text-muted-text cursor-pointer transition-all hover:border-gold/30 hover:text-body-text hover:bg-surface-elevated ${cartFlash ? 'animate-pulse' : ''}`} aria-label="Корзина">
            <ShoppingCart />
            {cartCount > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 flex items-center justify-center bg-gold text-gold-ink text-[9px] font-bold rounded-md">{cartCount}</span>}
          </Link>

          <Link to="/wishlist" className="relative w-10 h-10 flex items-center justify-center bg-transparent border border-transparent rounded-xl text-muted-text cursor-pointer transition-all hover:border-gold/30 hover:text-body-text hover:bg-surface-elevated" aria-label="Избранное">
            <Heart />
            {wishlistCount > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 flex items-center justify-center bg-gold text-gold-ink text-[9px] font-bold rounded-md">{wishlistCount}</span>}
          </Link>

          <Link to="/comparison" className="relative w-10 h-10 flex items-center justify-center bg-transparent border border-transparent rounded-xl text-muted-text cursor-pointer transition-all hover:border-gold/30 hover:text-body-text hover:bg-surface-elevated" aria-label="Сравнение">
            <GitCompare />
            {comparisonCount > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 flex items-center justify-center bg-gold text-gold-ink text-[9px] font-bold rounded-md">{comparisonCount}</span>}
          </Link>

          {/* Profile / Auth */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              className={`relative w-10 h-10 flex items-center justify-center bg-transparent border rounded-xl text-muted-text cursor-pointer transition-all hover:border-gold/30 hover:text-body-text hover:bg-surface-elevated ${isAuthenticated ? 'border-gold/30 text-gold' : 'border-transparent'}`}
              aria-label={isAuthenticated ? 'Профиль' : 'Войти'}
              onClick={handleProfileDropdownToggle}
              aria-expanded={isProfileDropdownOpen}
              type="button"
            >
              <User />
              {isAuthenticated && <span className="absolute bottom-0.5 right-0.5 w-2 h-2 bg-gold rounded-full border-2 border-surface-card" />}
            </button>

            {/* Profile Dropdown */}
            {isProfileDropdownOpen && (
                <div className="absolute top-[calc(100%+8px)] right-0 w-[300px] bg-surface-card border border-hairline-dark rounded-xl shadow-xl z-[200] overflow-hidden">
                {!isAuthenticated ? (
                    <div className="flex flex-col gap-2 p-4">
                      <button
                       className="w-full px-4 py-2.5 bg-transparent border border-hairline-dark rounded-lg text-body-text text-sm font-medium cursor-pointer transition-colors hover:border-gold/40 hover:bg-gold/5"
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
                       className="w-full px-4 py-2.5 bg-gold text-gold-ink border-gold rounded-lg text-sm font-medium cursor-pointer transition-colors hover:bg-gold-active"
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
                    <div className="flex items-center gap-3 p-4 bg-surface-elevated rounded-t-xl">
                      <div className="w-11 h-11 bg-gold rounded-full flex items-center justify-center text-gold-ink font-semibold text-lg uppercase flex-shrink-0">
                        {((decodeHtmlEntities(user?.firstName) ?? '') || (decodeHtmlEntities(user?.email) ?? ''))?.charAt(0) || 'U'}
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm font-semibold text-body-text whitespace-nowrap overflow-hidden text-overflow-ellipsis">
                          {(decodeHtmlEntities(user?.firstName) ?? '')} {(decodeHtmlEntities(user?.lastName) ?? '')}
                        </span>
                        <span className="text-sm text-muted-text whitespace-nowrap overflow-hidden text-overflow-ellipsis max-w-[200px]">{(decodeHtmlEntities(user?.email) ?? '')}</span>
                      </div>
                    </div>

<nav className="flex flex-col py-2">
                      <Link to="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-text no-underline transition-colors hover:bg-surface-elevated hover:text-body-text" onClick={handleProfileDropdownClose}>
                        <LayoutDashboard />
                        <span>Панель управления</span>
                      </Link>
                      <Link to="/account" className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-text no-underline transition-colors hover:bg-surface-elevated hover:text-body-text" onClick={handleProfileDropdownClose}>
                        <User />
                        <span>Профиль</span>
                      </Link>
                      <Link to="/account/orders" className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-text no-underline transition-colors hover:bg-surface-elevated hover:text-body-text" onClick={handleProfileDropdownClose}>
                        <ShoppingBag />
                        <span>Заказы</span>
                      </Link>
                      <Link to="/wishlist" className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-text no-underline transition-colors hover:bg-surface-elevated hover:text-body-text" onClick={handleProfileDropdownClose}>
                        <Heart />
                        <span>Избранное</span>
                      </Link>
                      <Link to="/account/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-text no-underline transition-colors hover:bg-surface-elevated hover:text-body-text" onClick={handleProfileDropdownClose}>
                        <Settings />
                        <span>Настройки</span>
                      </Link>
                    </nav>
<button className="flex items-center gap-3 w-full px-4 py-3 bg-transparent border-t border-hairline-dark text-muted-text text-sm cursor-pointer transition-colors hover:text-red-500 hover:bg-red-50" onClick={handleLogout} type="button">
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
            className="md:hidden w-10 h-10 flex items-center justify-center bg-transparent border border-hairline-dark rounded-xl text-muted-text cursor-pointer ml-auto hover:border-gold/30 hover:text-body-text"
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
            <div className="fixed inset-0 bg-black/50 z-[190]" onClick={handleCloseMenu} />
            <motion.div
              ref={mobileDrawerRef}
              className="fixed top-16 right-0 w-[300px] bg-surface-card border-b border-hairline-dark shadow-xl z-[200] max-h-[calc(100vh-64px)] overflow-y-auto"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label="Мобильное меню"
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-hairline-dark">
                <span className="text-sm font-semibold text-body-text">Меню</span>
                <button className="w-8 h-8 flex items-center justify-center bg-transparent border-none text-muted-text cursor-pointer hover:text-body-text" onClick={handleCloseMenu} type="button" aria-label="Закрыть">
                  <X size={20} />
                </button>
              </div>

              <nav className="flex flex-col py-2">
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className="block px-5 py-3 text-sm text-muted-text no-underline transition-colors hover:bg-surface-elevated hover:text-body-text"
                    onClick={handleCloseMenu}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div className="h-px bg-hairline-dark my-2" />

              <Link to="/catalog" className="flex items-center gap-3 px-5 py-3.5 text-body-text no-underline text-sm border-b border-hairline-dark w-full text-left cursor-pointer bg-transparent font-sans transition-colors hover:bg-surface-elevated" onClick={handleCloseMenu}>
                <ShoppingCart size={18} />
                <span>Корзина</span>
                {cartCount > 0 && <span className="absolute top-2 right-4 min-w-5 h-5 px-1.5 flex items-center justify-center bg-gold text-gold-ink text-[11px] font-bold rounded-md">{cartCount}</span>}
              </Link>
              <Link to="/wishlist" className="flex items-center gap-3 px-5 py-3.5 text-body-text no-underline text-sm border-b border-hairline-dark w-full text-left cursor-pointer bg-transparent font-sans transition-colors hover:bg-surface-elevated" onClick={handleCloseMenu}>
                <Heart size={18} />
                <span>Избранное</span>
                {wishlistCount > 0 && <span className="absolute top-2 right-4 min-w-5 h-5 px-1.5 flex items-center justify-center bg-gold text-gold-ink text-[11px] font-bold rounded-md">{wishlistCount}</span>}
              </Link>
              <Link to="/comparison" className="flex items-center gap-3 px-5 py-3.5 text-body-text no-underline text-sm border-b border-hairline-dark w-full text-left cursor-pointer bg-transparent font-sans transition-colors hover:bg-surface-elevated" onClick={handleCloseMenu}>
                <GitCompare size={18} />
                <span>Сравнение</span>
                {comparisonCount > 0 && <span className="absolute top-2 right-4 min-w-5 h-5 px-1.5 flex items-center justify-center bg-gold text-gold-ink text-[11px] font-bold rounded-md">{comparisonCount}</span>}
              </Link>

              {isAuthenticated ? (
                <>
                  <div className="h-px bg-hairline-dark my-2" />
                  <div className="flex items-center gap-3 px-5 py-4 bg-surface-elevated">
                    <div className="w-11 h-11 bg-gold rounded-full flex items-center justify-center text-gold-ink font-semibold text-lg uppercase flex-shrink-0">
                      {((decodeHtmlEntities(user?.firstName) ?? '') || (decodeHtmlEntities(user?.email) ?? ''))?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-body-text whitespace-nowrap overflow-hidden text-overflow-ellipsis">
                        {(decodeHtmlEntities(user?.firstName) ?? '')} {(decodeHtmlEntities(user?.lastName) ?? '')}
                      </div>
                      <div className="text-sm text-muted-text whitespace-nowrap overflow-hidden text-overflow-ellipsis max-w-[200px]">{(decodeHtmlEntities(user?.email) ?? '')}</div>
                    </div>
                  </div>
                  <Link to="/dashboard" className="flex items-center gap-3 px-5 py-3.5 text-body-text no-underline text-sm border-b border-hairline-dark w-full text-left cursor-pointer bg-transparent font-sans transition-colors hover:bg-surface-elevated" onClick={handleCloseMenu}>
                    <LayoutDashboard size={18} />
                    <span>Панель управления</span>
                  </Link>
                  <Link to="/account" className="flex items-center gap-3 px-5 py-3.5 text-body-text no-underline text-sm border-b border-hairline-dark w-full text-left cursor-pointer bg-transparent font-sans transition-colors hover:bg-surface-elevated" onClick={handleCloseMenu}>
                    <User size={18} />
                    <span>Профиль</span>
                  </Link>
                  <Link to="/account/orders" className="flex items-center gap-3 px-5 py-3.5 text-body-text no-underline text-sm border-b border-hairline-dark w-full text-left cursor-pointer bg-transparent font-sans transition-colors hover:bg-surface-elevated" onClick={handleCloseMenu}>
                    <ShoppingBag size={18} />
                    <span>Заказы</span>
                  </Link>
                  <Link to="/account/settings" className="flex items-center gap-3 px-5 py-3.5 text-body-text no-underline text-sm border-b border-hairline-dark w-full text-left cursor-pointer bg-transparent font-sans transition-colors hover:bg-surface-elevated" onClick={handleCloseMenu}>
                    <Settings size={18} />
                    <span>Настройки</span>
                  </Link>
                  <button className="flex items-center gap-3 w-full px-5 py-3.5 bg-transparent border-t border-hairline-dark text-muted-text text-sm cursor-pointer transition-colors hover:text-red-500 hover:bg-red-50 font-sans" onClick={handleLogout} type="button">
                    <LogOut size={18} />
                    <span>Выйти</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="h-px bg-hairline-dark my-2" />
                  <button
                    className="flex items-center gap-3 px-5 py-3.5 text-body-text no-underline text-sm border-b border-hairline-dark w-full text-left cursor-pointer bg-transparent font-sans transition-colors hover:bg-surface-elevated"
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
                    className="flex items-center gap-3 px-5 py-3.5 text-gold-ink bg-gold border-gold text-sm w-full text-left cursor-pointer font-sans transition-colors hover:bg-gold-active"
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
