/** Mục đích: Sidebar nền tối kiểu modern với active rõ và logout sticky. Responsive: co lại khi !open. */
import { Box, Typography, IconButton, Tooltip, Button, Divider } from '@mui/material';
import {
    Home as HomeIcon,
    Bookmark as BookmarkIcon,
    CampaignOutlined as CampaignIcon,
    Chat as ChatIcon,
    PeopleAlt as PeopleIcon,
    Add as AddIcon,
    ListAlt as ListAltIcon,
    Logout as LogoutIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { SIDEBAR_WIDTH, SIDEBAR_MINI_WIDTH, SIDEBAR_TOP_OFFSET } from '../../utils/layoutConstants';

const AUTH_REQUIRED_PATHS = ['/saved', '/listings/new', '/chat'];

const NAV_ITEMS = [
    { label: 'Feed', icon: HomeIcon, path: '/feed' },
    { label: 'Tin đã lưu', icon: BookmarkIcon, path: '/saved' },
    { label: 'Tin nhắn', icon: ChatIcon, path: '/chat' },
    { label: 'Tin của tôi', icon: ListAltIcon, path: '/my-listings' },
    { label: 'Đăng tin', icon: CampaignIcon, path: '/listings/new' },
];

export default function Sidebar({ open = true }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, logout } = useAuth();
    
    const currentWidth = open ? SIDEBAR_WIDTH : SIDEBAR_MINI_WIDTH;
    
    // Config: độ rộng của thanh menu khi mở (để ngắn hơn Sidebar_width, nằm giữa)
    const OPEN_PILL_WIDTH = '180px';
    const CLOSED_PILL_WIDTH = '44px'; // Độ rộng của khối tròn khi đóng

    const handleNavClick = (path) => {
        if (AUTH_REQUIRED_PATHS.includes(path) && !isAuthenticated) {
            navigate('/login', { state: { from: path, message: 'Bạn cần đăng nhập để truy cập' } });
            return;
        }

        if (location.pathname === path) {
            navigate(0); 
            return;
        }

        navigate(path);
    };

    const isActive = (path) => {
        if (path === '/feed') return location.pathname === '/feed';
        return location.pathname.startsWith(path);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/feed');
    };

    return (
        <Box
            data-sidebar="main"
            sx={{
                width: currentWidth,
                minWidth: currentWidth,
                height: `calc(100vh - ${SIDEBAR_TOP_OFFSET}px)`,
                backgroundColor: '#141225',
                borderRight: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                flexDirection: 'column',
                position: 'sticky',
                top: `${SIDEBAR_TOP_OFFSET}px`,
                zIndex: 1200,
                pt: 1.5,
                pb: 1.5,
                overflowY: 'auto',
                overflowX: 'hidden',
                transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&::-webkit-scrollbar': { display: 'none' },
            }}
        >
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
                    const active = isActive(path);
                    return (
                        <Tooltip key={path} title={!open ? label : ''} placement="right" disableHoverListener={open}>
                            <Box
                                onClick={() => handleNavClick(path)}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-start',
                                    width: open ? OPEN_PILL_WIDTH : CLOSED_PILL_WIDTH,
                                    height: '44px',
                                    cursor: 'pointer',
                                    borderRadius: '22px', // Tròn trịa hơn
                                    mb: 0.6,
                                    background: active
                                        ? 'linear-gradient(90deg, rgba(167,139,250,0.34) 0%, rgba(157,110,237,0.86) 100%)'
                                        : 'transparent',
                                    border: active ? '1px solid rgba(207,190,255,0.46)' : '1px solid transparent',
                                    boxShadow: active ? '0 8px 18px rgba(122,78,211,0.28)' : 'none',
                                    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s',
                                    '&:hover': {
                                        background: active
                                            ? 'linear-gradient(90deg, rgba(167,139,250,0.4) 0%, rgba(157,110,237,0.94) 100%)'
                                            : 'rgba(255,255,255,0.06)',
                                    },
                                    overflow: 'hidden',
                                }}
                            >
                                <Icon
                                    sx={{
                                        fontSize: 20,
                                        color: active ? '#FFFFFF' : 'rgba(226,232,240,0.78)',
                                        flexShrink: 0,
                                        ml: open ? 2 : '12px', // Dịch icon vào giữa khi state đóng/mở
                                        transition: 'margin 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    }}
                                />
                                <Typography
                                    sx={{
                                        fontSize: 13.5,
                                        fontWeight: active ? 700 : 500,
                                        color: active ? '#FFFFFF' : 'rgba(226,232,240,0.78)',
                                        whiteSpace: 'nowrap',
                                        ml: 1.5,
                                        opacity: open ? 1 : 0,
                                        maxWidth: open ? '120px' : 0,
                                        transition: 'max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s',
                                    }}
                                >
                                    {label}
                                </Typography>
                            </Box>
                        </Tooltip>
                    );
                })}
            </Box>

            <Divider sx={{ width: open ? OPEN_PILL_WIDTH : CLOSED_PILL_WIDTH, mx: 'auto', my: 1.4, borderColor: 'rgba(255,255,255,0.08)', transition: 'width 0.3s ease' }} />

            {/* Cộng đồng */}
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Tooltip title={!open ? "Cộng đồng" : ''} placement="right" disableHoverListener={open}>
                    <Box
                        onClick={() => navigate('/community')}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            width: open ? OPEN_PILL_WIDTH : CLOSED_PILL_WIDTH,
                            height: '44px',
                            cursor: 'pointer',
                            borderRadius: '22px',
                            mb: 0.5,
                            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s',
                            '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' },
                            overflow: 'hidden',
                        }}
                    >
                        <PeopleIcon sx={{ fontSize: 20, color: 'rgba(226,232,240,0.78)', flexShrink: 0, ml: open ? 2 : '12px', transition: 'margin 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                        <Typography
                            sx={{
                                fontSize: '13.5px',
                                fontWeight: 500,
                                color: 'rgba(226,232,240,0.78)',
                                whiteSpace: 'nowrap',
                                ml: 1.5,
                                opacity: open ? 1 : 0,
                                maxWidth: open ? '120px' : 0,
                                transition: 'max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s',
                            }}
                        >
                            Cộng đồng
                        </Typography>
                    </Box>
                </Tooltip>

                {/* Nút + tạo nhóm */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
                    <Tooltip title="Tạo nhóm" placement="right" arrow>
                        <IconButton
                            size="small"
                            sx={{
                                bgcolor: 'rgba(255,255,255,0.08)',
                                color: 'rgba(255,255,255,0.65)',
                                width: 34,
                                height: 34,
                                transition: 'all 0.3s ease',
                                '&:hover': { bgcolor: '#9D6EED', color: '#fff' },
                            }}
                        >
                            <AddIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {isAuthenticated && (
                <Box sx={{ mt: 'auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 1.6, pb: 1.6 }}>
                    <Divider sx={{ width: open ? OPEN_PILL_WIDTH : CLOSED_PILL_WIDTH, mb: 1.5, borderColor: 'rgba(255,255,255,0.08)', transition: 'width 0.3s ease' }} />
                    <Tooltip title={!open ? "Đăng xuất" : ''} placement="right" disableHoverListener={open}>
                        <Button
                            variant="text"
                            onClick={handleLogout}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                width: open ? OPEN_PILL_WIDTH : CLOSED_PILL_WIDTH,
                                height: '44px',
                                textTransform: 'none',
                                color: 'rgba(248,113,113,0.92)',
                                fontWeight: 600,
                                fontSize: 13.5,
                                borderRadius: '22px',
                                p: 0,
                                minWidth: 0,
                                transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s',
                                '&:hover': { bgcolor: 'rgba(248,113,113,0.12)' },
                                overflow: 'hidden',
                            }}
                        >
                            <LogoutIcon sx={{ fontSize: 20, flexShrink: 0, ml: open ? 2 : '12px', transition: 'margin 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                            <Typography
                                sx={{
                                    fontSize: 13.5,
                                    fontWeight: 600,
                                    lineHeight: 1,
                                    whiteSpace: 'nowrap',
                                    ml: 1.5,
                                    opacity: open ? 1 : 0,
                                    maxWidth: open ? '120px' : 0,
                                    transition: 'max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s',
                                }}
                            >
                                Đăng xuất
                            </Typography>
                        </Button>
                    </Tooltip>
                </Box>
            )}
        </Box>
    );
}
