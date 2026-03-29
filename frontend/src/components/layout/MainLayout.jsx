/** Mục đích: Layout tổng gồm Header (fixed), Sidebar (fixed), content, Footer. SCRUM-93: layout constants. */
import { useState, useEffect } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { HEADER_HEIGHT, HEADER_GAP, CONTENT_MAX_WIDTH, PAGE_PADDING_X, PAGE_PADDING_Y } from '../../utils/layoutConstants';

export default function MainLayout() {
    const theme = useTheme();
    const isLgUp = useMediaQuery(theme.breakpoints.up('lg')); // >= 1200px
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Auto close sidebar when screen shrinks, auto open when large
    useEffect(() => {
        setSidebarOpen(isLgUp);
    }, [isLgUp]);
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#141225' }}>
            {/* Header fixed — ẩn trên admin routes, chỉ dùng header riêng trong AdminLayout */}
            {!isAdminRoute && (
                <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1300 }}>
                    <Header onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
                </Box>
            )}

            {/* Phần thân — bắt đầu sau header */}
            <Box
                sx={{
                    display: 'flex',
                    flex: 1,
                    mt: isAdminRoute ? 0 : `${HEADER_HEIGHT + HEADER_GAP}px`,
                    width: '100%',
                    maxWidth: '100%',
                    mx: 0,
                }}
            >
                {!isAdminRoute && <Sidebar open={sidebarOpen} />}
                <Box
                    component="main"
                    sx={{
                        flex: 1,
                        minWidth: 0,
                        marginLeft: !isAdminRoute && sidebarOpen ? `${SIDEBAR_WIDTH}px` : 0,
                        transition: 'margin-left 0.3s ease',
                        minHeight: isAdminRoute ? '100vh' : `calc(100vh - ${HEADER_HEIGHT + HEADER_GAP}px)`,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <Box
                        sx={{
                            flex: 1,
                            width: '100%',
                            maxWidth: isAdminRoute ? '100%' : CONTENT_MAX_WIDTH,
                            mx: isAdminRoute ? 0 : 'auto',
                            px: isAdminRoute ? 0 : PAGE_PADDING_X,
                            py: isAdminRoute ? 0 : PAGE_PADDING_Y,
                        }}
                    >
                        <Outlet />
                    </Box>
                    {!isAdminRoute && <Footer />}
                </Box>
            </Box>
        </Box>
    );
}
