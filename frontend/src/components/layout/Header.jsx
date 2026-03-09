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
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Tooltip,
    Popover,
    List,
    ListItemButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    Menu as MenuIcon,
    Notifications as NotificationsIcon,
    Favorite as FavoriteIcon,
    Chat as ChatIcon,
    Search as SearchIcon,
    Person as PersonIcon,
    ListAlt as ListAltIcon,
    Logout as LogoutIcon,
    Login as LoginIcon,
    KeyboardArrowDown as ArrowDownIcon,
} from '@mui/icons-material';
import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategories } from '../../api/categoryApi';
import { NotificationContext } from '../../providers/NotificationProvider';
import { AuthContext } from '../../context/AuthContext';
import { fullImageUrl } from '../../utils/constants';

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


export default function Header({ onToggleSidebar }) {
    const { unreadCount } = useContext(NotificationContext);
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [searchValue, setSearchValue] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [categories, setCategories] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [catAnchorEl, setCatAnchorEl] = useState(null);
    const menuOpen = Boolean(anchorEl);
    const catOpen = Boolean(catAnchorEl);

    const selectedCatLabel = selectedCategory
        ? (categories.find(c => String(c.id) === selectedCategory)?.name ?? 'Tất cả')
        : 'Tất cả';

    useEffect(() => {
        getCategories()
            .then(({ data: res }) => {
                const list = res?.data ?? res ?? [];
                setCategories(Array.isArray(list) ? list : []);
            })
            .catch(() => setCategories([]));
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (searchValue.trim()) params.set('q', searchValue.trim());
        if (selectedCategory) params.set('category', selectedCategory);
        navigate(`/?${params.toString()}`);
    };

    const handleAvatarClick = (e) => setAnchorEl(e.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    const handleProfile = () => { navigate('/profile/me'); handleMenuClose(); };
    const handleManagePosts = () => { navigate('/profile/listings'); handleMenuClose(); };
    const handleCreatePost = () => navigate('/listings/new');
    const handleLogout = () => { logout(); handleMenuClose(); navigate('/login'); };

    const displayName = user?.fullName || user?.name || user?.email?.split('@')[0] || 'Tài khoản';
    const avatarSrc = fullImageUrl(user?.avatarUrl || user?.avatar_url || user?.avatar) || null;

    return (
        <AppBar
            position="static"
            sx={{
                backgroundColor: '#201D26',
                boxShadow: 'none',
                borderBottom: 'none',
                zIndex: 1300,
            }}
        >
            <Toolbar sx={{ gap: 1, py: 0.5, px: 2, minHeight: '56px' }}>
                {/* Logo & Hamburger */}
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
                        sx={{ fontWeight: 'bold', fontSize: '24px', color: '#FFFFFF', cursor: 'pointer' }}
                        onClick={() => navigate('/')}
                    >
                        SLIFE
                    </Typography>
                </Box>

                {/* Navigation Buttons */}
                <Box sx={{ display: 'flex', gap: 2, ml: 2 }}>
                    <NavButton onClick={handleCreatePost}>ĐĂNG TIN</NavButton>
                    <NavButton onClick={() => navigate('/giveaway')}>TRAO TẶNG</NavButton>
                    <NavButton onClick={() => navigate('/community')}>CỘNG ĐỒNG</NavButton>
                </Box>

                {/* Search Bar */}
                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', mx: 2 }}>
                    <Box
                        component="form"
                        onSubmit={handleSearch}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                            minWidth: '500px',
                            maxWidth: '640px',
                            height: '36px',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '20px',
                            overflow: 'hidden',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                        }}
                    >
                        {/* Category Button */}
                        <Box
                            onClick={(e) => setCatAnchorEl(e.currentTarget)}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                height: '100%',
                                px: 1.5,
                                borderRight: '1px solid #e8e8e8',
                                cursor: 'pointer',
                                minWidth: '110px',
                                maxWidth: '130px',
                                userSelect: 'none',
                                backgroundColor: catOpen ? '#f5f0ff' : '#fafafa',
                                transition: 'background 0.15s',
                                '&:hover': { backgroundColor: '#f5f0ff' },
                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    color: selectedCategory ? '#7C3AED' : '#555',
                                    flex: 1,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {selectedCatLabel}
                            </Typography>
                            <ArrowDownIcon
                                sx={{
                                    fontSize: '16px',
                                    color: '#999',
                                    transform: catOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s',
                                    flexShrink: 0,
                                }}
                            />
                        </Box>

                        {/* Category Popover */}
                        <Popover
                            open={catOpen}
                            anchorEl={catAnchorEl}
                            onClose={() => setCatAnchorEl(null)}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                            slotProps={{
                                paper: {
                                    sx: {
                                        mt: 0.5,
                                        minWidth: 200,
                                        maxHeight: 320,
                                        overflowY: 'auto',
                                        borderRadius: '12px',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                        border: '1px solid #f0e8ff',
                                    }
                                }
                            }}
                        >
                            <List dense disablePadding sx={{ py: 0.5 }}>
                                <ListItemButton
                                    selected={selectedCategory === ''}
                                    onClick={() => { setSelectedCategory(''); setCatAnchorEl(null); }}
                                    sx={{
                                        px: 2, py: 0.8, fontSize: '13px',
                                        '&.Mui-selected': { backgroundColor: '#f5f0ff', color: '#7C3AED' },
                                        '&:hover': { backgroundColor: '#f9f5ff' },
                                    }}
                                >
                                    <Typography sx={{ fontSize: '13px', fontWeight: selectedCategory === '' ? 600 : 400 }}>
                                        Tất cả danh mục
                                    </Typography>
                                </ListItemButton>
                                <Divider sx={{ my: 0.5 }} />
                                {categories.map((c) => (
                                    <ListItemButton
                                        key={c.id}
                                        selected={selectedCategory === String(c.id)}
                                        onClick={() => { setSelectedCategory(String(c.id)); setCatAnchorEl(null); }}
                                        sx={{
                                            px: 2, py: 0.8,
                                            '&.Mui-selected': { backgroundColor: '#f5f0ff', color: '#7C3AED' },
                                            '&:hover': { backgroundColor: '#f9f5ff' },
                                        }}
                                    >
                                        <Typography sx={{ fontSize: '13px', fontWeight: selectedCategory === String(c.id) ? 600 : 400 }}>
                                            {c.name}
                                        </Typography>
                                    </ListItemButton>
                                ))}
                            </List>
                        </Popover>

                        {/* Search Input */}
                        <Box sx={{ flex: 1, position: 'relative', height: '100%' }}>
                            <SearchIconWrapper>
                                <SearchIcon />
                            </SearchIconWrapper>
                            <StyledInputBase
                                placeholder="Tìm sản phẩm..."
                                inputProps={{ 'aria-label': 'search' }}
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                            />
                        </Box>
                    </Box>
                </Box>

                {/* Right Section */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {/* Wishlist */}
                    <Tooltip title="Yêu thích" arrow>
                        <IconButton onClick={() => navigate('/wishlist')} sx={{ color: '#FFFFFF', p: 0.75 }}>
                            <FavoriteIcon sx={{ fontSize: '20px' }} />
                        </IconButton>
                    </Tooltip>

                    {/* Notifications */}
                    <Tooltip title="Thông báo" arrow>
                        <IconButton onClick={() => navigate('/notifications')} sx={{ color: '#FFFFFF', p: 0.75 }}>
                            <Badge badgeContent={unreadCount} color="error">
                                <NotificationsIcon sx={{ fontSize: '20px' }} />
                            </Badge>
                        </IconButton>
                    </Tooltip>

                    {/* Chat */}
                    <Tooltip title="Tin nhắn" arrow>
                        <IconButton onClick={() => navigate('/chat')} sx={{ color: '#FFFFFF', p: 0.75 }}>
                            <ChatIcon sx={{ fontSize: '20px' }} />
                        </IconButton>
                    </Tooltip>

                    {/* Divider */}
                    <Box sx={{ width: 1, height: 24, bgcolor: 'rgba(255,255,255,0.15)', mx: 1 }} />

                    {user ? (
                        /* ─── LOGGED IN: Đăng tin + Avatar dropdown ─── */
                        <>
                            <ActionButton onClick={handleCreatePost} startIcon={null}>
                                + Đăng tin
                            </ActionButton>

                            <Tooltip title={displayName} arrow>
                                <IconButton onClick={handleAvatarClick} sx={{ p: 0.5, ml: 0.5 }}>
                                    {avatarSrc ? (
                                        <Avatar
                                            src={avatarSrc}
                                            alt={displayName}
                                            sx={{
                                                width: 32, height: 32,
                                                border: '2px solid #9D6EED',
                                                transition: 'box-shadow 0.2s',
                                                '&:hover': { boxShadow: '0 0 0 3px rgba(157,110,237,0.4)' }
                                            }}
                                        />
                                    ) : (
                                        <Avatar
                                            sx={{
                                                width: 32, height: 32,
                                                bgcolor: '#9D6EED',
                                                fontSize: '14px',
                                                fontWeight: 700,
                                                border: '2px solid #9D6EED',
                                            }}
                                        >
                                            {displayName.charAt(0).toUpperCase()}
                                        </Avatar>
                                    )}
                                </IconButton>
                            </Tooltip>

                            {/* Dropdown Menu */}
                            <Menu
                                anchorEl={anchorEl}
                                open={menuOpen}
                                onClose={handleMenuClose}
                                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                                slotProps={{
                                    paper: {
                                        elevation: 8,
                                        sx: {
                                            mt: 1,
                                            minWidth: 220,
                                            borderRadius: '12px',
                                            overflow: 'visible',
                                            background: '#FFFFFF',
                                            border: '1px solid rgba(0,0,0,0.08)',
                                            '&::before': {
                                                content: '""',
                                                display: 'block',
                                                position: 'absolute',
                                                top: 0, right: 18,
                                                width: 10, height: 10,
                                                bgcolor: '#FFFFFF',
                                                transform: 'translateY(-50%) rotate(45deg)',
                                                border: '1px solid rgba(0,0,0,0.08)',
                                                borderBottom: 'none',
                                                borderRight: 'none',
                                            },
                                        }
                                    }
                                }}
                            >
                                {/* User info header */}
                                <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    {avatarSrc ? (
                                        <Avatar src={avatarSrc} alt={displayName} sx={{ width: 40, height: 40 }} />
                                    ) : (
                                        <Avatar sx={{ width: 40, height: 40, bgcolor: '#9D6EED', fontWeight: 700 }}>
                                            {displayName.charAt(0).toUpperCase()}
                                        </Avatar>
                                    )}
                                    <Box>
                                        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 140 }}>
                                            {displayName}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 140, display: 'block' }}>
                                            {user?.email}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Divider />

                                <MenuItem onClick={handleProfile} sx={{ py: 1.2, px: 2, gap: 1.5, borderRadius: '8px', mx: 0.5, my: 0.25 }}>
                                    <ListItemIcon sx={{ minWidth: 'auto' }}>
                                        <PersonIcon fontSize="small" sx={{ color: '#9D6EED' }} />
                                    </ListItemIcon>
                                    <ListItemText primary="Trang cá nhân" primaryTypographyProps={{ fontSize: 14 }} />
                                </MenuItem>

                                <MenuItem onClick={handleManagePosts} sx={{ py: 1.2, px: 2, gap: 1.5, borderRadius: '8px', mx: 0.5, my: 0.25 }}>
                                    <ListItemIcon sx={{ minWidth: 'auto' }}>
                                        <ListAltIcon fontSize="small" sx={{ color: '#9D6EED' }} />
                                    </ListItemIcon>
                                    <ListItemText primary="Quản lý tin đăng" primaryTypographyProps={{ fontSize: 14 }} />
                                </MenuItem>

                                <MenuItem onClick={() => { navigate('/chat'); handleMenuClose(); }} sx={{ py: 1.2, px: 2, gap: 1.5, borderRadius: '8px', mx: 0.5, my: 0.25 }}>
                                    <ListItemIcon sx={{ minWidth: 'auto' }}>
                                        <ChatIcon fontSize="small" sx={{ color: '#9D6EED' }} />
                                    </ListItemIcon>
                                    <ListItemText primary="Tin nhắn" primaryTypographyProps={{ fontSize: 14 }} />
                                </MenuItem>

                                <Divider sx={{ my: 0.5 }} />

                                <MenuItem
                                    onClick={handleLogout}
                                    sx={{
                                        py: 1.2, px: 2, gap: 1.5, borderRadius: '8px', mx: 0.5, mb: 0.5,
                                        color: '#EF4444',
                                        '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' }
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 'auto' }}>
                                        <LogoutIcon fontSize="small" sx={{ color: '#EF4444' }} />
                                    </ListItemIcon>
                                    <ListItemText primary="Đăng xuất" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
                                </MenuItem>
                            </Menu>
                        </>
                    ) : (
                        /* ─── NOT LOGGED IN: Login button ─── */
                        <Button
                            variant="contained"
                            startIcon={<LoginIcon />}
                            onClick={() => navigate('/login')}
                            sx={{
                                bgcolor: '#9D6EED',
                                color: '#FFFFFF',
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '13px',
                                px: 2,
                                py: 0.75,
                                borderRadius: '20px',
                                boxShadow: 'none',
                                '&:hover': {
                                    bgcolor: '#8A5BD6',
                                    boxShadow: '0 2px 8px rgba(157,110,237,0.4)',
                                },
                                transition: 'all 0.2s',
                            }}
                        >
                            Đăng nhập
                        </Button>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
}
