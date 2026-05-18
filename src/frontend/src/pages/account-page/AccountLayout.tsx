import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  Package,
  Wrench,
  Menu,
  X,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

/**
 * AccountLayout - Layout for /account/* pages with sidebar navigation
 *
 * Features:
 * - Fixed sidebar with user profile from auth store
 * - Navigation links: Overview, Profile, Orders, Repairs
 * - Mobile responsive with slide-over sidebar panel
 */
export function AccountLayout() {
  const { user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const firstName = user?.firstName ?? '';
  const lastName = user?.lastName ?? '';
  const initials = (firstName.charAt(0) + lastName.charAt(0)).trim() || '?';

  interface NavItem {
    to: string;
    icon: React.ComponentType<{ size?: number }>;
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
  ];

  const sidebarLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors',
      isActive
        ? 'text-gold bg-surface-elevated border-l-2 border-gold'
        : 'text-muted-text hover:text-body-text hover:bg-surface-elevated',
    ].join(' ');

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-canvas-dark">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'fixed inset-y-0 left-0 top-16 z-[110] w-[280px] bg-surface-card border-r border-hairline-dark lg:top-0',
          'flex flex-col transform transition-transform duration-300 ease-in-out',
          'lg:relative lg:translate-x-0 lg:top-0 lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Close button — mobile only */}
        <button
          onClick={closeSidebar}
          className="absolute top-4 right-4 p-1 text-muted-text hover:text-body-text rounded-lg lg:hidden hover:bg-surface-elevated transition-colors"
          aria-label="Закрыть меню"
        >
          <X size={20} />
        </button>

        {/* User profile section */}
        <div className="flex flex-col items-center gap-2 pt-8 pb-6 px-6 border-b border-hairline-dark">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="Аватар"
              className="w-14 h-14 rounded-full object-cover border-2 border-gold"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gold text-gold-ink flex items-center justify-center text-lg font-bold">
              {initials}
            </div>
          )}
          <div className="font-semibold text-body-text text-center">
            {user ? `${firstName} ${lastName}` : 'Гость'}
          </div>
          <div className="text-sm text-muted-text text-center truncate max-w-full">
            {user?.email ?? 'Войдите в аккаунт'}
          </div>
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
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content area */}
      <main className="flex-1 min-w-0">
        {/* Mobile header with hamburger toggle */}
        <div className="sticky top-0 z-30 bg-canvas-dark border-b border-hairline-dark px-4 py-3 lg:hidden flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-muted-text hover:text-body-text rounded-lg hover:bg-surface-elevated transition-colors"
            aria-label="Открыть меню"
          >
            <Menu size={22} />
          </button>
          <span className="text-sm font-semibold text-body-text">Личный кабинет</span>
        </div>

        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
