import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import AppLayout from '../layout/AppLayout';

export default function ProtectedRoute({ children }) {
  const { token, initAuth } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (token) {
      initAuth();
    }
  }, [token, initAuth]);

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <AppLayout>{children}</AppLayout>;
}
