/**
 * Страница пользователей для менеджера
 * Переиспользует компонент из админки (DRY)
 */
import { UserManagementPage } from '@/pages/admin/user-management-page/UserManagementPage';

export function ManagerUsersPage() {
  return <UserManagementPage />;
}
