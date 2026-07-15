import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PMRoute() {
  const { isAuthenticated, user, authLoading } = useAuth();
  if (authLoading) return <div className="page-wrapper page-content"><div className="spinner" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'pm') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
