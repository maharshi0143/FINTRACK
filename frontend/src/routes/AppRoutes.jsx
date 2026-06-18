import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import DashBoardPage from '../pages/dashboard/DashBoardPage';
import TransactionPage from '../pages/transactions/TransactionPage';
import BudgetsPage from '../pages/budgets/BudgetsPage';
import AnalyticsPage from '../pages/analytics/AnalyticsPage';
import AIAssistantPage from '../pages/ai/AIAssistantPage';
import NotificationsPage from '../pages/notifications/NotificationsPage';
import ProfilePage from '../pages/profile/ProfilePage';
import MainLayout from '../layouts/MainLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';
import PublicRoute from '../components/common/PublicRoute';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPasswordPage />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password/:token"
          element={
            <PublicRoute>
              <ResetPasswordPage />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <DashBoardPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <MainLayout>
                <TransactionPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/budgets"
          element={
            <ProtectedRoute>
              <MainLayout>
                <BudgetsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <MainLayout>
                <AnalyticsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai"
          element={
            <ProtectedRoute>
              <MainLayout>
                <AIAssistantPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <MainLayout>
                <NotificationsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ProfilePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* 404 Catch-all */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center text-white">
              <div className="text-center">
                <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                  404
                </h1>
                <p className="text-slate-400 mt-2">Page not found</p>
                <Link
                  to="/dashboard"
                  className="inline-block mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 text-white font-medium hover:from-blue-400 hover:to-violet-400 transition-all"
                >
                  Go Home
                </Link>
              </div>
            </div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default AppRoutes;
