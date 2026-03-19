import { Box, Button, InputBase, Stack, Typography } from '@mui/material';
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
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                bgcolor: '#1E1B24',
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
                    bgcolor: 'rgba(255,255,255,0.08)',
                    borderRadius: 999,
                    px: 2,
                    py: 0.75,
                    border: '1px solid rgba(255,255,255,0.1)',
                }}
            >
                <SearchIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', mr: 1 }} />
                <InputBase
                    placeholder="Tìm kiếm tài liệu, người dùng..."
                    sx={{
                        fontSize: 13,
                        flex: 1,
                        color: '#ffffff',
                        '& input::placeholder': { color: 'rgba(255,255,255,0.5)', opacity: 1 },
                    }}
                />
            </Box>

            <Stack direction="row" spacing={1.5} alignItems="center">
                {displayName && (
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', display: { xs: 'none', sm: 'block' } }}>
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
                        borderColor: 'rgba(255,255,255,0.2)',
                        color: 'rgba(255,255,255,0.9)',
                        px: 1.8,
                        display: { xs: 'none', sm: 'inline-flex' },
                    }}
                >
                    Đăng xuất
                </Button>
            </Stack>
        </Box>
    );
}

