/**
 * PublicOnlyRoute - Component chỉ cho phép user CHƯA đăng nhập
 *
 * Tính năng:
 * - Chặn user đã đăng nhập truy cập login/register
 * - Auto redirect về trang đã lưu hoặc homepage
 * - Loading state khi đang kiểm tra auth
 * - Message thông báo cho user
 *
 * Props:
 * @param {React.ReactNode} children - Component cần bảo vệ (LoginPage, RegisterPage)
 * @param {string} redirectPath - Đường dẫn redirect khi đã đăng nhập
 * @param {boolean} showLoading - Hiển thị loading spinner
 */

import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography, Paper } from '@mui/material';
import { useAuth } from '../hooks/useAuth';

export default function PublicOnlyRoute({
                                            children,
                                            redirectPath = "/",
                                            showLoading = true
                                        }) {
    const { user, token, isAuthLoading } = useAuth();
    const location = useLocation();

    // 1. Loading state - hiển thị khi đang kiểm tra auth
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
                        Đang kiểm tra trạng thái...
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Vui lòng chờ trong giây lát
                    </Typography>
                </Paper>
            </Box>
        );
    }

    // 2. Nếu đã đăng nhập -> redirect về trang được lưu hoặc homepage
    if (token && user) {
        // Lấy trang được lưu từ login state hoặc dùng redirectPath
        const from = location.state?.from || redirectPath;

        return (
            <Navigate
                to={from}
                replace
            />
        );
    }

    // 3. Chưa đăng nhập -> cho phép truy cập (hiển thị login/register form)
    return children;
}