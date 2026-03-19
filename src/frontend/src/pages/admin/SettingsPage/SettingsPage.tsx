/**
 * Страница настроек системы
 * Форма для управления глобальными параметрами магазина
 */

import { useState, useEffect } from 'react';
import {
  settingsApi,
  type SiteSettings,
  type UpdateSettingsRequest,
} from '../../../api/admin';
import styles from './SettingsPage.module.css';

/**
 * Страница настроек системы
 */
export function SettingsPage() {
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
      const data = await settingsApi.getSettings();
      setSettings(data);
      setFormData(data);
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
      const updated = await settingsApi.updateSettings(formData);
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
      const defaultSettings = await settingsApi.resetSettings();
      setSettings(defaultSettings);
      setFormData(defaultSettings);
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
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Загрузка настроек...</p>
        </div>
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>{error || 'Настройки не найдены'}</p>
          <button onClick={fetchSettings} className={styles.retryBtn}>
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Настройки системы</h1>
        <p className={styles.subtitle}>Конфигурация параметров магазина</p>
      </header>

      {/* Основные настройки */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>
          <span className={styles.cardIcon}>🏠</span>
          Основные настройки
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Название магазина</label>
            <input
              type="text"
              name="siteName"
              className={styles.formInput}
              value={formData.siteName || ''}
              onChange={handleInputChange}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Email для уведомлений</label>
            <input
              type="email"
              name="adminEmail"
              className={styles.formInput}
              value={formData.adminEmail || ''}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Адрес магазина</label>
          <input
            type="text"
            name="storeAddress"
            className={styles.formInput}
            value={formData.storeAddress || ''}
            onChange={handleInputChange}
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Телефон</label>
            <input
              type="tel"
              name="phone"
              className={styles.formInput}
              value={formData.phone || ''}
              onChange={handleInputChange}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Режим работы</label>
            <input
              type="text"
              name="workingHours"
              className={styles.formInput}
              value={formData.workingHours || ''}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </div>

      {/* Настройки доставки */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>
          <span className={styles.cardIcon}>📦</span>
          Настройки доставки
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Бесплатная доставка от (BYN)</label>
            <input
              type="number"
              name="freeDeliveryThreshold"
              className={styles.formInput}
              value={formData.freeDeliveryThreshold || 0}
              onChange={handleInputChange}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Стоимость доставки (BYN)</label>
            <input
              type="number"
              name="deliveryCost"
              className={styles.formInput}
              value={formData.deliveryCost || 0}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Сроки доставки</label>
          <select
            name="deliveryTime"
            className={styles.formSelect}
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
      <div className={styles.card}>
        <div className={styles.cardTitle}>
          <span className={styles.cardIcon}>🔒</span>
          Безопасность
        </div>

        <div className={styles.toggleGroup}>
          <div>
            <div className={styles.toggleLabel}>Двухфакторная аутентификация</div>
            <div className={styles.toggleDesc}>
              Требовать 2FA для всех администраторов
            </div>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              name="twoFactorRequired"
              checked={formData.twoFactorRequired || false}
              onChange={handleInputChange}
            />
            <span className={styles.toggleSlider}></span>
          </label>
        </div>

        <div className={styles.toggleGroup}>
          <div>
            <div className={styles.toggleLabel}>Журналирование действий</div>
            <div className={styles.toggleDesc}>
              Записывать все действия пользователей
            </div>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              name="auditLogging"
              checked={formData.auditLogging || false}
              onChange={handleInputChange}
            />
            <span className={styles.toggleSlider}></span>
          </label>
        </div>

        <div className={styles.toggleGroup}>
          <div>
            <div className={styles.toggleLabel}>Уведомления о входе</div>
            <div className={styles.toggleDesc}>
              Отправлять email при входе с нового устройства
            </div>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              name="loginNotifications"
              checked={formData.loginNotifications || false}
              onChange={handleInputChange}
            />
            <span className={styles.toggleSlider}></span>
          </label>
        </div>
      </div>

      {/* Уведомления системы */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>
          <span className={styles.cardIcon}>🔔</span>
          Уведомления системы
        </div>

        <div className={styles.toggleGroup}>
          <div>
            <div className={styles.toggleLabel}>Email уведомления о заказах</div>
            <div className={styles.toggleDesc}>
              Отправлять менеджерам уведомления о новых заказах
            </div>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              name="orderEmailNotifications"
              checked={formData.orderEmailNotifications || false}
              onChange={handleInputChange}
            />
            <span className={styles.toggleSlider}></span>
          </label>
        </div>

        <div className={styles.toggleGroup}>
          <div>
            <div className={styles.toggleLabel}>SMS уведомления клиентам</div>
            <div className={styles.toggleDesc}>
              Отправлять клиентам SMS о статусе заказа
            </div>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              name="smsNotifications"
              checked={formData.smsNotifications || false}
              onChange={handleInputChange}
            />
            <span className={styles.toggleSlider}></span>
          </label>
        </div>

        <div className={styles.toggleGroup}>
          <div>
            <div className={styles.toggleLabel}>Низкий остаток товаров</div>
            <div className={styles.toggleDesc}>
              Уведомлять о товарах с низким остатком
            </div>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              name="lowStockNotifications"
              checked={formData.lowStockNotifications || false}
              onChange={handleInputChange}
            />
            <span className={styles.toggleSlider}></span>
          </label>
        </div>
      </div>

      {/* Режим обслуживания */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>
          <span className={styles.cardIcon}>⚙️</span>
          Режим обслуживания
        </div>

        <div className={styles.toggleGroup}>
          <div>
            <div className={styles.toggleLabel}>Режим обслуживания</div>
            <div className={styles.toggleDesc}>
              Временно отключить публичный доступ к сайту
            </div>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              name="maintenanceMode"
              checked={formData.maintenanceMode || false}
              onChange={handleInputChange}
            />
            <span className={styles.toggleSlider}></span>
          </label>
        </div>
      </div>

      {/* Действия */}
      <div className={styles.formActions}>
        <button
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
        <button
          className={styles.resetBtn}
          onClick={handleReset}
          disabled={resetting}
        >
          {resetting ? 'Сброс...' : 'Сбросить'}
        </button>
      </div>
    </div>
  );
}