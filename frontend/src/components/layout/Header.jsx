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
    Chat as ChatIcon,
    DoneAll as DoneAllIcon,
    Search as SearchIcon,
    Person as PersonIcon,
    ListAlt as ListAltIcon,
    Logout as LogoutIcon,
    Close as CloseIcon,
    ChatBubbleOutline as CommentIcon,
} from '@mui/icons-material';
import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    backgroundColor: '#2A2733',
    borderRadius: '24px',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.1)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    '&:focus-within': {
        borderColor: '#9D6EED',
        boxShadow: '0 0 0 2px rgba(157,110,237,0.2)',
    },
}));


const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: '#FFFFFF',
    width: '100%',
    height: '40px',
    '& .MuiInputBase-input': {
        padding: theme.spacing(0, 1.5),
        fontSize: '13px',
        height: '40px',
        boxSizing: 'border-box',
        '&::placeholder': {
            color: 'rgba(255,255,255,0.35)',
            opacity: 1,
        }
    }
}));

const ActionButton = styled(Button)(({ theme }) => ({
    color: '#FFFFFF',
    textTransform: 'none',
    fontSize: '13px',
    fontWeight: 600,
    padding: theme.spacing(0.5, 2),
    borderRadius: '20px',
    backgroundColor: '#9D6EED',
    border: 'none',
    minHeight: '32px',
    whiteSpace: 'nowrap',
    '&:hover': {
        backgroundColor: '#8A5BD6',
    }
}));

const formatNotificationTime = (createdAt) => {
    if (!createdAt) return '';
    const d = new Date(createdAt);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return d.toLocaleDateString('vi-VN');
};

export default function Header({ onToggleSidebar }) {
    const { notifications, unreadCount, markRead, markAllRead } = useContext(NotificationContext);
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [searchValue, setSearchValue] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifAnchorEl, setNotifAnchorEl] = useState(null);
    const menuOpen = Boolean(anchorEl);
    const notifOpen = Boolean(notifAnchorEl);

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (searchValue.trim()) params.set('q', searchValue.trim());
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
                            sx={{ color: '#FFFFFF', mr: 0.5 }}
                        >
                            <MenuIcon />
                        </IconButton>
                    ) : (
                        <Box sx={{ width: 40, height: 40 }} />
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={() => navigate('/')}>
                        <Typography
                            variant="h6"
                            sx={{ fontWeight: 'bold', fontSize: '22px', color: '#FFFFFF', lineHeight: 1 }}
                        >
                            SLIFE
                        </Typography>
                        <Box sx={{
                            bgcolor: '#9D6EED',
                            color: '#FFFFFF',
                            fontSize: '13px',
                            fontWeight: 700,
                            px: 1.5,
                            py: 0.4,
                            borderRadius: '8px',
                            lineHeight: 1.4,
                            ml: 1,
                        }}>
                            Feed
                        </Box>
                    </Box>
                </Box>

                {/* Search Bar */}
                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', mx: 2 }}>
                    <SearchBar onSubmit={handleSearch}>

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
                                            sx={{ color: 'rgba(255,255,255,0.4)', p: 0.5, mr: 0.5, '&:hover': { color: 'rgba(255,255,255,0.7)' } }}>
                                    <CloseIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                            )}
                        </Box>

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
                    {/* Comment / Feed reactions */}
                    <Tooltip title="Bình luận" arrow>
                        <IconButton onClick={() => navigate('/')} sx={{ color: '#FFFFFF', p: 0.75 }}>
                            <CommentIcon sx={{ fontSize: '20px' }} />
                        </IconButton>
                    </Tooltip>

                    {/* Notifications */}
                    <Tooltip title="Thông báo" arrow>
                        <IconButton
                            onClick={(e) => (user ? setNotifAnchorEl(e.currentTarget) : navigate('/login'))}
                            sx={{ color: '#FFFFFF', p: 0.75 }}
                            aria-label="Thông báo"
                        >
                            <Badge badgeContent={unreadCount > 0 ? unreadCount : 0} color="error">
                                <NotificationsIcon sx={{ fontSize: '20px' }} />
                            </Badge>
                        </IconButton>
                    </Tooltip>
                    {/* Notification Dropdown */}
                    <Popover
                        open={notifOpen}
                        anchorEl={notifAnchorEl}
                        onClose={() => setNotifAnchorEl(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        slotProps={{
                            paper: {
                                sx: {
                                    mt: 1.5,
                                    width: 380,
                                    maxHeight: 420,
                                    borderRadius: '16px',
                                    boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
                                    border: '1px solid #ede9fe',
                                },
                            },
                        }}
                    >
                        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#7C3AED' }}>
                                Thông báo
                            </Typography>
                            {unreadCount > 0 && (
                                <Button
                                    size="small"
                                    startIcon={<DoneAllIcon sx={{ fontSize: 16 }} />}
                                    onClick={markAllRead}
                                    sx={{ fontSize: '12px', color: '#9D6EED', textTransform: 'none' }}
                                >
                                    Đánh dấu tất cả đã đọc
                                </Button>
                            )}
                        </Box>
                        <List dense disablePadding sx={{ maxHeight: 320, overflowY: 'auto', py: 0.5 }}>
                            {notifications.length === 0 ? (
                                <Box sx={{ py: 4, textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Chưa có thông báo
                                    </Typography>
                                </Box>
                            ) : (
                                notifications.map((n) => (
                                    <ListItemButton
                                        key={n.id}
                                        onClick={() => { if (!n.isRead) markRead(n.id); }}
                                        sx={{
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                            py: 1.5,
                                            px: 2,
                                            bgcolor: n.isRead ? 'transparent' : '#faf5ff',
                                            '&:hover': { bgcolor: n.isRead ? '#faf7ff' : '#f5f0ff' },
                                        }}
                                    >
                                        <Typography sx={{ fontSize: '13px', fontWeight: n.isRead ? 400 : 600, color: '#333', width: '100%' }}>
                                            {n.content}
                                        </Typography>
                                        <Typography sx={{ fontSize: '11px', color: '#9D6EED', mt: 0.5 }}>
                                            {formatNotificationTime(n.createdAt)}
                                        </Typography>
                                    </ListItemButton>
                                ))
                            )}
                        </List>
                        {notifications.length > 0 && (
                            <Box sx={{ px: 2, py: 1, borderTop: '1px solid #f5f3ff' }}>
                                <Button
                                    fullWidth
                                    size="small"
                                    onClick={() => { setNotifAnchorEl(null); navigate('/notifications'); }}
                                    sx={{ fontSize: '12px', color: '#9D6EED', textTransform: 'none' }}
                                >
                                    Xem tất cả
                                </Button>
                            </Box>
                        )}
                    </Popover>

                    {/* Chat */}
                    <Tooltip title="Tin nhắn" arrow>
                        <IconButton onClick={() => navigate('/chat')} sx={{ color: '#FFFFFF', p: 0.75 }}>
                            <ChatIcon sx={{ fontSize: '20px' }} />
                        </IconButton>
                    </Tooltip>

                    {/* Divider */}
                    <Box sx={{ width: 1, height: 24, bgcolor: 'rgba(255,255,255,0.15)', mx: 1 }} />

                    {user ? (
                        /* ─── LOGGED IN: Tên user + Avatar dropdown ─── */
                        <>
                            <ActionButton onClick={handleAvatarClick}>
                                {displayName}
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
