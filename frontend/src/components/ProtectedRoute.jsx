import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { isAuthenticated, authLoading } = useAuth();
  if (authLoading) return <div className="page-wrapper page-content"><div className="spinner" /></div>;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
