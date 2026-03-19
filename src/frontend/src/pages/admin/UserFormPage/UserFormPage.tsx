/**
 * Страница редактирования пользователя
 * Форма для редактирования данных пользователя
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usersAdminApi, type UserRole, type UpdateUserRequest } from '../../../api/admin';
import type { User } from '../../../api/types';
import styles from './UserFormPage.module.css';

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
      const userData = await usersAdminApi.getUser(id!);
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
        // TODO: Добавить API для создания пользователя
        console.log('Creating new user:', data);
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
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>
            {isNewUser ? 'Новый пользователь' : 'Редактирование пользователя'}
          </h1>
          <nav className={styles.breadcrumb}>
            <a href="/admin/users" className={styles.breadcrumbLink}>Пользователи</a>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            <span className={styles.breadcrumbCurrent}>
              {isNewUser ? 'Создание' : 'Редактирование'}
            </span>
          </nav>
        </div>
      </header>

      {error && (
        <div className={styles.errorBanner}>
          <p>{error}</p>
          <button onClick={() => setError(null)} className={styles.errorClose}>×</button>
        </div>
      )}

      <form className={styles.formCard} onSubmit={handleSubmit}>
        {/* Avatar Section */}
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Аватар</h2>
          <div className={styles.avatarSection}>
            <div className={styles.avatarPreview}>
              {getInitials()}
            </div>
            <div className={styles.avatarUpload}>
              <button type="button" className={styles.uploadBtn}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Загрузить фото
              </button>
              <span className={styles.uploadHint}>JPG, PNG. Максимум 2MB</span>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Основная информация</h2>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Имя <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={`${styles.formInput} ${formErrors.firstName ? styles.inputError : ''}`}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Введите имя"
              />
              {formErrors.firstName && (
                <span className={styles.errorMessage}>{formErrors.firstName}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Фамилия <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={`${styles.formInput} ${formErrors.lastName ? styles.inputError : ''}`}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Введите фамилию"
              />
              {formErrors.lastName && (
                <span className={styles.errorMessage}>{formErrors.lastName}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Email <span className={styles.required}>*</span>
              </label>
              <input
                type="email"
                className={`${styles.formInput} ${formErrors.email ? styles.inputError : ''}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
              />
              {formErrors.email && (
                <span className={styles.errorMessage}>{formErrors.email}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Телефон</label>
              <input
                type="tel"
                className={styles.formInput}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+375 (__) ___-__-__"
              />
            </div>
          </div>
        </div>

        {/* Role Section */}
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Роли и права</h2>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Назначенные роли</label>
            <div className={styles.roleBadges}>
              {ROLE_OPTIONS.map((roleOption) => (
                <button
                  key={roleOption}
                  type="button"
                  className={`${styles.roleBadge} ${role === roleOption ? styles.roleBadgeActive : ''}`}
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
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Статус</h2>
          <div className={styles.formGrid}>
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <div className={styles.toggleRow}>
                <input
                  type="checkbox"
                  id="isActive"
                  className={styles.toggle}
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <label htmlFor="isActive" className={styles.toggleLabel}>
                  Аккаунт активен
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info (only for existing users) */}
        {!isNewUser && user && (
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Дополнительно</h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Дата регистрации</label>
                <input
                  type="text"
                  className={`${styles.formInput} ${styles.inputReadonly}`}
                  value={formatDate(user.createdAt)}
                  readOnly
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>ID пользователя</label>
                <input
                  type="text"
                  className={`${styles.formInput} ${styles.inputReadonly}`}
                  value={user.id}
                  readOnly
                />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className={styles.formActions}>
          {!isNewUser && (
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={handleDelete}
              disabled={saving}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              Удалить
            </button>
          )}
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => navigate('/admin/users')}
          >
            Отмена
          </button>
          <button
            type="submit"
            className={styles.saveBtn}
            disabled={saving}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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