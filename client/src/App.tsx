import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { IntroScreen } from './pages/IntroScreen';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExploreResourcesPage } from './pages/ExploreResourcesPage';
import { ResourceDetailPage } from './pages/ResourceDetailPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { WaitlistPage } from './pages/WaitlistPage';
import { ActivityPage } from './pages/ActivityPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { HelpSupportPage } from './pages/HelpSupportPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Owner Pages
import { OwnerOverviewPage } from './pages/owner/OwnerOverviewPage';
import { MyResourcesPage } from './pages/owner/MyResourcesPage';
import { AddResourcePage } from './pages/owner/AddResourcePage';
import { OwnerBookingsPage } from './pages/owner/OwnerBookingsPage';
import { CheckInOutPage } from './pages/owner/CheckInOutPage';
import { ConditionReportsPage } from './pages/owner/ConditionReportsPage';
import { OwnerIncidentsPage } from './pages/owner/OwnerIncidentsPage';
import { OwnerCalendarPage } from './pages/owner/OwnerCalendarPage';
import { OwnerAnalyticsPage } from './pages/owner/OwnerAnalyticsPage';
import { OwnerAuditPage } from './pages/owner/OwnerAuditPage';
import { OwnerSettingsPage } from './pages/owner/OwnerSettingsPage';

// Manager Pages
import { ManagerDashboardPage } from './pages/manager/ManagerDashboardPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: ('student' | 'owner' | 'manager' | 'admin')[];
}> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingSpinner message="Verifying secure institutional session..." size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallback =
      user.role === 'admin'
        ? '/admin'
        : user.role === 'manager'
        ? '/manager'
        : user.role === 'owner'
        ? '/owner'
        : '/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingSpinner message="Loading RENTORA gateway..." size="md" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <ErrorBoundary>
            <AppLayout>
            <Routes>
            {/* Public Landing Page */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/intro" element={<IntroScreen />} />

            {/* Authentication Gateway */}
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <RegisterPage />
                </PublicOnlyRoute>
              }
            />

            {/* Protected Console Dashboard & Subroutes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/explore"
              element={
                <ProtectedRoute>
                  <ExploreResourcesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/resources"
              element={
                <ProtectedRoute>
                  <ExploreResourcesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/resources/:id"
              element={
                <ProtectedRoute>
                  <ResourceDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/explore/:id"
              element={
                <ProtectedRoute>
                  <ResourceDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/bookings"
              element={
                <ProtectedRoute>
                  <MyBookingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/waitlist"
              element={
                <ProtectedRoute>
                  <WaitlistPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/activity"
              element={
                <ProtectedRoute>
                  <ActivityPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/ecoshare"
              element={
                <ProtectedRoute>
                  <ActivityPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/sustainability"
              element={
                <ProtectedRoute>
                  <ActivityPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/help"
              element={
                <ProtectedRoute>
                  <HelpSupportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Owner Dashboard & 12 Specialized Submodules */}
            <Route
              path="/owner"
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager', 'admin']}>
                  <OwnerOverviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/resources"
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager', 'admin']}>
                  <MyResourcesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/add-resource"
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager', 'admin']}>
                  <AddResourcePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/requests"
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager', 'admin']}>
                  <OwnerBookingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/approved"
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager', 'admin']}>
                  <OwnerBookingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/checkin"
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager', 'admin']}>
                  <CheckInOutPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/condition-reports"
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager', 'admin']}>
                  <ConditionReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/incidents"
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager', 'admin']}>
                  <OwnerIncidentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/calendar"
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager', 'admin']}>
                  <OwnerCalendarPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/analytics"
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager', 'admin']}>
                  <OwnerAnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/audit"
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager', 'admin']}>
                  <OwnerAuditPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/settings"
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager', 'admin']}>
                  <OwnerSettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Institutional Manager & Governance Console */}
            <Route
              path="/manager"
              element={
                <ProtectedRoute allowedRoles={['manager', 'admin']}>
                  <ManagerDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/*"
              element={
                <ProtectedRoute allowedRoles={['manager', 'admin']}>
                  <ManagerDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Global System Administrator Console */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AppLayout>
      </ErrorBoundary>
    </ToastProvider>
  </AuthProvider>
</Router>
);
};

export default App;
