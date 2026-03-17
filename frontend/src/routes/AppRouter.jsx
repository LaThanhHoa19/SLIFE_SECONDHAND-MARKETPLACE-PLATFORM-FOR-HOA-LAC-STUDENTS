/**
 * AppRouter - Advanced routing với lazy loading và guards (không có error pages)
 * Features:
 * - Lazy loading cho performance
 * - Route guards với middleware pattern
 * - Role-based access control
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import LandingLayout from '../components/layout/LandingLayout';
import AdminLayout from '../components/layout/AdminLayout';
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
    SuspenseGoogleCallbackPage,
    SuspenseStitchLandingPage,
    SuspenseSearchPage,
} from './LazyRoutes';

export default function AppRouter() {
    return (
        <Routes>
            {/* Landing page = trang chủ khi mở app */}
            <Route element={<LandingLayout />}>
                <Route path="/" element={<SuspenseStitchLandingPage />} />
                <Route path="/landing" element={<SuspenseStitchLandingPage />} />
            </Route>

            <Route element={<MainLayout />}>
                {/* ===== PUBLIC ROUTES - Ai cũng truy cập được ===== */}
                <Route path="/feed" element={<SuspenseListingsPage />} />
                <Route path="/search" element={<SuspenseSearchPage />} />
                <Route path="/listings/:id" element={<SuspenseListingDetailPage />} />
                <Route path="/backendtest" element={<SuspenseBackendTestPage />} />

                {/* Google OAuth2 redirect callback — no guard, no layout needed */}
                <Route path="/auth/google/callback" element={<SuspenseGoogleCallbackPage />} />

                {/* ===== AUTH ROUTES - Chỉ cho chưa đăng nhập ===== */}
                <Route
                    path="/login"
                    element={
                        <RouteGuard guards={GUARD_PRESETS.GUEST_ONLY}>
                            <SuspenseLoginPage />
                        </RouteGuard>
                    }
                />
                <Route
                    path="/register"
                    element={
                        <RouteGuard guards={GUARD_PRESETS.GUEST_ONLY}>
                            <SuspenseRegisterPage />
                        </RouteGuard>
                    }
                />

                {/* ===== PROTECTED ROUTES - Cần đăng nhập ===== */}
                <Route
                    path="/listings/new"
                    element={
                        <RouteGuard guards={GUARD_PRESETS.VERIFIED_USER}>
                            <SuspenseCreateListingPage />
                        </RouteGuard>
                    }
                />
                <Route
                    path="/profile/:id"
                    element={
                        <RouteGuard guards={GUARD_PRESETS.AUTH_REQUIRED}>
                            <SuspenseProfilePage />
                        </RouteGuard>
                    }
                />
                <Route
                    path="/deals/:id"
                    element={
                        <RouteGuard guards={GUARD_PRESETS.AUTH_REQUIRED}>
                            <SuspenseDealDetailPage />
                        </RouteGuard>
                    }
                />

                {/* Admin routes (tạm thời không cần login để test UI) */}
                <Route
                    path="/admin"
                    element={
                        <SuspenseDashboardPage />
                    }
                />
                <Route
                    path="/admin/reports"
                    element={
                        <SuspenseReportManagementPage />
                    }
                />
                <Route
                    path="/admin/users"
                    element={
                        <SuspenseUserManagementPage />
                    }
                />

                {/* Dev/test route */}
                <Route path="/backend-test" element={<SuspenseBackendTestPage />} />

                {/* Fallback: không match route nào thì về landing */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    );
}

