import { useState, useEffect } from 'react';
import { Lock, Clock, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../api/authService';
import { useToast } from '../../hooks/useToast';
import { ChangePasswordModal } from '../../components/account/change-password-modal/ChangePasswordModal';
import { LoginHistoryModal } from '../../components/account/login-history-modal/LoginHistoryModal';
import { PhoneInput } from '../../components/ui/PhoneInput';

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

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  useEffect(() => {
    if (user) {
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Выберите файл изображения', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Размер файла не должен превышать 5 МБ', 'error');
      return;
    }

    try {
      const result = await authService.uploadAvatar(file);
      if (result?.avatarUrl) {
        setUser({ ...user!, avatarUrl: result.avatarUrl });
        showToast('Аватар обновлён', 'success');
      }
    } catch {
      showToast('Ошибка загрузки аватара', 'error');
    }

    // Reset input so same file can be re-selected
    e.target.value = '';
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
      if (updatedUser) {
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
    <div className="bg-[#0b0e11] min-h-screen">
      <div className="max-w-[1280px] mx-auto px-4 py-8">
        {/* Page Header */}
        <h1 className="text-2xl font-bold text-[#eaecef] mb-1">Профиль</h1>
        <p className="text-[#707a8a] mb-6">Управление личными данными</p>

        {/* Avatar Section Card */}
        <div className="bg-[#1e2329] rounded-xl border border-[#2b3139] p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Аватар"
                  className="w-16 h-16 rounded-full object-cover border-2 border-[#FCD535]"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#FCD535] text-[#181a20] text-xl font-bold flex items-center justify-center">
                  {initials}
                </div>
              )}
              <label
                htmlFor="avatar-upload"
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#2b3139] border border-[#3f3f46] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#3f3f46] transition-colors"
              >
                <svg className="w-3 h-3 text-[#eaecef]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </label>
            </div>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <div>
              <div className="font-semibold text-[#eaecef]">Аватар профиля</div>
              <div className="text-sm text-[#707a8a]">
                {user?.avatarUrl ? 'Нажмите на иконку + чтобы заменить' : 'Нажмите + чтобы загрузить'}
              </div>
            </div>
          </div>
        </div>

        {/* Personal Info Form Card */}
        <div className="bg-[#1e2329] rounded-xl border border-[#2b3139] p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-[#eaecef]">Личные данные</h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#707a8a] mb-1.5" htmlFor="firstName">
                  Имя
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  className="w-full bg-[#2b3139] border border-[#2b3139] rounded-lg p-2.5 text-[#eaecef] placeholder-[#707a8a] outline-none focus:border-[#FCD535] transition-colors"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Введите имя"
                />
              </div>

              <div>
                <label className="block text-sm text-[#707a8a] mb-1.5" htmlFor="lastName">
                  Фамилия
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  className="w-full bg-[#2b3139] border border-[#2b3139] rounded-lg p-2.5 text-[#eaecef] placeholder-[#707a8a] outline-none focus:border-[#FCD535] transition-colors"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Введите фамилию"
                />
              </div>

              <div>
                <label className="block text-sm text-[#707a8a] mb-1.5" htmlFor="email">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full bg-[#2b3139] border border-[#2b3139] rounded-lg p-2.5 text-[#eaecef] placeholder-[#707a8a] outline-none focus:border-[#FCD535] transition-colors"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Введите email"
                  disabled
                />
                <p className="text-xs text-[#707a8a] mt-1">Email нельзя изменить</p>
              </div>

              <div>
                <label className="block text-sm text-[#707a8a] mb-1.5" htmlFor="phone">
                  Телефон
                </label>
                <PhoneInput
                  value={formData.phone}
                  onChange={(value) => setFormData((prev) => ({ ...prev, phone: value }))}
                  placeholder="+375 (XX) XXX-XX-XX"
                  className="bg-[#2b3139] border border-[#2b3139] text-[#eaecef] placeholder-[#707a8a] focus:border-[#FCD535]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#FCD535] text-[#181a20] hover:bg-[#f0b90b] px-6 py-2.5 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                Сохранить изменения
              </button>
            </div>
          </form>
        </div>

        {/* Security Settings Card */}
        <div className="bg-[#1e2329] rounded-xl border border-[#2b3139] p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#eaecef] mb-4">Безопасность</h2>

          <div className="divide-y divide-[#2b3139]">
            {/* Password */}
            <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#2b3139] flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-[#707a8a]" />
                </div>
                <div>
                  <div className="text-[#eaecef] font-medium">Пароль</div>
                  <div className="text-sm text-[#707a8a]">Изменить пароль аккаунта</div>
                </div>
              </div>
              <button 
                onClick={() => setActiveModal('password')}
                className="bg-[#2b3139] text-[#eaecef] hover:bg-[#3f3f46] px-4 py-2 rounded-lg text-sm transition-colors shrink-0"
              >
                Изменить
              </button>
            </div>

            {/* Login History */}
            <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#2b3139] flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-[#707a8a]" />
                </div>
                <div>
                  <div className="text-[#eaecef] font-medium">История входов</div>
                  <div className="text-sm text-[#707a8a]">Просмотр последних активностей</div>
                </div>
              </div>
              <button 
                onClick={() => setActiveModal('history')}
                className="text-[#707a8a] hover:text-[#eaecef] px-4 py-2 rounded-lg text-sm transition-colors shrink-0"
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
      </div>
    </div>
  );
}
