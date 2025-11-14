import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import LoadingScreen from '../LoadingScreen.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const PublicRoute = ({ children }) => {
  const { isAuthenticated, initializing } = useAuth();

  if (initializing) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children ?? <Outlet />;
};

export default PublicRoute;
