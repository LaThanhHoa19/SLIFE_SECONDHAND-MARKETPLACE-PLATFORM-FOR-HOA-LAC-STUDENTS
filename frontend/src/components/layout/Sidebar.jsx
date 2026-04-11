/** Mục đích: Sidebar nền tối kiểu modern với active rõ và logout sticky. Responsive: co lại khi !open. */
import { Box, Typography, Tooltip, Button, Divider, useTheme, useMediaQuery } from '@mui/material';
import {
    Home as HomeIcon,
    Bookmark as BookmarkIcon,
    FavoriteBorder as FavoriteIcon,
    Chat as ChatIcon,
    PeopleAlt as PeopleIcon,
    Add as AddIcon,
    ListAlt as ListAltIcon,
    FactCheck as FactCheckIcon,
    Logout as LogoutIcon,
    Block as BlockIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePhoneVerification } from '../../context/PhoneVerificationContext';
import { APP_SHELL_BG, SIDEBAR_WIDTH, SIDEBAR_MINI_WIDTH, SIDEBAR_TOP_OFFSET } from '../../utils/layoutConstants';

const AUTH_REQUIRED_PATHS = ['/saved', '/listings/new', '/community/new', '/chat', '/settings/blocked', '/community/mine', '/community/saved', '/community/liked'];

