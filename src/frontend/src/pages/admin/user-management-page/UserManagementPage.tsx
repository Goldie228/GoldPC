/**
 * Страница управления пользователями
 * Таблица пользователей с возможностью редактирования и удаления
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../../hooks/useAdmin';
import { useToast } from '../../../hooks/useToast';
import type { UserRole, GetUsersParams } from '../../../api/admin';
import type { User } from '../../../api/types';
const ROLE_LABELS: Record<UserRole, string> = {
  Client: 'Клиент',
  Manager: 'Менеджер',
  Master: 'Мастер',
  Admin: 'Администратор',
  Accountant: 'Бухгалтер',
};

const ROLE_OPTIONS: UserRole[] = ['Client', 'Manager', 'Master', 'Admin', 'Accountant'];

const ROLE_BADGE_CLASSES: Record<string, string> = {
  Admin: 'bg-border-muted text-accent',
  Manager: 'bg-indigo-500/15 text-indigo-400',
  Master: 'bg-green-500/15 text-green-500',
  Client: 'bg-zinc-500/15 text-muted-foreground',
  Accountant: 'bg-pink-500/15 text-pink-400',
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  active: 'bg-green-500/15 text-green-500',
  inactive: 'bg-red-500/15 text-red-500',
};

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
  const { getUsers, deleteUser } = useAdmin();
  const { showToast } = useToast();
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
      
      const response = await getUsers(params);
      if (response != null) {
        setUsers(response.data);
        setTotalPages(response.meta.totalPages);
        setTotalItems(response.meta.totalItems);
      }
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
      await deleteUser(user.id);
      setUsers(users.filter(u => u.id !== user.id));
      setTotalItems(prev => prev - 1);
    } catch (err) {
      console.error('Failed to delete user:', err);
      showToast('Не удалось удалить пользователя', 'error');
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
      <header className="flex justify-between items-start mb-8 staff-page__header">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-1 staff-page__title">Пользователи</h1>
          <p className="text-sm text-muted-foreground staff-page__subtitle">
            Управление пользователями системы
          </p>
        </div>
        <div className="flex gap-3">
          <button
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-transparent border border-border text-foreground text-sm font-medium cursor-pointer transition-all hover:border-accent hover:text-accent"
            onClick={() => {}}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Экспорт
          </button>
          <button
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent border-none text-background text-sm font-semibold cursor-pointer transition-all hover:bg-accent-bright"
            onClick={() => navigate('/admin/users/new')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Добавить пользователя
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="flex gap-6 mb-6 p-4 px-5 bg-card border border-border">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xl font-medium text-accent">{totalItems.toLocaleString('ru-RU')}</span>
          <span className="text-xs text-muted-foreground">Всего пользователей</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xl font-medium text-accent">{users.filter(u => u.isActive).length}</span>
          <span className="text-xs text-muted-foreground">Активных на странице</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xl font-medium text-accent">{users.filter(u => u.role === 'Admin').length}</span>
          <span className="text-xs text-muted-foreground">Администраторов</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <form className="flex gap-2 flex-1 min-w-[300px]" onSubmit={handleSearch}>
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-dim pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              className="w-full py-2 pl-9 pr-3 bg-card border border-border text-foreground text-sm transition-colors focus:outline-none focus:border-accent"
              placeholder="Поиск по имени или email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-card border border-border text-foreground text-sm cursor-pointer transition-all hover:border-accent hover:text-accent">
            Найти
          </button>
        </form>

        <div className="flex items-center gap-2">
          <label className="text-[0.75rem] text-foreground-dim uppercase tracking-wider">Роль</label>
          <select
            className="px-3 py-2 pr-8 bg-card border border-border text-foreground text-sm cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2371717a%27 stroke-width=%272%27%3E%3Cpolyline points=%276 9 12 15 18 9%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_8px_center] focus:outline-none focus:border-accent"
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

        <div className="flex items-center gap-2">
          <label className="text-[0.75rem] text-foreground-dim uppercase tracking-wider">Статус</label>
          <select
            className="px-3 py-2 pr-8 bg-card border border-border text-foreground text-sm cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2371717a%27 stroke-width=%272%27%3E%3Cpolyline points=%276 9 12 15 18 9%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_8px_center] focus:outline-none focus:border-accent"
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
        <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground bg-card border border-border">
          <div className="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin"></div>
          <p className="mt-4">Загрузка пользователей...</p>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center p-12 text-center text-error bg-card border border-border">
          <p>{error}</p>
          <button onClick={fetchUsers} className="mt-4 px-4 py-2 bg-elevated border border-border text-foreground text-sm cursor-pointer transition-all hover:border-accent hover:text-accent">
            Попробовать снова
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="bg-card border border-border overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-3.5 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-foreground-dim bg-elevated border-b border-border">Пользователь</th>
                  <th className="text-left p-3.5 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-foreground-dim bg-elevated border-b border-border">ID</th>
                  <th className="text-left p-3.5 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-foreground-dim bg-elevated border-b border-border">Роль</th>
                  <th className="text-left p-3.5 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-foreground-dim bg-elevated border-b border-border">Статус</th>
                  <th className="text-left p-3.5 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-foreground-dim bg-elevated border-b border-border">Регистрация</th>
                  <th className="text-left p-3.5 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-foreground-dim bg-elevated border-b border-border"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className={!user.isActive ? 'opacity-60' : ''}>
                    <td className="p-4 text-sm border-b border-border align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center bg-elevated text-accent font-semibold text-[0.9rem] flex-shrink-0">
                          {getInitials(user)}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-foreground">
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="text-[0.75rem] text-foreground-dim">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm border-b border-border align-middle">
                      <span className="font-mono text-[0.75rem] text-foreground-dim">
                        {user.id.substring(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-sm border-b border-border align-middle">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium uppercase tracking-wider ${ROLE_BADGE_CLASSES[user.role] || ''}`}>
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="p-4 text-sm border-b border-border align-middle">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium uppercase tracking-wider ${user.isActive ? STATUS_BADGE_CLASSES.active : STATUS_BADGE_CLASSES.inactive}`}>
                        {user.isActive ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td className="p-4 text-sm border-b border-border align-middle">
                      <span className="font-mono text-sm text-muted-foreground">{formatDate(user.createdAt)}</span>
                    </td>
                    <td className="p-4 text-sm border-b border-border align-middle">
                      <div className="flex gap-2 justify-end">
                        <button
                          className="w-8 h-8 flex items-center justify-center bg-transparent border border-border text-foreground-dim cursor-pointer transition-all hover:border-accent hover:text-accent"
                          onClick={() => handleEdit(user.id)}
                          title="Редактировать"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          className="w-8 h-8 flex items-center justify-center bg-transparent border border-border text-foreground-dim cursor-pointer transition-all hover:border-error hover:text-error disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleDelete(user)}
                          disabled={deleting === user.id}
                          title="Удалить"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
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
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground bg-card border border-border">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 text-foreground-dim">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <p>Пользователи не найдены</p>
              <button className="mt-4 px-4 py-2 bg-elevated border border-border text-foreground text-sm cursor-pointer transition-all hover:border-accent hover:text-accent" onClick={() => {
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
            <div className="flex justify-between items-center p-4 border-t border-border">
              <span className="text-sm text-muted-foreground">
                Показано {((page - 1) * 10) + 1}-{Math.min(page * 10, totalItems)} из {totalItems} пользователей
              </span>
              <div className="flex gap-1">
                <button
                  className="w-8 h-8 flex items-center justify-center bg-transparent border border-border text-muted-foreground font-mono text-sm cursor-pointer transition-all hover:border-foreground-dim hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className={`w-8 h-8 flex items-center justify-center border font-mono text-sm cursor-pointer transition-all hover:border-foreground-dim hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed ${page === pageNum ? 'bg-accent border-accent text-background' : 'bg-transparent border-border text-muted-foreground'}`}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  className="w-8 h-8 flex items-center justify-center bg-transparent border border-border text-muted-foreground font-mono text-sm cursor-pointer transition-all hover:border-foreground-dim hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
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