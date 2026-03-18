/**
 * AuthGuard - Компонент защиты маршрутов от неавторизованных пользователей
 * 
 * Проверяет статус аутентификации из authStore.
 * Если пользователь не авторизован - перенаправляет на /login.
 * Если авторизован - рендерит дочерние маршруты через Outlet.
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export function AuthGuard() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  // Пока загружается состояние авторизации, можно показать загрузку
  if (isLoading) {
    return (
      <div className="auth-guard-loading">
        <div className="loading-spinner" />
        <p>Проверка авторизации...</p>
      </div>
    );
  }

  // Если не авторизован - редирект на логин с сохранением текущего пути
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Если авторизован - рендерим дочерние маршруты
  return <Outlet />;
}

export default AuthGuard;