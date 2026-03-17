import { Link, NavLink } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, X } from 'lucide-react';
import { useState } from 'react';
import './Header.css';

/**
 * Header Component - Dark Glass Theme
 * 
 * Features:
 * - Sticky navigation with glassmorphism effect
 * - Logo with gold accent
 * - Navigation links
 * - Search, Cart, Profile actions
 * - Mobile hamburger menu
 */
export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount] = useState(3); // TODO: Get from cart context

  return (
    <header className="header">
      <div className="header__container">
        {/* Logo */}
        <Link to="/" className="header__logo">
          <div className="header__logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <span className="header__logo-text">Gold<span className="header__logo-accent">PC</span></span>
        </Link>

        {/* Navigation */}
        <nav className={`header__nav ${isMenuOpen ? 'header__nav--open' : ''}`}>
          <NavLink 
            to="/" 
            className={({ isActive }) => `header__nav-link ${isActive ? 'header__nav-link--active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Главная
          </NavLink>
          <NavLink 
            to="/catalog" 
            className={({ isActive }) => `header__nav-link ${isActive ? 'header__nav-link--active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Каталог
          </NavLink>
          <NavLink 
            to="/builder" 
            className={({ isActive }) => `header__nav-link ${isActive ? 'header__nav-link--active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Конструктор ПК
          </NavLink>
          <NavLink 
            to="/admin/coordinator" 
            className={({ isActive }) => `header__nav-link header__nav-link--admin ${isActive ? 'header__nav-link--active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            👥 Admin
          </NavLink>
        </nav>

        {/* Actions */}
        <div className="header__actions">
          <button className="header__action-btn" aria-label="Поиск">
            <Search size={20} />
          </button>
          
          <Link to="/cart" className="header__action-btn header__cart-btn" aria-label={`Корзина: ${cartCount} товара`}>
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="header__cart-badge">{cartCount}</span>
            )}
          </Link>
          
          <Link to="/account" className="header__action-btn" aria-label="Профиль">
            <User size={20} />
          </Link>

          {/* Mobile Menu Toggle */}
          <button 
            className="header__hamburger" 
            aria-label={isMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="header__overlay" 
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </header>
  );
}