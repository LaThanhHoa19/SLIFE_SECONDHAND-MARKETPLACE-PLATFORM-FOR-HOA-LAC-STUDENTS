/** Mục đích: Layout tổng gồm Header, Sidebar, content (Outlet), Footer. */
import { useState } from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function MainLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
            <Box display="flex" flex={1}>
                <Sidebar open={sidebarOpen} />
                <Box
                    component="main"
                    flex={1}
                    sx={{ ml: sidebarOpen ? '280px' : 0, transition: 'margin-left 0.3s', mt: '56px' }}
                >
                    <Outlet />
                </Box>
            </Box>
            <Footer />
        </Box>
    );
}
