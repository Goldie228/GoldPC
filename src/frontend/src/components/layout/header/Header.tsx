import { useState, useRef, useEffect, type ReactElement } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
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
  Bell,
  Shield,
} from 'lucide-react';
import { MiniCart } from './MiniCart';
import { NotificationCenter } from '@/components/notification-center/NotificationCenter';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useComparison } from '@/hooks/useComparison';
import { useAuth } from '@/hooks/useAuth';
import { useModal } from '@/hooks/useModal';
import { useAuthModal } from '@/hooks/useAuthModal';
import { decodeHtmlEntities } from '@/utils/decodeHtml';

const NAV_ITEMS = [
  { to: '/catalog', label: 'Каталог' },
  { to: '/pc-builder', label: 'Конструктор' },
  { to: '/services', label: 'Сервис' },
  { to: '/about', label: 'О нас' },
];

export function Header(): ReactElement {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartFlash, setCartFlash] = useState(false);
  const prevCartCountRef = useRef(0);
  const location = useLocation();

  const { itemCount: cartCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { items: comparisonItems } = useComparison();
  const { isAuthenticated, user, logout } = useAuth();
  const { openModal: _openModal, closeModal: _closeModal } = useModal();

  const wishlistCount = wishlistItems.length;
  const comparisonCount = comparisonItems.length;

  const { openLoginModal, openRegisterModal } = useAuthModal();

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

  // Close MiniCart on Escape
  useEffect(() => {
    if (!isCartOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsCartOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen]);

  // Close MiniCart on navigation
  useEffect(() => {
    setIsCartOpen(false);
  }, [location]);

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
    void logout();
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
      <header className="sticky top-0 z-[100] bg-canvas-dark border-b border-hairline-dark flex items-center justify-between px-6 h-16 gap-4">
         {/* Logo */}
         <Link to="/" className="flex items-center gap-2.5 text-decoration-none flex-shrink-0">
             <span className="text-lg md:text-xl font-bold text-gold tracking-tight">Gold<span className="text-body-text">PC</span></span>
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
          {/* Mobile-only: Profile + Menu. Desktop: all actions */}
          <button
            onClick={() => setIsCartOpen(true)}
            className={`relative w-10 h-10 flex items-center justify-center bg-transparent border border-transparent rounded-xl text-muted-text cursor-pointer transition-all hover:border-gold/30 hover:text-body-text hover:bg-surface-elevated hidden md:flex ${cartFlash ? 'animate-pulse' : ''}`}
            aria-label="Корзина"
            type="button"
          >
            <ShoppingCart />
            {cartCount > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 flex items-center justify-center bg-gold text-gold-ink text-[9px] font-bold rounded-md">{cartCount}</span>}
          </button>
          <MiniCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

          <Link to="/wishlist" className="relative w-10 h-10 flex items-center justify-center bg-transparent border border-transparent rounded-xl text-muted-text cursor-pointer transition-all hover:border-gold/30 hover:text-body-text hover:bg-surface-elevated hidden md:flex" aria-label="Избранное">
            <Heart />
            {wishlistCount > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 flex items-center justify-center bg-gold text-gold-ink text-[9px] font-bold rounded-md">{wishlistCount}</span>}
          </Link>

          <Link to="/comparison" className="relative w-10 h-10 flex items-center justify-center bg-transparent border border-transparent rounded-xl text-muted-text cursor-pointer transition-all hover:border-gold/30 hover:text-body-text hover:bg-surface-elevated hidden md:flex" aria-label="Сравнение">
            <GitCompare />
            {comparisonCount > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 flex items-center justify-center bg-gold text-gold-ink text-[9px] font-bold rounded-md">{comparisonCount}</span>}
          </Link>

          {/* Notifications - hidden on mobile */}
          <div className="hidden md:block">
            <NotificationCenter />
          </div>

          {/* Кнопка панели администратора — только для Admin */}
          {isAuthenticated && user?.role === 'Admin' && (
            <Link
              to="/admin/users"
              className="relative w-10 h-10 flex items-center justify-center bg-transparent border border-transparent rounded-xl text-muted-text cursor-pointer transition-all hover:border-gold/30 hover:text-gold hover:bg-surface-elevated hidden md:flex"
              aria-label="Админ-панель"
            >
              <Shield size={24} />
            </Link>
          )}

          {/* Кнопка панели менеджера — для Manager, Admin, Master */}
          {isAuthenticated && ['Manager', 'Admin', 'Master'].includes(user?.role ?? '') && (
            <Link
              to="/manager/dashboard"
              className="relative w-10 h-10 flex items-center justify-center bg-transparent border border-transparent rounded-xl text-muted-text cursor-pointer transition-all hover:border-gold/30 hover:text-gold hover:bg-surface-elevated hidden md:flex"
              aria-label="Панель менеджера"
            >
              <LayoutDashboard size={24} />
            </Link>
          )}

          {/* Profile / Auth - hidden on mobile (in drawer instead) */}
          <div className="relative hidden md:block" ref={profileDropdownRef}>
            <button
              className={`w-10 h-10 flex items-center justify-center bg-transparent border rounded-xl text-muted-text cursor-pointer transition-all hover:border-gold/30 hover:text-body-text hover:bg-surface-elevated ${isAuthenticated ? 'border-gold/30 text-gold' : 'border-transparent'}`}
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
                      className="w-full px-6 py-3 bg-transparent border border-hairline-dark rounded-md text-body-text text-sm font-semibold cursor-pointer transition-colors hover:border-gold/40 hover:bg-gold/5"
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
                      className="w-full px-6 py-3 bg-gold text-gold-ink rounded-md text-sm font-semibold cursor-pointer transition-colors hover:bg-gold-active border-none"
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
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Аватар" className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-11 h-11 bg-gold rounded-full flex items-center justify-center text-gold-ink font-semibold text-lg uppercase flex-shrink-0">
                          {((decodeHtmlEntities(user?.firstName ?? '') ?? '') || (decodeHtmlEntities(user?.email ?? '') ?? ''))?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm font-semibold text-body-text whitespace-nowrap overflow-hidden text-overflow-ellipsis">
                          {(decodeHtmlEntities(user?.firstName ?? ''))} {(decodeHtmlEntities(user?.lastName ?? ''))}
                        </span>
                        <span className="text-sm text-muted-text whitespace-nowrap overflow-hidden text-overflow-ellipsis max-w-[200px]">{(decodeHtmlEntities(user?.email ?? '') ?? '')}</span>
                      </div>
                    </div>

                    <nav className="flex flex-col py-2">
                      <Link to="/account" className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-text no-underline transition-colors hover:bg-surface-elevated hover:text-body-text" onClick={handleProfileDropdownClose}>
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
                      <Link to="/account/notifications" className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-text no-underline transition-colors hover:bg-surface-elevated hover:text-body-text" onClick={handleProfileDropdownClose}>
                        <Bell />
                        <span>Уведомления</span>
                      </Link>
                      <Link to="/account/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-text no-underline transition-colors hover:bg-surface-elevated hover:text-body-text" onClick={handleProfileDropdownClose}>
                        <Settings />
                        <span>Настройки</span>
                      </Link>
                    </nav>

                    {user?.role === 'Admin' && (
                      <>
                        <div className="h-px bg-hairline-dark mx-4" />
                        <Link to="/admin/users" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gold no-underline transition-colors hover:bg-surface-elevated" onClick={handleProfileDropdownClose}>
                          <Shield size={18} />
                          <span>Админ-панель</span>
                        </Link>
                      </>
                    )}

                    {['Manager', 'Admin', 'Master'].includes(user?.role ?? '') && (
                      <>
                        <div className="h-px bg-hairline-dark mx-4" />
                        <Link to="/manager/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gold no-underline transition-colors hover:bg-surface-elevated" onClick={handleProfileDropdownClose}>
                          <LayoutDashboard size={18} />
                          <span>Панель менеджера</span>
                        </Link>
                      </>
                    )}

                    <button className="flex items-center gap-3 w-full px-4 py-3 bg-transparent border-t border-hairline-dark text-muted-text text-sm cursor-pointer transition-colors hover:text-red-500 hover:bg-red-50" onClick={handleLogout} type="button">
                      <LogOut />
                      <span>Выйти</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle - only on mobile */}
          <button
            ref={menuButtonRef}
            className="md:hidden w-10 h-10 flex items-center justify-center bg-transparent border border-hairline-dark rounded-lg text-muted-text cursor-pointer hover:border-gold/30 hover:text-body-text transition-colors self-center"
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
              <div
                className="fixed top-0 left-0 w-screen h-screen bg-black/50 z-[190]"
                role="button"
                tabIndex={0}
                onClick={handleCloseMenu}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCloseMenu(); } }}
                aria-label="Закрыть меню"
              />
             <motion.div
               ref={mobileDrawerRef}
               className="fixed bottom-0 left-0 right-0 bg-surface-card border-t border-hairline-dark shadow-xl z-[200] overflow-y-auto rounded-t-2xl max-h-[calc(100vh-4rem)]"
               initial={{ y: '100%' }}
               animate={{ y: 0 }}
               exit={{ y: '100%' }}
               transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
               role="dialog"
               aria-modal="true"
               aria-label="Мобильное меню"
             >
               {/* Drawer Header */}
               <div className="flex items-center justify-between px-5 py-4 border-b border-hairline-dark">
                 <span className="text-base font-semibold text-body-text leading-normal">Меню</span>
                 <button className="w-9 h-9 flex items-center justify-center bg-transparent border border-transparent rounded-lg text-muted-text cursor-pointer transition-colors hover:border-hairline-dark hover:text-body-text" onClick={handleCloseMenu} type="button" aria-label="Закрыть">
                   <X size={20} />
                 </button>
               </div>

               {/* Nav Links */}
               <nav className="flex flex-col py-1">
                 {NAV_ITEMS.map((item) => (
                   <NavLink
                     key={item.to}
                     to={item.to}
                     className="block px-5 py-3 text-sm font-medium leading-normal text-muted-text no-underline transition-colors hover:bg-surface-elevated hover:text-body-text"
                     onClick={handleCloseMenu}
                   >
                     {item.label}
                   </NavLink>
                 ))}
               </nav>

               <div className="h-px bg-hairline-dark my-2" />

               {/* Quick Actions — Card Grid */}
                <div className="grid grid-cols-4 gap-px bg-hairline-dark mx-4 mb-3 rounded-lg overflow-hidden">
                  <Link to="/cart" className="flex flex-col items-center gap-1.5 py-3 px-2 bg-surface-card text-center cursor-pointer transition-colors hover:bg-surface-elevated" onClick={handleCloseMenu}>
                    <div className="w-10 h-10 flex items-center justify-center bg-transparent border border-hairline-dark rounded-xl text-muted-text transition-colors group-hover:border-gold/30 group-hover:text-body-text">
                      <ShoppingCart size={18} />
                    </div>
                    <span className="text-[11px] font-medium text-muted-text leading-tight">Корзина</span>
                    {cartCount > 0 && <span className="text-[10px] font-semibold text-gold">{cartCount}</span>}
                  </Link>
                 <Link to="/wishlist" className="flex flex-col items-center gap-1.5 py-3 px-2 bg-surface-card text-center cursor-pointer transition-colors hover:bg-surface-elevated" onClick={handleCloseMenu}>
                   <div className="w-10 h-10 flex items-center justify-center bg-transparent border border-hairline-dark rounded-xl text-muted-text transition-colors group-hover:border-gold/30 group-hover:text-body-text">
                     <Heart size={18} />
                   </div>
                   <span className="text-[11px] font-medium text-muted-text leading-tight">Избранное</span>
                   {wishlistCount > 0 && <span className="text-[10px] font-semibold text-gold">{wishlistCount}</span>}
                 </Link>
                  <Link to="/comparison" className="flex flex-col items-center gap-1.5 py-3 px-2 bg-surface-card text-center cursor-pointer transition-colors hover:bg-surface-elevated" onClick={handleCloseMenu}>
                    <div className="w-10 h-10 flex items-center justify-center bg-transparent border border-hairline-dark rounded-xl text-muted-text transition-colors group-hover:border-gold/30 group-hover:text-body-text">
                      <GitCompare size={18} />
                    </div>
                    <span className="text-[11px] font-medium text-muted-text leading-tight">Сравнение</span>
                    {comparisonCount > 0 && <span className="text-[10px] font-semibold text-gold">{comparisonCount}</span>}
                  </Link>
                  <button type="button" className="relative flex flex-col items-center gap-1.5 py-3 px-2 bg-surface-card cursor-pointer transition-colors hover:bg-surface-elevated">
                    <div className="w-10 h-10 flex items-center justify-center bg-transparent border border-hairline-dark rounded-xl text-muted-text">
                      <Bell size={18} />
                    </div>
                    <span className="text-[11px] font-medium text-muted-text leading-tight">Уведомления</span>
                  </button>
                </div>

{/* CTA Section */}
                <div className="flex flex-col gap-px bg-hairline-dark mx-4 mb-3 rounded-lg overflow-hidden">
                  {isAuthenticated ? (
                    <>
                      {/* User Card */}
                      <div className="flex items-center gap-3 px-4 py-3 bg-surface-elevated">
                        {user?.avatarUrl ? (
                          <img src={user.avatarUrl} alt="Аватар" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center text-gold-ink font-semibold text-sm uppercase flex-shrink-0">
                            {(() => {
                              const name = decodeHtmlEntities(user?.firstName ?? '') ?? '';
                              const surname = decodeHtmlEntities(user?.lastName ?? '') ?? '';
                              if (name && surname) return (name + surname).slice(0, 2).toUpperCase();
                              if (name) return name.slice(0, 2).toUpperCase();
                              const email = decodeHtmlEntities(user?.email ?? '') ?? '';
                              return email.slice(0, 2).toUpperCase();
                            })()}
                          </div>
                        )}
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-sm font-semibold text-body-text whitespace-nowrap overflow-hidden text-overflow-ellipsis">
                            {(decodeHtmlEntities(user?.firstName ?? '') ?? '')} {(decodeHtmlEntities(user?.lastName ?? '') ?? '')}
                          </span>
                          <span className="text-xs text-muted-text whitespace-nowrap overflow-hidden text-overflow-ellipsis max-w-[180px]">
                            {decodeHtmlEntities(user?.email ?? '') ?? ''}
                          </span>
                        </div>
                      </div>

                      {/* Navigation */}
                      <nav className="flex flex-col">
                        <Link to="/account" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-text no-underline transition-colors hover:bg-surface-elevated hover:text-body-text" onClick={handleCloseMenu}>
                          <LayoutDashboard size={18} />
                          <span>Панель управления</span>
                        </Link>
                        <Link to="/account" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-text no-underline transition-colors hover:bg-surface-elevated hover:text-body-text" onClick={handleCloseMenu}>
                          <User size={18} />
                          <span>Профиль</span>
                        </Link>
                        <Link to="/account/orders" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-text no-underline transition-colors hover:bg-surface-elevated hover:text-body-text" onClick={handleCloseMenu}>
                          <ShoppingBag size={18} />
                          <span>Заказы</span>
                        </Link>
                        <Link to="/account/notifications" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-text no-underline transition-colors hover:bg-surface-elevated hover:text-body-text" onClick={handleCloseMenu}>
                          <Bell size={18} />
                          <span>Уведомления</span>
                        </Link>
                        <Link to="/account/settings" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-text no-underline transition-colors hover:bg-surface-elevated hover:text-body-text" onClick={handleCloseMenu}>
                          <Settings size={18} />
                          <span>Настройки</span>
                        </Link>
                      </nav>

                      {/* Панель администратора — только для Admin */}
                      {user?.role === 'Admin' && (
                        <>
                          <div className="h-px bg-hairline-dark mx-4" />
                          <Link to="/admin/users" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gold no-underline transition-colors hover:bg-surface-elevated" onClick={handleCloseMenu}>
                            <Shield size={18} />
                            <span>Админ-панель</span>
                          </Link>
                        </>
                      )}

                      {/* Панель менеджера — для Manager, Admin, Master */}
                      {['Manager', 'Admin', 'Master'].includes(user?.role ?? '') && (
                        <>
                          <div className="h-px bg-hairline-dark mx-4" />
                          <Link to="/manager/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gold no-underline transition-colors hover:bg-surface-elevated" onClick={handleCloseMenu}>
                            <LayoutDashboard size={18} />
                            <span>Панель менеджера</span>
                          </Link>
                        </>
                      )}

                      {/* Logout */}
                      <button className="flex items-center gap-2 w-full px-4 py-3 bg-transparent border-t border-hairline-dark text-sm font-semibold text-red-500 cursor-pointer transition-colors hover:bg-red-50" onClick={handleLogout} type="button">
                        <LogOut size={18} />
                        <span>Выйти</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-px">
                      <button
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gold text-gold-ink text-sm font-semibold cursor-pointer transition-colors hover:bg-gold-active border-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          openLoginModal();
                          handleCloseMenu();
                        }}
                        type="button"
                      >
                        Войти
                      </button>
                      <button
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-surface-elevated text-body-text text-sm font-semibold cursor-pointer transition-colors hover:bg-surface-card border-t border-hairline-dark"
                        onClick={(e) => {
                          e.stopPropagation();
                          openRegisterModal();
                          handleCloseMenu();
                        }}
                        type="button"
                      >
                        Регистрация
                      </button>
                    </div>
                  )}
                </div>
             </motion.div>
           </>
         )}
       </AnimatePresence>

     </>
  );
}
