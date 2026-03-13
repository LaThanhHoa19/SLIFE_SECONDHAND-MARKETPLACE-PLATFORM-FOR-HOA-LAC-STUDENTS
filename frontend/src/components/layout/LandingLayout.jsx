import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const HEADER_HEIGHT = 56;

export default function LandingLayout() {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f8f6f5', width: '100%' }}>
            {/* Header fixed */}
            <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1300 }}>
                <Header onToggleSidebar={null} />
            </Box>

            {/* Main content below header */}
            <Box
                component="main"
                sx={{
                    flex: 1,
                    mt: `${HEADER_HEIGHT}px`,
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%'
                }}
            >
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <Outlet />
                </Box>
                <Footer />
            </Box>
        </Box>
    );
}
