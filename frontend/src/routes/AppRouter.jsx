/**
 * AppRouter - Unified routing with lazy loading and guard middleware.
 * Combines the clean structure of 'main' with the path aliases from 'Hoa'.
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import RouteGuard, { GUARD_PRESETS } from './RouteGuard';

// Lazy loaded components (Imports standardized from main)
import {
  SuspenseLoginPage,
  SuspenseRegisterPage,
  SuspenseListingsPage,
  SuspenseListingDetailPage,
  SuspenseCreateListingPage,
  SuspenseProfilePage,
  SuspenseChatPage,
  SuspenseDealDetailPage,
  SuspenseDashboardPage,
  SuspenseReportManagementPage,
  SuspenseUserManagementPage,
  SuspenseBackendTestPage,
} from './LazyRoutes';

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<ListingsPage />} />
        <Route path="/listings/:id" element={<ListingDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/listings/new" element={<ProtectedRoute><CreateListingPage /></ProtectedRoute>} />
        <Route path="/profile/:id" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/deals/:id" element={<ProtectedRoute><DealDetailPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><DashboardPage /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute roles={['ADMIN']}><ReportManagementPage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}><UserManagementPage /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}