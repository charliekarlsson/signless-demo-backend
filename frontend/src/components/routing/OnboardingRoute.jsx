import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import LoadingScreen from '../LoadingScreen.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const OnboardingRoute = ({ children }) => {
  const { isAuthenticated, initializing, isOnboarded } = useAuth();
  const location = useLocation();

  if (initializing) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (isOnboarded) {
    return <Navigate to="/" replace />;
  }

  return children ?? <Outlet />;
};

export default OnboardingRoute;
