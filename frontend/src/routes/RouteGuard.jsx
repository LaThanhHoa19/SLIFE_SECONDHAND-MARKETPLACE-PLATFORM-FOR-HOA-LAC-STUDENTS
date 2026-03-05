/**
 * RouteGuard - Advanced route protection với middleware pattern
 * Tính năng:
 * - Multiple guards chạy tuần tự
 * - Custom guard functions
 * - Conditional redirects
 * - Loading states
 */
import { useAuth } from '../hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography, Paper } from '@mui/material';

// Built-in guards
export const authGuard = {
    name: 'auth',
    check: ({ user, token }) => !!(token && user),
    redirect: '/login',
    message: 'Bạn cần đăng nhập để truy cập'
};

export const guestGuard = {
    name: 'guest',
    check: ({ user, token }) => !(token && user),
    redirect: '/',
    message: 'Bạn đã đăng nhập rồi'
};

export const emailVerifiedGuard = {
    name: 'emailVerified',
    check: ({ user }) => user?.emailVerified,
    redirect: '/verify-email',
    message: 'Vui lòng xác thực email'
};

export const adminGuard = {
    name: 'admin',
    check: ({ user }) => user?.role === 'ADMIN',
    redirect: '/',
    message: 'Cần quyền admin'
};

export const moderatorGuard = {
    name: 'moderator',
    check: ({ user }) => ['ADMIN', 'MODERATOR'].includes(user?.role),
    redirect: '/',
    message: 'Cần quyền moderator'
};

/**
 * RouteGuard Component
 */
export default function RouteGuard({
                                       children,
                                       guards = [],
                                       fallback = null,
                                       showLoading = true
                                   }) {
    const { user, token, isAuthLoading } = useAuth();
    const location = useLocation();
    const context = { user, token };

    // Loading state
    if (isAuthLoading) {
        if (!showLoading) return null;

        return (
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                minHeight="100vh"
                bgcolor="grey.50"
            >
                <Paper elevation={2} sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
                    <CircularProgress size={48} sx={{ mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                        Đang kiểm tra quyền truy cập...
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Vui lòng chờ trong giây lát
                    </Typography>
                </Paper>
            </Box>
        );
    }

    // Check all guards
    for (const guard of guards) {
        const passed = guard.check(context);

        if (!passed) {
            if (guard.redirect) {
                return (
                    <Navigate
                        to={guard.redirect}
                        state={{
                            from: location.pathname + location.search,
                            message: guard.message
                        }}
                        replace
                    />
                );
            }

            if (fallback) {
                return fallback;
            }

            return null;
        }
    }

    // All guards passed
    return children;
}

/**
 * Utility functions để tạo guards
 */
export const createRoleGuard = (roles = [], redirect = '/', message) => ({
    name: `role-${roles.join('-')}`,
    check: ({ user }) => roles.includes(user?.role),
    redirect,
    message: message || `Cần quyền ${roles.join(' hoặc ')}`
});

export const createCustomGuard = (name, checkFn, redirect, message) => ({
    name,
    check: checkFn,
    redirect,
    message
});

/**
 * Pre-built guard combinations
 */
export const GUARD_PRESETS = {
    // User cần đăng nhập
    AUTH_REQUIRED: [authGuard],

    // User chưa đăng nhập (login/register pages)
    GUEST_ONLY: [guestGuard],

    // User đã verify email
    VERIFIED_USER: [authGuard, emailVerifiedGuard],

    // Admin only
    ADMIN_ONLY: [authGuard, adminGuard],

    // Moderator or Admin
    MODERATOR_PLUS: [authGuard, moderatorGuard]
};