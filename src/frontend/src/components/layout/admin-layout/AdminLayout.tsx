import { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Package,
  BookOpen,
  Settings,
  LayoutDashboard,
  ScrollText,
  Menu,
  X,
  ExternalLink,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface NavItem {
  to: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}

/* ------------------------------------------------------------------ */
/*  Navigation items                                                   */
/* ------------------------------------------------------------------ */

const navItems: NavItem[] = [
  { to: '/admin/users', icon: Users, label: 'Пользователи' },
  { to: '/admin/catalog', icon: Package, label: 'Каталог' },
  { to: '/admin/dictionaries', icon: BookOpen, label: 'Справочники' },
  { to: '/admin/audit-log', icon: ScrollText, label: 'Журнал аудита' },
  { to: '/admin/coordinator', icon: LayoutDashboard, label: 'Координатор' },
  { to: '/admin/settings', icon: Settings, label: 'Настройки' },
];

/* ------------------------------------------------------------------ */
/*  AdminLayout                                                        */
/* ------------------------------------------------------------------ */

/**
 * AdminLayout — отдельный лейаут для панели администратора GoldPC.
 *
 * Структура:
 *   Header с брендом и кнопкой "На сайт"
 *   Sidebar (240px, bg-canvas-dark) с 5 навигационными ссылками
 *   Main content с <Outlet /> для вложенных роутов
 *
 * Особенности:
 *   - Active link: border-l-2 border-gold + bg-surface-card + text-gold
 *   - Mobile (<1024px): sidebar скрыт, открывается как overlay через гамбургер
 *   - Анимация: framer-motion (AnimatePresence + motion.div)
 *   - Полностью самостоятельный (не использует MainLayout)
 */
export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? 'w-[68px]' : 'w-60';

  const sidebarLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-md transition-colors shrink-0',
      isActive
        ? 'text-gold bg-surface-card border-l-2 border-gold'
        : 'text-muted-foreground hover:text-body-text hover:bg-surface-elevated',
      collapsed ? 'justify-center px-2' : '',
    ].join(' ');

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-canvas-dark">
      {/* -------------------------------------------------- */}
      {/* Mobile overlay                                      */}
      {/* -------------------------------------------------- */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={closeSidebar}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* -------------------------------------------------- */}
      {/* Sidebar                                             */}
      {/* -------------------------------------------------- */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-[110] flex flex-col h-screen',
          'bg-canvas-dark border-r border-hairline-dark',
          'transform transition-all duration-300 ease-in-out',
          'lg:translate-x-0 lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          sidebarWidth,
        ].join(' ')}
      >
        {/* Close button — mobile only */}
        <button
          onClick={closeSidebar}
          className={[
            'absolute top-4 right-4 p-1',
            'text-muted-foreground hover:text-body-text',
            'rounded-md hover:bg-surface-elevated transition-colors',
            'lg:hidden',
          ].join(' ')}
          aria-label="Закрыть меню"
        >
          <X size={20} />
        </button>

        {/* Logo section */}
        <div className={`flex items-center h-14 border-b border-hairline-dark shrink-0 ${collapsed ? 'justify-center px-2' : 'gap-2 px-6'}`}>
          <span className="text-lg font-bold text-gold tracking-tight">
            {collapsed ? 'GP' : 'Gold PC'}
          </span>
          {!collapsed && (
            <span className="hidden sm:inline text-xs text-muted-foreground">
              Администрирование
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 overflow-y-auto px-3 py-4 space-y-1"
          aria-label="Административная панель"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeSidebar}
              className={sidebarLinkClass}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={20} className="shrink-0" />
              {!collapsed && item.label}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle — desktop only, всегда видна */}
        <div className="hidden lg:block shrink-0 border-t border-hairline-dark">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={[
              'flex items-center justify-center w-full h-11',
              'text-muted-foreground hover:text-body-text',
              'hover:bg-surface-elevated transition-colors cursor-pointer',
            ].join(' ')}
            aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
          >
            {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          </button>
        </div>
      </aside>

      {/* -------------------------------------------------- */}
      {/* Main content area                                    */}
      {/* -------------------------------------------------- */}
      <div className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ${collapsed ? 'lg:ml-[68px]' : 'lg:ml-60'}`}>
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-hairline-dark bg-canvas-dark px-4 lg:px-6">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className={[
                'p-2 -ml-2',
                'text-muted-foreground hover:text-body-text',
                'rounded-md hover:bg-surface-elevated transition-colors',
                'lg:hidden',
              ].join(' ')}
              aria-label="Открыть меню"
            >
              <Menu size={20} />
            </button>
          </div>

          {/* "На сайт" button — Link to / (SPA без перезагрузки) */}
          <Link
            to="/"
            className={[
              'inline-flex items-center gap-1.5',
              'bg-surface-card text-body-text',
              'hover:bg-surface-elevated',
              'rounded-md px-4 py-1.5 text-sm font-semibold',
              'transition-colors',
            ].join(' ')}
          >
            <ExternalLink size={14} />
            На сайт
          </Link>
        </header>

        {/* Page content via nested routes */}
        <main className="flex-1 p-3 lg:p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
