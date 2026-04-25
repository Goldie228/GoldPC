import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

/**
 * Redirects admin users to the appropriate dashboard based on their role.
 * Must be used as a component (not inline function) to follow Rules of Hooks.
 */
export function AdminRedirect() {
  const { user } = useAuthStore();
  
  if (!user) return <Navigate to="/" replace />;
  if (user.role === 'Admin') return <Navigate to="/admin/users" replace />;
  if (['Manager', 'Master'].includes(user.role)) return <Navigate to="/manager/dashboard" replace />;
  if (user.role === 'Accountant') return <Navigate to="/accountant/reports" replace />;
  return <Navigate to="/dashboard" replace />;
}
