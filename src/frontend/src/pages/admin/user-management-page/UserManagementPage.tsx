/**
 * Страница управления пользователями (Admin)
 * - Таблица пользователей с поиском, фильтром по роли, пагинацией
 * - Инлайн-изменение роли, деактивация/активация, редактирование
 * - Использует @tanstack/react-query и usersAdminApi
 * - Все стили через DESIGN.md токены Tailwind
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAdminApi, type UserRole } from '../../../api/admin';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Edit2,
  UserX,
  Check,
  Users,
} from 'lucide-react';

/* ======== Константы ======== */

const ROLE_LABELS: Record<UserRole, string> = {
  Client: 'Клиент',
  Manager: 'Менеджер',
  Master: 'Мастер',
  Admin: 'Администратор',
  Accountant: 'Бухгалтер',
};

const ROLE_OPTIONS: UserRole[] = [
  'Client',
  'Manager',
  'Master',
  'Admin',
  'Accountant',
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

/* ======== Компонент ======== */

export function UserManagementPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  /* ————— Состояние ————— */

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [updatingRoles, setUpdatingRoles] = useState<Record<string, boolean>>(
    {},
  );

  /* ————— React Query: получение пользователей ————— */

  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      'admin',
      'users',
      { search: searchQuery, role: roleFilter, page, pageSize },
    ],
    queryFn: () =>
      usersAdminApi.getUsers({
        page,
        pageSize,
        ...(searchQuery ? { search: searchQuery } : {}),
        ...(roleFilter ? { role: roleFilter as UserRole } : {}),
      }),
  });

  /* ————— React Query: мутации ————— */

  const deactivateMutation = useMutation({
    mutationFn: (userId: string) => usersAdminApi.deactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setMutationError(null);
    },
    onError: (err: Error) => {
      setMutationError(err.message || 'Ошибка деактивации пользователя');
    },
  });

  const activateMutation = useMutation({
    mutationFn: (userId: string) => usersAdminApi.activateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setMutationError(null);
    },
    onError: (err: Error) => {
      setMutationError(err.message || 'Ошибка активации пользователя');
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({
      userId,
      role,
    }: {
      userId: string;
      role: UserRole;
    }) => usersAdminApi.updateUserRole(userId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setMutationError(null);
    },
    onError: (err: Error) => {
      setMutationError(err.message || 'Ошибка изменения роли');
    },
  });

  /* ————— Производные данные ————— */

  const users = response?.data ?? [];
  const meta = response?.meta;
  const totalItems = meta?.totalItems ?? 0;
  const totalPages = meta?.totalPages ?? 0;

  /* ————— Обработчики ————— */

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setPage(1);
  };

  const handleEdit = (userId: string) => {
    navigate(`/admin/users/${userId}/edit`);
  };

  const handleDeactivate = (userId: string) => {
    if (
      window.confirm(
        'Вы уверены, что хотите деактивировать этого пользователя?',
      )
    ) {
      deactivateMutation.mutate(userId);
    }
  };

  const handleActivate = (userId: string) => {
    activateMutation.mutate(userId);
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    setUpdatingRoles((prev) => ({ ...prev, [userId]: true }));
    roleMutation.mutate(
      { userId, role: newRole as UserRole },
      {
        onSettled: () => {
          setUpdatingRoles((prev) => ({ ...prev, [userId]: false }));
        },
      },
    );
  };

  const resetFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setRoleFilter('');
    setPage(1);
  };

  /* ————— Утилиты ————— */

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  const getPageNumbers = (): number[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (page <= 3) {
      return [1, 2, 3, 4, 5];
    }
    if (page >= totalPages - 2) {
      return [
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }
    return [page - 2, page - 1, page, page + 1, page + 2];
  };

  /* ————— Рендер ————— */

  return (
    <div className="min-h-screen bg-canvas-dark p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* ===== Заголовок страницы ===== */}
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-gold" />
          <h1 className="text-lg font-semibold text-body-text">
            Управление пользователями
          </h1>
        </div>

        {/* ===== Основная карточка ===== */}
        <div className="bg-surface-card rounded-xl p-6 space-y-6">
          {/* Ошибка мутации */}
          {mutationError && (
            <div className="bg-price-rise/10 border border-price-rise/30 rounded-md px-4 py-3 text-sm text-price-rise">
              {mutationError}
            </div>
          )}

          {/* ===== Фильтры ===== */}
          <div className="flex flex-wrap items-center gap-4">
            <form
              onSubmit={handleSearch}
              className="flex flex-1 min-w-[280px] gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Поиск по имени или email..."
                  className="w-full bg-surface-card border border-hairline-dark rounded-md pl-9 pr-3 py-2 text-sm text-body-text placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold outline-none"
                />
              </div>
              <button
                type="submit"
                className="bg-gold text-black hover:bg-gold-active rounded-md px-4 py-2 text-sm font-semibold"
              >
                Найти
              </button>
            </form>

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Роль
              </label>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value as UserRole | '');
                  setPage(1);
                }}
                className="bg-surface-card border border-hairline-dark rounded-md px-3 py-2 text-sm text-body-text focus:border-gold focus:ring-1 focus:ring-gold outline-none cursor-pointer"
              >
                <option value="">Все роли</option>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ===== Состояние: загрузка ===== */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-8 w-8 border-2 border-hairline-dark border-t-gold rounded-full animate-spin" />
              <p className="mt-4 text-sm text-muted-foreground">
                Загрузка пользователей...
              </p>
            </div>
          )}

          {/* ===== Состояние: ошибка ===== */}
          {!isLoading && isError && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-price-rise">
                {error instanceof Error
                  ? error.message
                  : 'Не удалось загрузить пользователей. Попробуйте позже.'}
              </p>
              <button
                onClick={() => refetch()}
                className="mt-4 bg-surface-card text-body-text hover:bg-surface-elevated rounded-md px-4 py-2 text-sm font-semibold"
              >
                Попробовать снова
              </button>
            </div>
          )}

          {/* ===== Состояние: пустой список ===== */}
          {!isLoading && !isError && users.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-body-text">Пользователи не найдены</p>
              {(searchQuery || roleFilter) && (
                <button
                  onClick={resetFilters}
                  className="mt-4 bg-surface-card text-body-text hover:bg-surface-elevated rounded-md px-4 py-2 text-sm font-semibold"
                >
                  Сбросить фильтры
                </button>
              )}
            </div>
          )}

          {/* ===== Таблица пользователей ===== */}
          {!isLoading && !isError && users.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="bg-surface-card text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4 text-left border-b border-hairline-dark">
                      Пользователь
                    </th>
                    <th className="bg-surface-card text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4 text-left border-b border-hairline-dark">
                      Роль
                    </th>
                    <th className="bg-surface-card text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4 text-left border-b border-hairline-dark">
                      Статус
                    </th>
                    <th className="bg-surface-card text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4 text-left border-b border-hairline-dark">
                      Регистрация
                    </th>
                    <th className="bg-surface-card text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4 text-right border-b border-hairline-dark">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, idx) => (
                    <tr
                      key={user.id}
                      className={`${
                        idx % 2 === 0 ? '' : 'bg-surface-card/50'
                      } ${!user.isActive ? 'opacity-60' : ''}`}
                    >
                      {/* Пользователь: аватар + имя + email */}
                      <td className="py-3 px-4 text-sm text-body-text border-b border-hairline-dark">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 flex items-center justify-center bg-surface-elevated text-body-text rounded-full text-sm font-semibold flex-shrink-0">
                            {user.firstName.charAt(0)}
                            {user.lastName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Роль: инлайн <select> */}
                      <td className="py-3 px-4 text-sm text-body-text border-b border-hairline-dark">
                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleRoleChange(user.id, e.target.value)
                          }
                          disabled={updatingRoles[user.id]}
                          className="bg-surface-card border border-hairline-dark rounded-md px-2 py-1 text-xs font-medium cursor-pointer focus:border-gold focus:ring-1 focus:ring-gold outline-none disabled:opacity-50"
                        >
                          {ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Статус: активен / неактивен */}
                      <td className="py-3 px-4 text-sm text-body-text border-b border-hairline-dark">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${
                            user.isActive
                              ? 'bg-price-drop/15 text-price-drop'
                              : 'bg-price-rise/15 text-price-rise'
                          }`}
                        >
                          {user.isActive ? 'Активен' : 'Неактивен'}
                        </span>
                      </td>

                      {/* Дата регистрации */}
                      <td className="py-3 px-4 text-sm text-body-text border-b border-hairline-dark">
                        {formatDate(user.createdAt)}
                      </td>

                      {/* Кнопки действий */}
                      <td className="py-3 px-4 text-sm border-b border-hairline-dark">
                        <div className="flex items-center justify-end gap-2">
                          {user.isActive ? (
                            <button
                              onClick={() => handleDeactivate(user.id)}
                              disabled={deactivateMutation.isPending}
                              title="Деактивировать пользователя"
                              className="bg-price-rise text-white hover:bg-red-700 rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <UserX className="h-3.5 w-3.5 inline-block mr-1" />
                              Деактивировать
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivate(user.id)}
                              disabled={activateMutation.isPending}
                              title="Активировать пользователя"
                              className="bg-price-drop text-white hover:bg-green-700 rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Check className="h-3.5 w-3.5 inline-block mr-1" />
                              Активировать
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(user.id)}
                            title="Редактировать пользователя"
                            className="bg-surface-card text-body-text hover:bg-surface-elevated rounded-md px-3 py-1.5 text-xs font-semibold"
                          >
                            <Edit2 className="h-3.5 w-3.5 inline-block mr-1" />
                            Редактировать
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* ===== Пагинация ===== */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-hairline-dark">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground whitespace-nowrap">
                        Показывать по:
                      </label>
                      <select
                        className="px-2 py-1 bg-surface-card border border-hairline-dark rounded-md text-sm text-body-text cursor-pointer outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setPage(1);
                        }}
                      >
                        {PAGE_SIZE_OPTIONS.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Показано {(page - 1) * pageSize + 1}–
                      {Math.min(page * pageSize, totalItems)} из {totalItems}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                      className="flex items-center justify-center h-8 w-8 bg-surface-card text-body-text hover:bg-surface-elevated rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Предыдущая страница"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {getPageNumbers().map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`flex items-center justify-center h-8 w-8 text-sm font-medium rounded-md ${
                          pageNum === page
                            ? 'bg-gold text-black'
                            : 'bg-surface-card text-body-text hover:bg-surface-elevated'
                        }`}
                        aria-current={pageNum === page ? 'page' : undefined}
                        aria-label={`Страница ${pageNum}`}
                      >
                        {pageNum}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages}
                      className="flex items-center justify-center h-8 w-8 bg-surface-card text-body-text hover:bg-surface-elevated rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Следующая страница"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
