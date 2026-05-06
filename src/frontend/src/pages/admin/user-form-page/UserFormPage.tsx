/**
 * Страница редактирования пользователя
 * Форма для редактирования данных пользователя
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdmin } from '../../../hooks/useAdmin';
import type { UserRole, UpdateUserRequest } from '../../../api/admin';
import type { User } from '../../../api/types';

const ROLE_LABELS: Record<UserRole, string> = {
  Client: 'Клиент',
  Manager: 'Менеджер',
  Master: 'Мастер',
  Admin: 'Администратор',
  Accountant: 'Бухгалтер',
};

const ROLE_OPTIONS: UserRole[] = ['Client', 'Manager', 'Master', 'Admin', 'Accountant'];

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  Admin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Manager: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Master: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  Client: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Accountant: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
};

/**
 * Страница редактирования пользователя
 */
export function UserFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNewUser = id === 'new';
  const { getUser, updateUser, deleteUser } = useAdmin();

  const [loading, setLoading] = useState(!isNewUser);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('Client');
  const [isActive, setIsActive] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isNewUser && id) {
      fetchUser();
    }
  }, [id, isNewUser]);

  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const userData = await getUser(id!);
      setUser(userData);
      setFirstName(userData.firstName);
      setLastName(userData.lastName);
      setEmail(userData.email);
      setPhone(userData.phone || '');
      setRole(userData.role);
      setIsActive(userData.isActive);
    } catch (err) {
      setError('Не удалось загрузить данные пользователя');
      console.error('Failed to fetch user:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!firstName.trim()) {
      errors.firstName = 'Имя обязательно';
    }

    if (!lastName.trim()) {
      errors.lastName = 'Фамилия обязательна';
    }

    if (!email.trim()) {
      errors.email = 'Email обязателен';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Некорректный формат email';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const data: UpdateUserRequest = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        role,
        isActive,
      };

      if (isNewUser) {
      } else {
        await usersAdminApi.updateUser(id!, data);
      }

      navigate('/admin/users');
    } catch (err) {
      setError('Не удалось сохранить пользователя. Попробуйте позже.');
      console.error('Failed to save user:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !window.confirm(`Вы уверены, что хотите удалить пользователя ${user.firstName} ${user.lastName}?\nЭто действие нельзя отменить.`)) {
      return;
    }

    setSaving(true);
    try {
      await usersAdminApi.deleteUser(user.id);
      navigate('/admin/users');
    } catch (err) {
      setError('Не удалось удалить пользователя');
      console.error('Failed to delete user:', err);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getInitials = () => {
    return `${firstName.charAt(0) || ''}${lastName.charAt(0) || ''}`;
  };

  if (loading) {
    return (
      <div className="p-8 min-h-screen bg-gray-900 text-white">
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <div className="w-8 h-8 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p>Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen bg-gray-900 text-white">
      <header className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-2 tracking-tight text-white">
            {isNewUser ? 'Новый пользователь' : 'Редактирование пользователя'}
          </h1>
          <nav className="flex items-center gap-2 text-xs text-gray-400">
            <a href="/admin/users" className="text-gray-400 hover:text-blue-500 transition-colors no-underline">Пользователи</a>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            <span className="text-gray-500">
              {isNewUser ? 'Создание' : 'Редактирование'}
            </span>
          </nav>
        </div>
      </header>

      {error && (
        <div className="flex items-center justify-between px-4 py-3 mb-6 bg-red-500/10 border border-red-500/30 text-red-600">
          <p className="m-0 text-sm">{error}</p>
          <button onClick={() => setError(null)} className="bg-transparent border-none text-red-600 text-xl cursor-pointer px-1 leading-none">
            ×
          </button>
        </div>
      )}

      <form className="bg-gray-800 border border-gray-700 p-8 max-w-[640px]" onSubmit={handleSubmit}>
        {/* Avatar Section */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-[0.08em] mb-5 pb-3 border-b border-gray-700">Аватар</h2>
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-gray-700 border border-gray-600 flex items-center justify-center text-gray-400 text-2xl font-medium">
              {getInitials()}
            </div>
            <div className="flex flex-col gap-2">
              <button type="button" className="inline-flex items-center gap-2 px-4 py-2.5 bg-transparent border border-gray-600 text-gray-400 text-sm cursor-pointer hover:border-blue-500 hover:text-blue-500 transition-all font-inherit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Загрузить фото
              </button>
              <span className="text-xs text-gray-400">JPG, PNG. Максимум 2MB</span>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-[0.08em] mb-5 pb-3 border-b border-gray-700">Основная информация</h2>
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2 mb-5">
              <label className="text-sm font-medium text-gray-400">
                Имя <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                className={`px-4 py-3 bg-gray-700 border border-gray-600 text-white text-sm transition-all focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 ${formErrors.firstName ? 'border-red-500' : ''}`}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Введите имя"
              />
              {formErrors.firstName && (
                <span className="text-xs text-red-500">{formErrors.firstName}</span>
              )}
            </div>

            <div className="flex flex-col gap-2 mb-5">
              <label className="text-sm font-medium text-gray-400">
                Фамилия <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                className={`px-4 py-3 bg-gray-700 border border-gray-600 text-white text-sm transition-all focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 ${formErrors.lastName ? 'border-red-500' : ''}`}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Введите фамилию"
              />
              {formErrors.lastName && (
                <span className="text-xs text-red-500">{formErrors.lastName}</span>
              )}
            </div>

            <div className="flex flex-col gap-2 mb-5">
              <label className="text-sm font-medium text-gray-400">
                Email <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="email"
                className={`px-4 py-3 bg-gray-700 border border-gray-600 text-white text-sm transition-all focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 ${formErrors.email ? 'border-red-500' : ''}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
              />
              {formErrors.email && (
                <span className="text-xs text-red-500">{formErrors.email}</span>
              )}
            </div>

            <div className="flex flex-col gap-2 mb-5">
              <label className="text-sm font-medium text-gray-400">Телефон</label>
              <input
                type="tel"
                className="px-4 py-3 bg-gray-700 border border-gray-600 text-white text-sm transition-all focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+375 (__) ___-__-__"
              />
            </div>
          </div>
        </div>

        {/* Role Section */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-[0.08em] mb-5 pb-3 border-b border-gray-700">Роли и права</h2>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-400">Назначенные роли</label>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((roleOption) => (
                <button
                  key={roleOption}
                  type="button"
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-700 border border-gray-600 text-sm text-gray-400 cursor-pointer transition-all font-inherit hover:border-blue-500/50 ${
                    role === roleOption ? 'bg-blue-500/10 border-blue-500 text-blue-500' : ''
                  }`}
                  onClick={() => setRole(roleOption)}
                >
                  {ROLE_ICONS[roleOption]}
                  {ROLE_LABELS[roleOption]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Status Section */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-[0.08em] mb-5 pb-3 border-b border-gray-700">Статус</h2>
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  className="w-12 h-6 appearance-none bg-gray-700 border border-gray-600 cursor-pointer relative transition-all checked:bg-blue-500 checked:border-blue-500 before:content-[''] before:absolute before:w-4 before:h-4 before:left-0.5 before:bottom-0.5 before:bg-gray-400 before:transition-all checked:before:translate-x-6 checked:before:bg-white before:rounded-full rounded-full cursor-pointer"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <label htmlFor="isActive" className="text-sm text-white cursor-pointer">
                  Аккаунт активен
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info (only for existing users) */}
        {!isNewUser && user && (
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-[0.08em] mb-5 pb-3 border-b border-gray-700">Дополнительно</h2>
            <div className="grid grid-cols-2 gap-5">
              <div className="flex flex-col gap-2 mb-5">
                <label className="text-sm font-medium text-gray-400">Дата регистрации</label>
                <input
                  type="text"
                  className="px-4 py-3 bg-gray-800 border border-gray-600 text-gray-400 text-sm cursor-not-allowed"
                  value={formatDate(user.createdAt)}
                  readOnly
                />
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label className="text-sm font-medium text-gray-400">ID пользователя</label>
                <input
                  type="text"
                  className="px-4 py-3 bg-gray-800 border border-gray-600 text-gray-400 text-sm cursor-not-allowed"
                  value={user.id}
                  readOnly
                />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-700 mt-8">
          {!isNewUser && (
            <button
              type="button"
              className="inline-flex items-center gap-2 px-6 py-3 bg-transparent text-red-500 border border-red-500/30 text-sm font-semibold cursor-pointer hover:bg-red-500/10 hover:border-red-500 transition-all mr-auto"
              onClick={handleDelete}
              disabled={saving}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              Удалить
            </button>
          )}
          <button
            type="button"
            className="inline-flex items-center gap-2 px-6 py-3 bg-transparent text-gray-400 border border-gray-600 text-sm font-semibold cursor-pointer hover:border-gray-400 hover:text-white transition-all"
            onClick={() => navigate('/admin/users')}
          >
            Отмена
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white border-none text-sm font-semibold cursor-pointer hover:bg-blue-600 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  );
}