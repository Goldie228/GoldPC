/**
 * Страница редактирования пользователя
 * Форма для редактирования данных пользователя
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import type { UserRole, UpdateUserRequest, CreateUserRequest } from '@/api/admin';
import { usersAdminApi } from '@/api/admin';
import type { User } from '@/api/types';

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
  const { getUser } = useAdmin();

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
  const [password, setPassword] = useState('');
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
      if (!userData) return;
      setFirstName(userData.firstName);
      setLastName(userData.lastName);
      setEmail(userData.email);
      setPhone(userData.phone || '');
      setRole(userData.role);
      setIsActive(userData.isActive);
    } catch (err) {
      setError('Не удалось загрузить данные пользователя');
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

    if (isNewUser) {
      if (!password) {
        errors.password = 'Пароль обязателен';
      } else if (password.length < 8) {
        errors.password = 'Пароль должен содержать минимум 8 символов';
      }
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
        const createData: CreateUserRequest = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          role,
          password,
        };
        await usersAdminApi.createUser(createData);
      } else {
        await usersAdminApi.updateUser(id!, data);
      }

      navigate('/admin/users');
    } catch (err) {
      setError('Не удалось сохранить пользователя. Попробуйте позже.');
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
      <div className="pb-8 min-h-screen bg-canvas-dark text-body-text">
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <div className="w-8 h-8 border-2 border-hairline-dark border-t-gold rounded-full animate-spin mb-4"></div>
          <p>Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8 min-h-screen bg-canvas-dark text-body-text">
      <header className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-2 tracking-tight text-body-text">
            {isNewUser ? 'Новый пользователь' : 'Редактирование пользователя'}
          </h1>
          <nav className="flex items-center gap-2 text-xs text-muted-foreground">
            <a href="/admin/users" className="text-muted-foreground hover:text-gold transition-colors no-underline">Пользователи</a>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            <span className="text-muted-foreground">
              {isNewUser ? 'Создание' : 'Редактирование'}
            </span>
          </nav>
        </div>
      </header>

      {error && (
        <div className="flex items-center justify-between px-4 py-3 mb-6 bg-price-rise/10 border border-price-rise/20 text-price-rise">
          <p className="m-0 text-sm">{error}</p>
          <button onClick={() => setError(null)} className="bg-transparent border-none text-price-rise text-xl cursor-pointer px-1 leading-none">
            ×
          </button>
        </div>
      )}

      <form className="bg-surface-card border border-hairline-dark p-8 max-w-[640px]" onSubmit={handleSubmit}>
        {/* Avatar Section */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-5 pb-3 border-b border-hairline-dark">Аватар</h2>
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-surface-card border border-hairline-dark flex items-center justify-center text-muted-foreground text-2xl font-medium">
              {getInitials()}
            </div>
            <div className="flex flex-col gap-2">
              <button type="button" className="inline-flex items-center gap-2 px-4 py-2.5 bg-transparent border border-hairline-dark text-muted-foreground text-sm cursor-pointer hover:border-gold hover:text-gold transition-all font-inherit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Загрузить фото
              </button>
              <span className="text-xs text-muted-foreground">JPG, PNG. Максимум 2MB</span>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-5 pb-3 border-b border-hairline-dark">Основная информация</h2>
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2 mb-5">
              <label className="text-sm font-medium text-muted-foreground">
                Имя <span className="text-price-rise ml-0.5">*</span>
              </label>
              <input
                type="text"
                className={`w-full rounded-md border border-hairline-dark bg-surface-card px-3 py-2 text-sm text-body-text outline-none transition-colors placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold ${formErrors.firstName ? 'border-price-rise' : ''}`}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Введите имя"
              />
              {formErrors.firstName && (
                <span className="text-xs text-price-rise">{formErrors.firstName}</span>
              )}
            </div>

            <div className="flex flex-col gap-2 mb-5">
              <label className="text-sm font-medium text-muted-foreground">
                Фамилия <span className="text-price-rise ml-0.5">*</span>
              </label>
              <input
                type="text"
                className={`w-full rounded-md border border-hairline-dark bg-surface-card px-3 py-2 text-sm text-body-text outline-none transition-colors placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold ${formErrors.lastName ? 'border-price-rise' : ''}`}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Введите фамилию"
              />
              {formErrors.lastName && (
                <span className="text-xs text-price-rise">{formErrors.lastName}</span>
              )}
            </div>

            <div className="flex flex-col gap-2 mb-5">
              <label className="text-sm font-medium text-muted-foreground">
                Email <span className="text-price-rise ml-0.5">*</span>
              </label>
              <input
                type="email"
                className={`w-full rounded-md border border-hairline-dark bg-surface-card px-3 py-2 text-sm text-body-text outline-none transition-colors placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold ${formErrors.email ? 'border-price-rise' : ''}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
              />
              {formErrors.email && (
                <span className="text-xs text-price-rise">{formErrors.email}</span>
              )}
            </div>

            <div className="flex flex-col gap-2 mb-5">
              <label className="text-sm font-medium text-muted-foreground">Телефон</label>
              <input
                type="tel"
                className="w-full rounded-md border border-hairline-dark bg-surface-card px-3 py-2 text-sm text-body-text outline-none transition-colors placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+375 (__) ___-__-__"
              />
            </div>

            {isNewUser && (
              <div className="flex flex-col gap-2 mb-5">
                <label className="text-sm font-medium text-muted-foreground">
                  Пароль <span className="text-price-rise ml-0.5">*</span>
                </label>
                <input
                  type="password"
                  className={`w-full rounded-md border border-hairline-dark bg-surface-card px-3 py-2 text-sm text-body-text outline-none transition-colors placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold ${formErrors.password ? 'border-price-rise' : ''}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 8 символов"
                />
                {formErrors.password && (
                  <span className="text-xs text-price-rise">{formErrors.password}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Role Section */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-5 pb-3 border-b border-hairline-dark">Роли и права</h2>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">Назначенные роли</label>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((roleOption) => (
                <button
                  key={roleOption}
                  type="button"
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 bg-surface-card border border-hairline-dark text-sm text-muted-foreground cursor-pointer transition-all font-inherit hover:border-gold/50 ${
                    role === roleOption ? 'bg-gold/10 border-gold text-gold' : ''
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
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-5 pb-3 border-b border-hairline-dark">Статус</h2>
          <div className="flex items-center justify-between py-3">
            <div className="text-sm font-medium text-body-text">Аккаунт активен</div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                aria-label="Аккаунт активен"
              />
              <div className="w-11 h-6 bg-surface-elevated rounded-full peer peer-checked:bg-gold peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-gold transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>
        </div>

        {/* Additional Info (only for existing users) */}
        {!isNewUser && user && (
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-5 pb-3 border-b border-hairline-dark">Дополнительно</h2>
            <div className="grid grid-cols-2 gap-5">
              <div className="flex flex-col gap-2 mb-5">
                <label className="text-sm font-medium text-muted-foreground">Дата регистрации</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-hairline-dark bg-surface-card px-3 py-2 text-sm text-muted-foreground cursor-not-allowed opacity-60"
                  value={formatDate(user.createdAt)}
                  readOnly
                />
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label className="text-sm font-medium text-muted-foreground">ID пользователя</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-hairline-dark bg-surface-card px-3 py-2 text-sm text-muted-foreground cursor-not-allowed opacity-60"
                  value={user.id}
                  readOnly
                />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-hairline-dark mt-8">
          {!isNewUser && (
            <button
              type="button"
              className="inline-flex items-center gap-2 px-6 py-3 bg-transparent text-price-rise border border-price-rise/30 text-sm font-semibold cursor-pointer hover:bg-price-rise/10 hover:border-price-rise transition-all mr-auto"
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
            className="inline-flex items-center gap-2 px-6 py-3 bg-transparent text-muted-foreground border border-hairline-dark text-sm font-semibold cursor-pointer hover:border-body-text/20 hover:text-body-text transition-all"
            onClick={() => navigate('/admin/users')}
          >
            Отмена
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-black border-none text-sm font-semibold cursor-pointer hover:bg-gold-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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