import { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  User,
  Package,
  Wrench,
  Menu,
  X,
  ShieldCheck,
  Cpu,
  Bell,
  Settings,
  Shield,
  Ticket,
  BarChart3,
  Download,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

/**
 * AccountLayout - Макет for /account/* pages with sidebar navigation
 *
 * Features:
 * - Fixed sidebar with user profile from auth store
 * - Navigation links: Overview, Profile, Orders, Repairs
 * - Мобильные responsive with slide-over sidebar panel
 */
export function AccountLayout() {
  const { user, currentRole } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? 'w-[68px]' : 'w-[280px]';

  const firstName = user?.firstName ?? '';
  const lastName = user?.lastName ?? '';
  const initials = (firstName.charAt(0) + lastName.charAt(0)).trim() || '?';

  interface NavItem {
    to: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    end?: boolean;
  }

const navItems: NavItem[] = [
    { to: '/account', icon: LayoutDashboard, label: 'Обзор', end: true },
    { to: '/account/profile', icon: User, label: 'Профиль' },
    { to: '/account/orders', icon: Package, label: 'Заказы' },
    { to: '/account/repairs', icon: Wrench, label: 'Ремонты' },
    { to: '/account/warranty', icon: ShieldCheck, label: 'Гарантия' },
    { to: '/account/saved-builds', icon: Cpu, label: 'Сборки' },
    { to: '/account/notifications', icon: Bell, label: 'Уведомления' },
    { to: '/account/settings', icon: Settings, label: 'Настройки' },
  ];

  const sidebarLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors shrink-0',
      isActive
        ? 'text-gold bg-surface-card border-l-2 border-gold'
        : 'text-muted-foreground hover:text-foreground hover:bg-surface-elevated',
      collapsed ? 'justify-center px-2' : '',
    ].join(' ');

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-canvas-dark">
      {/* Mobile overlay */}
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

      {/* Sidebar */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-[110] bg-surface-card border-r border-hairline-dark',
          'flex flex-col transform transition-all duration-300 ease-in-out',
          'lg:relative lg:translate-x-0 lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          sidebarWidth,
        ].join(' ')}
      >
        {/* Close button — mobile only */}
        <button
          onClick={closeSidebar}
          className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground rounded-lg lg:hidden hover:bg-surface-elevated transition-colors"
          aria-label="Закрыть меню"
        >
          <X size={20} />
        </button>

        {/* Collapse toggle — desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute top-2 right-2 w-7 h-7 items-center justify-center rounded-md text-muted-foreground hover:text-gold hover:bg-gold/10 transition-all cursor-pointer z-10"
          aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>

        {/* User profile section */}
        <div className={`flex flex-col items-center gap-2 pt-12 pb-6 border-b border-hairline-dark transition-all duration-300 ${collapsed ? 'px-2' : 'px-6'}`}>
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="Аватар"
              className={`rounded-full object-cover border-2 border-gold shrink-0 transition-all duration-300 ${collapsed ? 'w-10 h-10' : 'w-14 h-14'}`}
            />
          ) : (
            <div className={`rounded-full bg-gold text-gold-ink flex items-center justify-center font-bold shrink-0 transition-all duration-300 ${collapsed ? 'w-10 h-10 text-sm' : 'w-14 h-14 text-lg'}`}>
              {initials}
            </div>
          )}
          {!collapsed && (
            <>
              <div className="font-semibold text-foreground text-center">
                {user ? `${firstName} ${lastName}` : 'Гость'}
              </div>
              <div className="text-sm text-muted-foreground text-center truncate max-w-full">
                {user?.email ?? 'Войдите в аккаунт'}
              </div>
            </>
          )}
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Навигация аккаунта">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={closeSidebar}
              className={sidebarLinkClass}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={20} className="shrink-0" />
              {!collapsed && item.label}
            </NavLink>
          ))}

          {/* Role-aware section — only for non-Client roles */}
          {currentRole && currentRole !== 'Client' && (
            <>
              <div className="border-t border-hairline-dark my-2" />

              {currentRole === 'Admin' && (
                <Link
                  to="/admin/users"
                  onClick={closeSidebar}
                  className={`flex items-center gap-3 text-sm font-medium rounded-lg transition-colors text-gold bg-gold/10 hover:bg-gold/15 border border-gold/20 shrink-0 ${collapsed ? 'justify-center px-2 py-3' : 'px-4 py-3'}`}
                  title={collapsed ? 'Админ-панель' : undefined}
                >
                  <Shield size={20} className="shrink-0" />
                  {!collapsed && 'Админ-панель'}
                </Link>
              )}

              {['Manager', 'Admin', 'Master'].includes(currentRole ?? '') && (
                <NavLink
                  to="/manager/dashboard"
                  onClick={closeSidebar}
                  className={sidebarLinkClass}
                  title={collapsed ? 'Панель менеджера' : undefined}
                >
                  <LayoutDashboard size={20} className="shrink-0" />
                  {!collapsed && 'Панель менеджера'}
                </NavLink>
              )}

              {['Master', 'Admin'].includes(currentRole ?? '') && (
                <NavLink
                  to="/master/tickets"
                  onClick={closeSidebar}
                  className={sidebarLinkClass}
                  title={collapsed ? 'Тикеты' : undefined}
                >
                  <Ticket size={20} className="shrink-0" />
                  {!collapsed && 'Тикеты'}
                </NavLink>
              )}

              {['Accountant', 'Admin'].includes(currentRole ?? '') && (
                <>
                  <NavLink
                    to="/accountant/reports"
                    onClick={closeSidebar}
                    className={sidebarLinkClass}
                    title={collapsed ? 'Отчёты' : undefined}
                  >
                    <BarChart3 size={20} className="shrink-0" />
                    {!collapsed && 'Отчёты'}
                  </NavLink>
                  <NavLink
                    to="/accountant/export"
                    onClick={closeSidebar}
                    className={sidebarLinkClass}
                    title={collapsed ? 'Экспорт' : undefined}
                  >
                    <Download size={20} className="shrink-0" />
                    {!collapsed && 'Экспорт'}
                  </NavLink>
                </>
              )}
            </>
          )}
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex-1 min-w-0">
        {/* Mobile header with hamburger toggle */}
        <div className="sticky top-0 z-30 bg-canvas-dark border-b border-hairline-dark px-4 py-3 lg:hidden flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface-elevated transition-colors"
            aria-label="Открыть меню"
          >
            <Menu size={22} />
          </button>
          <span className="text-sm font-semibold text-foreground">Личный кабинет</span>
        </div>

        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
