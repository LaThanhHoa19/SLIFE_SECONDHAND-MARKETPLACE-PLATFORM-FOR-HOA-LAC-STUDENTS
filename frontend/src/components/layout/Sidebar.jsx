/** Mục đích: Sidebar nền tối kiểu modern với active rõ và logout sticky. */
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
import { SIDEBAR_WIDTH, SIDEBAR_TOP_OFFSET } from '../../utils/layoutConstants';

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

    if (!open) return null;

    const handleNavClick = (path) => {
        if (AUTH_REQUIRED_PATHS.includes(path) && !isAuthenticated) {
            navigate('/login', { state: { from: path, message: 'Bạn cần đăng nhập để truy cập' } });
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
        navigate('/login');
    };

    return (
        <Box
            data-sidebar="main"
            sx={{
                width: SIDEBAR_WIDTH,
                minWidth: SIDEBAR_WIDTH,
                height: `calc(100vh - ${SIDEBAR_TOP_OFFSET}px)`,
                // Use the same base background as MainLayout to avoid a visible color seam
                // between the fixed Header and the fixed Sidebar.
                backgroundColor: '#141225',
                borderRight: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                top: `${SIDEBAR_TOP_OFFSET}px`,
                left: 0,
                zIndex: 1200,
                pt: 1.5,
                pb: 1.5,
                overflowY: 'auto',
                overflowX: 'hidden',
                '&::-webkit-scrollbar': { display: 'none' },
            }}
        >
            <Box sx={{ px: 1.25 }}>
                {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
                    const active = isActive(path);
                    return (
                        <Box
                            key={path}
                            onClick={() => handleNavClick(path)}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                py: 1.15,
                                px: 1.5,
                                cursor: 'pointer',
                                borderRadius: 2.25,
                                mb: 0.4,
                                background: active
                                    ? 'linear-gradient(90deg, rgba(167,139,250,0.34) 0%, rgba(157,110,237,0.86) 100%)'
                                    : 'transparent',
                                border: active ? '1px solid rgba(207,190,255,0.46)' : '1px solid transparent',
                                boxShadow: active ? '0 8px 18px rgba(122,78,211,0.28)' : 'none',
                                transition: 'all .18s ease',
                                '&:hover': {
                                    background: active
                                        ? 'linear-gradient(90deg, rgba(167,139,250,0.4) 0%, rgba(157,110,237,0.94) 100%)'
                                        : 'rgba(255,255,255,0.06)',
                                },
                            }}
                        >
                            <Icon
                                sx={{
                                    fontSize: 18,
                                    color: active ? '#FFFFFF' : 'rgba(226,232,240,0.78)',
                                    flexShrink: 0,
                                }}
                            />
                            <Typography
                                sx={{
                                    fontSize: 13.5,
                                    fontWeight: active ? 700 : 500,
                                    color: active ? '#FFFFFF' : 'rgba(226,232,240,0.78)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {label}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>

            <Divider sx={{ mx: 1.75, my: 1.4, borderColor: 'rgba(255,255,255,0.08)' }} />

            {/* Cộng đồng */}
            <Box
                onClick={() => navigate('/community')}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    py: 1.15,
                    px: 2.75,
                    cursor: 'pointer',
                    borderRadius: 2.25,
                    mx: 1.25,
                    mb: 0.5,
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' },
                }}
            >
                <PeopleIcon sx={{ fontSize: 18, color: 'rgba(226,232,240,0.78)', flexShrink: 0 }} />
                <Typography
                    sx={{
                        fontSize: '13.5px',
                        fontWeight: 500,
                        color: 'rgba(226,232,240,0.78)',
                        whiteSpace: 'nowrap',
                    }}
                >
                    Cộng đồng
                </Typography>
            </Box>

            {/* Nút + tạo nhóm */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
                <Tooltip title="Tạo nhóm" placement="right" arrow>
                    <IconButton
                        size="small"
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.65)',
                            width: 30,
                            height: 30,
                            '&:hover': { bgcolor: '#9D6EED', color: '#fff' },
                        }}
                    >
                        <AddIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                </Tooltip>
            </Box>

            <Box sx={{ mt: 'auto', px: 1.4, pt: 1.6 }}>
                <Divider sx={{ mb: 1.2, borderColor: 'rgba(255,255,255,0.08)' }} />
                <Button
                    fullWidth
                    variant="text"
                    onClick={handleLogout}
                    startIcon={<LogoutIcon />}
                    sx={{
                        justifyContent: 'flex-start',
                        textTransform: 'none',
                        color: 'rgba(248,113,113,0.92)',
                        fontWeight: 600,
                        fontSize: 13.5,
                        borderRadius: 2,
                        px: 1.6,
                        py: 1,
                        '&:hover': { bgcolor: 'rgba(248,113,113,0.12)' },
                    }}
                >
                    Đăng xuất
                </Button>
            </Box>
        </Box>
    );
}
