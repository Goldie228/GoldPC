import { useState, useEffect } from 'react';
import { Lock, Clock, Loader2, Camera } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/api/authService';
import { useToast } from '@/hooks/useToast';
import { ChangePasswordModal } from '@/components/account/change-password-modal/ChangePasswordModal';
import { LoginHistoryModal } from '@/components/account/login-history-modal/LoginHistoryModal';
import { AvatarCropModal } from '@/components/account/avatar-crop-modal/AvatarCropModal';
import { PhoneInput } from '@/components/ui/PhoneInput';

type SecurityModal = 'password' | 'history' | null;

/**
 * AccountProfile - User profile editing page
 *
 * Features:
 * - Personal data form with dark inputs
 * - Security settings section (change password, 2FA, login history)
 */
export function AccountProfile() {
  const { user, setUser } = useAuthStore();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [activeModal, setActiveModal] = useState<SecurityModal>(null);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);

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

  // Mobile keyboard handling — adjust padding when keyboard opens
  useEffect(() => {
    const handleResize = () => {
      const vp = window.visualViewport;
      if (vp && vp.height < window.screen.height * 0.8) {
        document.documentElement.style.setProperty('--keyboard-offset', `${window.innerHeight - vp.height}px`);
      } else {
        document.documentElement.style.setProperty('--keyboard-offset', '0px');
      }
    };
    window.visualViewport?.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarUpload = async (file: File) => {
    setAvatarSaving(true);
    try {
      const result = await authService.uploadAvatar(file);
      if (result?.avatarUrl && user) {
        setUser({ ...user, avatarUrl: result.avatarUrl });
        showToast('Аватар обновлён', 'success');
        setAvatarModalOpen(false);
      }
    } catch {
      showToast('Ошибка загрузки аватара', 'error');
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedUser = await authService.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      });
      if (updatedUser != null) {
        setUser(updatedUser);
        showToast('Данные профиля сохранены', 'success');
      }
    } catch (error) {
      showToast('Ошибка сохранения данных', 'error');
    } finally {
      setSaving(false);
    }
  };

  const initials = formData.firstName && formData.lastName
    ? `${formData.firstName.charAt(0)}${formData.lastName.charAt(0)}`
    : formData.email?.charAt(0) || '?';

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-[1280px] mx-auto px-4 py-8">
        {/* Page Header */}
        <h1 className="text-2xl font-bold text-foreground mb-1">Профиль</h1>
        <p className="text-muted-foreground mb-6">Управление личными данными</p>

        {/* Avatar Section Card */}
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <div className="flex items-center gap-4">
            {/* Avatar with hover upload overlay */}
            <div className="relative shrink-0 group cursor-pointer" onClick={() => setAvatarModalOpen(true)}>
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Аватар"
                  className="w-16 h-16 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-elevated text-foreground text-xl font-bold flex items-center justify-center">
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={20} className="text-white" />
              </div>
            </div>
            <div>
              <div className="font-semibold text-foreground">Аватар профиля</div>
              <div className="text-sm text-muted-foreground">
                {user?.avatarUrl ? 'Нажмите чтобы заменить' : 'Нажмите чтобы загрузить'}
              </div>
            </div>
          </div>
        </div>

        {/* Personal Info Form Card */}
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">Личные данные</h2>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5" htmlFor="firstName">
                  Имя
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  className="w-full bg-elevated border border-border rounded-lg p-2.5 text-foreground placeholder-muted-foreground outline-none focus:border-info-blue transition-colors"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Введите имя"
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1.5" htmlFor="lastName">
                  Фамилия
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  className="w-full bg-elevated border border-border rounded-lg p-2.5 text-foreground placeholder-muted-foreground outline-none focus:border-info-blue transition-colors"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Введите фамилию"
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1.5" htmlFor="email">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full bg-elevated border border-border rounded-lg p-2.5 text-foreground placeholder-muted-foreground outline-none focus:border-info-blue transition-colors"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Введите email"
                  disabled
                />
                <p className="text-xs text-muted-foreground mt-1">Email нельзя изменить</p>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1.5" htmlFor="phone">
                  Телефон
                </label>
                <PhoneInput
                  value={formData.phone}
                  onChange={(value) => setFormData((prev) => ({ ...prev, phone: value }))}
                  placeholder="+375 (XX) XXX-XX-XX"
                  className="bg-elevated border border-border text-foreground placeholder-muted-foreground focus:border-info-blue"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="submit"
                disabled={saving}
                className="bg-gold text-gold-ink hover:bg-gold-active px-6 py-2.5 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                Сохранить изменения
              </button>
            </div>
          </form>
        </div>

        {/* Security Settings Card */}
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Безопасность</h2>

          <div className="divide-y divide-border">
            {/* Password */}
            <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-elevated flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-foreground font-medium">Пароль</div>
                  <div className="text-sm text-muted-foreground">Изменить пароль аккаунта</div>
                </div>
              </div>
              <button 
                onClick={() => setActiveModal('password')}
                className="bg-elevated text-foreground hover:bg-elevated px-4 py-2 rounded-lg text-sm transition-colors shrink-0"
              >
                Изменить
              </button>
            </div>

            {/* Login History */}
            <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-elevated flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-foreground font-medium">История входов</div>
                  <div className="text-sm text-muted-foreground">Просмотр последних активностей</div>
                </div>
              </div>
              <button 
                onClick={() => setActiveModal('history')}
                className="text-muted-foreground hover:text-foreground px-4 py-2 rounded-lg text-sm transition-colors shrink-0"
              >
                Просмотреть
              </button>
            </div>
          </div>
        </div>

        {/* Security Modals */}
        <ChangePasswordModal
          isOpen={activeModal === 'password'}
          onClose={() => setActiveModal(null)}
        />
        <LoginHistoryModal
          isOpen={activeModal === 'history'}
          onClose={() => setActiveModal(null)}
        />
        <AvatarCropModal
          isOpen={avatarModalOpen}
          onClose={() => setAvatarModalOpen(false)}
          onCrop={handleAvatarUpload}
          isSaving={avatarSaving}
        />
      </div>
    </div>
  );
}
