/** Mục đích: Layout tổng gồm Header, Sidebar, content (Outlet), Footer. */
import {Box} from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function MainLayout() {
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
