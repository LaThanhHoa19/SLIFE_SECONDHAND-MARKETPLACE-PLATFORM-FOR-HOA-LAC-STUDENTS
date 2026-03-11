/**
 * Trang đăng nhập – Google SSO (@fpt.edu.vn) và đăng nhập test (Alice, Bob).
 */

import { Box, Typography } from '@mui/material';
export default function LoginPage() {

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        px: 2,
        textAlign: 'center',
      }}
    >
      <Typography variant="h5" gutterBottom>
               Chỉ tài khoản Google đuôi <strong>@fpt.edu.vn</strong> được phép đăng nhập.
        Đăng nhập đang tạm tắt
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Phạm vi hiện tại tập trung test giao diện feed (`ListingsPage`), header, footer và layout.
      </Typography>

    </Box>
  );
}