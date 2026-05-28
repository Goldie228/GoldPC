/**
 * Страница настроек системы
 * Форма для управления глобальными параметрами магазина
 */

import { useState, useEffect } from 'react';
import { useAdmin } from '../../../hooks/useAdmin';
import type { SiteSettings, UpdateSettingsRequest } from '../../../api/admin';
import { Home, Package, Lock, Bell, Settings, Loader2 } from 'lucide-react';

/**
 * Страница настроек системы
 */
export function SettingsPage() {
  const { getSettings, updateSettings, resetSettings } = useAdmin();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<UpdateSettingsRequest>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getSettings();
      setSettings(data);
      setFormData(data ?? {});
    } catch (err) {
      setError('Не удалось загрузить настройки. Попробуйте позже.');
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateSettings(formData);
      setSettings(updated);
      alert('Настройки успешно сохранены');
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Не удалось сохранить настройки');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Сбросить все настройки к значениям по умолчанию?')) return;
    
    setResetting(true);
    try {
      const defaultSettings = await resetSettings();
      setSettings(defaultSettings);
      setFormData(defaultSettings ?? {});
      alert('Настройки сброшены к значениям по умолчанию');
    } catch (err) {
      console.error('Failed to reset settings:', err);
      alert('Не удалось сбросить настройки');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-[900px] mx-auto">
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-accent mb-4" />
          <p>Загрузка настроек...</p>
        </div>
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="p-8 max-w-[900px] mx-auto">
        <div className="flex flex-col items-center justify-center py-12 text-error min-h-[400px]">
          <p>{error || 'Настройки не найдены'}</p>
          <button onClick={fetchSettings} className="mt-4 px-4 py-2 bg-accent text-gold-ink rounded-lg text-sm hover:bg-accent-bright transition-colors">
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

    return (
    <div className="p-8 max-w-[900px] mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-2 tracking-tight">Настройки системы</h1>
        <p className="text-sm text-muted-foreground">Конфигурация параметров магазина</p>
      </header>

      {/* Основные настройки */}
      <div className="bg-card border border-border p-6 mb-6">
        <div className="text-base font-semibold text-foreground mb-5 flex items-center gap-3 pb-4 border-b border-border">
          <Home className="w-4 h-4 text-accent" />
          Основные настройки
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="mb-6">
            <label className="block text-xs font-medium text-muted-foreground mb-2.5 uppercase tracking-[0.05em]">Название магазина</label>
            <input
              type="text"
              name="siteName"
              className="w-full px-4 py-3 bg-elevated border border-border text-foreground text-sm transition-colors focus:outline-none focus:border-info-blue"
              value={formData.siteName || ''}
              onChange={handleInputChange}
            />
          </div>
          <div className="mb-6">
            <label className="block text-xs font-medium text-muted-foreground mb-2.5 uppercase tracking-[0.05em]">Email для уведомлений</label>
            <input
              type="email"
              name="adminEmail"
              className="w-full px-4 py-3 bg-elevated border border-border text-foreground text-sm transition-colors focus:outline-none focus:border-info-blue"
              value={formData.adminEmail || ''}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-medium text-muted-foreground mb-2.5 uppercase tracking-[0.05em]">Адрес магазина</label>
          <input
            type="text"
            name="storeAddress"
            className="w-full px-4 py-3 bg-elevated border border-border text-foreground text-sm transition-colors focus:outline-none focus:border-info-blue"
            value={formData.storeAddress || ''}
            onChange={handleInputChange}
          />
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="mb-6">
            <label className="block text-xs font-medium text-muted-foreground mb-2.5 uppercase tracking-[0.05em]">Телефон</label>
            <input
              type="tel"
              name="phone"
              className="w-full px-4 py-3 bg-elevated border border-border text-foreground text-sm transition-colors focus:outline-none focus:border-info-blue"
              value={formData.phone || ''}
              onChange={handleInputChange}
            />
          </div>
          <div className="mb-6">
            <label className="block text-xs font-medium text-muted-foreground mb-2.5 uppercase tracking-[0.05em]">Режим работы</label>
            <input
              type="text"
              name="workingHours"
              className="w-full px-4 py-3 bg-elevated border border-border text-foreground text-sm transition-colors focus:outline-none focus:border-info-blue"
              value={formData.workingHours || ''}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </div>

      {/* Настройки доставки */}
      <div className="bg-card border border-border p-6 mb-6">
        <div className="text-base font-semibold text-foreground mb-5 flex items-center gap-3 pb-4 border-b border-border">
          <Package className="w-4 h-4 text-accent" />
          Настройки доставки
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="mb-6">
            <label className="block text-xs font-medium text-muted-foreground mb-2.5 uppercase tracking-[0.05em]">Бесплатная доставка от (BYN)</label>
            <input
              type="number"
              name="freeDeliveryThreshold"
              className="w-full px-4 py-3 bg-elevated border border-border text-foreground text-sm transition-colors focus:outline-none focus:border-info-blue"
              value={formData.freeDeliveryThreshold || 0}
              onChange={handleInputChange}
            />
          </div>
          <div className="mb-6">
            <label className="block text-xs font-medium text-muted-foreground mb-2.5 uppercase tracking-[0.05em]">Стоимость доставки (BYN)</label>
            <input
              type="number"
              name="deliveryCost"
              className="w-full px-4 py-3 bg-elevated border border-border text-foreground text-sm transition-colors focus:outline-none focus:border-info-blue"
              value={formData.deliveryCost || 0}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-medium text-muted-foreground mb-2.5 uppercase tracking-[0.05em]">Сроки доставки</label>
          <select
            name="deliveryTime"
            className="w-full px-4 py-3 bg-elevated border border-border text-foreground text-sm transition-colors focus:outline-none focus:border-info-blue appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2371717a%27 stroke-width=%272%27%3E%3Cpolyline points=%276 9 12 15 18 9%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_1rem_center] pr-10 cursor-pointer"
            value={formData.deliveryTime || ''}
            onChange={handleInputChange}
          >
            <option value="1-3">1-3 рабочих дня</option>
            <option value="3-5">3-5 рабочих дней</option>
            <option value="5-7">5-7 рабочих дней</option>
          </select>
        </div>
      </div>

      {/* Безопасность */}
      <div className="bg-card border border-border p-6 mb-6">
        <div className="text-base font-semibold text-foreground mb-5 flex items-center gap-3 pb-4 border-b border-border">
          <Lock className="w-4 h-4 text-accent" />
          Безопасность
        </div>

        <div className="flex items-center justify-between py-3 border-b border-border">
          <div>
            <div className="text-sm text-foreground">Двухфакторная аутентификация</div>
            <div className="text-xs text-muted-foreground mt-1">
              Требовать 2FA для всех администраторов
            </div>
          </div>
          <label className="relative w-12 h-6 flex-shrink-0 cursor-pointer">
            <input
              type="checkbox"
              name="twoFactorRequired"
              className="opacity-0 w-0 h-0 peer"
              checked={formData.twoFactorRequired || false}
              onChange={handleInputChange}
            />
            <span className="absolute inset-0 bg-elevated border border-border peer-checked:bg-accent peer-checked:border-accent transition-all rounded-full cursor-pointer before:content-[''] before:absolute before:h-4 before:w-4 before:left-0.5 before:bottom-0.5 before:bg-muted-foreground peer-checked:before:bg-white before:transition-all peer-checked:before:translate-x-6 before:rounded-full"></span>
          </label>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-border">
          <div>
            <div className="text-sm text-foreground">Журналирование действий</div>
            <div className="text-xs text-muted-foreground mt-1">
              Записывать все действия пользователей
            </div>
          </div>
          <label className="relative w-12 h-6 flex-shrink-0 cursor-pointer">
            <input
              type="checkbox"
              name="auditLogging"
              className="opacity-0 w-0 h-0 peer"
              checked={formData.auditLogging || false}
              onChange={handleInputChange}
            />
            <span className="absolute inset-0 bg-elevated border border-border peer-checked:bg-accent peer-checked:border-accent transition-all rounded-full cursor-pointer before:content-[''] before:absolute before:h-4 before:w-4 before:left-0.5 before:bottom-0.5 before:bg-muted-foreground peer-checked:before:bg-white before:transition-all peer-checked:before:translate-x-6 before:rounded-full"></span>
          </label>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-border">
          <div>
            <div className="text-sm text-foreground">Уведомления о входе</div>
            <div className="text-xs text-muted-foreground mt-1">
              Отправлять email при входе с нового устройства
            </div>
          </div>
          <label className="relative w-12 h-6 flex-shrink-0 cursor-pointer">
            <input
              type="checkbox"
              name="loginNotifications"
              className="opacity-0 w-0 h-0 peer"
              checked={formData.loginNotifications || false}
              onChange={handleInputChange}
            />
            <span className="absolute inset-0 bg-elevated border border-border peer-checked:bg-accent peer-checked:border-accent transition-all rounded-full cursor-pointer before:content-[''] before:absolute before:h-4 before:w-4 before:left-0.5 before:bottom-0.5 before:bg-muted-foreground peer-checked:before:bg-white before:transition-all peer-checked:before:translate-x-6 before:rounded-full"></span>
          </label>
        </div>
      </div>

      {/* Уведомления системы */}
      <div className="bg-card border border-border p-6 mb-6">
        <div className="text-base font-semibold text-foreground mb-5 flex items-center gap-3 pb-4 border-b border-border">
          <Bell className="w-4 h-4 text-accent" />
          Уведомления системы
        </div>

        <div className="flex items-center justify-between py-3 border-b border-border">
          <div>
            <div className="text-sm text-foreground">Email уведомления о заказах</div>
            <div className="text-xs text-muted-foreground mt-1">
              Отправлять менеджерам уведомления о новых заказах
            </div>
          </div>
          <label className="relative w-12 h-6 flex-shrink-0 cursor-pointer">
            <input
              type="checkbox"
              name="orderEmailNotifications"
              className="opacity-0 w-0 h-0 peer"
              checked={formData.orderEmailNotifications || false}
              onChange={handleInputChange}
            />
            <span className="absolute inset-0 bg-elevated border border-border peer-checked:bg-accent peer-checked:border-accent transition-all rounded-full cursor-pointer before:content-[''] before:absolute before:h-4 before:w-4 before:left-0.5 before:bottom-0.5 before:bg-muted-foreground peer-checked:before:bg-white before:transition-all peer-checked:before:translate-x-6 before:rounded-full"></span>
          </label>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-border">
          <div>
            <div className="text-sm text-foreground">SMS уведомления клиентам</div>
            <div className="text-xs text-muted-foreground mt-1">
              Отправлять клиентам SMS о статусе заказа
            </div>
          </div>
          <label className="relative w-12 h-6 flex-shrink-0 cursor-pointer">
            <input
              type="checkbox"
              name="smsNotifications"
              className="opacity-0 w-0 h-0 peer"
              checked={formData.smsNotifications || false}
              onChange={handleInputChange}
            />
            <span className="absolute inset-0 bg-elevated border border-border peer-checked:bg-accent peer-checked:border-accent transition-all rounded-full cursor-pointer before:content-[''] before:absolute before:h-4 before:w-4 before:left-0.5 before:bottom-0.5 before:bg-muted-foreground peer-checked:before:bg-white before:transition-all peer-checked:before:translate-x-6 before:rounded-full"></span>
          </label>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-border">
          <div>
            <div className="text-sm text-foreground">Низкий остаток товаров</div>
            <div className="text-xs text-muted-foreground mt-1">
              Уведомлять о товарах с низким остатком
            </div>
          </div>
          <label className="relative w-12 h-6 flex-shrink-0 cursor-pointer">
            <input
              type="checkbox"
              name="lowStockNotifications"
              className="opacity-0 w-0 h-0 peer"
              checked={formData.lowStockNotifications || false}
              onChange={handleInputChange}
            />
            <span className="absolute inset-0 bg-elevated border border-border peer-checked:bg-accent peer-checked:border-accent transition-all rounded-full cursor-pointer before:content-[''] before:absolute before:h-4 before:w-4 before:left-0.5 before:bottom-0.5 before:bg-muted-foreground peer-checked:before:bg-white before:transition-all peer-checked:before:translate-x-6 before:rounded-full"></span>
          </label>
        </div>
      </div>

      {/* Режим обслуживания */}
      <div className="bg-card border border-border p-6 mb-6">
        <div className="text-base font-semibold text-foreground mb-5 flex items-center gap-3 pb-4 border-b border-border">
          <Settings className="w-4 h-4 text-accent" />
          Режим обслуживания
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <div className="text-sm text-foreground">Режим обслуживания</div>
            <div className="text-xs text-muted-foreground mt-1">
              Временно отключить публичный доступ к сайту
            </div>
          </div>
          <label className="relative w-12 h-6 flex-shrink-0 cursor-pointer">
            <input
              type="checkbox"
              name="maintenanceMode"
              className="opacity-0 w-0 h-0 peer"
              checked={formData.maintenanceMode || false}
              onChange={handleInputChange}
            />
            <span className="absolute inset-0 bg-elevated border border-border peer-checked:bg-accent peer-checked:border-accent transition-all rounded-full cursor-pointer before:content-[''] before:absolute before:h-4 before:w-4 before:left-0.5 before:bottom-0.5 before:bg-muted-foreground peer-checked:before:bg-white before:transition-all peer-checked:before:translate-x-6 before:rounded-full"></span>
          </label>
        </div>
      </div>

      {/* Действия */}
      <div className="flex gap-3 mt-6 pt-6 border-t border-border">
        <button
          className="px-6 py-3 bg-accent text-gold-ink border-none text-sm font-semibold cursor-pointer hover:bg-accent-bright transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
        <button
          className="px-6 py-3 bg-transparent text-muted-foreground border border-border text-sm font-semibold cursor-pointer hover:border-muted-foreground hover:text-foreground transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={handleReset}
          disabled={resetting}
        >
          {resetting ? 'Сброс...' : 'Сбросить'}
        </button>
      </div>
    </div>
  );
}