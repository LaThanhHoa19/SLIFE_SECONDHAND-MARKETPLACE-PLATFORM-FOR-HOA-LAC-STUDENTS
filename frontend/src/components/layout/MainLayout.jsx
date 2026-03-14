/** Mục đích: Layout tổng gồm Header (fixed), Sidebar (fixed), content, Footer. SCRUM-93: layout constants. */
import { useState } from 'react';
import { Box } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { HEADER_HEIGHT, HEADER_GAP, SIDEBAR_WIDTH, CONTENT_MAX_WIDTH, PAGE_PADDING_X, PAGE_PADDING_Y } from '../../utils/layoutConstants';

export default function MainLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#1C1B23' }}>
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
                    maxWidth: isAdminRoute ? '100%' : CONTENT_MAX_WIDTH,
                    mx: isAdminRoute ? 0 : 'auto',
                }}
            >
                {!isAdminRoute && <Sidebar open={sidebarOpen} />}
                <Box
                    component="main"
                    sx={{
                        flex: 1,
                        transition: 'margin-left 0.3s',
                        minHeight: isAdminRoute ? '100vh' : `calc(100vh - ${HEADER_HEIGHT + HEADER_GAP}px)`,
                        display: 'flex',
                        flexDirection: 'column',
                        minWidth: 0,
                    }}
                >
                    <Box sx={{ flex: 1, px: isAdminRoute ? 0 : PAGE_PADDING_X, py: isAdminRoute ? 0 : PAGE_PADDING_Y }}>
                        <Outlet />
                    </Box>
                    {!isAdminRoute && <Footer />}
                </Box>
            </Box>
        </Box>
    );
}
