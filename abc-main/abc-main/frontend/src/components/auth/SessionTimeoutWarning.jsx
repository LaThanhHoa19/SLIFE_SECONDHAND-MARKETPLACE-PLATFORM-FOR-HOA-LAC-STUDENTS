/**
 * SessionTimeoutWarning - Cảnh báo session sắp hết hạn
 */
import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    LinearProgress,
    Box
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { useSession, useLogout } from '../../hooks/useAuthActions';

const SESSION_WARNING_TIME = 2 * 60 * 1000; // 2 minutes before expiry
const AUTO_LOGOUT_TIME = 30 * 1000; // 30 seconds countdown

export default function SessionTimeoutWarning() {
    const { getSessionTimeLeft } = useSession();
    const { handleLogout } = useLogout();
    const [showWarning, setShowWarning] = useState(false);
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        const checkSession = () => {
            const timeLeft = getSessionTimeLeft();

            if (timeLeft <= SESSION_WARNING_TIME && timeLeft > 0) {
                if (!showWarning) {
                    setShowWarning(true);
                    setCountdown(AUTO_LOGOUT_TIME);
                }
            } else if (timeLeft <= 0) {
                // Session expired
                handleLogout({ redirectTo: '/login' });
            }
        };

        const interval = setInterval(checkSession, 10000); // Check every 10 seconds
        checkSession(); // Initial check

        return () => clearInterval(interval);
    }, [getSessionTimeLeft, handleLogout, showWarning]);

    useEffect(() => {
        if (!showWarning) return;

        const countdownInterval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1000) {
                    // Auto logout
                    handleLogout({ redirectTo: '/login' });
                    return 0;
                }
                return prev - 1000;
            });
        }, 1000);

        return () => clearInterval(countdownInterval);
    }, [showWarning, handleLogout]);

    const handleStayLoggedIn = () => {
        setShowWarning(false);
        setCountdown(0);
        // Trigger a token refresh by making an API call
        window.location.reload();
    };

    const handleLogoutNow = () => {
        handleLogout({ redirectTo: '/login' });
    };

    if (!showWarning) return null;

    const progress = ((AUTO_LOGOUT_TIME - countdown) / AUTO_LOGOUT_TIME) * 100;

    return (
        <Dialog
            open={showWarning}
            maxWidth="sm"
            fullWidth
            disableEscapeKeyDown
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon color="warning" />
                Phiên làm việc sắp hết hạn
            </DialogTitle>

            <DialogContent>
                <Typography variant="body1" gutterBottom>
                    Phiên làm việc của bạn sẽ hết hạn sau{' '}
                    <strong>{Math.ceil(countdown / 1000)} giây</strong>.
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Bạn sẽ được tự động đăng xuất nếu không có hành động nào.
                </Typography>

                <Box sx={{ width: '100%', mb: 2 }}>
                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        color="warning"
                    />
                </Box>

                <Typography variant="caption" color="text.secondary">
                    Chọn "Tiếp tục" để gia hạn phiên làm việc.
                </Typography>
            </DialogContent>

            <DialogActions>
                <Button
                    onClick={handleLogoutNow}
                    color="secondary"
                >
                    Đăng xuất ngay
                </Button>
                <Button
                    onClick={handleStayLoggedIn}
                    variant="contained"
                    autoFocus
                >
                    Tiếp tục ({Math.ceil(countdown / 1000)}s)
                </Button>
            </DialogActions>
        </Dialog>
    );
}