import { Avatar, Box, Typography, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import {
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    Flag as FlagIcon,
    Category as CategoryIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const SIDEBAR_WIDTH = 260;

const ADMIN_ITEMS = [
    {
        label: 'Tổng quan',
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
        label: 'Người dùng',
        icon: PeopleIcon,
        path: '/admin/users',
        allowedRoles: ['ADMIN'],
    },
    {
        label: 'Danh mục',
        icon: CategoryIcon,
        path: '/admin/categories',
        allowedRoles: ['ADMIN'],
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
        // Role-based menu:
        // - Nếu role chưa xác định thì không hiển thị item admin để tránh user thường nhìn thấy UI không phù hợp.
        // - Route admin đã được guard phía router, nhưng guard không ngăn 100% trường hợp state role null trên UI.
        if (!role) return false;
        return allowedRoles.includes(role);
    });

    return (
        <Box
            sx={{
                width: SIDEBAR_WIDTH,
                minWidth: SIDEBAR_WIDTH,
                height: '100%',
                bgcolor: '#ffffff',
                borderRight: '1px solid #e5e7eb',
                display: { xs: 'none', md: 'flex' },
                flexDirection: 'column',
                py: 3,
                px: 2,
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    mb: 2,
                }}
            >
                <Box
                    sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 2,
                        bgcolor: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        fontWeight: 700,
                        color: '#ffffff',
                    }}
                >
                    S
                </Box>
                <Box>
                    <Typography
                        variant="subtitle2"
                        sx={{
                            fontWeight: 700,
                            fontSize: 18,
                            color: '#020617',
                        }}
                    >
                        SLIFE Admin
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6b7280', fontSize: 11 }}>
                        Bảng điều khiển hệ thống
                    </Typography>
                </Box>
            </Box>

            <List dense disablePadding sx={{ mt: 1 }}>
                {visibleItems.map(({ label, icon: Icon, path }) => {
                    const active = isActive(path);
                    return (
                        <ListItemButton
                            key={path}
                            onClick={() => navigate(path)}
                            sx={{
                                mb: 0.75,
                                borderRadius: 2,
                                px: 1.5,
                                py: 1,
                                transition: 'all 0.15s ease',
                                bgcolor: active ? 'rgba(37,99,235,0.08)' : 'transparent',
                                '&:hover': {
                                    bgcolor: active ? 'rgba(37,99,235,0.12)' : '#f9fafb',
                                },
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: 32,
                                    color: active ? '#2563eb' : '#9ca3af',
                                }}
                            >
                                <Icon sx={{ fontSize: 20 }} />
                            </ListItemIcon>
                            <ListItemText
                                primary={label}
                                primaryTypographyProps={{
                                    fontSize: 13,
                                    fontWeight: active ? 700 : 500,
                                    color: active ? '#111827' : '#4b5563',
                                }}
                            />
                        </ListItemButton>
                    );
                })}
            </List>

            <Box sx={{ flexGrow: 1 }} />

            <Box
                sx={{
                    mt: 2,
                    p: 1.5,
                    borderRadius: 3,
                    bgcolor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                }}
            >
                <Avatar
                    sx={{
                        width: 40,
                        height: 40,
                        bgcolor: 'rgba(37,99,235,0.15)',
                        color: '#2563eb',
                        fontWeight: 700,
                        fontSize: 18,
                    }}
                >
                    A
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 700,
                            color: '#020617',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                        }}
                    >
                        Admin User
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                        Quản trị viên
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}

