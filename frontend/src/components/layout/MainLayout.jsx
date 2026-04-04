/** Mục đích: Layout tổng gồm Header (fixed), Sidebar (fixed), content, Footer. SCRUM-93: layout constants. */
import { useState, useEffect } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { APP_SHELL_BG, HEADER_HEIGHT, HEADER_GAP, CONTENT_MAX_WIDTH, isFullWidthMainRoute, PAGE_PADDING_X, PAGE_PADDING_Y } from '../../utils/layoutConstants';

export default function MainLayout() {
    const theme = useTheme();
    const isLgUp = useMediaQuery(theme.breakpoints.up('lg')); // >= 1200px
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');
    const isFullWidthMain = isFullWidthMainRoute(location.pathname);
    const isChatRoute = location.pathname === '/chat';

    // Đồng bộ sidebar theo breakpoint; trên /chat không render Sidebar app (chỉ còn danh sách hội thoại trong ChatPage).
    useEffect(() => {
        if (isChatRoute) return;
        setSidebarOpen(isLgUp);
    }, [isLgUp, isChatRoute]);

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                bgcolor: APP_SHELL_BG,
                ...(isChatRoute
                    ? {
                          height: '100dvh',
                          maxHeight: '100dvh',
                          overflow: 'hidden',
                      }
                    : { minHeight: '100vh' }),
            }}
        >
            {/* Header — ẩn trên admin routes, dùng header riêng trong AdminLayout. internal: position fixed */}
            {!isAdminRoute && (
                <Header
                    onToggleSidebar={
                        isChatRoute ? undefined : () => setSidebarOpen((prev) => !prev)
                    }
                />
            )}

            {/* Phần thân — bắt đầu sau header */}
            <Box
                sx={{
                    display: 'flex',
                    flex: 1,
                    minHeight: 0,
                    mt: 0,
                    width: '100%',
                    overflow: isChatRoute ? 'hidden' : undefined,
                }}
            >
                {!isAdminRoute && !isChatRoute && <Sidebar open={sidebarOpen} />}
                <Box
                    component="main"
                    sx={{
                        flex: 1,
                        minWidth: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        ...(isChatRoute
                            ? {
                                  minHeight: 0,
                                  overflow: 'hidden',
                              }
                            : {
                                  minHeight: isAdminRoute ? '100vh' : `calc(100vh - ${HEADER_HEIGHT + HEADER_GAP}px)`,
                              }),
                    }}
                >
                    <Box
                        sx={{
                            flex: 1,
                            minHeight: 0,
                            width: '100%',
                            maxWidth: isAdminRoute || isFullWidthMain ? '100%' : CONTENT_MAX_WIDTH,
                            mx: isAdminRoute || isFullWidthMain ? 0 : 'auto',
                            px: isAdminRoute || isChatRoute ? 0 : PAGE_PADDING_X,
                            py: isAdminRoute || isChatRoute ? 0 : PAGE_PADDING_Y,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: isChatRoute ? 'hidden' : undefined,
                        }}
                    >
                        <Outlet />
                    </Box>
                    {!isAdminRoute && !isChatRoute && <Footer />}
                </Box>
            </Box>
        </Box>
    );
}