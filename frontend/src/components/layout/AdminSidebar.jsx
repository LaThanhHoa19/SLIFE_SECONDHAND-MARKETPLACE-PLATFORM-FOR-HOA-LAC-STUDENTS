import { Avatar, Box, Typography, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Flag as FlagIcon,
    Category as CategoryIcon,
    ManageAccounts as ManageAccountsIcon,
    SettingsInputComponent as SettingsIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { fullImageUrl } from '../../utils/constants';
import { ADMIN_THEME as t } from '../../theme/adminTheme';

const SIDEBAR_WIDTH = 260;

const ADMIN_ITEMS = [
    { id: 'dashboard', label: 'Tổng quan hệ thống', icon: DashboardIcon, path: '/admin' },
    { id: 'reports', label: 'Báo cáo', icon: FlagIcon, path: '/admin/reports' },
    { id: 'categories', label: 'Quản lý danh mục', icon: CategoryIcon, path: '/admin/categories' },
    { id: 'users', label: 'Quản lý người dùng', icon: ManageAccountsIcon, path: '/admin/users' },
    { id: 'settings', label: 'Cấu hình hệ thống', icon: SettingsIcon, path: '/admin/settings' },
];

export default function AdminSidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth() || {};

    const isActive = (path) => {
        if (path === '/admin') return location.pathname === '/admin';
        return location.pathname.startsWith(path);
    };

    return (
        <Box
            sx={{
                width: SIDEBAR_WIDTH,
                minWidth: SIDEBAR_WIDTH,
                minHeight: '100vh',
                flexShrink: 0,
                alignSelf: 'stretch',
                bgcolor: t.bgSidebar,
                borderRight: `1px solid ${t.borderSubtle}`,
                display: { xs: 'none', md: 'flex' },
                flexDirection: 'column',
                py: 3,
                px: 2,
            }}
        >
            <Box sx={{ mb: 2.5 }}>
                <Typography
                    variant="subtitle2"
                    sx={{
                        fontWeight: 800,
                        fontSize: 17,
                        letterSpacing: '0.04em',
                        color: t.brandTitle,
                    }}
                >
                    SLIFE ADMIN
                </Typography>
                <Typography variant="body2" sx={{ color: t.textMuted, fontSize: 11, mt: 0.5, letterSpacing: '0.06em' }}>
                    BẢNG ĐIỀU KHIỂN HỆ THỐNG
                </Typography>
            </Box>

            <Box sx={{ borderBottom: `1px solid ${t.borderSubtle}`, mb: 2 }} />

            <Box
                component="button"
                type="button"
                onClick={() => navigate('/admin/profile')}
                sx={{
                    width: '100%',
                    p: 1.5,
                    borderRadius: 3,
                    fontFamily: 'inherit',
                    bgcolor: t.bgElevated,
                    border: `1px solid ${t.borderAccent}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    mb: 2,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.2s, border-color 0.2s',
                    '&:hover': {
                        bgcolor: t.bgCard,
                        borderColor: t.borderAccentStrong,
                    },
                }}
            >
                <Avatar
                    src={fullImageUrl(user?.avatarUrl || user?.avatar)}
                    sx={{
                        width: 42,
                        height: 42,
                        bgcolor: 'rgba(139,92,246,0.2)',
                        color: t.purpleStrong,
                        fontWeight: 800,
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
                            color: t.text,
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                        }}
                    >
                        {user?.fullName || user?.name || 'Admin User'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: t.textMuted }}>
                        {user?.role === 'ADMIN'
                            ? 'Quản trị viên'
                            : user?.role === 'MODERATOR'
                                ? 'Kiểm duyệt'
                                : user?.role || 'Thành viên'}
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ borderBottom: `1px solid ${t.borderSubtle}`, mb: 1.5 }} />

            <List dense disablePadding sx={{ mt: 0.5 }}>
                {ADMIN_ITEMS.map(({ id, label, icon: Icon, path }) => {
                    const active = isActive(path);
                    return (
                        <ListItemButton
                            key={id}
                            onClick={() => navigate(path)}
                            sx={{
                                mb: 0.5,
                                borderRadius: 2,
                                borderLeft: active ? `3px solid ${t.navActiveBorder}` : '3px solid transparent',
                                pl: active ? 1.5 : 1.75,
                                py: 1.1,
                                transition: 'background 0.2s, border-color 0.2s',
                                bgcolor: active ? t.navActiveBg : 'transparent',
                                '&:hover': {
                                    bgcolor: active ? t.navActiveBg : 'rgba(255,255,255,0.05)',
                                },
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: 36,
                                    color: active ? t.purple : t.textMuted,
                                }}
                            >
                                <Icon sx={{ fontSize: 22 }} />
                            </ListItemIcon>
                            <ListItemText
                                primary={label}
                                primaryTypographyProps={{
                                    fontSize: 13,
                                    fontWeight: active ? 700 : 500,
                                    color: active ? t.navActiveText : t.textMuted,
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
