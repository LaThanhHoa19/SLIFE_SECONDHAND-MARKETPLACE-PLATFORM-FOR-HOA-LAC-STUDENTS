/**
 * Mục đích: Layout chính của ứng dụng web với Header, Sidebar có thể ẩn/hiện, Content area và Footer
 * Tối ưu cho desktop/laptop
 */
import { Box } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { useState, useEffect } from 'react';
/** Mục đích: Layout tổng gồm Header, Sidebar, content (Outlet), Footer. */
import {Box} from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function MainLayout() {
    const theme = useTheme();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);


    // Các routes không cần sidebar
    const noSidebarRoutes = ['/login', '/register', '/admin'];
    const shouldShowSidebar = !noSidebarRoutes.some(route =>
        location.pathname.startsWith(route)
    );

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                backgroundColor: theme.palette.background.default
            }}
        >
            {/* Header - Always visible */}
            <Header onToggleSidebar={toggleSidebar} />

            {/* Main Content Area */}
            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar - Fixed position, outside normal flow */}
                {shouldShowSidebar && (
                    <Sidebar open={sidebarOpen} />
                )}

                {/* Main Content */}
                <Box
                    component="main"
                    sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'auto',
                        backgroundColor: theme.palette.background.default,
                        marginLeft: shouldShowSidebar && sidebarOpen ? '280px' : 0,
                        transition: theme.transitions.create(['margin-left'], {
                            duration: theme.transitions.duration.shorter,
                        })
                    }}
                >
                    {/* Content Container */}
                    <Box
                        sx={{
                            flex: 1,
                            padding: shouldShowSidebar ? 3 : 2,
                            maxWidth: '100%'
                        }}
                    >
                        <Outlet />
                    </Box>
                </Box>
            </Box>

            {/* Footer - Always at bottom */}
            <Footer />
    const { pathname } = useLocation();
    const isFeedRoute = pathname === '/' || pathname === '/ListingsPage';

    return (
        <Box>
            <Header />

            <Box display="flex" justifyContent={isFeedRoute ? 'center' : 'flex-start'}>
                {!isFeedRoute && <Sidebar />}

                <Box component="main" flex={1}>
                    <Outlet />
                </Box>
            </Box>

            {!isFeedRoute && <Footer />}
        </Box>
    );
}
