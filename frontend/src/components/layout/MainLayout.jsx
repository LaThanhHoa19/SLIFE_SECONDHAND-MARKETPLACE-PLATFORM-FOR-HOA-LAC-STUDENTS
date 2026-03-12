/** Mục đích: Layout tổng gồm Header (fixed), Sidebar (fixed), content, Footer. */
import { useState } from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

const HEADER_HEIGHT = 56;
const SIDEBAR_WIDTH = 148;

export default function MainLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const ml = sidebarOpen ? `${SIDEBAR_WIDTH}px` : 0;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#1C1B23' }}>
            {/* Header fixed — giữ nguyên trên cùng khi scroll */}
            <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1300 }}>
                <Header onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
            </Box>

            {/* Phần thân — bắt đầu sau header */}
            <Box sx={{ display: 'flex', flex: 1, mt: `${HEADER_HEIGHT}px`, maxWidth: '1200px', mx: 'auto', width: '100%' }}>
                <Sidebar open={sidebarOpen} />
                <Box
                    component="main"
                    sx={{
                        flex: 1,
                        transition: 'margin-left 0.3s',
                        minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
                        display: 'flex',
                        flexDirection: 'column',
                        minWidth: 0,
                    }}
                >
                    <Box sx={{ flex: 1, px: 2, py: 2.5 }}>
                        <Outlet />
                    </Box>
                    <Footer />
                </Box>
            </Box>
        </Box>
    );
}
