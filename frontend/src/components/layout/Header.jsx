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
    useTheme,
    useMediaQuery
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
    Menu as MenuIcon,
    Notifications as NotificationsIcon,
    Favorite as FavoriteIcon,
    Chat as ChatIcon,
    Search as SearchIcon,
    AccountCircle as AccountCircleIcon
} from '@mui/icons-material';
import { useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NotificationContext } from '../../providers/NotificationProvider';
import NotificationDropdown from '../common/NotificationDropdown';
import { AuthContext } from '../../context/AuthContext';

const Search = styled('div')(({ theme }) => ({
    position: 'relative',
    borderRadius: '20px',
    backgroundColor: '#FFFFFF',
    border: 'none',
    width: '100%',
    minWidth: '500px',
    maxWidth: '600px',
    height: '32px',
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
    color: '#999999',
    '& svg': {
        fontSize: '20px'
    }
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: '#333333',
    width: '100%',
    height: '32px',
    '& .MuiInputBase-input': {
        padding: theme.spacing(0.5, 5, 0.5, 1.5),
        fontSize: '13px',
        height: '32px',
        boxSizing: 'border-box',
        width: '100%',
        '&::placeholder': {
            color: '#999999',
            opacity: 1,
        }
    }
}));

const NavButton = styled(Button)(({ theme }) => ({
    color: '#FFFFFF',
    backgroundColor: 'transparent',
    textTransform: 'none',
    fontSize: '13px',
    fontWeight: 400,
    padding: theme.spacing(0.5, 1.5),
    minWidth: 'auto',
    '&:hover': {
        backgroundColor: 'transparent',
        color: '#9D6EED',
    }
}));

const ActionButton = styled(Button)(({ theme }) => ({
    color: '#FFFFFF',
    textTransform: 'none',
    fontSize: '11px',
    fontWeight: 500,
    padding: theme.spacing(0.4, 1.5),
    borderRadius: '12px',
    backgroundColor: '#9D6EED',
    border: 'none',
    minHeight: '24px',
    '&:hover': {
        backgroundColor: '#8A5BD6',
    }
}));

const PostButton = styled(Button)(({ theme }) => ({
    color: '#FFFFFF',
    textTransform: 'none',
    fontSize: '11px',
    fontWeight: 500,
    padding: theme.spacing(0.4, 1.5),
    borderRadius: '12px',
    backgroundColor: '#9D6EED',
    border: 'none',
    minHeight: '24px',
    '&:hover': {
        backgroundColor: '#8A5BD6',
    }
}));

export default function Header({ onToggleSidebar }) {
    const { unreadCount } = useContext(NotificationContext);
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const [searchValue, setSearchValue] = useState('');
    const [notifAnchorEl, setNotifAnchorEl] = useState(null);
    const userAvatar = user?.avatarUrl || user?.avatar || '';

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchValue.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
        }
    };

    const handleLogin = () => {
        navigate('/login');
    };

    const handleRegister = () => {
        navigate('/register');
    };

    const handleProfile = () => {
        navigate('/profile');
    };

    const handleCreatePost = () => {
        navigate('/listing/create');
    };

    const handleManagePosts = () => {
        navigate('/profile/listings');
    };


    return (
        <AppBar
            position="static"
            sx={{
                backgroundColor: '#201D26',
                boxShadow: 'none',
                borderBottom: 'none',
                zIndex: 1300 // Higher than sidebar
            }}
        >
            <Toolbar sx={{ gap: 1, py: 0.5, px: 2, minHeight: '56px' }}>
                {/* Logo & Menu */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {onToggleSidebar ? (
                        <IconButton
                            color="inherit"
                            edge="start"
                            onClick={onToggleSidebar}
                            sx={{ color: '#FFFFFF', mr: 1 }}
                        >
                            <MenuIcon />
                        </IconButton>
                    ) : (
                        <Box sx={{ width: 40, height: 40 }} />
                    )}
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 'bold',
                            fontSize: '24px',
                            color: '#FFFFFF',
                            textDecoration: 'none',
                            cursor: 'pointer'
                        }}
                        onClick={() => navigate('/')}
                    >
                        SLIFE
                    </Typography>
                </Box>

                {/* Navigation Buttons */}
                <Box sx={{ display: 'flex', gap: 2, ml: 2 }}>
                    <NavButton onClick={handleCreatePost}>
                        ĐĂNG TIN
                    </NavButton>
                    <NavButton onClick={() => navigate('/giveaway')}>
                        TRAO TẶNG
                    </NavButton>
                    <NavButton onClick={() => navigate('/community')}>
                        CỘNG ĐỒNG
                    </NavButton>
                </Box>

                {/* Search Bar */}
                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', mx: 2 }}>
                    <Search>
                        <SearchIconWrapper>
                            <SearchIcon />
                        </SearchIconWrapper>
                        <form onSubmit={handleSearch} style={{ width: '100%', height: '100%' }}>
                            <StyledInputBase
                                placeholder="Tìm sản phẩm..."
                                inputProps={{ 'aria-label': 'search' }}
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                            />
                        </form>
                    </Search>
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Wishlist */}
                    <IconButton
                        color="inherit"
                        onClick={() => navigate('/wishlist')}
                        sx={{ color: '#FFFFFF', p: 0.5 }}
                    >
                        <FavoriteIcon sx={{ fontSize: '20px' }} />
                    </IconButton>

                    {/* Notifications */}
                    <IconButton
                        color="inherit"
                        onClick={(e) => setNotifAnchorEl(e.currentTarget)}
                        sx={{ color: '#FFFFFF', p: 0.5 }}
                    >
                        <Badge badgeContent={unreadCount} color="error">
                            <NotificationsIcon sx={{ fontSize: '20px' }} />
                        </Badge>
                    </IconButton>

                    {/* Chat */}
                    <IconButton
                        color="inherit"
                        onClick={() => navigate('/chat')}
                        sx={{ color: '#FFFFFF', p: 0.5 }}
                    >
                        <ChatIcon sx={{ fontSize: '20px' }} />
                    </IconButton>

                    {user ? (
                        <>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, ml: 1.5 }}>
                                <ActionButton onClick={handleManagePosts}>
                                    QUẢN LÝ TIN
                                </ActionButton>
                                <PostButton onClick={handleCreatePost}>
                                    ĐĂNG TIN
                                </PostButton>
                            </Box>
                            <IconButton onClick={handleProfile} sx={{ p: 0, ml: 1.5 }}>
                                {userAvatar ? (
                                    <Avatar
                                        src={userAvatar}
                                        alt={user.fullName || user.email}
                                        sx={{ width: 28, height: 28 }}
                                    />
                                ) : (
                                    <AccountCircleIcon sx={{ fontSize: 28, color: '#FFFFFF' }} />
                                )}
                            </IconButton>
                        </>
                    ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, ml: 1.5 }}>
                            <ActionButton onClick={handleLogin}>
                                QUẢN LÝ TIN
                            </ActionButton>
                            <PostButton onClick={handleRegister}>
                                ĐĂNG TIN
                            </PostButton>
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
