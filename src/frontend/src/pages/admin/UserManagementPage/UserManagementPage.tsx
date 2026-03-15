/**
 * Страница управления пользователями
 * Таблица пользователей с возможностью изменения ролей
 */

import { useState, useEffect } from 'react';
import { usersAdminApi, type UserRole, type GetUsersParams } from '../../../api/admin';
import type { User } from '../../../api/types';
import styles from './UserManagementPage.module.css';

const ROLE_LABELS: Record<UserRole, string> = {
  Client: 'Клиент',
  Manager: 'Менеджер',
  Master: 'Мастер',
  Admin: 'Администратор',
  Accountant: 'Бухгалтер',
};

const ROLE_OPTIONS: UserRole[] = ['Client', 'Manager', 'Master', 'Admin', 'Accountant'];

/**
 * Страница управления пользователями
 */
export function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: GetUsersParams = {
        page,
        pageSize: 10,
      };
      
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      if (roleFilter) {
        params.role = roleFilter;
      }
      
      const response = await usersAdminApi.getUsers(params);
      setUsers(response.data);
      setTotalPages(response.meta.totalPages);
      setTotalItems(response.meta.totalItems);
    } catch (err) {
      setError('Не удалось загрузить пользователей. Попробуйте позже.');
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setSaving(true);
    try {
      const updatedUser = await usersAdminApi.updateUserRole(userId, { role: newRole });
      setUsers(users.map(u => u.id === userId ? updatedUser : u));
      setEditingUser(null);
    } catch (err) {
      console.error('Failed to update role:', err);
      alert('Не удалось изменить роль пользователя');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      let updatedUser: User;
      if (user.isActive) {
        updatedUser = await usersAdminApi.deactivateUser(user.id);
      } else {
        updatedUser = await usersAdminApi.activateUser(user.id);
      }
      setUsers(users.map(u => u.id === user.id ? updatedUser : u));
    } catch (err) {
      console.error('Failed to toggle user status:', err);
      alert('Не удалось изменить статус пользователя');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Управление пользователями</h1>
        <p className={styles.subtitle}>
          Всего пользователей: {totalItems}
        </p>
      </header>

      <div className={styles.filters}>
        <form className={styles.searchForm} onSubmit={handleSearch}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Поиск по email или имени..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className={styles.searchBtn}>
            🔍 Найти
          </button>
        </form>

        <select
          className={styles.roleSelect}
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value as UserRole | '');
            setPage(1);
          }}
        >
          <option value="">Все роли</option>
          {ROLE_OPTIONS.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Загрузка пользователей...</p>
        </div>
      )}

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={fetchUsers} className={styles.retryBtn}>
            Попробовать снова
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Имя</th>
                  <th>Телефон</th>
                  <th>Роль</th>
                  <th>Статус</th>
                  <th>Дата регистрации</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className={!user.isActive ? styles.inactiveRow : ''}>
                    <td>{user.email}</td>
                    <td>{user.firstName} {user.lastName}</td>
                    <td>{user.phone || '—'}</td>
                    <td>
                      {editingUser === user.id ? (
                        <select
                          className={styles.roleEditSelect}
                          defaultValue={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                          disabled={saving}
                          autoFocus
                          onBlur={() => setEditingUser(null)}
                        >
                          {ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span 
                          className={styles.roleBadge}
                          onClick={() => setEditingUser(user.id)}
                          title="Нажмите для изменения роли"
                        >
                          {ROLE_LABELS[user.role]}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${user.isActive ? styles.active : styles.inactive}`}>
                        {user.isActive ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={`${styles.actionBtn} ${user.isActive ? styles.deactivate : styles.activate}`}
                          onClick={() => handleToggleActive(user)}
                          title={user.isActive ? 'Деактивировать' : 'Активировать'}
                        >
                          {user.isActive ? '🔴' : '🟢'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className={styles.empty}>
              <p>Пользователи не найдены</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                ← Назад
              </button>
              <span className={styles.pageInfo}>
                Страница {page} из {totalPages}
              </span>
              <button
                className={styles.pageBtn}
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Вперёд →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}