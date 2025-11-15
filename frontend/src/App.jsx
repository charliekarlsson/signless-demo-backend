import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/routing/ProtectedRoute.jsx';
import PublicRoute from './components/routing/PublicRoute.jsx';
import OnboardingRoute from './components/routing/OnboardingRoute.jsx';
import AuthLayout from './components/layouts/AuthLayout.jsx';
import DashboardLayout from './components/layouts/DashboardLayout.jsx';
import OnboardingLayout from './components/layouts/OnboardingLayout.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Checkouts from './pages/Checkouts.jsx';
import Builder from './pages/Builder.jsx';
import ApiKeys from './pages/ApiKeys.jsx';
import Overview from './pages/onboarding/Overview.jsx';
import ProfileStep from './pages/onboarding/ProfileStep.jsx';
import PayoutStep from './pages/onboarding/PayoutStep.jsx';
import ComplianceStep from './pages/onboarding/ComplianceStep.jsx';
import DocumentsStep from './pages/onboarding/DocumentsStep.jsx';
import ReviewStep from './pages/onboarding/ReviewStep.jsx';

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

      <Route element={<OnboardingRoute />}>
        <Route path="/onboarding" element={<OnboardingLayout />}>
          <Route index element={<Overview />} />
          <Route path="profile" element={<ProfileStep />} />
          <Route path="payout" element={<PayoutStep />} />
          <Route path="compliance" element={<ComplianceStep />} />
          <Route path="documents" element={<DocumentsStep />} />
          <Route path="review" element={<ReviewStep />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowIncomplete />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route element={<ProtectedRoute />}>
            <Route path="checkouts" element={<Checkouts />} />
            <Route path="builder" element={<Builder />} />
            <Route path="api-keys" element={<ApiKeys />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
