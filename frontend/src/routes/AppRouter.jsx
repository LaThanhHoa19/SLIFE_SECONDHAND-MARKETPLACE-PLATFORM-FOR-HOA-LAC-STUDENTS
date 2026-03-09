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
        
        {/* ===== PUBLIC ROUTES ===== */}
        <Route path="/" element={<SuspenseListingsPage />} />
        {/* Retained alias from Hoa for backward compatibility */}
        <Route path="/ListingsPage" element={<Navigate to="/" replace />} />
        <Route path="/listings/:id" element={<SuspenseListingDetailPage />} />
        <Route path="/backendtest" element={<SuspenseBackendTestPage />} />

        {/* ===== AUTH ROUTES (Guest Only) ===== */}
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

        {/* ===== PROTECTED ROUTES (Auth Required) ===== */}
        <Route path="/listings/new" element={
          <RouteGuard guards={GUARD_PRESETS.AUTH_REQUIRED}>
            <SuspenseCreateListingPage />
          </RouteGuard>
        } />
        
        {/* Profile redirects to ensure 'me' context */}
        <Route path="/profile" element={<Navigate to="/profile/me" replace />} />
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

        {/* ===== ADMIN ROUTES (Role-Based Access) ===== */}
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

        {/* Catch-all redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}