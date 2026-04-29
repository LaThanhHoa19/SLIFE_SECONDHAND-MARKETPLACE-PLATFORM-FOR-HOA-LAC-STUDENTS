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
export const LazySearchPage = lazy(() => import('../pages/listing/SearchPage.jsx'));
export const LazyListingDetailPage = lazy(() => import('../pages/listing/ListingDetailPage'));
export const LazyCreateListingPage = lazy(() => import('../pages/listing/CreateListingPage'));
export const LazyEditListingPage = lazy(() => import('../pages/listing/EditListingPage'));
export const LazyDraftEditPublishPage = lazy(() => import('../pages/listing/DraftEditPublishPage'));
export const LazyRepostPublishPage = lazy(() => import('../pages/listing/RepostPublishPage.jsx'));
export const LazyMyListingsPage = lazy(() => import('../pages/listing/MyListingsPage'));
export const LazySavedListingsPage = lazy(() => import('../pages/listing/SavedListingsPage'));
export const LazyLikedListingsPage = lazy(() => import('../pages/listing/LikedListingsPage'));
export const LazyProfilePage = lazy(() => import('../pages/profile/ProfilePage'));
export const LazyDealDetailPage = lazy(() => import('../pages/deal/DealDetailPage'));
export const LazyNotificationsPage = lazy(() => import('../pages/notification/NotificationsPage.jsx'));
export const LazyDashboardPage = lazy(() => import('../pages/admin/DashboardPage'));
export const LazyReportManagementPage = lazy(() => import('../pages/admin/ReportManagementPage'));
export const LazyReportDetailPage = lazy(() => import('../pages/admin/ReportDetailPage'));
export const LazyUserManagementPage = lazy(() => import('../pages/admin/UserManagementPage'));
export const LazyCategoryManagementPage = lazy(() => import('../pages/admin/CategoryManagementPage'));
export const LazyConfigurationManagementPage = lazy(() => import('../pages/admin/ConfigurationManagementPage'));
export const LazyBackendTestPage = lazy(() => import('../pages/BackendTestPage'));
export const LazyGoogleCallbackPage = lazy(() => import('../pages/auth/GoogleCallbackPage'));
export const LazyStitchLandingPage = lazy(() => import('../landing_page/StitchLandingPage.jsx'));
export const LazyAdminLoginPage = lazy(() => import('../pages/admin/AdminLoginPage'));
export const LazyReportPage = lazy(() => import('../pages/report/ReportPage'));
export const LazyChatPage = lazy(() => import('../pages/chat/ChatPage'));
export const LazyOrderHistoryPage = lazy(() => import('../pages/history/OrderHistoryPage'));
export const LazyTermsPage = lazy(() => import('../pages/legal/TermsPage'));
export const LazyCommunityFeedPage = lazy(() => import('../pages/community/CommunityFeedPage'));
export const LazyCommunitySavedPage = lazy(() => import('../pages/community/CommunitySavedPage'));
export const LazyCommunityLikedPage = lazy(() => import('../pages/community/CommunityLikedPage'));
export const LazyCommunityPostDetailPage = lazy(() => import('../pages/community/CommunityPostDetailPage'));
export const LazyBlockedUsersPage = lazy(() => import('../pages/settings/BlockedUsersPage'));

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
export const SuspenseSearchPage = withSuspense(LazySearchPage, "Đang tải kết quả tìm kiếm...");
export const SuspenseListingDetailPage = withSuspense(LazyListingDetailPage, "Đang tải chi tiết tin...");
export const SuspenseCreateListingPage = withSuspense(LazyCreateListingPage, "Đang tải trang đăng tin...");
export const SuspenseEditListingPage = withSuspense(LazyEditListingPage, "Đang tải trang chỉnh sửa tin...");
export const SuspenseDraftEditPublishPage = withSuspense(LazyDraftEditPublishPage, "Đang tải bản nháp...");
export const SuspenseRepostPublishPage = withSuspense(LazyRepostPublishPage, "Đang tải đăng lại tin...");
export const SuspenseMyListingsPage = withSuspense(LazyMyListingsPage, "Đang tải tin đăng của tôi...");
export const SuspenseSavedListingsPage = withSuspense(LazySavedListingsPage, "Đang tải tin đã lưu...");
export const SuspenseLikedListingsPage = withSuspense(LazyLikedListingsPage, "Đang tải tin đã thích...");
export const SuspenseProfilePage = withSuspense(LazyProfilePage, "Đang tải trang cá nhân...");
export const SuspenseDealDetailPage = withSuspense(LazyDealDetailPage, "Đang tải chi tiết giao dịch...");
export const SuspenseNotificationsPage = withSuspense(LazyNotificationsPage, "Đang tải thông báo...");
export const SuspenseDashboardPage = withSuspense(LazyDashboardPage, "Đang tải dashboard...");
export const SuspenseReportManagementPage = withSuspense(LazyReportManagementPage, "Đang tải quản lý báo cáo...");
export const SuspenseReportDetailPage = withSuspense(LazyReportDetailPage, "Đang tải chi tiết báo cáo...");
export const SuspenseUserManagementPage = withSuspense(LazyUserManagementPage, "Đang tải quản lý người dùng...");
export const SuspenseCategoryManagementPage = withSuspense(LazyCategoryManagementPage, "Đang tải quản lý danh mục...");
export const SuspenseConfigurationManagementPage = withSuspense(LazyConfigurationManagementPage, "Đang tải cấu hình hệ thống...");
export const SuspenseBackendTestPage = withSuspense(LazyBackendTestPage, "Đang tải trang backend test...");
export const SuspenseGoogleCallbackPage = withSuspense(LazyGoogleCallbackPage, "Đang xử lý đăng nhập...");
export const SuspenseStitchLandingPage = withSuspense(LazyStitchLandingPage, "Đang tải trang giới thiệu...");
export const SuspenseAdminLoginPage = withSuspense(LazyAdminLoginPage, "Đang tải trang đăng nhập admin...");
export const SuspenseReportPage = withSuspense(LazyReportPage, "Đang tải trang báo cáo...");
export const SuspenseChatPage = withSuspense(LazyChatPage, "Đang tải tin nhắn...");
export const SuspenseOrderHistoryPage = withSuspense(LazyOrderHistoryPage, "Đang tải lịch sử chốt đơn...");
export const SuspenseTermsPage = withSuspense(LazyTermsPage, "Đang tải quy chế hoạt động...");
export const SuspenseCommunityFeedPage = withSuspense(LazyCommunityFeedPage, "Đang tải cộng đồng...");
export const SuspenseCommunitySavedPage = withSuspense(LazyCommunitySavedPage, "Đang tải bài đã lưu...");
export const SuspenseCommunityLikedPage = withSuspense(LazyCommunityLikedPage, "Đang tải bài đã thích...");
export const SuspenseCommunityPostDetailPage = withSuspense(LazyCommunityPostDetailPage, "Đang tải bài cộng đồng...");
export const SuspenseBlockedUsersPage = withSuspense(LazyBlockedUsersPage, "Đang tải danh sách chặn...");
