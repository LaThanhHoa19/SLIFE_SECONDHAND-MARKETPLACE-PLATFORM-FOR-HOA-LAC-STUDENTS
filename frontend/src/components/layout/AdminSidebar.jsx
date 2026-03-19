import { Avatar, Box, Typography, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import {
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    Flag as FlagIcon,
    Category as CategoryIcon,
    ManageAccounts as ManageAccountsIcon,
    Insights as InsightsIcon,
    SettingsInputComponent as SettingsIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { fullImageUrl } from '../../utils/constants';

const SIDEBAR_WIDTH = 260;

const ADMIN_ITEMS = [
    {
        label: 'Tổng quan hệ thống',
        icon: DashboardIcon,
        path: '/admin',
        allowedRoles: ['ADMIN', 'MODERATOR'],
    },
    {
        label: 'Báo cáo',
        icon: FlagIcon,
        path: '/admin/reports',
        allowedRoles: ['ADMIN', 'MODERATOR'],
    },
    { 
        label: 'Quản lý danh mục', 
        icon: CategoryIcon, 
        path: '/admin/categories' 
    },
    { 
        label: 'Quản lý người dùng', 
        icon: ManageAccountsIcon, 
        path: '/admin/users' 
    },
    { 
        label: 'Cấu hình hệ thống', 
        icon: SettingsIcon, 
        path: '/admin/settings' 
    },
];

export default function AdminSidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth() || {};

    const isActive = (path) => {
        if (path === '/admin') {
            return location.pathname === '/admin';
        }
        return location.pathname.startsWith(path);
    };

    const visibleItems = ADMIN_ITEMS.filter(({ allowedRoles }) => {
        if (!allowedRoles || allowedRoles.length === 0) return true;
        const role = user?.role;
        // Nếu chưa có user/role (chưa login hoặc đang test UI) thì cho hiện tất cả,
        // role-based filter chỉ áp dụng khi đã có role rõ ràng.
        if (!role) return true;
        return allowedRoles.includes(role);
    });

    return (
        <Box
            sx={{
                width: SIDEBAR_WIDTH,
                minWidth: SIDEBAR_WIDTH,
                minHeight: '100vh',
                flexShrink: 0,
                alignSelf: 'stretch',
                bgcolor: '#1E1B24',
                borderRight: '1px solid rgba(255,255,255,0.08)',
                display: { xs: 'none', md: 'flex' },
                flexDirection: 'column',
                py: 3,
                px: 2,
            }}
        >
            <Box sx={{ mb: 2 }}>
                <Typography
                    variant="subtitle2"
                    sx={{
                        fontWeight: 700,
                        fontSize: 18,
                        color: '#9D6EED',
                    }}
                >
                    SLIFE ADMIN
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                    BẢNG ĐIỀU KHIỂN HỆ THỐNG
                </Typography>
            </Box>

            <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)', mb: 2 }} />

            <Box
                component="button"
                onClick={() => navigate('/admin/profile')}
                sx={{
                    width: '100%',
                    p: 1.5,
                    borderRadius: '50px',
                    fontFamily: 'inherit',
                    bgcolor: '#1F1B2E',
                    border: '1px solid #8B5CF6',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    mb: 2,
                    cursor: 'pointer',
                    textAlign: 'left',
                    '&:hover': {
                        bgcolor: '#2D2B3D',
                    },
                }}
            >
                <Avatar
                    src={fullImageUrl(user?.avatarUrl || user?.avatar)}
                    sx={{
                        width: 40,
                        height: 40,
                        bgcolor: 'rgba(139,92,246,0.2)',
                        color: '#8B5CF6',
                        fontWeight: 700,
                        fontSize: 18,
                    }}
                >
                    {(user?.fullName || user?.name || 'A').charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 700,
                            color: '#ffffff',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                        }}
                    >
                        {user?.fullName || user?.name || 'Admin User'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Quản trị viên
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)', mb: 2 }} />

            <List dense disablePadding sx={{ mt: 1 }}>
                {visibleItems.map(({ label, icon: Icon, path }) => {
                    const active = isActive(path);
                    return (
                        <ListItemButton
                            key={path}
                            onClick={() => navigate(path)}
                            sx={{
                                mb: 0.75,
                                borderRadius: active ? '0 50px 50px 0' : 2,
                                borderLeft: active ? '4px solid #8b80f9' : '4px solid transparent',
                                px: 1.5,
                                py: 1,
                                ml: 0,
                                pl: active ? 2 : 2,
                                transition: 'all 0.2s ease',
                                bgcolor: active ? '#222226' : 'transparent',
                                '&:hover': {
                                    bgcolor: active ? '#222226' : 'rgba(255,255,255,0.06)',
                                },
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: 32,
                                    color: active ? '#c3bef7' : 'rgba(255,255,255,0.5)',
                                }}
                            >
                                <Icon sx={{ fontSize: 20 }} />
                            </ListItemIcon>
                            <ListItemText
                                primary={label}
                                primaryTypographyProps={{
                                    fontSize: 13,
                                    fontWeight: active ? 600 : 500,
                                    color: active ? '#c3bef7' : 'rgba(255,255,255,0.7)',
                                }}
                            />
                        </ListItemButton>
                    );
                })}
            </List>

            <Box sx={{ flexGrow: 1 }} />
        </Box>
    );
}

