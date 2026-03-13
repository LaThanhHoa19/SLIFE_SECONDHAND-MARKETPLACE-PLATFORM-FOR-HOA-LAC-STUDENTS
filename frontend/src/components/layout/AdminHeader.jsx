import { Avatar, Box, Button, Chip, InputBase, Stack, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '../../hooks/useAuth';

export default function AdminHeader() {
    const { user } = useAuth();
    const displayName = user?.fullName || user?.name || user?.email || '';
    const initial = (displayName || 'A').charAt(0).toUpperCase();

    return (
        <Box
            sx={{
                mb: 0,
                px: 3,
                py: 1.5,
                borderRadius: 0,
                borderBottom: '1px solid #e5e7eb',
                bgcolor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
            }}
        >
            <Box />

            <Box
                sx={{
                    flex: 1,
                    mx: 4,
                    maxWidth: 520,
                    display: { xs: 'none', sm: 'flex' },
                    alignItems: 'center',
                    bgcolor: '#f3f4f6',
                    borderRadius: 999,
                    px: 2,
                    py: 0.75,
                    border: '1px solid #e5e7eb',
                }}
            >
                <SearchIcon sx={{ fontSize: 18, color: '#9ca3af', mr: 1 }} />
                <InputBase
                    placeholder="Tìm kiếm tài liệu, người dùng..."
                    sx={{
                        fontSize: 13,
                        flex: 1,
                        color: '#111827',
                        '& input::placeholder': { color: '#9ca3af', opacity: 1 },
                    }}
                />
            </Box>

            <Stack direction="row" spacing={1.5} alignItems="center">
                {displayName && (
                    <Typography variant="body2" sx={{ color: '#4b5563', display: { xs: 'none', sm: 'block' } }}>
                        {displayName}
                    </Typography>
                )}
                <Button
                    variant="outlined"
                    size="small"
                    sx={{
                        textTransform: 'none',
                        fontSize: 12,
                        borderRadius: 999,
                        borderColor: '#e5e7eb',
                        color: '#374151',
                        px: 1.8,
                        display: { xs: 'none', sm: 'inline-flex' },
                    }}
                >
                    Đăng xuất
                </Button>
                <Avatar
                    sx={{
                        width: 30,
                        height: 30,
                        bgcolor: '#2563eb',
                        fontSize: 14,
                        fontWeight: 600,
                    }}
                >
                    {initial}
                </Avatar>
            </Stack>
        </Box>
    );
}

