import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage.jsx';
import { LoginPage } from '../pages/LoginPage.jsx';
import { RegisterPage } from '../pages/RegisterPage.jsx';
import { AcceptInvitePage } from '../pages/AcceptInvitePage.jsx';
import { VerifyEmailPage } from '../pages/VerifyEmailPage.jsx';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage.jsx';
import { ResetPasswordPage } from '../pages/ResetPasswordPage.jsx';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import { AppLayout } from '../components/layout/AppLayout.jsx';

// Code-split authenticated application views (Phase 15: Performance)
const DashboardPage = lazy(() => import('../pages/DashboardPage.jsx').then(m => ({ default: m.DashboardPage })));
const TasksPage = lazy(() => import('../pages/TasksPage.jsx').then(m => ({ default: m.TasksPage })));
const ExpensesPage = lazy(() => import('../pages/ExpensesPage.jsx').then(m => ({ default: m.ExpensesPage })));
const SettlementsPage = lazy(() => import('../pages/SettlementsPage.jsx').then(m => ({ default: m.SettlementsPage })));
const FamilyDetailPage = lazy(() => import('../pages/FamilyDetailPage.jsx').then(m => ({ default: m.FamilyDetailPage })));

function RouteLoadingFallback() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1rem' }}>
      <div className="live-pulse" style={{ width: '12px', height: '12px' }}></div>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading...</span>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
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
    </Suspense>
  );
}
