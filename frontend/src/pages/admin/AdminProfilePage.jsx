/** Mục đích: Trang profile của admin. */
import { Box, Typography, Avatar } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { fullImageUrl } from '../../utils/constants';

export default function AdminProfilePage() {
    const { user } = useAuth() || {};
    const displayName = user?.fullName || user?.name || 'Admin User';
    const initial = (displayName || 'A').charAt(0).toUpperCase();

    return (
        <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff', mb: 3 }}>
                Hồ sơ quản trị viên
            </Typography>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: '#19191B',
                    border: '1px solid rgba(255,255,255,0.08)',
                }}
            >
                <Avatar
                    src={fullImageUrl(user?.avatarUrl || user?.avatar)}
                    sx={{
                        width: 64,
                        height: 64,
                        bgcolor: 'rgba(139,92,246,0.2)',
                        color: '#8B5CF6',
                        fontWeight: 700,
                        fontSize: 24,
                    }}
                >
                    {initial}
                </Avatar>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff' }}>
                        {displayName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Quản trị viên
                    </Typography>
                    {user?.email && (
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mt: 0.5 }}>
                            {user.email}
                        </Typography>
                    )}
                </Box>
            </Box>
        </Box>
    );
}
