/**
 * LazyRoutes - Lazy loading components cho performance tốt hơn
 */
import { lazy, Suspense } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

// Loading component
const PageLoader = ({ message = "Đang tải trang..." }) => (
    <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="60vh"
    >
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
            {message}
        </Typography>
    </Box>
);

// Lazy load pages
export const LazyLoginPage = lazy(() => import('../pages/auth/LoginPage'));
export const LazyRegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
export const LazyListingsPage = lazy(() => import('../pages/listing/ListingsPage'));
export const LazyListingDetailPage = lazy(() => import('../pages/listing/ListingDetailPage'));
export const LazyCreateListingPage = lazy(() => import('../pages/listing/CreateListingPage'));
export const LazyProfilePage = lazy(() => import('../pages/profile/ProfilePage'));
export const LazyChatPage = lazy(() => import('../pages/chat/ChatPage'));
export const LazyDealDetailPage = lazy(() => import('../pages/deal/DealDetailPage'));
export const LazyDashboardPage = lazy(() => import('../pages/admin/DashboardPage'));
export const LazyReportManagementPage = lazy(() => import('../pages/admin/ReportManagementPage'));
export const LazyUserManagementPage = lazy(() => import('../pages/admin/UserManagementPage'));
export const LazyBackendTestPage = lazy(() => import('../pages/BackendTestPage'));
export const LazyNotificationsPage = lazy(() => import('../pages/notification/NotificationsPage'));
export const LazyMyListingsPage = lazy(() => import('../pages/listing/MyListingsPage'));

// HOC để wrap lazy components với Suspense
export const withSuspense = (Component, loadingMessage) => (props) => (
    <Suspense fallback={<PageLoader message={loadingMessage} />}>
        <Component {...props} />
    </Suspense>
);

// Pre-wrapped components
export const SuspenseLoginPage = withSuspense(LazyLoginPage, "Đang tải trang đăng nhập...");
export const SuspenseRegisterPage = withSuspense(LazyRegisterPage, "Đang tải trang đăng ký...");
export const SuspenseListingsPage = withSuspense(LazyListingsPage, "Đang tải danh sách tin...");
export const SuspenseListingDetailPage = withSuspense(LazyListingDetailPage, "Đang tải chi tiết tin...");
export const SuspenseCreateListingPage = withSuspense(LazyCreateListingPage, "Đang tải trang đăng tin...");
export const SuspenseProfilePage = withSuspense(LazyProfilePage, "Đang tải trang cá nhân...");
export const SuspenseChatPage = withSuspense(LazyChatPage, "Đang tải tin nhắn...");
export const SuspenseDealDetailPage = withSuspense(LazyDealDetailPage, "Đang tải chi tiết giao dịch...");
export const SuspenseDashboardPage = withSuspense(LazyDashboardPage, "Đang tải dashboard...");
export const SuspenseReportManagementPage = withSuspense(LazyReportManagementPage, "Đang tải quản lý báo cáo...");
export const SuspenseUserManagementPage = withSuspense(LazyUserManagementPage, "Đang tải quản lý người dùng...");
export const SuspenseBackendTestPage = withSuspense(LazyBackendTestPage, "Đang tải trang backend test...");
export const SuspenseNotificationsPage = withSuspense(LazyNotificationsPage, "Đang tải thông báo...");
export const SuspenseMyListingsPage = withSuspense(LazyMyListingsPage, "Đang tải tin đăng của bạn...");