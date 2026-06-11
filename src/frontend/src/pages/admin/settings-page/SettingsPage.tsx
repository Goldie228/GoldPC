/**
 * SettingsPage — Страница настроек системы
 *
 * Форма управления глобальными параметрами магазина GoldPC.
 * Группирует поля в 4 логические секции:
 *   — Основные настройки
 *   — Доставка
 *   — Уведомления (toggle switches)
 *   — Режим обслуживания (с предупреждением)
 *
 * Стилизация: только Tailwind DESIGN.md токены.
 * Загрузка/сохранение: TanStack Query (useQuery / useMutation).
 * Иконки: lucide-react.
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/api/admin';
import type { SiteSettings } from '@/api/admin';
import { useToast } from '@/hooks/useToast';
import {
  Save,
  RotateCcw,
  AlertTriangle,
  Home,
  Package,
  Bell,
  Settings as SettingsIcon,
  Loader2,
} from 'lucide-react';

// =============================================================================
// ToggleSwitch — кастомный переключатель (off → bg-surface-elevated, on → bg-gold)
// =============================================================================

interface ToggleSwitchProps {
  name: keyof SiteSettings;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  description?: string;
}

function ToggleSwitch({ name, checked, onChange, label, description }: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="pr-4">
        <div className="text-sm font-medium text-body-text">{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground mt-1">{description}</div>
        )}
      </div>
      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
        <input
          type="checkbox"
          name={name}
          className="sr-only peer"
          checked={checked}
          onChange={onChange}
          aria-label={label}
        />
        <div className="w-11 h-6 bg-surface-elevated rounded-full peer peer-checked:bg-gold peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-gold transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
      </label>
    </div>
  );
}

// =============================================================================
// SectionCard — карточка-секция с заголовком и иконкой
// =============================================================================

interface SectionCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  warning?: boolean;
}

function SectionCard({ icon, title, children, warning }: SectionCardProps) {
  return (
    <div className="bg-surface-card rounded-xl p-6">
      <div className="flex items-center gap-3 pb-4 mb-5 border-b border-hairline-dark">
        <span className={warning ? 'text-price-rise' : 'text-gold'}>{icon}</span>
        <h2 className={`text-base font-semibold ${warning ? 'text-price-rise' : 'text-body-text'}`}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

// =============================================================================
// SettingsSkeleton — заглушка загрузки
// =============================================================================

function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-surface-card rounded-xl p-6">
          <div className="flex items-center gap-3 pb-4 mb-5 border-b border-hairline-dark">
            <div className="w-5 h-5 bg-surface-elevated rounded" />
            <div className="h-5 bg-surface-elevated rounded w-40" />
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <div className="h-3 bg-surface-elevated rounded w-24 mb-2" />
                <div className="h-9 bg-surface-elevated rounded-md" />
              </div>
              <div>
                <div className="h-3 bg-surface-elevated rounded w-24 mb-2" />
                <div className="h-9 bg-surface-elevated rounded-md" />
              </div>
            </div>
            <div>
              <div className="h-3 bg-surface-elevated rounded w-24 mb-2" />
              <div className="h-9 bg-surface-elevated rounded-md" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <div className="h-3 bg-surface-elevated rounded w-24 mb-2" />
                <div className="h-9 bg-surface-elevated rounded-md" />
              </div>
              <div>
                <div className="h-3 bg-surface-elevated rounded w-24 mb-2" />
                <div className="h-9 bg-surface-elevated rounded-md" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// SettingsPage
// =============================================================================

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<Partial<SiteSettings>>({});
  const [formInitialized, setFormInitialized] = useState(false);
  const [inlineMessage, setInlineMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // ---- загрузка текущих настроек ----

  const {
    data: settings,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: () => settingsApi.getSettings(),
    staleTime: 30_000,
  });

  // Одноразовая инициализация формы при первой загрузке данных
  useEffect(() => {
    if (settings && !formInitialized) {
      setFormData(settings);
      setFormInitialized(true);
    }
  }, [settings, formInitialized]);

  // ---- мутация сохранения ----

  const saveMutation = useMutation({
    mutationFn: (data: Partial<SiteSettings>) => settingsApi.updateSettings(data),
    onSuccess: (result) => {
      queryClient.setQueryData(['adminSettings'], result);
      setInlineMessage({ type: 'success', text: 'Настройки успешно сохранены' });
      showToast('Настройки успешно сохранены', 'success');
    },
    onError: () => {
      setInlineMessage({ type: 'error', text: 'Не удалось сохранить настройки. Попробуйте позже.' });
      showToast('Не удалось сохранить настройки', 'error');
    },
  });

  // ---- мутация сброса ----

  const resetMutation = useMutation({
    mutationFn: () => settingsApi.resetSettings(),
    onSuccess: (result) => {
      queryClient.setQueryData(['adminSettings'], result);
      setFormData(result);
      setInlineMessage({ type: 'success', text: 'Настройки сброшены к значениям по умолчанию' });
      showToast('Настройки сброшены к значениям по умолчанию', 'success');
    },
    onError: () => {
      setInlineMessage({ type: 'error', text: 'Не удалось сбросить настройки. Попробуйте позже.' });
      showToast('Не удалось сбросить настройки', 'error');
    },
  });

  // ---- обработчики формы ----

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    setInlineMessage(null);

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: value ? parseFloat(value) : 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const handleReset = () => {
    if (
      !window.confirm(
        'Сбросить все настройки к значениям по умолчанию? Это действие нельзя отменить.',
      )
    ) {
      return;
    }
    resetMutation.mutate();
  };

  // ====== Состояние: загрузка ======

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas-dark pb-6">
        <div className="mx-auto max-w-[900px]">
          <div className="mb-8">
            <div className="mb-2 h-7 w-56 animate-pulse rounded bg-surface-elevated" />
            <div className="h-4 w-72 animate-pulse rounded bg-surface-elevated" />
          </div>
          <SettingsSkeleton />
        </div>
      </div>
    );
  }

  // ====== Состояние: ошибка загрузки ======

  if (isError || !settings) {
    return (
      <div className="min-h-screen bg-canvas-dark pb-6">
        <div className="mx-auto max-w-[900px]">
          <div className="flex flex-col items-center justify-center rounded-xl bg-surface-card p-12 text-center">
            <AlertTriangle className="mb-4 h-12 w-12 text-price-rise" />
            <h2 className="mb-2 text-lg font-semibold text-body-text">
              Ошибка загрузки настроек
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              {error instanceof Error
                ? error.message
                : 'Не удалось загрузить настройки. Проверьте подключение к серверу.'}
            </p>
            <button
              onClick={() => refetch()}
              className="rounded-md bg-gold px-6 py-2 text-sm font-semibold text-black transition-colors hover:bg-gold-hover"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isSaving = saveMutation.isPending;
  const isResetting = resetMutation.isPending;

  // ====== Основной рендер ======

  return (
    <div className="min-h-screen bg-canvas-dark pb-6">
      <div className="mx-auto max-w-[900px]">
        {/* Шапка страницы */}
        <header className="mb-8">
          <h1 className="flex items-center gap-3 text-lg font-semibold text-body-text">
            <SettingsIcon className="h-5 w-5 text-gold" />
            Настройки системы
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Конфигурация глобальных параметров магазина
          </p>
        </header>

        {/* Inline-уведомление об успехе / ошибке */}
        {inlineMessage && (
          <div
            className={`mb-6 flex items-center gap-2 rounded-md border px-4 py-3 text-sm ${
              inlineMessage.type === 'success'
                ? 'border-price-drop/20 bg-price-drop/10 text-price-drop'
                : 'border-price-rise/20 bg-price-rise/10 text-price-rise'
            }`}
          >
            {inlineMessage.type === 'success' ? (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-price-drop/20 text-[10px]">
                ✓
              </span>
            ) : (
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            )}
            {inlineMessage.text}
          </div>
        )}

        {/* ======== Секции формы ======== */}
        <div className="space-y-6">
          {/* --- 1. Основные настройки --- */}
          <SectionCard icon={<Home className="h-5 w-5" />} title="Основные настройки">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Название магазина
                </label>
                <input
                  type="text"
                  name="siteName"
                  value={formData.siteName || ''}
                  onChange={handleInputChange}
                  placeholder="GoldPC"
                  className="w-full rounded-md border border-hairline-dark bg-surface-card px-3 py-2 text-sm text-body-text outline-none transition-colors placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Email для уведомлений
                </label>
                <input
                  type="email"
                  name="adminEmail"
                  value={formData.adminEmail || ''}
                  onChange={handleInputChange}
                  placeholder="admin@goldpc.by"
                  className="w-full rounded-md border border-hairline-dark bg-surface-card px-3 py-2 text-sm text-body-text outline-none transition-colors placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold"
                />
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Адрес магазина
              </label>
              <textarea
                name="storeAddress"
                value={formData.storeAddress || ''}
                onChange={handleInputChange}
                placeholder="г. Минск, ул. Примерная, д. 1"
                rows={2}
                className="w-full resize-vertical rounded-md border border-hairline-dark bg-surface-card px-3 py-2 text-sm text-body-text outline-none transition-colors placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold"
              />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Телефон
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleInputChange}
                  placeholder="+375 (29) 123-45-67"
                  className="w-full rounded-md border border-hairline-dark bg-surface-card px-3 py-2 text-sm text-body-text outline-none transition-colors placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Режим работы
                </label>
                <input
                  type="text"
                  name="workingHours"
                  value={formData.workingHours || ''}
                  onChange={handleInputChange}
                  placeholder="Пн-Пт: 09:00–19:00, Сб-Вс: 10:00–17:00"
                  className="w-full rounded-md border border-hairline-dark bg-surface-card px-3 py-2 text-sm text-body-text outline-none transition-colors placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold"
                />
              </div>
            </div>
          </SectionCard>

          {/* --- 2. Доставка --- */}
          <SectionCard icon={<Package className="h-5 w-5" />} title="Доставка">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Бесплатная доставка от (BYN)
                </label>
                <input
                  type="number"
                  name="freeDeliveryThreshold"
                  value={formData.freeDeliveryThreshold ?? ''}
                  onChange={handleInputChange}
                  min={0}
                  step={0.01}
                  placeholder="100"
                  className="w-full rounded-md border border-hairline-dark bg-surface-card px-3 py-2 text-sm text-body-text outline-none transition-colors placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Стоимость доставки (BYN)
                </label>
                <input
                  type="number"
                  name="deliveryCost"
                  value={formData.deliveryCost ?? ''}
                  onChange={handleInputChange}
                  min={0}
                  step={0.01}
                  placeholder="15"
                  className="w-full rounded-md border border-hairline-dark bg-surface-card px-3 py-2 text-sm text-body-text outline-none transition-colors placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold"
                />
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Сроки доставки
              </label>
              <select
                name="deliveryTime"
                value={formData.deliveryTime || ''}
                onChange={handleInputChange}
                className="w-full cursor-pointer appearance-none rounded-md border border-hairline-dark bg-surface-card px-3 py-2 pr-10 text-sm text-body-text outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold"
              >
                <option value="" disabled>
                  Выберите срок доставки
                </option>
                <option value="1-3">1–3 рабочих дня</option>
                <option value="3-5">3–5 рабочих дней</option>
                <option value="5-7">5–7 рабочих дней</option>
              </select>
            </div>
          </SectionCard>

          {/* --- 3. Уведомления --- */}
          <SectionCard icon={<Bell className="h-5 w-5" />} title="Уведомления">
            <div className="divide-y divide-hairline-dark">
              <ToggleSwitch
                name="twoFactorRequired"
                checked={formData.twoFactorRequired || false}
                onChange={handleInputChange}
                label="Двухфакторная аутентификация"
                description="Требовать 2FA для всех администраторов"
              />
              <ToggleSwitch
                name="auditLogging"
                checked={formData.auditLogging || false}
                onChange={handleInputChange}
                label="Журналирование действий"
                description="Записывать все действия пользователей"
              />
              <ToggleSwitch
                name="loginNotifications"
                checked={formData.loginNotifications || false}
                onChange={handleInputChange}
                label="Уведомления о входе"
                description="Отправлять email при входе с нового устройства"
              />
              <ToggleSwitch
                name="orderEmailNotifications"
                checked={formData.orderEmailNotifications || false}
                onChange={handleInputChange}
                label="Email уведомления о заказах"
                description="Отправлять менеджерам уведомления о новых заказах"
              />
              <ToggleSwitch
                name="smsNotifications"
                checked={formData.smsNotifications || false}
                onChange={handleInputChange}
                label="SMS уведомления клиентам"
                description="Отправлять клиентам SMS о статусе заказа"
              />
              <ToggleSwitch
                name="lowStockNotifications"
                checked={formData.lowStockNotifications || false}
                onChange={handleInputChange}
                label="Низкий остаток товаров"
                description="Уведомлять о товарах с низким остатком"
              />
            </div>
          </SectionCard>

          {/* --- 4. Режим обслуживания --- */}
          <SectionCard
            icon={<SettingsIcon className="h-5 w-5" />}
            title="Режим обслуживания"
            warning={!!formData.maintenanceMode}
          >
            <div className="flex items-center justify-between py-3">
              <div className="pr-4">
                <div className="text-sm font-medium text-body-text">Режим обслуживания</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Временно отключить публичный доступ к сайту
                </div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center flex-shrink-0">
                <input
                  type="checkbox"
                  name="maintenanceMode"
                  className="sr-only peer"
                  checked={formData.maintenanceMode || false}
                  onChange={handleInputChange}
                  aria-label="Режим обслуживания"
                />
                <div className="h-6 w-11 rounded-full bg-surface-elevated transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-gold peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-gold" />
              </label>
            </div>

            {formData.maintenanceMode && (
              <div className="mt-3 flex items-start gap-3 rounded-md border border-price-rise/20 bg-price-rise/10 px-4 py-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-price-rise" />
                <div>
                  <p className="text-sm font-medium text-price-rise">Внимание!</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    При включённом режиме обслуживания сайт будет недоступен для посетителей.
                    Доступ к административной панели сохранится.
                  </p>
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        {/* ======== Кнопки действий ======== */}
        <div className="mt-8 flex items-center gap-4 border-t border-hairline-dark pt-6">
          <button
            onClick={handleSave}
            disabled={isSaving || isResetting}
            className="flex items-center gap-2 rounded-md bg-gold px-6 py-2 text-sm font-semibold text-black transition-colors hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
          <button
            onClick={handleReset}
            disabled={isResetting || isSaving}
            className="flex items-center gap-2 rounded-md bg-surface-card px-4 py-2 text-sm font-semibold text-body-text transition-colors hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isResetting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            {isResetting ? 'Сброс...' : 'Сбросить настройки'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
