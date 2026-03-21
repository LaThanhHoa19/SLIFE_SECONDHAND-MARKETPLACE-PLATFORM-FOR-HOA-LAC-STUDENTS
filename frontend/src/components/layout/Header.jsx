/** Mục đích: Header navigation + search + auth buttons + notification badge/list. API: GET /api/notifications, PATCH read. */
import {
    AppBar,
    Badge,
    Box,
    IconButton,
    Toolbar,
    Typography,
    Button,
    InputBase,
    Avatar,
    Chip,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    Menu as MenuIcon,
    NotificationsOutlined as NotificationsIcon,
    FavoriteBorder as FavoriteIcon,
    ChatBubbleOutline as ChatIcon,
    Search as SearchIcon,
    AccountCircle as AccountCircleIcon,
    Person as PersonIcon,
    Logout as LogoutIcon
} from '@mui/icons-material';
import { useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NotificationContext } from '../../providers/NotificationProvider';
import NotificationDropdown from '../common/NotificationDropdown';
import { AuthContext } from '../../context/AuthContext';

const HEADER_BG = 'linear-gradient(180deg, #1a1720 0%, #25222c 100%)';
const ACCENT = '#a78bfa';
const ACCENT_HOVER = '#8b5cf6';
const ACCENT_SUBTLE = 'rgba(167, 139, 250, 0.15)';

const Search = styled('div')(({ theme }) => ({
    position: 'relative',
    borderRadius: '12px',
    backgroundColor: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.06)',
    width: '100%',
    minWidth: '420px',
    maxWidth: '520px',
    height: '40px',
    transition: 'background-color 0.2s, border-color 0.2s, box-shadow 0.2s',
    '&:focus-within': {
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderColor: 'rgba(167, 139, 250, 0.4)',
        boxShadow: '0 0 0 3px rgba(167, 139, 250, 0.2)',
    },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
    padding: theme.spacing(0, 1.5),
    height: '100%',
    position: 'absolute',
    right: 0,
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255,255,255,0.5)',
    '& svg': { fontSize: '20px' },
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: '#fff',
    width: '100%',
    height: '40px',
    '& .MuiInputBase-input': {
        padding: theme.spacing(0, 5, 0, 2),
        fontSize: '14px',
        height: '40px',
        boxSizing: 'border-box',
        width: '100%',
        outline: 'none',
        border: 'none',
        boxShadow: 'none',
        '&:focus': {
            outline: 'none',
            border: 'none',
            boxShadow: 'none',
        },
        '&::placeholder': {
            color: 'rgba(255,255,255,0.45)',
            opacity: 1,
        },
    },
}));

const NavButton = styled(Button)(({ theme }) => ({
    color: 'rgba(255,255,255,0.85)',
    backgroundColor: 'transparent',
    textTransform: 'none',
    fontSize: '14px',
    fontWeight: 500,
    letterSpacing: '0.02em',
    padding: theme.spacing(0.75, 1.5),
    borderRadius: '10px',
    minWidth: 'auto',
    transition: 'color 0.2s, background-color 0.2s',
    '&:hover': {
        backgroundColor: ACCENT_SUBTLE,
        color: '#fff',
    },
}));

const ActionButton = styled(Button)(({ theme }) => ({
    color: '#fff',
    textTransform: 'none',
    fontSize: '13px',
    fontWeight: 600,
    letterSpacing: '0.02em',
    padding: theme.spacing(0.875, 2),
    borderRadius: '10px',
    backgroundColor: 'rgba(167, 139, 250, 0.25)',
    border: '1px solid rgba(167, 139, 250, 0.35)',
    minHeight: '42px',
    transition: 'all 0.2s ease',
    '&:hover': {
        backgroundColor: 'rgba(167, 139, 250, 0.4)',
        borderColor: 'rgba(167, 139, 250, 0.5)',
        transform: 'translateY(-1px)',
    },
}));

const PostButton = styled(Button)(({ theme }) => ({
    color: '#fff',
    textTransform: 'none',
    fontSize: '14px',
    fontWeight: 600,
    letterSpacing: '0.02em',
    padding: theme.spacing(0.875, 2.25),
    borderRadius: '10px',
    backgroundColor: ACCENT,
    border: 'none',
    minHeight: '42px',
    boxShadow: '0 2px 12px rgba(167, 139, 250, 0.35)',
    transition: 'all 0.2s ease',
    '&:hover': {
        backgroundColor: ACCENT_HOVER,
        boxShadow: '0 4px 20px rgba(167, 139, 250, 0.45)',
        transform: 'translateY(-1px)',
    },
}));

