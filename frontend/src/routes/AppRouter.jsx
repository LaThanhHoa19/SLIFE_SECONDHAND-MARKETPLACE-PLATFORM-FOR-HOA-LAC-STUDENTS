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
    SuspenseNotificationsPage,
} from './LazyRoutes';

export default function AppRouter() {
    return (
        <Routes>
            <Route element={<MainLayout />}>
                {/* Public routes */}
                <Route path="/" element={<SuspenseListingsPage />} />
                <Route path="/listings/:id" element={<SuspenseListingDetailPage />} />

                {/* Guest-only routes (redirect nếu đã đăng nhập) */}
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

                {/* Authenticated routes */}
                <Route
                    path="/listings/new"
                    element={
                        <RouteGuard guards={GUARD_PRESETS.AUTH_REQUIRED}>
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
                    path="/chat"
                    element={
                        <RouteGuard guards={GUARD_PRESETS.AUTH_REQUIRED}>
                            <SuspenseChatPage />
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
                <Route
                    path="/notifications"
                    element={
                        <RouteGuard guards={GUARD_PRESETS.AUTH_REQUIRED}>
                            <SuspenseNotificationsPage />
                        </RouteGuard>
                    }
                />

                {/* Admin-only routes */}
                <Route
                    path="/admin"
                    element={
                        <RouteGuard guards={GUARD_PRESETS.ADMIN_ONLY}>
                            <SuspenseDashboardPage />
                        </RouteGuard>
                    }
                />
                <Route
                    path="/admin/reports"
                    element={
                        <RouteGuard guards={GUARD_PRESETS.ADMIN_ONLY}>
                            <SuspenseReportManagementPage />
                        </RouteGuard>
                    }
                />
                <Route
                    path="/admin/users"
                    element={
                        <RouteGuard guards={GUARD_PRESETS.ADMIN_ONLY}>
                            <SuspenseUserManagementPage />
                        </RouteGuard>
                    }
                />

                {/* Dev/test route */}
                <Route path="/backend-test" element={<SuspenseBackendTestPage />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    );
}
