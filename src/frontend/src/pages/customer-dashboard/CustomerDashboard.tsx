import { Link } from 'react-router-dom';
import {
  Package,
  Wrench,
  Cpu,
  ShieldCheck,
  Bell,
  Settings,
  ChevronRight,
  Clock
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

/**
 * Customer Dashboard Page
 *
 * Authenticated customer main dashboard with welcome message,
 * quick actions, and placeholder widgets for orders and repairs.
 */
export function CustomerDashboard() {
  const { user } = useAuthStore();

  const quickActions = [
    {
      to: '/orders/tracking',
      icon: <Package />,
      label: 'Отследить заказ',
      description: 'Статус и история доставки'
    },
    {
      to: '/service-request',
      icon: <Wrench />,
      label: 'Новый запрос на ремонт',
      description: 'Отправить устройство на диагностику'
    },
    {
      to: '/pc-builder',
      icon: <Cpu />,
      label: 'Конструктор ПК',
      description: 'Собрать индивидуальную конфигурацию'
    },
    {
      to: '/account/warranty',
      icon: <ShieldCheck />,
      label: 'Моя гарантия',
      description: 'Активные гарантийные обязательства'
    }
  ];

  return (
    <div className="min-h-[calc(100vh-120px)] py-8 bg-gradient-to-b from-[#0f0f11] to-[#151518]">
      <div className="max-w-[1280px] mx-auto px-6">
        {/* Welcome Section */}
        <section className="flex justify-between items-start mb-10 gap-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--fg)] mb-2">
              Добро пожаловать, {user?.firstName || 'Пользователь'}! 👋
            </h1>
            <p className="text-[var(--fg-muted)] text-base mb-0 max-w-[600px] leading-6">
              Здесь вы можете управлять своими заказами, просматривать статус ремонтов
              и получить доступ ко всем сервисам GoldPC.
            </p>
          </div>

          <div className="flex gap-3 flex-shrink-0">
            <button className="w-11 h-11 rounded-xl border border-[#27272a] bg-[var(--bg-card)] text-[var(--fg-muted)] flex items-center justify-center cursor-pointer transition-all duration-200 relative hover:bg-[#27272a] hover:text-[var(--fg)] hover:border-[#3f3f46]" aria-label="Уведомления">
              <Bell />
              <span className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full bg-[var(--accent)] text-[#0f0f11] text-[0.6875rem] font-bold flex items-center justify-center">3</span>
            </button>
            <Link to="/account/settings" className="w-11 h-11 rounded-xl border border-[#27272a] bg-[var(--bg-card)] text-[var(--fg-muted)] flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-[#27272a] hover:text-[var(--fg)] hover:border-[#3f3f46]" aria-label="Настройки">
              <Settings />
            </Link>
          </div>
        </section>

        {/* Quick Actions Grid */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[var(--fg)] mb-4">Быстрые действия</h2>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="flex items-center gap-4 p-5 bg-[var(--bg-card)] border border-[#27272a] rounded-2xl text-decoration-none transition-all duration-200 hover:bg-[#1f1f23] hover:border-[#3f3f46] hover:-translate-y-0.5"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[#c89666] text-[#0f0f11] flex items-center justify-center flex-shrink-0">
                  {action.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-[var(--fg)] mb-1">{action.label}</h3>
                  <p className="text-sm text-[var(--fg-muted)] mb-0">{action.description}</p>
                </div>
                <ChevronRight className="text-[var(--fg-dim)] flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[var(--fg-muted)]" />
              </Link>
            ))}
          </div>
        </section>

        {/* Dashboard Widgets */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(400px,1fr))] gap-6">
          {/* Recent Orders Widget */}
          <section className="mb-8 bg-[var(--bg-card)] border border-[#27272a] rounded-2xl p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-semibold text-[var(--fg)] mb-0">Последние заказы</h2>
              <Link to="/account/orders" className="flex items-center gap-1 text-[var(--accent)] text-decoration-none text-sm font-medium transition-opacity duration-200 hover:opacity-80">
                Все заказы
                <ChevronRight />
              </Link>
            </div>

            <div className="flex flex-col gap-3.5">
              <div className="flex items-center gap-4 p-3.5 bg-[#1f1f23] rounded-xl opacity-70">
                <Package className="text-[var(--fg-dim)] flex-shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-3 bg-[#27272a] rounded w-[60%] animate-pulse" />
                  <div className="h-3 bg-[#27272a] rounded w-[40%] animate-pulse opacity-60" />
                </div>
              </div>
              <div className="flex items-center gap-4 p-3.5 bg-[#1f1f23] rounded-xl opacity-70">
                <Package className="text-[var(--fg-dim)] flex-shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-3 bg-[#27272a] rounded w-[70%] animate-pulse" />
                  <div className="h-3 bg-[#27272a] rounded w-[50%] animate-pulse opacity-60" />
                </div>
              </div>
              <div className="flex items-center gap-4 p-3.5 bg-[#1f1f23] rounded-xl opacity-70">
                <Package className="text-[var(--fg-dim)] flex-shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-3 bg-[#27272a] rounded w-[55%] animate-pulse" />
                  <div className="h-3 bg-[#27272a] rounded w-[35%] animate-pulse opacity-60" />
                </div>
              </div>
            </div>

            <div className="mt-5 p-3 bg-[var(--border-muted)] rounded-lg text-[var(--accent)] text-[0.8125rem] flex items-center gap-2">
              <Clock size={16} />
              <span>Данные будут загружены после интеграции с API</span>
            </div>
          </section>

          {/* Active Repairs Widget */}
          <section className="mb-8 bg-[var(--bg-card)] border border-[#27272a] rounded-2xl p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-semibold text-[var(--fg)] mb-0">Активные ремонты</h2>
              <Link to="/account/repairs" className="flex items-center gap-1 text-[var(--accent)] text-decoration-none text-sm font-medium transition-opacity duration-200 hover:opacity-80">
                Все запросы
                <ChevronRight />
              </Link>
            </div>

            <div className="flex flex-col gap-3.5">
              <div className="flex items-center gap-4 p-3.5 bg-[#1f1f23] rounded-xl opacity-70">
                <Wrench className="text-[var(--fg-dim)] flex-shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-3 bg-[#27272a] rounded w-[65%] animate-pulse" />
                  <div className="h-3 bg-[#27272a] rounded w-[45%] animate-pulse opacity-60" />
                </div>
              </div>
              <div className="flex items-center gap-4 p-3.5 bg-[#1f1f23] rounded-xl opacity-70">
                <Wrench className="text-[var(--fg-dim)] flex-shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-3 bg-[#27272a] rounded w-[50%] animate-pulse" />
                  <div className="h-3 bg-[#27272a] rounded w-[30%] animate-pulse opacity-60" />
                </div>
              </div>
            </div>

            <div className="mt-5 p-3 bg-[var(--border-muted)] rounded-lg text-[var(--accent)] text-[0.8125rem] flex items-center gap-2">
              <Clock size={16} />
              <span>Данные будут загружены после интеграции с API</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
