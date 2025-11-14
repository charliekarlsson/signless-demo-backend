import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/routing/ProtectedRoute.jsx';
import PublicRoute from './components/routing/PublicRoute.jsx';
import AuthLayout from './components/layouts/AuthLayout.jsx';
import DashboardLayout from './components/layouts/DashboardLayout.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Checkouts from './pages/Checkouts.jsx';
import Builder from './pages/Builder.jsx';
import ApiKeys from './pages/ApiKeys.jsx';

function App() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route
          path="/login"
          element={
            <AuthLayout
              title="Welcome back"
              subtitle="Sign in to manage checkouts, API keys, and settlement performance."
            >
              <Login />
            </AuthLayout>
          }
        />
        <Route
          path="/signup"
          element={
            <AuthLayout
              title="Create your merchant workspace"
              subtitle="USDC + EVM-ready payments with automated compliance and settlement."
            >
              <Signup />
            </AuthLayout>
          }
        />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="checkouts" element={<Checkouts />} />
          <Route path="builder" element={<Builder />} />
          <Route path="api-keys" element={<ApiKeys />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
