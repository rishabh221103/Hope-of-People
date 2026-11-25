import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AdminRoute: React.FC = () => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <p>Loading session...</p>
      </div>
    );
  }

  if (!isAuthenticated || !hasRole('ROLE_ADMIN')) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
