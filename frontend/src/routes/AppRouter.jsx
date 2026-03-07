/**
 * AppRouter - Advanced routing với lazy loading và guards (không có error pages)
 * Features:
 * - Lazy loading cho performance
 * - Route guards với middleware pattern
 * - Role-based access control
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import RouteGuard, { GUARD_PRESETS } from './RouteGuard';

// Lazy loaded components
import {
  SuspenseLoginPage,
  SuspenseRegisterPage,
  SuspenseListingsPage,
  SuspenseListingDetailPage,
  SuspenseCreateListingPage,
  SuspenseProfilePage,
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
          {/* ===== PUBLIC ROUTES - Ai cũng truy cập được ===== */}
          <Route path="/" element={<SuspenseListingsPage />} />
          <Route path="/listings/:id" element={<SuspenseListingDetailPage />} />
          <Route path="/backendtest" element={<SuspenseBackendTestPage />} />

          {/* ===== AUTH ROUTES - Chỉ cho chưa đăng nhập ===== */}
          <Route path="/login" element={
            <RouteGuard guards={GUARD_PRESETS.GUEST_ONLY}>
              <SuspenseLoginPage />
            </RouteGuard>
          } />
          <Route path="/register" element={
            <RouteGuard guards={GUARD_PRESETS.GUEST_ONLY}>
              <SuspenseRegisterPage />
            </RouteGuard>
          } />

          {/* ===== PROTECTED ROUTES - Cần đăng nhập ===== */}
          <Route path="/listings/new" element={
            <RouteGuard guards={GUARD_PRESETS.GUEST_ONLY}>
              <SuspenseCreateListingPage />
            </RouteGuard>
          } />
          <Route path="/profile" element={<Navigate to="/profile/me" replace />} />
          <Route path="/profile/:id" element={
            <RouteGuard guards={GUARD_PRESETS.AUTH_REQUIRED}>
              <SuspenseProfilePage />
            </RouteGuard>
          } />
          <Route path="/deals/:id" element={
            <RouteGuard guards={GUARD_PRESETS.AUTH_REQUIRED}>
              <SuspenseDealDetailPage />
            </RouteGuard>
          } />

          {/* ===== ADMIN ROUTES - Chỉ admin ===== */}
          <Route path="/admin" element={
            <RouteGuard guards={GUARD_PRESETS.ADMIN_ONLY}>
              <SuspenseDashboardPage />
            </RouteGuard>
          } />
          <Route path="/admin/reports" element={
            <RouteGuard guards={GUARD_PRESETS.ADMIN_ONLY}>
              <SuspenseReportManagementPage />
            </RouteGuard>
          } />
          <Route path="/admin/users" element={
            <RouteGuard guards={GUARD_PRESETS.ADMIN_ONLY}>
              <SuspenseUserManagementPage />
            </RouteGuard>
          } />
        </Route>
      </Routes>
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<ListingsPage />} />
        <Route path="/ListingsPage" element={<ListingsPage />} />
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
