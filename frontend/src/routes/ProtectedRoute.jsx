/**
 * ProtectedRoute - Component bảo vệ routes cần xác thực
 *
 * Tính năng:
 * - Kiểm tra đăng nhập (token + user)
 * - Kiểm tra role-based access control
 * - Loading state đẹp khi đang xác thực
 * - Lưu current location để redirect về sau
 * - Kiểm tra email verification (optional)
 * - Tùy chỉnh fallback path
 *
 * Props:
 * @param {React.ReactNode} children - Component cần bảo vệ
 * @param {string[]} roles - Danh sách role được phép truy cập
 * @param {boolean} requireEmailVerified - Yêu cầu email đã xác thực
 * @param {string} fallbackPath - Đường dẫn khi không có quyền
 * @param {boolean} showLoading - Hiển thị loading spinner
 */

import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography, Paper } from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({
                                         children,
                                         roles = [],
                                         requireEmailVerified = false,
                                         fallbackPath = "/",
                                         showLoading = true
                                       }) {
  const { user, token, isAuthLoading } = useAuth();
  const location = useLocation();

  // 1. Loading state - hiển thị khi đang xác thực
  if (isAuthLoading) {
    if (!showLoading) return null;

    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight="100vh"
            bgcolor="grey.50"
            px={2}
        >
          <Paper
              elevation={2}
              sx={{
                p: 4,
                borderRadius: 2,
                textAlign: 'center',
                maxWidth: 400
              }}
          >
            <CircularProgress
                size={48}
                color="primary"
                sx={{ mb: 2 }}
            />
            <Typography variant="h6" gutterBottom>
              Đang xác thực...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vui lòng chờ trong giây lát
            </Typography>
          </Paper>
        </Box>
    );
  }

  // 2. Kiểm tra đăng nhập
  if (!token || !user) {
    return (
        <Navigate
            to="/login"
            state={{
              from: location.pathname + location.search,
              message: "Bạn cần đăng nhập để truy cập trang này"
            }}
            replace
        />
    );
  }

  // 3. Kiểm tra email verification (nếu được yêu cầu)
  if (requireEmailVerified && !user.emailVerified) {
    return (
        <Navigate
            to="/verify-email"
            state={{
              from: location.pathname + location.search,
              message: "Vui lòng xác thực email để tiếp tục"
            }}
            replace
        />
    );
  }

  // 4. Kiểm tra role-based access
  if (roles.length > 0 && !roles.includes(user.role)) {
    // Hiển thị trang không có quyền thay vì redirect ngay
    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight="70vh"
            px={2}
        >
          <Paper
              elevation={2}
              sx={{
                p: 4,
                borderRadius: 2,
                textAlign: 'center',
                maxWidth: 500
              }}
          >
            <LockIcon
                sx={{
                  fontSize: 64,
                  color: 'error.main',
                  mb: 2
                }}
            />
            <Typography variant="h5" gutterBottom color="error">
              Không có quyền truy cập
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Bạn cần quyền <strong>{roles.join(', ')}</strong> để truy cập trang này.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Role hiện tại của bạn: <strong>{user.role}</strong>
            </Typography>
          </Paper>
        </Box>
    );
  }

  // 5. Cho phép truy cập - render children
  return children;
}
