/**
 * Страница управления пользователями
 * Таблица пользователей с возможностью редактирования и удаления
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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

const STATUS_FILTERS = [
  { value: '', label: 'Все статусы' },
  { value: 'true', label: 'Активные' },
  { value: 'false', label: 'Неактивные' },
];

/**
 * Страница управления пользователями
 */
export function UserManagementPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
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

      if (statusFilter) {
        params.isActive = statusFilter === 'true';
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
  }, [page, roleFilter, statusFilter, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleEdit = (userId: string) => {
    navigate(`/admin/users/${userId}/edit`);
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Вы уверены, что хотите удалить пользователя ${user.firstName} ${user.lastName}?\nЭто действие нельзя отменить.`)) {
      return;
    }

    setDeleting(user.id);
    try {
      await usersAdminApi.deleteUser(user.id);
      setUsers(users.filter(u => u.id !== user.id));
      setTotalItems(prev => prev - 1);
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Не удалось удалить пользователя. Попробуйте позже.');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getInitials = (user: User) => {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
  };

  return (
    <div className="staff-page">
      <header className={`${styles.header} staff-page__header`}>
        <div>
          <h1 className={`${styles.title} staff-page__title`}>Пользователи</h1>
          <p className={`${styles.subtitle} staff-page__subtitle`}>
            Управление пользователями системы
          </p>
        </div>
        <div className={styles.headerActions}>
          <button 
            className={styles.exportBtn}
            onClick={() => {/* TODO: export functionality */}}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Экспорт
          </button>
          <button 
            className={styles.addBtn}
            onClick={() => navigate('/admin/users/new')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Добавить пользователя
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>{totalItems.toLocaleString('ru-RU')}</span>
          <span className={styles.statLabel}>Всего пользователей</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>{users.filter(u => u.isActive).length}</span>
          <span className={styles.statLabel}>Активных на странице</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>{users.filter(u => u.role === 'Admin').length}</span>
          <span className={styles.statLabel}>Администраторов</span>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <form className={styles.searchForm} onSubmit={handleSearch}>
          <div className={styles.searchWrapper}>
            <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Поиск по имени или email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="submit" className={styles.searchBtn}>
            Найти
          </button>
        </form>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Роль</label>
          <select
            className={styles.filterSelect}
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

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Статус</label>
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            {STATUS_FILTERS.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>
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
                  <th>Пользователь</th>
                  <th>ID</th>
                  <th>Роль</th>
                  <th>Статус</th>
                  <th>Регистрация</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className={!user.isActive ? styles.inactiveRow : ''}>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.userAvatar}>
                          {getInitials(user)}
                        </div>
                        <div className={styles.userInfo}>
                          <span className={styles.userName}>
                            {user.firstName} {user.lastName}
                          </span>
                          <span className={styles.userEmail}>{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.userId}>
                        {user.id.substring(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.roleBadge} ${styles[`role${user.role}`]}`}>
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${user.isActive ? styles.statusActive : styles.statusInactive}`}>
                        {user.isActive ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td>
                      <span className={styles.date}>{formatDate(user.createdAt)}</span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.editBtn}
                          onClick={() => handleEdit(user.id)}
                          title="Редактировать"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => handleDelete(user)}
                          disabled={deleting === user.id}
                          title="Удалить"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <p>Пользователи не найдены</p>
              <button className={styles.clearFiltersBtn} onClick={() => {
                setSearchQuery('');
                setRoleFilter('');
                setStatusFilter('');
                setPage(1);
              }}>
                Сбросить фильтры
              </button>
            </div>
          )}

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <span className={styles.paginationInfo}>
                Показано {((page - 1) * 10) + 1}-{Math.min(page * 10, totalItems)} из {totalItems} пользователей
              </span>
              <div className={styles.paginationPages}>
                <button
                  className={styles.pageBtn}
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  ←
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      className={`${styles.pageBtn} ${page === pageNum ? styles.pageBtnActive : ''}`}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  className={styles.pageBtn}
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}