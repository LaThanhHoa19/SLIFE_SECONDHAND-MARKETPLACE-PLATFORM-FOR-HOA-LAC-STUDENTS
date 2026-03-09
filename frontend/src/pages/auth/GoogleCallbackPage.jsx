import { useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const TOKEN_KEY = 'slife_access_token';
const USER_KEY = 'slife_user';

export default function GoogleCallbackPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');
    const userJson = params.get('user');

    if (!accessToken) {
      window.location.replace('/login?google_error=no_token');
      return;
    }

    localStorage.setItem(TOKEN_KEY, accessToken);

    if (userJson) {
      try {
        const user = JSON.parse(decodeURIComponent(userJson));
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } catch {
        // user data will be fetched by AuthContext on next load
      }
    }

    // Full page replace so AuthContext re-initializes with the new token
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