export default function Header({ onToggleSidebar }) {
    const { unreadCount } = useContext(NotificationContext);
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const [searchValue, setSearchValue] = useState('');
    const [notifAnchorEl, setNotifAnchorEl] = useState(null);
    const [userMenuAnchor, setUserMenuAnchor] = useState(null);
    const userAvatar = user?.avatarUrl || user?.avatar || '';

    const handleSearch = (e) => {
        e.preventDefault();
        const q = searchValue.trim();
        if (q) {
            navigate(`/search?q=${encodeURIComponent(q)}`);
        } else {
            navigate('/search');
        }
    };

    const handleLogin = () => {
        navigate('/login');
    };

    const handleRegister = () => {
        navigate('/register');
    };

    const handleProfile = () => {
        navigate('/profile/me');
    };

    const handleCreatePost = () => {
        if (!user) {
            navigate('/login', {
                state: {
                    from: '/listings/new',
                    message: 'Bạn cần đăng nhập để đăng tin',
                },
            });
            return;
        }
        navigate('/listings/new');
    };

    const handleManagePosts = () => {
        navigate('/profile/listings');
    };

    const handleUserMenuOpen = (e) => {
        setUserMenuAnchor(e.currentTarget);
    };

    const handleUserMenuClose = () => {
        setUserMenuAnchor(null);
    };

    const handleLogout = () => {
        handleUserMenuClose();
        logout();
        navigate('/');
    };


    return (
        <AppBar
            position="static"
            sx={{
                background: HEADER_BG,
                boxShadow: '0 1px 0 rgba(255,255,255,0.06)',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                zIndex: 1300,
            }}
        >
            <Toolbar sx={{ gap: 1, py: 0, px: 3, minHeight: '64px' }}>
                {/* Logo & Menu */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {onToggleSidebar ? (
                        <IconButton
                            color="inherit"
                            edge="start"
                            onClick={onToggleSidebar}
                            sx={{
                                color: 'rgba(255,255,255,0.9)',
                                mr: 0.5,
                                '&:hover': { backgroundColor: ACCENT_SUBTLE },
                            }}
                        >
                            <MenuIcon />
                        </IconButton>
                    ) : (
                        <Box sx={{ width: 40, height: 40 }} />
                    )}
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 700,
                            fontSize: '1.4rem',
                            letterSpacing: '0.06em',
                            color: '#fff',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s',
                            '&:hover': { opacity: 0.9 },
                        }}
                        onClick={() => navigate('/')}
                    >
                        SLIFE
                    </Typography>
                </Box>

                {/* Navigation Buttons */}
                <Box sx={{ display: 'flex', gap: 0.5, ml: 3 }}>
                    <NavButton onClick={() => navigate('/giveaway')}>Trao tặng</NavButton>
                    <NavButton onClick={() => navigate('/community')}>Cộng đồng</NavButton>
                </Box>

                {/* Search Bar */}
                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', mx: 3 }}>
                    <Search>
                        <SearchIconWrapper>
                            <SearchIcon />
                        </SearchIconWrapper>
                        <form onSubmit={handleSearch} style={{ width: '100%', height: '100%' }}>
                            <StyledInputBase
                                placeholder="Tìm sản phẩm, danh mục..."
                                inputProps={{ 'aria-label': 'search' }}
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                            />
                        </form>
                    </Search>
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <IconButton
                        color="inherit"
                        onClick={() => navigate('/wishlist')}
                        sx={{
                            color: 'rgba(255,255,255,0.85)',
                            p: 1,
                            borderRadius: '10px',
                            '&:hover': { backgroundColor: ACCENT_SUBTLE, color: '#fff' },
                        }}
                    >
                        <FavoriteIcon sx={{ fontSize: '22px' }} />
                    </IconButton>
                    <IconButton
                        color="inherit"
                        onClick={(e) => setNotifAnchorEl(e.currentTarget)}
                        sx={{
                            color: 'rgba(255,255,255,0.85)',
                            p: 1,
                            borderRadius: '10px',
                            '&:hover': { backgroundColor: ACCENT_SUBTLE, color: '#fff' },
                        }}
                    >
                        <Badge badgeContent={unreadCount} color="error">
                            <NotificationsIcon sx={{ fontSize: '22px' }} />
                        </Badge>
                    </IconButton>
                    <IconButton
                        color="inherit"
                        onClick={() => navigate('/chat')}
                        sx={{
                            color: 'rgba(255,255,255,0.85)',
                            p: 1,
                            borderRadius: '10px',
                            '&:hover': { backgroundColor: ACCENT_SUBTLE, color: '#fff' },
                        }}
                    >
                        <ChatIcon sx={{ fontSize: '22px' }} />
                    </IconButton>

                    {user ? (
                        <>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1.5 }}>
                                <ActionButton onClick={handleManagePosts}>Quản lý tin</ActionButton>
                            </Box>
                            <IconButton
                                onClick={handleUserMenuOpen}
                                sx={{
                                    p: 0,
                                    ml: 1,
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'scale(1.05)',
                                        '& .MuiAvatar-root': { boxShadow: `0 0 0 2px ${ACCENT}` },
                                    },
                                    '&.Mui-focusVisible': { '& .MuiAvatar-root': { boxShadow: `0 0 0 2px ${ACCENT}` } },
                                }}
                                aria-controls={userMenuAnchor ? 'user-menu' : undefined}
                                aria-haspopup="true"
                                aria-expanded={userMenuAnchor ? 'true' : undefined}
                            >
                                {userAvatar ? (
                                    <Avatar
                                        src={userAvatar}
                                        alt={user.fullName || user.email}
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            border: '2px solid rgba(255,255,255,0.15)',
                                            transition: 'box-shadow 0.2s',
                                        }}
                                    />
                                ) : (
                                    <Avatar
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            bgcolor: ACCENT,
                                            border: '2px solid rgba(255,255,255,0.15)',
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {(user.fullName || user.email || 'U').charAt(0).toUpperCase()}
                                    </Avatar>
                                )}
                            </IconButton>
                            <Menu
                                id="user-menu"
                                anchorEl={userMenuAnchor}
                                open={Boolean(userMenuAnchor)}
                                onClose={handleUserMenuClose}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                slotProps={{
                                    paper: {
                                        elevation: 0,
                                        sx: {
                                            mt: 1.5,
                                            minWidth: 240,
                                            borderRadius: '14px',
                                            boxShadow: '0 12px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06)',
                                            overflow: 'hidden',
                                            py: 0.5,
                                            background: 'linear-gradient(180deg, #2a2732 0%, #25222c 100%)',
                                        },
                                    },
                                }}
                                sx={{ '& .MuiList-root': { py: 0 } }}
                            >
                                <Box
                                    sx={{
                                        px: 2,
                                        py: 1.75,
                                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                                    }}
                                >
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#fff' }}>
                                        {user?.fullName || 'Tài khoản'}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mt: 0.25 }}>
                                        {user?.email}
                                    </Typography>
                                </Box>
                                <MenuItem
                                    onClick={() => { handleUserMenuClose(); handleProfile(); }}
                                    sx={{
                                        py: 1.25,
                                        px: 2,
                                        gap: 1.5,
                                        borderRadius: '10px',
                                        mx: 0.75,
                                        mt: 0.75,
                                        color: 'rgba(255,255,255,0.9)',
                                        '&:hover': { bgcolor: ACCENT_SUBTLE },
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 36, color: ACCENT }}><PersonIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="Trang cá nhân" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />
                                </MenuItem>
                                <Divider sx={{ my: 0.5, borderColor: 'rgba(255,255,255,0.06)' }} />
                                <MenuItem
                                    onClick={handleLogout}
                                    sx={{
                                        py: 1.25,
                                        px: 2,
                                        gap: 1.5,
                                        borderRadius: '10px',
                                        mx: 0.75,
                                        mb: 0.75,
                                        color: 'rgba(255,255,255,0.9)',
                                        '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.15)' },
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 36, color: '#f87171' }}><LogoutIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="Đăng xuất" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />
                                </MenuItem>
                            </Menu>
                        </>
                    ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', ml: 1.5 }}>
                            <PostButton onClick={handleLogin}>Đăng nhập</PostButton>
                        </Box>
                    )}
                </Box>
            </Toolbar>
            <NotificationDropdown
                anchorEl={notifAnchorEl}
                open={Boolean(notifAnchorEl)}
                onClose={() => setNotifAnchorEl(null)}
            />
        </AppBar>
    );
}
