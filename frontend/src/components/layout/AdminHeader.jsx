import { Box, Button, IconButton, InputBase, Stack, Tooltip, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { ADMIN_THEME as t } from '../../theme/adminTheme';

export default function AdminHeader() {
    const navigate = useNavigate();
    const { adminUser, adminLogout } = useAdminAuth();
    const displayName = adminUser?.fullName || adminUser?.name || adminUser?.email || '';

    const handleLogout = async () => {
        try {
            await adminLogout?.();
        } catch {
            /* bỏ qua lỗi API, vẫn xóa session local */
        }
        navigate('/admin/login', { replace: true });
    };

    const iconBtnSx = {
        color: t.textMuted,
        borderRadius: 2,
        '&:hover': { color: t.purple, bgcolor: 'rgba(139,92,246,0.1)' },
    };

    return (
        <Box
            sx={{
                flexShrink: 0,
                px: { xs: 2, sm: 3 },
                py: 1.5,
                borderBottom: `1px solid ${t.borderSubtle}`,
                bgcolor: t.bgHeader,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
            }}
        >
            <Box sx={{ width: { xs: 0, md: 40 }, flexShrink: 0 }} />

            <Box
                sx={{
                    flex: 1,
                    maxWidth: 560,
                    mx: 'auto',
                    display: { xs: 'none', sm: 'flex' },
                    alignItems: 'center',
                    bgcolor: 'rgba(255,255,255,0.05)',
                    borderRadius: 999,
                    px: 2,
                    py: 0.85,
                    border: `1px solid ${t.borderSubtle}`,
                    transition: 'border-color 0.2s, background 0.2s',
                    '&:focus-within': {
                        borderColor: t.borderAccentStrong,
                        bgcolor: 'rgba(139,92,246,0.06)',
                    },
                }}
            >
                <SearchIcon sx={{ fontSize: 20, color: t.textMuted, mr: 1 }} />
                <InputBase
                    placeholder="Tìm kiếm tài liệu, người dùng..."
                    sx={{
                        fontSize: 13,
                        flex: 1,
                        color: t.text,
                        '& input::placeholder': { color: t.textMuted, opacity: 1 },
                    }}
                />
            </Box>

            <Stack direction="row" spacing={0.5} alignItems="center">
                <Tooltip title="Thông báo (sắp có)">
                    <span>
                        <IconButton size="small" sx={{ ...iconBtnSx, display: { xs: 'none', md: 'inline-flex' } }}>
                            <NotificationsNoneOutlinedIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title="Trợ giúp">
                    <span>
                        <IconButton size="small" sx={{ ...iconBtnSx, display: { xs: 'none', md: 'inline-flex' } }}>
                            <HelpOutlineOutlinedIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title="Cấu hình hệ thống">
                    <IconButton size="small" onClick={() => navigate('/admin/settings')} sx={{ ...iconBtnSx, display: { xs: 'none', sm: 'inline-flex' } }}>
                        <SettingsOutlinedIcon sx={{ fontSize: 22 }} />
                    </IconButton>
                </Tooltip>

                {displayName && (
                    <Typography
                        variant="body2"
                        sx={{
                            color: t.text,
                            fontWeight: 600,
                            display: { xs: 'none', lg: 'block' },
                            maxWidth: 200,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            ml: 1,
                        }}
                    >
                        {displayName}
                    </Typography>
                )}
                <Button
                    variant="outlined"
                    size="small"
                    onClick={handleLogout}
                    sx={{
                        textTransform: 'none',
                        fontSize: 12,
                        fontWeight: 600,
                        borderRadius: 999,
                        borderColor: 'rgba(248,113,113,0.35)',
                        color: 'rgba(252,165,165,0.95)',
                        px: 2,
                        ml: 1,
                        '&:hover': {
                            borderColor: 'rgba(248,113,113,0.55)',
                            bgcolor: 'rgba(248,113,113,0.08)',
                        },
                    }}
                >
                    Đăng xuất
                </Button>
            </Stack>
        </Box>
    );
}