export default function Sidebar({ open = true }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, user, logout } = useAuth();
    const { checkVerification } = usePhoneVerification();

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const isCommunityArea = location.pathname === '/community' || location.pathname.startsWith('/community/');

    const COMMUNITY_MARKET_ITEM = { label: 'Chợ', icon: HomeIcon, path: '/feed' };

    let NAV_ITEMS = isCommunityArea
        ? [
            { label: 'Cộng đồng', icon: PeopleIcon, path: '/community' },
            COMMUNITY_MARKET_ITEM,
            { label: 'Bài đăng của tôi', icon: ListAltIcon, path: '/community/mine' },
            { label: 'Đã lưu', icon: BookmarkIcon, path: '/community/saved' },
            { label: 'Đã thích', icon: FavoriteIcon, path: '/community/liked' },
        ]
        : [
            { label: 'Feed', icon: HomeIcon, path: '/feed' },
            { label: 'Tin nhắn', icon: ChatIcon, path: '/chat' },
            { label: 'Tin đã lưu', icon: BookmarkIcon, path: '/saved' },
            { label: 'Tin của tôi', icon: ListAltIcon, path: '/my-listings' },
            { label: 'Lịch sử chốt đơn', icon: FactCheckIcon, path: '/order-history' },
            ...(isAuthenticated && user ? [{ label: 'Trang cá nhân', icon: PeopleIcon, path: `/profile/${user.id}` }] : []),
            ...(isAuthenticated ? [{ label: 'Đã chặn', icon: BlockIcon, path: '/settings/blocked' }] : []),
        ];

    // Thêm nút Đăng tin vào sidebar nếu màn hình nhỏ (khi nút trên header ẩn đi)
    if (isMobile && !isCommunityArea) {
        NAV_ITEMS = [
            { label: 'Đăng tin', icon: AddIcon, path: '/listings/new', color: '#FF6B6B' },
            ...NAV_ITEMS
        ];
    }

    const isListingDetailView = location.pathname.startsWith('/listings/')
        && !location.pathname.endsWith('/new')
        && !location.pathname.endsWith('/edit');
    const shouldCompressInDetail = isListingDetailView && open && !isMobile;
    const currentWidth = shouldCompressInDetail ? Math.max(208, SIDEBAR_WIDTH - 32) : (open ? SIDEBAR_WIDTH : SIDEBAR_MINI_WIDTH);

    // Config: độ rộng của thanh menu khi mở (để ngắn hơn Sidebar_width, nằm giữa)
    const OPEN_PILL_WIDTH = shouldCompressInDetail ? '168px' : '180px';
    const CLOSED_PILL_WIDTH = '44px'; // Độ rộng của khối tròn khi đóng

    const handleNavClick = (path) => {
        if (AUTH_REQUIRED_PATHS.includes(path) && !isAuthenticated) {
            navigate('/login', { state: { from: path, message: 'Bạn cần đăng nhập để truy cập' } });
            return;
        }

        if (path === '/listings/new') {
            checkVerification(() => navigate(path));
            return;
        }

        if (location.pathname === path) {
            navigate(0);
            return;
        }

        navigate(path);
    };

    const isActive = (path) => {
        const current = location.pathname;
        if (path === '/feed') return current === '/feed' || (current.startsWith('/listings/') && !current.includes('/new'));
        if (path === '/community') return current === '/community';
        if (path.startsWith('/profile')) {
            return current.startsWith('/profile');
        }
        if (path === '/settings/blocked') {
            return current === '/settings/blocked';
        }
        return current === path || current.startsWith(path + '/');
    };

    const handleLogout = async () => {
        await logout();
        navigate('/feed');
    };

    return (
        <Box
            className="user-sidebar-root"
            data-sidebar="main"
            sx={{
                width: currentWidth,
                minWidth: currentWidth,
                height: `calc(100vh - ${SIDEBAR_TOP_OFFSET}px)`,
                backgroundColor: isListingDetailView ? 'rgba(20,18,37,0.52)' : APP_SHELL_BG,
                borderRight: isListingDetailView ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(255,255,255,0.06)',
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
                                    borderRadius: '22px',
                                    mb: 0.8,
                                    background: active
                                        ? (path === '/listings/new'
                                            ? (isListingDetailView ? 'linear-gradient(135deg, rgba(255,107,107,0.86) 10%, rgba(238,82,83,0.86) 100%)' : 'linear-gradient(135deg, #FF6B6B 10%, #EE5253 100%)')
                                            : (isListingDetailView ? 'linear-gradient(135deg, rgba(167,139,250,0.82) 0%, rgba(157,110,237,0.82) 100%)' : 'linear-gradient(135deg, #A78BFA 0%, #9D6EED 100%)'))
                                        : 'transparent',
                                    border: active
                                        ? (isListingDetailView ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(255,255,255,0.2)')
                                        : (path === '/listings/new' ? '1px solid rgba(255,107,107,0.3)' : '1px solid transparent'),
                                    boxShadow: active
                                        ? (path === '/listings/new'
                                            ? (isListingDetailView ? '0 6px 18px rgba(238, 82, 83, 0.28)' : '0 8px 24px rgba(238, 82, 83, 0.4)')
                                            : (isListingDetailView ? '0 6px 18px rgba(157, 110, 237, 0.26)' : '0 8px 24px rgba(157, 110, 237, 0.4)'))
                                        : 'none',
                                    transform: open && active ? (shouldCompressInDetail ? 'translateX(2px)' : 'translateX(4px)') : 'none',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                        background: active
                                            ? (path === '/listings/new' ? 'linear-gradient(135deg, #FF6B6B 0%, #EE5253 100%)' : 'linear-gradient(135deg, #A78BFA 0%, #9D6EED 100%)')
                                            : 'rgba(255,255,255,0.06)',
                                        transform: open ? (shouldCompressInDetail ? 'translateX(3px)' : 'translateX(6px)') : 'none',
                                    },
                                    overflow: 'hidden',
                                }}
                            >
                                <Icon
                                    sx={{
                                        fontSize: 20,
                                        color: active
                                            ? '#FFFFFF'
                                            : (path === '/listings/new'
                                                ? (isListingDetailView ? 'rgba(255,107,107,0.84)' : '#FF6B6B')
                                                : (isListingDetailView ? 'rgba(226,232,240,0.5)' : 'rgba(226,232,240,0.6)')),
                                        flexShrink: 0,
                                        ml: open ? 2 : '12px',
                                        transition: 'margin 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    }}
                                />
                                <Typography
                                    sx={{
                                        fontSize: 14,
                                        fontWeight: active ? 800 : 700,
                                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                                        color: active
                                            ? '#FFFFFF'
                                            : (path === '/listings/new'
                                                ? (isListingDetailView ? 'rgba(255,107,107,0.86)' : '#FF6B6B')
                                                : (isListingDetailView ? 'rgba(226,232,240,0.58)' : 'rgba(226,232,240,0.7)')),
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

            {!isCommunityArea && (
                <>
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
                                    background: isActive('/community')
                                        ? 'linear-gradient(135deg, #A78BFA 0%, #9D6EED 100%)'
                                        : 'transparent',
                                    boxShadow: isActive('/community') ? '0 8px 24px rgba(157, 110, 237, 0.4)' : 'none',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                        backgroundColor: isActive('/community') ? undefined : 'rgba(255,255,255,0.06)',
                                        transform: open && !isActive('/community') ? 'translateX(4px)' : 'none',
                                    },
                                    overflow: 'hidden',
                                }}
                            >
                                <PeopleIcon sx={{
                                    fontSize: 20,
                                    color: isActive('/community') ? '#FFFFFF' : 'rgba(226,232,240,0.6)',
                                    flexShrink: 0,
                                    ml: open ? 2 : '12px',
                                    transition: 'margin 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                }} />
                                <Typography
                                    sx={{
                                        fontSize: '14px',
                                        fontWeight: isActive('/community') ? 800 : 600,
                                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                                        color: isActive('/community') ? '#FFFFFF' : 'rgba(226,232,240,0.7)',
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
                    </Box>
                </>
            )}

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
