import { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  Package,
  Menu,
  X,
  ExternalLink,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

interface NavItem {
  to: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}

const navItems: NavItem[] = [
  { to: '/courier/deliveries', icon: Package, label: 'Мои доставки' },
];

export function CourierLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? 'w-[68px]' : 'w-[280px]';

  const sidebarLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'flex items-center gap-3 text-sm font-medium rounded-lg transition-colors shrink-0',
      isActive
        ? 'text-gold bg-surface-elevated border-l-2 border-gold'
        : 'text-muted-foreground hover:text-foreground hover:bg-surface-elevated',
      collapsed ? 'justify-center px-2 py-3' : 'px-4 py-3',
    ].join(' ');

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-[#181a20]">
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

      <aside
        className={[
          'fixed inset-y-0 left-0 z-[110] bg-[#1e2329] border-r border-hairline-dark',
          'flex flex-col transform transition-all duration-300 ease-in-out',
          'lg:relative lg:translate-x-0 lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          sidebarWidth,
        ].join(' ')}
      >
        <button
          onClick={closeSidebar}
          className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground rounded-lg lg:hidden hover:bg-surface-elevated transition-colors"
          aria-label="Закрыть меню"
        >
          <X size={20} />
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute top-2 right-2 w-7 h-7 items-center justify-center rounded-md text-muted-foreground hover:text-[#FCD535] hover:bg-[#FCD535]/10 transition-all cursor-pointer z-10"
          aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>

        <div
          className={`flex items-center border-b border-hairline-dark shrink-0 transition-all duration-300 ${
            collapsed ? 'justify-center px-2 pt-10 pb-4' : 'h-14 gap-2 px-6'
          }`}
        >
          <Truck size={22} className="text-[#FCD535] shrink-0" />
          {!collapsed && (
            <>
              <span className="text-lg font-bold text-[#FCD535] tracking-tight">Gold PC</span>
              <span className="text-xs text-muted-foreground">Курьер</span>
            </>
          )}
        </div>

        <nav
          className="flex-1 overflow-y-auto px-3 py-4 space-y-1"
          aria-label="Панель курьера"
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

        <div className="shrink-0 border-t border-hairline-dark px-3 py-3">
          <Link
            to="/"
            className={[
              'flex items-center gap-3 text-sm font-medium rounded-lg transition-colors',
              'text-muted-foreground hover:text-foreground hover:bg-surface-elevated',
              collapsed ? 'justify-center px-2 py-3' : 'px-4 py-3',
            ].join(' ')}
            title={collapsed ? 'На сайт' : undefined}
          >
            <ExternalLink size={20} className="shrink-0" />
            {!collapsed && 'На сайт'}
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-hairline-dark bg-[#1e2329] px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface-elevated transition-colors"
            aria-label="Открыть меню"
          >
            <Menu size={22} />
          </button>
          <span className="text-sm font-semibold text-foreground">Панель курьера</span>
        </div>

        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
