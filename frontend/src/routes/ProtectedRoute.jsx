/** Mục đích: Guard route cho user/auth/admin. API: không gọi trực tiếp. */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children, roles = [] }) {
  const { user, token, isAuthLoading } = useAuth();
  if (isAuthLoading) return null;
  if (!token) return <Navigate to="/login" replace />;
  if (roles.length && !roles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
}
