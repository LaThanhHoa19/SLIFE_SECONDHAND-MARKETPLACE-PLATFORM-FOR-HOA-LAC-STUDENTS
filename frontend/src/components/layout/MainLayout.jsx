/**
 * Mục đích: Layout chính tích hợp Header, Sidebar (ẩn/hiện), Content area và Footer.
 * Tối ưu hóa trải nghiệm Desktop và tự động điều chỉnh theo Route.
 */
import { Box } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function MainLayout() {
    const theme = useTheme();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Logic xác định các route đặc biệt
    const pathname = location.pathname;
    
    // 1. Routes hoàn toàn không có Sidebar (Login, Admin, v.v.)
    const noSidebarRoutes = ['/login', '/register', '/admin'];
    const isExcludedRoute = noSidebarRoutes.some(route => pathname.startsWith(route));

    // 2. Routes "Feed" - Ẩn Sidebar và căn giữa content (từ nhánh Hoa)
    const isFeedRoute = pathname === '/' || pathname === '/ListingsPage';

    // Tổng hợp điều kiện hiển thị Sidebar
    const shouldShowSidebar = !isExcludedRoute && !isFeedRoute;

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
            {/* Header - Nhận event toggle sidebar từ main */}
            <Header onToggleSidebar={toggleSidebar} />

            {/* Main Content Area */}
            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                
                {/* Sidebar - Hiển thị dựa trên route logic */}
                {shouldShowSidebar && (
                    <Sidebar open={sidebarOpen} />
                )}

                {/* Main Content - Tự động dịch chuyển margin khi sidebar mở/đóng */}
                <Box
                    component="main"
                    sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'auto',
                        backgroundColor: theme.palette.background.default,
                        // Nếu là Feed route thì căn giữa, nếu có sidebar thì tạo margin
                        marginLeft: shouldShowSidebar && sidebarOpen ? '280px' : 0,
                        transition: theme.transitions.create(['margin-left'], {
                            duration: theme.transitions.duration.shorter,
                        }),
                        alignItems: isFeedRoute ? 'center' : 'stretch'
                    }}
                >
                    <Box
                        sx={{
                            flex: 1,
                            padding: shouldShowSidebar ? 3 : 0, // Feed route thường dùng full width
                            maxWidth: isFeedRoute ? '1200px' : '100%',
                            width: '100%',
                            margin: isFeedRoute ? '0 auto' : '0'
                        }}
                    >
                        <Outlet />
                    </Box>

                    {/* Footer - Chỉ hiện khi không phải route Feed (theo logic nhánh Hoa) 
                        hoặc hiển thị mặc định (theo main). Ở đây chọn hiển thị mặc định 
                        nhưng căn chỉnh theo content. */}
                    {!isExcludedRoute && <Footer />}
                </Box>
            </Box>
        </Box>
    );
}