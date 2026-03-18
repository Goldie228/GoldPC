/**
 * RoleGuard - Компонент защиты маршрутов по ролям пользователей
 * 
 * Проверяет роль пользователя из authStore.
 * Если роль не соответствует разрешённым - показывает 403 Forbidden или редирект.
 * Если роль соответствует - рендерит дочерние маршруты через Outlet.
 */
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import type { User } from '../../api/types';

type UserRole = User['role'];

interface RoleGuardProps {
  allowedRoles: UserRole[];
  redirectTo?: string;
  showForbidden?: boolean;
}

export function RoleGuard({ 
  allowedRoles, 
  redirectTo = '/',
  showForbidden = true 
}: RoleGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  // Пока загружается состояние авторизации
  if (isLoading) {
    return (
      <div className="role-guard-loading">
        <div className="loading-spinner" />
        <p>Проверка прав доступа...</p>
      </div>
    );
  }

  // Если не авторизован - редирект на логин
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Если пользователь есть, но роль не соответствует
  if (user && !allowedRoles.includes(user.role)) {
    if (showForbidden) {
      return (
        <div className="forbidden-container">
          <div className="forbidden-content">
            <h1 className="forbidden-code">403</h1>
            <h2 className="forbidden-title">Доступ запрещён</h2>
            <p className="forbidden-message">
              У вас недостаточно прав для просмотра этой страницы.
            </p>
            <p className="forbidden-details">
              Требуемая роль: {allowedRoles.join(' или ')}
              <br />
              Ваша роль: {user.role}
            </p>
            <a href="/" className="forbidden-link">
              Вернуться на главную
            </a>
          </div>
        </div>
      );
    }
    
    // Если showForbidden=false, редиректим на указанный путь
    return <Navigate to={redirectTo} replace />;
  }

  // Если роль соответствует - рендерим дочерние маршруты
  return <Outlet />;
}

export default RoleGuard;