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
    Search as SearchIcon,
    Person as PersonIcon,
    ListAlt as ListAltIcon,
    Logout as LogoutIcon,
    Login as LoginIcon,
    KeyboardArrowDown as ArrowDownIcon,
    GridView as GridViewIcon,
    LocationOn as LocationOnIcon,
    Close as CloseIcon,
    Chat as ChatIcon,
} from '@mui/icons-material';
import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategories } from '../../api/categoryApi';
import { getLocations } from '../../api/locationApi';
import { NotificationContext } from '../../providers/NotificationProvider';
import { AuthContext } from '../../context/AuthContext';
import { fullImageUrl } from '../../utils/constants';

const SearchBar = styled('form')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    minWidth: '420px',
    maxWidth: '700px',
    height: '40px',
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    border: '2px solid transparent',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    '&:focus-within': {
        borderColor: '#9D6EED',
        boxShadow: '0 2px 12px rgba(157,110,237,0.25)',
    },
}));

const FilterButton = styled(Box)(({ theme, active }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    height: '100%',
    padding: '0 12px',
    cursor: 'pointer',
    userSelect: 'none',
    backgroundColor: active ? '#f3eeff' : '#fafafa',
    transition: 'background 0.15s',
    flexShrink: 0,
    '&:hover': { backgroundColor: '#f3eeff' },
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: '#333333',
    width: '100%',
    height: '40px',
    '& .MuiInputBase-input': {
        padding: theme.spacing(0, 1.5),
        fontSize: '13px',
        height: '40px',
        boxSizing: 'border-box',
        '&::placeholder': {
            color: '#aaaaaa',
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
    const [selectedLocation, setSelectedLocation] = useState('');
    const [categories, setCategories] = useState([]);
    const [locations, setLocations] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [catAnchorEl, setCatAnchorEl] = useState(null);
    const [locAnchorEl, setLocAnchorEl] = useState(null);
    const menuOpen = Boolean(anchorEl);
    const catOpen = Boolean(catAnchorEl);
    const locOpen = Boolean(locAnchorEl);

    const selectedCatLabel = selectedCategory
        ? (categories.find(c => String(c.id) === selectedCategory)?.name ?? 'Tất cả')
        : 'Tất cả';
    const selectedLocLabel = selectedLocation || 'Tất cả xã';

    useEffect(() => {
        getCategories()
            .then(({ data: res }) => {
                const list = res?.data ?? res ?? [];
                setCategories(Array.isArray(list) ? list : []);
            })
            .catch(() => setCategories([]));
    }, []);

    useEffect(() => {
        getLocations()
            .then(({ data: res }) => {
                const list = res?.data ?? res ?? [];
                setLocations(Array.isArray(list) ? list : []);
            })
            .catch(() => setLocations([]));
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (searchValue.trim()) params.set('q', searchValue.trim());
        if (selectedCategory) params.set('category', selectedCategory);
        if (selectedLocation) params.set('location', selectedLocation);
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
            <Toolbar sx={{ gap: 1, py: 0.5, px: 2, minHeight: '56px', flexWrap: 'nowrap' }}>
                {/* Logo & Hamburger */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
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
                <Box sx={{ display: 'flex', gap: 2, ml: 2, flexShrink: 0 }}>
                    <NavButton onClick={handleCreatePost}>ĐĂNG TIN</NavButton>
                    <NavButton onClick={() => navigate('/giveaway')}>TRAO TẶNG</NavButton>
                    <NavButton onClick={() => navigate('/community')}>CỘNG ĐỒNG</NavButton>
                </Box>

                {/* Search Bar */}
                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', mx: 2 }}>
                    <SearchBar onSubmit={handleSearch}>

                        {/* ── Category Filter ── */}
                        <FilterButton active={catOpen || !!selectedCategory} onClick={(e) => setCatAnchorEl(e.currentTarget)}
                                      sx={{ borderRight: '1px solid #efefef', minWidth: 120, maxWidth: 140, pl: 1.5, pr: 1 }}>
                            <GridViewIcon sx={{ fontSize: 14, color: selectedCategory ? '#7C3AED' : '#aaa', flexShrink: 0 }} />
                            <Typography sx={{ fontSize: '12px', fontWeight: 500, color: selectedCategory ? '#7C3AED' : '#666',
                                flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', mx: 0.5 }}>
                                {selectedCatLabel}
                            </Typography>
                            <ArrowDownIcon sx={{ fontSize: 14, color: '#bbb', flexShrink: 0,
                                transform: catOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </FilterButton>

                        {/* Category Popover */}
                        <Popover open={catOpen} anchorEl={catAnchorEl} onClose={() => setCatAnchorEl(null)}
                                 anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                                 transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                                 slotProps={{ paper: { sx: { mt: 1, minWidth: 220, maxHeight: 340, overflowY: 'auto',
                                             borderRadius: '16px', boxShadow: '0 12px 32px rgba(0,0,0,0.14)',
                                             border: '1px solid #ede9fe' } } }}>
                            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f5f3ff' }}>
                                <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#9D6EED', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                    Danh mục
                                </Typography>
                            </Box>
                            <List dense disablePadding sx={{ py: 0.5 }}>
                                <ListItemButton selected={selectedCategory === ''} onClick={() => { setSelectedCategory(''); setCatAnchorEl(null); }}
                                                sx={{ px: 2, py: 1, '&.Mui-selected': { bgcolor: '#f5f0ff' }, '&:hover': { bgcolor: '#faf7ff' } }}>
                                    <Typography sx={{ fontSize: '13px', fontWeight: selectedCategory === '' ? 600 : 400,
                                        color: selectedCategory === '' ? '#7C3AED' : '#444' }}>Tất cả danh mục</Typography>
                                </ListItemButton>
                                {categories.map((c) => (
                                    <ListItemButton key={c.id} selected={selectedCategory === String(c.id)}
                                                    onClick={() => { setSelectedCategory(String(c.id)); setCatAnchorEl(null); }}
                                                    sx={{ px: 2, py: 1, '&.Mui-selected': { bgcolor: '#f5f0ff' }, '&:hover': { bgcolor: '#faf7ff' } }}>
                                        <Typography sx={{ fontSize: '13px', fontWeight: selectedCategory === String(c.id) ? 600 : 400,
                                            color: selectedCategory === String(c.id) ? '#7C3AED' : '#444' }}>{c.name}</Typography>
                                    </ListItemButton>
                                ))}
                            </List>
                        </Popover>

                        {/* ── Search Input ── */}
                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative', height: '100%' }}>
                            <StyledInputBase
                                placeholder="Tìm kiếm sản phẩm..."
                                inputProps={{ 'aria-label': 'search' }}
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                            />
                            {searchValue && (
                                <IconButton size="small" onClick={() => setSearchValue('')}
                                            sx={{ color: '#ccc', p: 0.5, mr: 0.5, '&:hover': { color: '#999' } }}>
                                    <CloseIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                            )}
                        </Box>

                        {/* ── Location Filter ── */}
                        <FilterButton active={locOpen || !!selectedLocation} onClick={(e) => setLocAnchorEl(e.currentTarget)}
                                      sx={{ borderLeft: '1px solid #efefef', minWidth: 130, maxWidth: 160, pl: 1, pr: 0.5 }}>
                            <LocationOnIcon sx={{ fontSize: 14, color: '#7C3AED', flexShrink: 0 }} />
                            <Box sx={{ flex: 1, mx: 0.5, overflow: 'hidden' }}>
                                <Typography sx={{ fontSize: '10px', color: '#9D6EED', fontWeight: 600, lineHeight: 1.2 }}>
                                    Hòa Lạc
                                </Typography>
                                <Typography sx={{ fontSize: '12px', fontWeight: 500, color: selectedLocation ? '#7C3AED' : '#666',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                                    {selectedLocLabel}
                                </Typography>
                            </Box>
                            <ArrowDownIcon sx={{ fontSize: 14, color: '#bbb', flexShrink: 0,
                                transform: locOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </FilterButton>

                        {/* Location Popover */}
                        <Popover open={locOpen} anchorEl={locAnchorEl} onClose={() => setLocAnchorEl(null)}
                                 anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                 transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                 slotProps={{ paper: { sx: { mt: 1, minWidth: 210, borderRadius: '16px',
                                             boxShadow: '0 12px 32px rgba(0,0,0,0.14)', border: '1px solid #ede9fe' } } }}>
                            {/* Header: Hòa Lạc cố định */}
                            <Box sx={{ px: 2, py: 1.5, background: 'linear-gradient(135deg, #f5f0ff, #ede9fe)',
                                borderBottom: '1px solid #e9d8fd', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LocationOnIcon sx={{ fontSize: 16, color: '#7C3AED' }} />
                                <Box>
                                    <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#7C3AED' }}>Hòa Lạc</Typography>
                                    <Typography sx={{ fontSize: '11px', color: '#9D6EED' }}>Thạch Thất, Hà Nội</Typography>
                                </Box>
                            </Box>
                            {/* Chọn xã */}
                            <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
                                <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#9D6EED',
                                    textTransform: 'uppercase', letterSpacing: '0.8px' }}>Chọn xã</Typography>
                            </Box>
                            <List dense disablePadding sx={{ pb: 0.5 }}>
                                <ListItemButton selected={selectedLocation === ''} onClick={() => { setSelectedLocation(''); setLocAnchorEl(null); }}
                                                sx={{ px: 2, py: 1, '&.Mui-selected': { bgcolor: '#f5f0ff' }, '&:hover': { bgcolor: '#faf7ff' } }}>
                                    <Typography sx={{ fontSize: '13px', fontWeight: selectedLocation === '' ? 600 : 400,
                                        color: selectedLocation === '' ? '#7C3AED' : '#444' }}>Tất cả xã</Typography>
                                </ListItemButton>
                                <Divider sx={{ mx: 2, my: 0.5 }} />
                                {locations.map((loc) => (
                                    <ListItemButton key={loc} selected={selectedLocation === loc}
                                                    onClick={() => { setSelectedLocation(loc); setLocAnchorEl(null); }}
                                                    sx={{ px: 2, py: 1, '&.Mui-selected': { bgcolor: '#f5f0ff' }, '&:hover': { bgcolor: '#faf7ff' } }}>
                                        <Typography sx={{ fontSize: '13px', fontWeight: selectedLocation === loc ? 600 : 400,
                                            color: selectedLocation === loc ? '#7C3AED' : '#444' }}>{loc}</Typography>
                                    </ListItemButton>
                                ))}
                            </List>
                        </Popover>

                        {/* ── Search Button ── */}
                        <Box component="button" type="submit"
                             sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                                 height: '100%', px: 2, border: 'none', outline: 'none', cursor: 'pointer',
                                 background: 'linear-gradient(135deg, #9D6EED 0%, #7C3AED 100%)',
                                 color: '#fff', gap: 0.5, flexShrink: 0,
                                 transition: 'opacity 0.15s', '&:hover': { opacity: 0.9 } }}>
                            <SearchIcon sx={{ fontSize: 18 }} />
                            <Typography sx={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>Tìm kiếm</Typography>
                        </Box>

                    </SearchBar>
                </Box>

                {/* Right Section */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
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
                            onClick={() => navigate('/login')}
                            sx={{
                                bgcolor: '#9D6EED',
                                color: '#FFFFFF',
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '13px',
                                px: 2.5,
                                py: 0.75,
                                borderRadius: '20px',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
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
