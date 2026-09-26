import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage.jsx';
import { LoginPage } from '../pages/LoginPage.jsx';
import { RegisterPage } from '../pages/RegisterPage.jsx';
import { AcceptInvitePage } from '../pages/AcceptInvitePage.jsx';
import { VerifyEmailPage } from '../pages/VerifyEmailPage.jsx';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage.jsx';
import { ResetPasswordPage } from '../pages/ResetPasswordPage.jsx';
import { DashboardPage } from '../pages/DashboardPage.jsx';
import { TasksPage } from '../pages/TasksPage.jsx';
import { ExpensesPage } from '../pages/ExpensesPage.jsx';
import { SettlementsPage } from '../pages/SettlementsPage.jsx';
import { FamilyDetailPage } from '../pages/FamilyDetailPage.jsx';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import { AppLayout } from '../components/layout/AppLayout.jsx';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* Protected App Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/settlements" element={<SettlementsPage />} />
        <Route path="/family" element={<FamilyDetailPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
