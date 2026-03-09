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
            <RouteGuard guards={GUARD_PRESETS.AUTH_REQUIRED}>
              <SuspenseCreateListingPage />
            </RouteGuard>
          } />
          <Route path="/profile" element={<Navigate to="/profile/me" replace />} />
          {/* /profile/listings không được match bởi /profile/:id (id Long) → redirect về me */}
          <Route path="/profile/listings" element={<Navigate to="/profile/me" replace />} />
          <Route path="/profile/:id" element={
            <RouteGuard guards={GUARD_PRESETS.AUTH_REQUIRED}>
              <SuspenseProfilePage />
            </RouteGuard>
          } />
          <Route path="/chat" element={
            <RouteGuard guards={GUARD_PRESETS.AUTH_REQUIRED}>
              <SuspenseChatPage />
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
  );
}
