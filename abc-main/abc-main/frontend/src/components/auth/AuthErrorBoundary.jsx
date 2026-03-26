/**
 * AuthErrorBoundary - Xử lý auth errors toàn cục
 */
import React from 'react';
import { Box, Alert, Button, Typography } from '@mui/material';
import { Refresh as RefreshIcon, Login as LoginIcon } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

class AuthErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Auth Error Boundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    minHeight="50vh"
                    p={3}
                >
                    <Alert
                        severity="error"
                        sx={{ mb: 3, maxWidth: 500 }}
                        action={
                            <Button
                                color="inherit"
                                size="small"
                                onClick={() => window.location.reload()}
                                startIcon={<RefreshIcon />}
                            >
                                Tải lại
                            </Button>
                        }
                    >
                        <Typography variant="subtitle2" gutterBottom>
                            Lỗi xác thực
                        </Typography>
                        <Typography variant="body2">
                            Đã xảy ra lỗi khi xử lý thông tin đăng nhập. Vui lòng thử lại.
                        </Typography>
                    </Alert>

                    <Button
                        variant="contained"
                        startIcon={<LoginIcon />}
                        onClick={() => {
                            localStorage.clear();
                            window.location.href = '/login';
                        }}
                    >
                        Đăng nhập lại
                    </Button>
                </Box>
            );
        }

        return this.props.children;
    }
}

/**
 * Hook component để hiển thị auth errors
 */
export function AuthErrorDisplay() {
    const { authError, clearAuthError } = useAuth();

    if (!authError) return null;

    return (
        <Alert
            severity="error"
            onClose={clearAuthError}
            sx={{ mb: 2 }}
        >
            {authError}
        </Alert>
    );
}

export default AuthErrorBoundary;