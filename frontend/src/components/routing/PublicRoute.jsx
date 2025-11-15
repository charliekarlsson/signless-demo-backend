import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import LoadingScreen from '../LoadingScreen.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const PublicRoute = ({ children }) => {
  const { isAuthenticated, initializing, isOnboarded } = useAuth();

  if (initializing) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to={isOnboarded ? '/' : '/onboarding'} replace />;
  }

  return children ?? <Outlet />;
};

export default PublicRoute;
