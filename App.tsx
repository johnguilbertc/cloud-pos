import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import POSPage from './pages/pos/POSPage';
import KDSPage from './pages/kds/KDSPage';
import BarDisplayPage from './pages/bar/BarDisplayPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import MenuManagementPage from './pages/admin/MenuManagementPage';
import InventoryManagementPage from './pages/admin/InventoryManagementPage';
import RecipeManagementPage from './pages/admin/RecipeManagementPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import OrderHistoryPage from './pages/admin/OrderHistoryPage';
// Fix: Changed import to relative path for SettingsPage to resolve "no default export" error.
import SettingsPage from './pages/admin/SettingsPage'; // Updated path
import AIReportPage from './pages/admin/AIReportPage';
import LoginPage from './pages/LoginPage';
import FirebaseSetupPage from './pages/admin/FirebaseSetupPage'; 
import FirebaseTestPage from './pages/admin/FirebaseTestPage'; // New Test Page
import { APP_ROUTES } from './constants';
import { useUser } from './contexts/UserContext';
import { useFirebaseConfig } from './contexts/FirebaseConfigContext'; 
import { LoadingSpinner } from './components/icons/Icons'; 
import ErrorBoundary from './components/ErrorBoundary';

const App: React.FC = () => {
  const { currentUser, logoutUser } = useUser();
  const { isFirebaseEffectivelyConfigured, isLoading: isFirebaseConfigLoading } = useFirebaseConfig();

  const isAuthenticated = !!currentUser;

  const handleLogout = () => {
    logoutUser();
  };

  if (isFirebaseConfigLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary to-secondary p-4 text-white">
        <LoadingSpinner className="w-16 h-16 mb-4" />
        <p className="text-2xl animate-pulse">Initializing Application...</p>
      </div>
    );
  }

  // Firebase Test Page should be accessible even if setup isn't complete
  // So, handle its route before the !isFirebaseEffectivelyConfigured check for main app.
  // The main app logic can be within a nested Routes if needed, or handled by path priority.

  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          {/* Test page route accessible always */}
          <Route path={APP_ROUTES.FIREBASE_TEST} element={<FirebaseTestPage />} />

          {!isFirebaseEffectivelyConfigured ? (
            // If Firebase is not configured, all other paths lead to setup
            <Route path="*" element={<FirebaseSetupPage />} />
          ) : (
            // Firebase is configured, proceed with normal app routing
            <>
              <Route
                path={APP_ROUTES.LOGIN}
                element={isAuthenticated ? <Navigate to={APP_ROUTES.ADMIN_DASHBOARD} /> : <LoginPage />}
              />
              <Route
                path="/"
                element={
                  isAuthenticated ? <Layout onLogout={handleLogout} currentUser={currentUser} /> : <Navigate to={APP_ROUTES.LOGIN} />
                }
              >
                <Route index element={<Navigate to={APP_ROUTES.ADMIN_DASHBOARD} />} />
                <Route path={APP_ROUTES.POS} element={<POSPage />} />
                <Route path={APP_ROUTES.KDS} element={<KDSPage />} />
                <Route path={APP_ROUTES.BAR_DISPLAY} element={<BarDisplayPage />} />
                <Route path={APP_ROUTES.ADMIN_DASHBOARD} element={<AdminDashboardPage />} />
                <Route path={APP_ROUTES.ADMIN_MENU_MANAGEMENT} element={<MenuManagementPage />} />
                <Route path={APP_ROUTES.ADMIN_INVENTORY} element={<InventoryManagementPage />} />
                <Route path={APP_ROUTES.ADMIN_RECIPES} element={<RecipeManagementPage />} />
                <Route path={APP_ROUTES.ADMIN_USERS} element={<UserManagementPage />} />
                <Route path={APP_ROUTES.ADMIN_ORDER_HISTORY} element={<OrderHistoryPage />} />
                <Route path={APP_ROUTES.ADMIN_SETTINGS} element={<SettingsPage />} />
                <Route path={APP_ROUTES.ADMIN_AI_REPORTS} element={<AIReportPage />} />
              </Route>
              {/* Fallback for authenticated users if no other route matches */}
              <Route path="*" element={<Navigate to={APP_ROUTES.ADMIN_DASHBOARD} />} />
            </>
          )}
          {/* Fallback for unauthenticated users if Firebase is configured but not logged in */}
          {isFirebaseEffectivelyConfigured && !isAuthenticated && (
              <Route path="*" element={<Navigate to={APP_ROUTES.LOGIN} />} />
          )}

        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
};

export default App;