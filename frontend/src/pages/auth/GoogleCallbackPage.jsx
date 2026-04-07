import { useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function GoogleCallbackPage() {
  useEffect(() => {
    // Refresh token đã được backend set trong HttpOnly cookie.
    // AuthContext ở trang chủ sẽ tự gọi /auth/refresh để lấy access token in-memory.
    window.location.replace('/');
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <Box textAlign="center">
        <CircularProgress size={48} sx={{ mb: 2 }} />
        <Typography variant="h6">Đang xử lý đăng nhập Google...</Typography>
        <Typography variant="body2" color="text.secondary">
          Vui lòng chờ trong giây lát
        </Typography>
      </Box>
    </Box>
  );
}
