/**
 * Layout cho /login, /register, /admin/login — cùng Header + Sidebar + Footer với feed (SCRUM-93).
 */
import { useState } from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { HEADER_HEIGHT, HEADER_GAP, CONTENT_MAX_WIDTH, PAGE_PADDING_X, PAGE_PADDING_Y } from '../../utils/layoutConstants';

export default function AuthLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#1C1B23' }}>
            <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1300 }}>
                <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    flex: 1,
                    mt: `${HEADER_HEIGHT + HEADER_GAP}px`,
                    width: '100%',
                    maxWidth: CONTENT_MAX_WIDTH,
                    mx: 'auto',
                }}
            >
                <Sidebar open={sidebarOpen} />
                <Box
                    component="main"
                    sx={{
                        flex: 1,
                        transition: 'margin-left 0.3s',
                        minHeight: `calc(100vh - ${HEADER_HEIGHT + HEADER_GAP}px)`,
                        display: 'flex',
                        flexDirection: 'column',
                        minWidth: 0,
                    }}
                >
                    <Box sx={{ flex: 1, px: PAGE_PADDING_X, py: PAGE_PADDING_Y }}>
                        <Outlet />
                    </Box>
                    <Footer />
                </Box>
            </Box>
        </Box>
    );
}
