import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Footer from './Footer';

export default function LandingLayout() {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#141225', width: '100%' }}>
            <Box
                component="main"
                sx={{
                    flex: 1,
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
