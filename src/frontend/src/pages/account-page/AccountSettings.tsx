import { useState, useEffect } from 'react';
import { Settings, Lock, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';
import { PageHero } from '../../components/ui/PageHero';
import { ChangePasswordModal } from '../../components/account/change-password-modal/ChangePasswordModal';
import { DeleteAccountModal } from '../../components/account/delete-account-modal/DeleteAccountModal';

const inputClass =
  'w-full bg-elevated border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-info-blue focus:ring-1 focus:ring-info-blue outline-none transition-colors';

const labelClass = 'block text-sm font-medium text-foreground mb-1.5';

const sectionClass = 'bg-card rounded-xl p-6 border border-border space-y-4';

/**
 * AccountSettings — страница настроек личного кабинета.
 *
 * Секции: профиль, безопасность, опасная зона.
 */
export function AccountSettings() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  useEffect(() => {
    if (user != null) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Данные сохранены', 'success');
  };

  return (
    <div className="space-y-6">
      <PageHero title="Настройки" icon={Settings} />

      {/* Section 1 — Profile */}
      <div className={sectionClass}>
        <h2 className="text-lg font-semibold text-foreground">Профиль</h2>

        <form onSubmit={(e) => void handleSave(e)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass} htmlFor="settings-firstName">
                Имя
              </label>
              <input
                type="text"
                id="settings-firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={inputClass}
                placeholder="Имя"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="settings-lastName">
                Фамилия
              </label>
              <input
                type="text"
                id="settings-lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={inputClass}
                placeholder="Фамилия"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="settings-email">
                Email
              </label>
              <input
                type="email"
                id="settings-email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={inputClass}
                placeholder="Email"
                disabled
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email нельзя изменить
              </p>
            </div>
            <div>
              <label className={labelClass} htmlFor="settings-phone">
                Телефон
              </label>
              <input
                type="tel"
                id="settings-phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={inputClass}
                placeholder="+375 (XX) XXX-XX-XX"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-gold text-gold-ink px-6 py-2.5 rounded-lg font-medium hover:bg-gold-active transition-colors"
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>

      {/* Section 2 — Security */}
      <div className={sectionClass}>
        <h2 className="text-lg font-semibold text-foreground">Безопасность</h2>

        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-elevated flex items-center justify-center shrink-0">
              <Lock size={20} className="text-muted-foreground" />
            </div>
            <div>
              <div className="text-foreground font-medium">Пароль</div>
              <div className="text-sm text-muted-foreground">
                Изменить пароль аккаунта
              </div>
            </div>
          </div>
          <button
            onClick={() => setPasswordModalOpen(true)}
            className="bg-elevated text-foreground px-4 py-2 rounded-lg text-sm transition-colors hover:bg-elevated/80 shrink-0"
          >
            Изменить
          </button>
        </div>

        {/* Password requirements hint */}
        <div className="bg-elevated rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock size={14} className="text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Требования к паролю:
            </span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc ml-5">
            <li>Минимум 8 символов</li>
            <li>Заглавная буква (A-Z)</li>
            <li>Строчная буква (a-z)</li>
            <li>Цифра (0-9)</li>
          </ul>
        </div>
      </div>

      {/* Danger Zone */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2">
          <AlertTriangle size={20} className="text-destructive" />
          <h2 className="text-lg font-semibold text-foreground">
            Опасная зона
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          После удаления аккаунта все данные будут безвозвратно удалены. Это
          действие нельзя отменить.
        </p>
        <button
          onClick={() => setDeleteModalOpen(true)}
          className="bg-destructive text-white px-6 py-2.5 rounded-lg font-medium hover:bg-destructive/90 transition-colors"
        >
          Удалить аккаунт
        </button>
      </div>

      {/* Change password modal */}
      <ChangePasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />

      {/* Delete account modal */}
      <DeleteAccountModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}
