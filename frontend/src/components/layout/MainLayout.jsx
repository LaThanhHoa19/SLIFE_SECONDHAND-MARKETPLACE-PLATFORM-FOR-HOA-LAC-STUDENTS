/** Mục đích: Layout tổng gồm Header (fixed), Sidebar (fixed), content, Footer. */
import { useState } from 'react';
import { Box } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

const HEADER_HEIGHT = 56;
const SIDEBAR_WIDTH = 148;

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
                    mt: isAdminRoute ? 0 : `${HEADER_HEIGHT}px`,
                    width: '100%',
                    maxWidth: isAdminRoute ? '100%' : '1200px',
                    mx: isAdminRoute ? 0 : 'auto',
                }}
            >
                {!isAdminRoute && <Sidebar open={sidebarOpen} />}
                <Box
                    component="main"
                    sx={{
                        flex: 1,
                        transition: 'margin-left 0.3s',
                        minHeight: isAdminRoute ? '100vh' : `calc(100vh - ${HEADER_HEIGHT}px)`,
                        display: 'flex',
                        flexDirection: 'column',
                        minWidth: 0,
                    }}
                >
                    <Box sx={{ flex: 1, px: isAdminRoute ? 0 : 2, py: isAdminRoute ? 0 : 2.5 }}>
                        <Outlet />
                    </Box>
                    {!isAdminRoute && <Footer />}
                </Box>
            </Box>
        </Box>
    );
}
